import { supabase } from "@/integrations/supabase/client";
import { User, Group, ScheduleSlot, AttendanceRecord, Album, MediaFile } from "./types";
import { SCHEDULE_DAY_END_LABEL, SCHEDULE_SLOT_INTERVAL_MINUTES, SCHEDULE_START_HOUR, parseTimeToMinutes } from "@/lib/schedule";
import { withNormalizedUserGroups } from "@/lib/userGroups";
import { ALL_ADMIN_PRIVILEGES, normalizeAdminPrivileges } from "@/lib/adminPermissions";

const REMOTE_TABLE = "app_shared_storage";
const REMOTE_POLL_INTERVAL_MS = 5000;
const REMOTE_FLUSH_DEBOUNCE_MS = 250;
const PRIMARY_ADMIN_ID = "admin-001";
const PRIMARY_ADMIN_EMAIL = "admin@aranha.ma";

// Storage keys
const STORAGE_KEYS = {
  USERS: "jj_users",
  GROUPS: "jj_groups",
  SCHEDULES: "jj_schedules",
  ATTENDANCE: "jj_attendance",
  SESSION: "jj_session",
  ALBUMS: "jj_albums",
  MEDIA: "jj_media",
  MEDIA_ITEMS: "jj_media_items",
  APP_CONFIG: "jj_app_config",
  APP_CONTENT: "jj_app_content",
  ABOUT_CONTENT: "jj_about_content",
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const SHARED_ASSET_KEYS = {
  LEGACY_LOGO: "app_logo",
  HOME_HERO_IMAGE: "home_hero_image",
  HOME_GALLERY_IMAGES: "home_gallery_images",
  HOME_COACHES_IMAGES: "home_coaches_images",
  HOME_LINEAGE_IMAGE: "home_lineage_image",
  ABOUT_TIMELINE: "about_timeline",
  ABOUT_GALLERY: "about_gallery",
  ABOUT_COACHES_IMAGES: "about_coaches_images",
} as const;

export interface AppConfig {
  logo?: string;
  logoDataUrl?: string;
  favicon?: string;
  brandName?: string;
  primaryColor?: string;
}

export type AppContentMap = Record<string, string>;

export const APP_CONFIG_UPDATED_EVENT = "jj_app_config_updated";
export const APP_CONTENT_UPDATED_EVENT = "jj_app_content_updated";

const NON_PERSISTED_KEYS = new Set<string>([STORAGE_KEYS.SESSION]);
const MOJIBAKE_PATTERN = /Ã|Â|â€|â€œ|â€¢|â€™|â€“|â€”|â„¢/;

const cache = new Map<string, string>();
const remoteUpdatedAt = new Map<string, string>();
const pendingWrites = new Map<string, string | null>();

let bootstrapPromise: Promise<void> | null = null;
let pollTimer: number | null = null;
let flushTimer: number | null = null;
let isFlushing = false;
let persistEnabled = false;

interface SharedStorageRow {
  storage_key: string;
  storage_value: string | null;
  updated_at: string;
}

const isBrowser = (): boolean => typeof window !== "undefined";

const isPrimaryAdminUser = (user: Partial<Pick<User, "id" | "email" | "role">>): boolean => {
  const normalizedEmail = user.email?.toLowerCase();
  return user.role === "admin" && (user.id === PRIMARY_ADMIN_ID || normalizedEmail === PRIMARY_ADMIN_EMAIL);
};

const withNormalizedAdminAccess = <
  T extends Pick<User, "role" | "privileges"> & Partial<Pick<User, "id" | "email">>
>(
  user: T
): T => {
  const shouldDowngradeAdmin = user.role === "admin" && !isPrimaryAdminUser(user);
  const normalizedRole = shouldDowngradeAdmin ? "co_admin" : user.role;
  const fallbackPrivileges =
    shouldDowngradeAdmin && (!user.privileges || user.privileges.length === 0)
      ? ALL_ADMIN_PRIVILEGES
      : user.privileges || [];

  return {
    ...user,
    role: normalizedRole,
    privileges: normalizeAdminPrivileges(normalizedRole, fallbackPrivileges),
  };
};

const isRemoteConfigured = (): boolean => {
  if (!isBrowser()) return false;
  if (import.meta.env.MODE === "test") return false;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(import.meta.env.VITE_SUPABASE_URL && supabaseKey);
};

const dispatchStorageEvent = (key: string): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(new StorageEvent("storage", { key }));
};

