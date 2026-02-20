import { User, Group, ScheduleSlot, AttendanceRecord, Album, MediaFile } from "./types";

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
const MOJIBAKE_PATTERN = /Ã|Â|â€|â€œ|â€¢|â€™|â€“|â€”|â„¢/;

const readStorage = <T>(key: StorageKey, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Storage parse failed for "${key}". Resetting key.`, error);
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore cleanup errors.
    }
    return fallback;
  }
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Default admin credentials
const DEFAULT_ADMIN: User = {
  id: "admin-001",
  email: "admin@aranha.ma",
  name: "Administrateur",
  password: "Admin@2024",
  role: "admin",
  groupId: null,
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

// Initialize storage with default data
export const initializeStorage = (): void => {
  // Validate critical keys to clear invalid JSON before init.
  readStorage<User[]>(STORAGE_KEYS.USERS, []);
  readStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
  readStorage<ScheduleSlot[]>(STORAGE_KEYS.SCHEDULES, []);
  readStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);

  // Initialize users with admin if not exists
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_ADMIN]));
  } else {
    // Ensure admin exists
    const users = readStorage<User[]>(STORAGE_KEYS.USERS, []);
    const adminExists = users.some((u) => u.email === DEFAULT_ADMIN.email);
    if (!adminExists) {
      users.push(DEFAULT_ADMIN);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }

  // Initialize groups if not exists
  if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
  }

  // Initialize schedules if not exists
  if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(DEFAULT_SCHEDULES));
  }

  // Initialize attendance if not exists
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }
};

// Users CRUD
export const getUsers = (): User[] => {
  return readStorage<User[]>(STORAGE_KEYS.USERS, []);
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find((u) => u.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
};

export const createUser = (user: Omit<User, "id" | "createdAt">): User => {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return newUser;
};

export const updateUser = (id: string, data: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...data };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return users[index];
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
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
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  return newGroup;
};

export const updateGroup = (id: string, data: Partial<Group>): Group | null => {
  const groups = getGroups();
  const index = groups.findIndex((g) => g.id === id);
  if (index === -1) return null;
  groups[index] = { ...groups[index], ...data };
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  return groups[index];
};

export const deleteGroup = (id: string): boolean => {
  const groups = getGroups();
  const filtered = groups.filter((g) => g.id !== id);
  if (filtered.length === groups.length) return false;
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(filtered));
  return true;
};

// Schedules CRUD
export const getSchedules = (): ScheduleSlot[] => {
  return readStorage<ScheduleSlot[]>(STORAGE_KEYS.SCHEDULES, []);
};

export const createSchedule = (slot: Omit<ScheduleSlot, "id">): ScheduleSlot => {
  const schedules = getSchedules();
  const newSlot: ScheduleSlot = {
    ...slot,
    id: generateId(),
  };
  schedules.push(newSlot);
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  return newSlot;
};

export const updateSchedule = (id: string, data: Partial<ScheduleSlot>): ScheduleSlot | null => {
  const schedules = getSchedules();
  const index = schedules.findIndex((s) => s.id === id);
  if (index === -1) return null;
  schedules[index] = { ...schedules[index], ...data };
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  return schedules[index];
};

export const deleteSchedule = (id: string): boolean => {
  const schedules = getSchedules();
  const filtered = schedules.filter((s) => s.id !== id);
  if (filtered.length === schedules.length) return false;
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(filtered));
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
  
  // Check if already marked for this date/slot
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

  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  return record;
};

// Session management
export const getSession = (): { user: User; isAuthenticated: boolean } | null => {
  return readStorage<{ user: User; isAuthenticated: boolean } | null>(STORAGE_KEYS.SESSION, null);
};

export const login = (email: string, password: string): User | null => {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user, isAuthenticated: true }));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEYS.SESSION }));
    return user;
  }
  return null;
};

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEYS.SESSION }));
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
  });
  
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user, isAuthenticated: true }));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEYS.SESSION }));
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
  localStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(albums));
  return newAlbum;
};

export const updateAlbum = (id: string, data: Partial<Album>): Album | null => {
  const albums = getAlbums();
  const index = albums.findIndex((a) => a.id === id);
  if (index === -1) return null;
  albums[index] = { ...albums[index], ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(albums));
  return albums[index];
};

export const deleteAlbum = (id: string): boolean => {
  const albums = getAlbums();
  const filtered = albums.filter((a) => a.id !== id);
  if (filtered.length === albums.length) return false;
  
  // Also delete all media files in this album
  const media = getMedia();
  const filteredMedia = media.filter((m) => m.albumId !== id);
  localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(filteredMedia));
  
  localStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(filtered));
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
  localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(allMedia));
  
  // Update album's media count and thumbnail
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
  localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(allMedia));
  return allMedia[index];
};

export const deleteMediaFile = (id: string): boolean => {
  const allMedia = getMedia();
  const media = allMedia.find((m) => m.id === id);
  if (!media) return false;
  
  const filtered = allMedia.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(filtered));
  
  // Update album's media count
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
  localStorage.setItem(STORAGE_KEYS.MEDIA_ITEMS, JSON.stringify(items));
};

export const deleteMedia = (id: string): boolean => {
  const items = getMediaItems();
  const filtered = items.filter((m) => m.id !== id);
  if (filtered.length === items.length) return false;
  saveMedia(filtered);
  return true;
};

// App Config Management
export interface AppConfig {
  logo?: string;
  logoDataUrl?: string;
  favicon?: string;
  brandName?: string;
  primaryColor?: string;
}

export const APP_CONFIG_UPDATED_EVENT = "jj_app_config_updated";
export const APP_CONTENT_UPDATED_EVENT = "jj_app_content_updated";

export const getAppConfig = (): AppConfig | null => {
  return readStorage<AppConfig | null>(STORAGE_KEYS.APP_CONFIG, null);
};

export const saveAppConfig = (config: AppConfig): void => {
  const existing = getAppConfig() || {};
  const nextConfig = { ...existing, ...config };
  localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(nextConfig));
  window.dispatchEvent(new CustomEvent(APP_CONFIG_UPDATED_EVENT, { detail: nextConfig }));
};

export type AppContentMap = Record<string, string>;

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
  localStorage.setItem(STORAGE_KEYS.APP_CONTENT, JSON.stringify(content));
  window.dispatchEvent(new CustomEvent(APP_CONTENT_UPDATED_EVENT, { detail: content }));
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
  localStorage.setItem(STORAGE_KEYS.ABOUT_CONTENT, JSON.stringify(items));
};

export const deleteAboutItem = (id: string): boolean => {
  const items = getAboutContent();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveAboutContent(filtered);
  return true;
};