const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const normalizeScheduleSlot = (slot: ScheduleSlot): ScheduleSlot => {
  const minMinutes = SCHEDULE_START_HOUR * 60;
  const maxMinutes = parseTimeToMinutes(SCHEDULE_DAY_END_LABEL);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const snapDown = (value: number) =>
    minMinutes + Math.floor((value - minMinutes) / SCHEDULE_SLOT_INTERVAL_MINUTES) * SCHEDULE_SLOT_INTERVAL_MINUTES;
  const snapUp = (value: number) =>
    minMinutes + Math.ceil((value - minMinutes) / SCHEDULE_SLOT_INTERVAL_MINUTES) * SCHEDULE_SLOT_INTERVAL_MINUTES;

  let startMinutes = clamp(parseTimeToMinutes(slot.startTime), minMinutes, maxMinutes - SCHEDULE_SLOT_INTERVAL_MINUTES);
  let endMinutes = clamp(parseTimeToMinutes(slot.endTime), minMinutes + SCHEDULE_SLOT_INTERVAL_MINUTES, maxMinutes);

  startMinutes = snapDown(startMinutes);
  endMinutes = snapUp(endMinutes);

  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(maxMinutes, startMinutes + SCHEDULE_SLOT_INTERVAL_MINUTES);
  }

  return {
    ...slot,
    startTime: formatMinutesToTime(startMinutes),
    endTime: formatMinutesToTime(endMinutes),
  };
};

const dispatchKeySpecificEvents = (key: string, rawValue: string | null): void => {
  if (!isBrowser()) return;

  if (key === STORAGE_KEYS.APP_CONFIG) {
    const config = safeParse<AppConfig | null>(rawValue, null) ?? null;
    window.dispatchEvent(new CustomEvent(APP_CONFIG_UPDATED_EVENT, { detail: config }));
  }

  if (key === STORAGE_KEYS.APP_CONTENT) {
    const content = safeParse<AppContentMap>(rawValue, {});
    window.dispatchEvent(new CustomEvent(APP_CONTENT_UPDATED_EVENT, { detail: content }));
  }
};

const getRawCachedValue = (key: string): string | null => {
  if (!cache.has(key)) return null;
  return cache.get(key) ?? null;
};

const queueRemoteWrite = (key: string, value: string | null): void => {
  if (!persistEnabled || !isRemoteConfigured() || NON_PERSISTED_KEYS.has(key)) {
    return;
  }

  pendingWrites.set(key, value);

  if (flushTimer !== null) {
    return;
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushPendingWrites();
  }, REMOTE_FLUSH_DEBOUNCE_MS);
};

const setRawCachedValue = (
  key: string,
  value: string | null,
  options: { emit?: boolean; persist?: boolean } = {}
): void => {
  const { emit = true, persist = true } = options;
  const current = getRawCachedValue(key);

  if (current === value) {
    return;
  }

  if (value === null) {
    cache.delete(key);
  } else {
    cache.set(key, value);
  }

  if (persist) {
    queueRemoteWrite(key, value);
  }

  if (emit) {
    dispatchStorageEvent(key);
    dispatchKeySpecificEvents(key, value);
  }
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStorage = <T>(key: StorageKey | string, fallback: T): T => {
  const raw = getRawCachedValue(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    setRawCachedValue(key, null, { emit: false, persist: true });
    return fallback;
  }
};

const writeStorage = <T>(key: StorageKey | string, value: T, emit = true): void => {
  setRawCachedValue(key, JSON.stringify(value), { emit, persist: true });
};

const ensureRemoteTableAvailable = async (): Promise<boolean> => {
  const { error } = await supabase.from(REMOTE_TABLE).select("storage_key").limit(1);
  if (error) {
    console.warn(`[storage] Remote SQL disabled: ${error.message}`);
    return false;
  }
  return true;
};

const fetchAllRemoteRows = async (): Promise<SharedStorageRow[] | null> => {
  const { data, error } = await supabase
    .from(REMOTE_TABLE)
    .select("storage_key,storage_value,updated_at");

  if (error) {
    console.warn(`[storage] Failed reading remote SQL rows: ${error.message}`);
    return null;
  }

  return (data ?? []) as SharedStorageRow[];
};

const applyRemoteRows = (rows: SharedStorageRow[], emit: boolean): void => {
  rows.forEach((row) => {
    remoteUpdatedAt.set(row.storage_key, row.updated_at);
    setRawCachedValue(row.storage_key, row.storage_value, { emit, persist: false });
  });
};

const flushPendingWrites = async (): Promise<void> => {
  if (!persistEnabled || isFlushing || pendingWrites.size === 0) {
    return;
  }

  isFlushing = true;
  const writeBatch = Array.from(pendingWrites.entries()).map(([storage_key, storage_value]) => ({
    storage_key,
    storage_value,
  }));
  pendingWrites.clear();

  const { data, error } = await supabase
    .from(REMOTE_TABLE)
    .upsert(writeBatch, { onConflict: "storage_key" })
    .select("storage_key,updated_at");

  if (error) {
    console.warn(`[storage] Failed writing to remote SQL: ${error.message}`);
    writeBatch.forEach(({ storage_key, storage_value }) => {
      pendingWrites.set(storage_key, storage_value);
    });
  } else {
    ((data ?? []) as Array<Pick<SharedStorageRow, "storage_key" | "updated_at">>).forEach((row) => {
      remoteUpdatedAt.set(row.storage_key, row.updated_at);
    });
  }

  isFlushing = false;
};

const pollRemoteChanges = async (): Promise<void> => {
  if (!persistEnabled) return;

  const rows = await fetchAllRemoteRows();
  if (!rows) return;

  const changedRows = rows.filter((row) => remoteUpdatedAt.get(row.storage_key) !== row.updated_at);
  if (changedRows.length === 0) {
    return;
  }

  applyRemoteRows(changedRows, true);
};

const startRemotePolling = (): void => {
  if (!isBrowser() || pollTimer !== null) return;

  pollTimer = window.setInterval(() => {
    void pollRemoteChanges();
  }, REMOTE_POLL_INTERVAL_MS);
};

const stopRemotePolling = (): void => {
  if (!isBrowser() || pollTimer === null) return;
  window.clearInterval(pollTimer);
  pollTimer = null;
};

const initializeDefaults = (): void => {
  // Initialize users with admin if not exists
  const users = readStorage<User[]>(STORAGE_KEYS.USERS, []);
  const adminExists = users.some((u) => u.email === DEFAULT_ADMIN.email);
  if (!adminExists) {
    writeStorage(STORAGE_KEYS.USERS, [...users, DEFAULT_ADMIN], false);
  }

  // Initialize groups if not exists
  if (readStorage<Group[]>(STORAGE_KEYS.GROUPS, []).length === 0) {
    writeStorage(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS, false);
  }

  // Initialize schedules if not exists
  if (readStorage<ScheduleSlot[]>(STORAGE_KEYS.SCHEDULES, []).length === 0) {
    writeStorage(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES, false);
  }

  // Initialize attendance if not exists
  if (getRawCachedValue(STORAGE_KEYS.ATTENDANCE) === null) {
    writeStorage(STORAGE_KEYS.ATTENDANCE, [], false);
  }

  // Initialize media-related keys
  if (getRawCachedValue(STORAGE_KEYS.ALBUMS) === null) {
    writeStorage(STORAGE_KEYS.ALBUMS, [], false);
  }

  if (getRawCachedValue(STORAGE_KEYS.MEDIA) === null) {
    writeStorage(STORAGE_KEYS.MEDIA, [], false);
  }

  if (getRawCachedValue(STORAGE_KEYS.MEDIA_ITEMS) === null) {
    writeStorage(STORAGE_KEYS.MEDIA_ITEMS, [], false);
  }

  if (getRawCachedValue(STORAGE_KEYS.APP_CONFIG) === null) {
    writeStorage(STORAGE_KEYS.APP_CONFIG, {}, false);
  }

  if (getRawCachedValue(STORAGE_KEYS.APP_CONTENT) === null) {
    writeStorage(STORAGE_KEYS.APP_CONTENT, {}, false);
  }

  if (getRawCachedValue(STORAGE_KEYS.ABOUT_CONTENT) === null) {
    writeStorage(STORAGE_KEYS.ABOUT_CONTENT, [], false);
  }
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Default admin credentials
const DEFAULT_ADMIN: User = {
  id: PRIMARY_ADMIN_ID,
  email: PRIMARY_ADMIN_EMAIL,
  name: "Administrateur",
  password: "Admin@2024",
  role: "admin",
  privileges: ALL_ADMIN_PRIVILEGES,
  groupId: null,
  groupIds: [],
  createdAt: new Date().toISOString(),
};

// Default groups
const DEFAULT_GROUPS: Group[] = [
  {
    id: "group-matin",
    name: "Group du Matin",
    color: "primary",
    description: "Séances de 9h à 11h",
    createdAt: new Date().toISOString(),
  },
  {
    id: "group-soir",
    name: "Group du Soir",
    color: "accent",
    description: "Séances de 18h à 20h",
    createdAt: new Date().toISOString(),
  },
  {
    id: "group-open",
    name: "Cours Ouvert",
    color: "success",
    description: "Cours le samedi matin",
    createdAt: new Date().toISOString(),
  },
];

// Default schedule slots
const DEFAULT_SCHEDULES: ScheduleSlot[] = [
  { id: "s1", groupId: "group-matin", day: "Lundi", startTime: "09:00", endTime: "11:00" },
  { id: "s2", groupId: "group-soir", day: "Lundi", startTime: "18:00", endTime: "20:00" },
  { id: "s3", groupId: "group-matin", day: "Mercredi", startTime: "09:00", endTime: "11:00" },
  { id: "s4", groupId: "group-soir", day: "Mercredi", startTime: "18:00", endTime: "20:00" },
  { id: "s5", groupId: "group-matin", day: "Vendredi", startTime: "09:00", endTime: "11:00" },
  { id: "s6", groupId: "group-soir", day: "Vendredi", startTime: "18:00", endTime: "20:00" },
  { id: "s7", groupId: "group-open", day: "Samedi", startTime: "10:00", endTime: "12:00" },
];

// Initialize defaults in memory (sync)
export const initializeStorage = (): void => {
  initializeDefaults();
};

// Hydrate from SQL and start remote sync (async)
export const bootstrapStorage = async (): Promise<void> => {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    initializeDefaults();

    if (!isRemoteConfigured()) {
      persistEnabled = false;
      return;
    }

    const tableReady = await ensureRemoteTableAvailable();
    if (!tableReady) {
      persistEnabled = false;
      return;
    }

    const rows = await fetchAllRemoteRows();
    if (rows) {
      applyRemoteRows(rows, false);
    }

    persistEnabled = true;
    initializeDefaults();
    await flushPendingWrites();
    startRemotePolling();
  })();

  return bootstrapPromise;
};

export const shutdownStorageSync = (): void => {
  stopRemotePolling();
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
};

export const __resetStorageForTests = (): void => {
  stopRemotePolling();
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  cache.clear();
  remoteUpdatedAt.clear();
  pendingWrites.clear();
  bootstrapPromise = null;
  persistEnabled = false;
};

export const getSharedValue = (key: string): string | null => {
  return getRawCachedValue(key);
};

export const setSharedValue = (key: string, value: string): void => {
  setRawCachedValue(key, value, { emit: true, persist: true });
};

export const removeSharedValue = (key: string): void => {
  setRawCachedValue(key, null, { emit: true, persist: true });
};

export const getSharedJsonValue = <T>(key: string, fallback: T): T => {
  return safeParse<T>(getRawCachedValue(key), fallback);
};

export const setSharedJsonValue = <T>(key: string, value: T): void => {
  setSharedValue(key, JSON.stringify(value));
};

// Users CRUD
export const getUsers = (): User[] => {
  const users = readStorage<User[]>(STORAGE_KEYS.USERS, []);
  let hasNormalizedChanges = false;

  const normalizedUsers = users.map((user) => {
    const normalized = withNormalizedAdminAccess(withNormalizedUserGroups(user));
    const previousIds = (user.groupIds || []).join("|");
    const nextIds = normalized.groupIds?.join("|") || "";
    const previousPrivileges = (user.privileges || []).join("|");
    const nextPrivileges = (normalized.privileges || []).join("|");

    if (user.groupId !== normalized.groupId || previousIds !== nextIds || previousPrivileges !== nextPrivileges) {
      hasNormalizedChanges = true;
    }
    return normalized;
  });

  if (hasNormalizedChanges) {
    writeStorage(STORAGE_KEYS.USERS, normalizedUsers, false);
  }

  return normalizedUsers;
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find((u) => u.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
};

export const createUser = (user: Omit<User, "id" | "createdAt">): User => {
  const users = getUsers();
  const normalizedInput = withNormalizedAdminAccess(withNormalizedUserGroups({
    ...user,
    groupId: user.groupId ?? null,
  }));
  const newUser: User = {
    ...normalizedInput,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeStorage(STORAGE_KEYS.USERS, users);
  return newUser;
};

export const updateUser = (id: string, data: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const nextUser = withNormalizedAdminAccess(withNormalizedUserGroups({
    ...users[index],
    ...data,
  }));
  users[index] = nextUser;
  writeStorage(STORAGE_KEYS.USERS, users);

  const session = readStorage<{ user: User; isAuthenticated: boolean } | null>(STORAGE_KEYS.SESSION, null);
  if (session?.isAuthenticated && session.user.id === id) {
    writeStorage(STORAGE_KEYS.SESSION, { ...session, user: nextUser });
  }

  return nextUser;
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  writeStorage(STORAGE_KEYS.USERS, filtered);
  return true;
};

// Groups CRUD
export const getGroups = (): Group[] => {
  return readStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
};

export const getGroupById = (id: string): Group | undefined => {
  return getGroups().find((g) => g.id === id);
};

export const createGroup = (group: Omit<Group, "id" | "createdAt">): Group => {
  const groups = getGroups();
  const newGroup: Group = {
    ...group,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  groups.push(newGroup);
  writeStorage(STORAGE_KEYS.GROUPS, groups);
  return newGroup;
};

export const updateGroup = (id: string, data: Partial<Group>): Group | null => {
  const groups = getGroups();
  const index = groups.findIndex((g) => g.id === id);
  if (index === -1) return null;
  groups[index] = { ...groups[index], ...data };
  writeStorage(STORAGE_KEYS.GROUPS, groups);
  return groups[index];
};

export const deleteGroup = (id: string): boolean => {
  const groups = getGroups();
  const filtered = groups.filter((g) => g.id !== id);
  if (filtered.length === groups.length) return false;
  writeStorage(STORAGE_KEYS.GROUPS, filtered);
  return true;
};

// Schedules CRUD
export const getSchedules = (): ScheduleSlot[] => {
  const schedules = readStorage<ScheduleSlot[]>(STORAGE_KEYS.SCHEDULES, []);
  let hasNormalizedChanges = false;

  const normalizedSchedules = schedules.map((slot) => {
    const normalized = normalizeScheduleSlot(slot);
    if (normalized.startTime !== slot.startTime || normalized.endTime !== slot.endTime) {
      hasNormalizedChanges = true;
    }
    return normalized;
  });

  if (hasNormalizedChanges) {
    writeStorage(STORAGE_KEYS.SCHEDULES, normalizedSchedules, false);
  }

  return normalizedSchedules;
};

export const createSchedule = (slot: Omit<ScheduleSlot, "id">): ScheduleSlot => {
  const schedules = getSchedules();
  const newSlot = normalizeScheduleSlot({
    ...slot,
    id: generateId(),
  });
  schedules.push(newSlot);
  writeStorage(STORAGE_KEYS.SCHEDULES, schedules);
  return newSlot;
};

export const updateSchedule = (id: string, data: Partial<ScheduleSlot>): ScheduleSlot | null => {
  const schedules = getSchedules();
  const index = schedules.findIndex((s) => s.id === id);
  if (index === -1) return null;
  schedules[index] = normalizeScheduleSlot({ ...schedules[index], ...data });
  writeStorage(STORAGE_KEYS.SCHEDULES, schedules);
  return schedules[index];
};

export const deleteSchedule = (id: string): boolean => {
  const schedules = getSchedules();
  const filtered = schedules.filter((s) => s.id !== id);
  if (filtered.length === schedules.length) return false;
  writeStorage(STORAGE_KEYS.SCHEDULES, filtered);
  return true;
};

// Attendance CRUD
export const getAttendance = (): AttendanceRecord[] => {
  return readStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
};

export const getAttendanceByUser = (userId: string): AttendanceRecord[] => {
  return getAttendance().filter((a) => a.userId === userId);
};

export const getAttendanceByDate = (date: string): AttendanceRecord[] => {
  return getAttendance().filter((a) => a.date === date);
};

export const markAttendance = (
  userId: string,
  scheduleSlotId: string,
  date: string,
  status: "present" | "absent",
  markedBy: string
): AttendanceRecord => {
  const attendance = getAttendance();

  const existingIndex = attendance.findIndex(
    (a) => a.userId === userId && a.scheduleSlotId === scheduleSlotId && a.date === date
  );

  const record: AttendanceRecord = {
    id: existingIndex >= 0 ? attendance[existingIndex].id : generateId(),
    userId,
    scheduleSlotId,
    date,
    status,
    markedBy,
    markedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    attendance[existingIndex] = record;
  } else {
    attendance.push(record);
  }

  writeStorage(STORAGE_KEYS.ATTENDANCE, attendance);
  return record;
};

// Session management (in-memory only, not persisted remotely)
export const getSession = (): { user: User; isAuthenticated: boolean } | null => {
  const session = readStorage<{ user: User; isAuthenticated: boolean } | null>(STORAGE_KEYS.SESSION, null);
  if (!session) return null;
  const normalizedUser = withNormalizedAdminAccess(withNormalizedUserGroups(session.user));
  return {
    ...session,
    user: normalizedUser,
  };
};

export const login = (email: string, password: string): User | null => {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    writeStorage(STORAGE_KEYS.SESSION, { user, isAuthenticated: true });
    return user;
  }
  return null;
};

export const logout = (): void => {
  setRawCachedValue(STORAGE_KEYS.SESSION, null, { emit: true, persist: false });
};

export const register = (email: string, password: string, name: string): User | null => {
  const existing = getUserByEmail(email);
  if (existing) return null;

  const user = createUser({
    email,
    password,
    name,
    role: "client",
    groupId: null,
    groupIds: [],
  });

  writeStorage(STORAGE_KEYS.SESSION, { user, isAuthenticated: true });
  return user;
};

// Gallery CRUD - Albums
export const getAlbums = (): Album[] => {
  return readStorage<Album[]>(STORAGE_KEYS.ALBUMS, []);
};

export const getAlbumById = (id: string): Album | undefined => {
  return getAlbums().find((a) => a.id === id);
};

export const createAlbum = (album: Omit<Album, "id" | "createdAt" | "updatedAt" | "mediaCount">): Album => {
  const albums = getAlbums();
  const newAlbum: Album = {
    ...album,
    id: generateId(),
    mediaCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  albums.push(newAlbum);
  writeStorage(STORAGE_KEYS.ALBUMS, albums);
  return newAlbum;
};

export const updateAlbum = (id: string, data: Partial<Album>): Album | null => {
  const albums = getAlbums();
  const index = albums.findIndex((a) => a.id === id);
  if (index === -1) return null;
  albums[index] = { ...albums[index], ...data, updatedAt: new Date().toISOString() };
  writeStorage(STORAGE_KEYS.ALBUMS, albums);
  return albums[index];
};

export const deleteAlbum = (id: string): boolean => {
  const albums = getAlbums();
  const filtered = albums.filter((a) => a.id !== id);
  if (filtered.length === albums.length) return false;

  const media = getMedia();
  const filteredMedia = media.filter((m) => m.albumId !== id);
  writeStorage(STORAGE_KEYS.MEDIA, filteredMedia);

  writeStorage(STORAGE_KEYS.ALBUMS, filtered);
  return true;
};

// Gallery CRUD - Media Files
export const getMedia = (): MediaFile[] => {
  return readStorage<MediaFile[]>(STORAGE_KEYS.MEDIA, []);
};

export const getMediaByAlbumId = (albumId: string): MediaFile[] => {
  return getMedia().filter((m) => m.albumId === albumId);
};

export const createMediaFile = (media: Omit<MediaFile, "id" | "createdAt" | "updatedAt">): MediaFile => {
  const allMedia = getMedia();
  const newMedia: MediaFile = {
    ...media,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  allMedia.push(newMedia);
  writeStorage(STORAGE_KEYS.MEDIA, allMedia);

  const album = getAlbumById(media.albumId);
  if (album) {
    const albumMedia = getMediaByAlbumId(media.albumId);
    updateAlbum(media.albumId, {
      mediaCount: albumMedia.length + 1,
      thumbnail: newMedia.type === "image" ? newMedia.url : newMedia.thumbnail,
    });
  }

  return newMedia;
};

export const updateMediaFile = (id: string, data: Partial<MediaFile>): MediaFile | null => {
  const allMedia = getMedia();
  const index = allMedia.findIndex((m) => m.id === id);
  if (index === -1) return null;
  allMedia[index] = { ...allMedia[index], ...data, updatedAt: new Date().toISOString() };
  writeStorage(STORAGE_KEYS.MEDIA, allMedia);
  return allMedia[index];
};

export const deleteMediaFile = (id: string): boolean => {
  const allMedia = getMedia();
  const media = allMedia.find((m) => m.id === id);
  if (!media) return false;

  const filtered = allMedia.filter((m) => m.id !== id);
  writeStorage(STORAGE_KEYS.MEDIA, filtered);

  const album = getAlbumById(media.albumId);
  if (album) {
    const albumMedia = getMediaByAlbumId(media.albumId);
    updateAlbum(media.albumId, {
      mediaCount: Math.max(0, albumMedia.length - 1),
    });
  }

  return true;
};

// Media Items Management (for AdminMedia)
export interface MediaItem {
  id: string;
  name: string;
  category: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  description?: string;
}

export const getMediaItems = (): MediaItem[] => {
  return readStorage<MediaItem[]>(STORAGE_KEYS.MEDIA_ITEMS, []);
};

export const saveMedia = (items: MediaItem[]): void => {
  writeStorage(STORAGE_KEYS.MEDIA_ITEMS, items);
};

export const deleteMedia = (id: string): boolean => {
  const items = getMediaItems();
  const filtered = items.filter((m) => m.id !== id);
  if (filtered.length === items.length) return false;
  saveMedia(filtered);
  return true;
};

// App Config Management
export const getAppConfig = (): AppConfig | null => {
  return readStorage<AppConfig | null>(STORAGE_KEYS.APP_CONFIG, null);
};

export const saveAppConfig = (config: AppConfig): void => {
  const existing = getAppConfig() || {};
  const nextConfig = { ...existing, ...config };
  writeStorage(STORAGE_KEYS.APP_CONFIG, nextConfig);
};

export const getAppContent = (): AppContentMap => {
  const parsed = readStorage<Record<string, unknown>>(STORAGE_KEYS.APP_CONTENT, {});
  return Object.entries(parsed).reduce<AppContentMap>((accumulator, [key, value]) => {
    if (typeof value === "string" && !MOJIBAKE_PATTERN.test(value)) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
};

export const saveAppContent = (content: AppContentMap): void => {
  writeStorage(STORAGE_KEYS.APP_CONTENT, content);
};

// About Content Management
export interface AboutImage {
  id: string;
  title: string;
  image: string;
  section: "timeline" | "gallery" | "team";
  year?: string;
  description?: string;
  uploadedAt: string;
}

export const getAboutContent = (): AboutImage[] => {
  return readStorage<AboutImage[]>(STORAGE_KEYS.ABOUT_CONTENT, []);
};

export const saveAboutContent = (items: AboutImage[]): void => {
  writeStorage(STORAGE_KEYS.ABOUT_CONTENT, items);
};

export const deleteAboutItem = (id: string): boolean => {
  const items = getAboutContent();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveAboutContent(filtered);
  return true;
};
