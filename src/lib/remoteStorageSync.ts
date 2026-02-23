import { supabase } from "@/integrations/supabase/client";

const SHARED_STORAGE_TABLE = "app_shared_storage" as const;
const SYNC_POLL_INTERVAL_MS = 5000;
const SYNC_FLUSH_DEBOUNCE_MS = 400;

const SYNC_KEYS = [
  "jj_users",
  "jj_groups",
  "jj_schedules",
  "jj_attendance",
  "jj_media_items",
  "jj_app_config",
  "jj_app_content",
  "jj_about_content",
  "home_hero_image",
  "home_gallery_images",
  "home_coaches_images",
  "home_lineage_image",
  "about_timeline",
  "about_gallery",
  "about_coaches_images",
  "app_logo",
] as const;

type SyncableStorageKey = (typeof SYNC_KEYS)[number];
type SharedStorageRow = {
  storage_key: SyncableStorageKey;
  storage_value: string | null;
  updated_at: string;
};

const SYNC_KEY_SET = new Set<string>(SYNC_KEYS);

let hasStarted = false;
let activeCleanup: (() => void) | null = null;

const isSyncConfigured = (): boolean => {
  if (typeof window === "undefined") return false;
  if (import.meta.env.MODE === "test") return false;
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
};

const shouldSyncKey = (key: string): key is SyncableStorageKey => {
  return SYNC_KEY_SET.has(key);
};

const emitStorageEvent = (key: string): void => {
  window.dispatchEvent(new StorageEvent("storage", { key }));
};

const readRows = async (
  keys: readonly SyncableStorageKey[]
): Promise<{ rows: SharedStorageRow[]; error: string | null }> => {
  const { data, error } = await supabase
    .from(SHARED_STORAGE_TABLE)
    .select("storage_key,storage_value,updated_at")
    .in("storage_key", [...keys]);

  if (error) {
    return { rows: [], error: error.message };
  }

  return {
    rows: (data ?? []) as SharedStorageRow[],
    error: null,
  };
};

const readRowVersions = async (): Promise<{
  versions: Array<Pick<SharedStorageRow, "storage_key" | "updated_at">>;
  error: string | null;
}> => {
  const { data, error } = await supabase
    .from(SHARED_STORAGE_TABLE)
    .select("storage_key,updated_at")
    .in("storage_key", [...SYNC_KEYS]);

  if (error) {
    return { versions: [], error: error.message };
  }

  return {
    versions: (data ?? []) as Array<Pick<SharedStorageRow, "storage_key" | "updated_at">>,
    error: null,
  };
};

const checkTableAvailability = async (): Promise<boolean> => {
  const { error } = await supabase.from(SHARED_STORAGE_TABLE).select("storage_key").limit(1);
  if (error) {
    console.warn(`[sync] Disabled shared storage sync: ${error.message}`);
    return false;
  }
  return true;
};

export const initializeRemoteStorageSync = async (): Promise<() => void> => {
  if (hasStarted) {
    return activeCleanup ?? (() => undefined);
  }

  if (!isSyncConfigured()) {
    return () => undefined;
  }

  const tableReady = await checkTableAvailability();
  if (!tableReady) {
    return () => undefined;
  }

  hasStarted = true;

  let disposed = false;
  let applyingRemote = false;
  let flushTimer: number | null = null;
  let isFlushing = false;
  let pollTimer: number | null = null;

  const pendingWrites = new Map<SyncableStorageKey, string | null>();
  const remoteVersions = new Map<SyncableStorageKey, string>();

  const queueWrite = (key: SyncableStorageKey, value: string | null): void => {
    pendingWrites.set(key, value);

    if (flushTimer !== null) {
      return;
    }

    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      void flushWrites();
    }, SYNC_FLUSH_DEBOUNCE_MS);
  };

  const flushWrites = async (): Promise<void> => {
    if (disposed || isFlushing || pendingWrites.size === 0) {
      return;
    }

    isFlushing = true;
    const writeBatch = Array.from(pendingWrites.entries()).map(([storage_key, storage_value]) => ({
      storage_key,
      storage_value,
    }));
    pendingWrites.clear();

    const { data, error } = await supabase
      .from(SHARED_STORAGE_TABLE)
      .upsert(writeBatch, { onConflict: "storage_key" })
      .select("storage_key,updated_at");

    if (error) {
      console.warn(`[sync] Failed to push local updates: ${error.message}`);
      writeBatch.forEach(({ storage_key, storage_value }) => {
        pendingWrites.set(storage_key, storage_value);
      });
    } else {
      ((data ?? []) as Array<Pick<SharedStorageRow, "storage_key" | "updated_at">>).forEach((row) => {
        remoteVersions.set(row.storage_key, row.updated_at);
      });
    }

    isFlushing = false;

    if (pendingWrites.size > 0 && flushTimer === null && !disposed) {
      flushTimer = window.setTimeout(() => {
        flushTimer = null;
        void flushWrites();
      }, SYNC_FLUSH_DEBOUNCE_MS);
    }
  };

  const applyRemoteRows = (rows: SharedStorageRow[]): void => {
    if (rows.length === 0) return;

    applyingRemote = true;
    try {
      rows.forEach((row) => {
        const currentValue = window.localStorage.getItem(row.storage_key);

        if (row.storage_value === null) {
          if (currentValue !== null) {
            window.localStorage.removeItem(row.storage_key);
            emitStorageEvent(row.storage_key);
          }
        } else if (currentValue !== row.storage_value) {
          window.localStorage.setItem(row.storage_key, row.storage_value);
          emitStorageEvent(row.storage_key);
        }

        remoteVersions.set(row.storage_key, row.updated_at);
      });
    } finally {
      applyingRemote = false;
    }
  };

  const pullRemoteChanges = async (): Promise<void> => {
    if (disposed) return;

    const { versions, error: versionError } = await readRowVersions();
    if (versionError) {
      console.warn(`[sync] Failed to poll remote updates: ${versionError}`);
      return;
    }

    const changedKeys = versions
      .filter((item) => remoteVersions.get(item.storage_key) !== item.updated_at)
      .map((item) => item.storage_key);

    if (changedKeys.length === 0) {
      return;
    }

    const { rows, error: rowError } = await readRows(changedKeys);
    if (rowError) {
      console.warn(`[sync] Failed to load remote changes: ${rowError}`);
      return;
    }

    applyRemoteRows(rows);
  };

  const storageProto = Object.getPrototypeOf(window.localStorage) as Storage;
  const originalSetItem = storageProto.setItem;
  const originalRemoveItem = storageProto.removeItem;
  const originalClear = storageProto.clear;

  storageProto.setItem = function patchedSetItem(key: string, value: string): void {
    originalSetItem.call(this, key, value);

    if (disposed || applyingRemote || this !== window.localStorage || !shouldSyncKey(key)) {
      return;
    }

    queueWrite(key, value);
    emitStorageEvent(key);
  };

  storageProto.removeItem = function patchedRemoveItem(key: string): void {
    originalRemoveItem.call(this, key);

    if (disposed || applyingRemote || this !== window.localStorage || !shouldSyncKey(key)) {
      return;
    }

    queueWrite(key, null);
    emitStorageEvent(key);
  };

  storageProto.clear = function patchedClear(): void {
    const keysToReset = [...SYNC_KEYS].filter((key) => window.localStorage.getItem(key) !== null);

    originalClear.call(this);

    if (disposed || applyingRemote || this !== window.localStorage) {
      return;
    }

    keysToReset.forEach((key) => {
      queueWrite(key, null);
      emitStorageEvent(key);
    });
  };

  const unpatchStorage = (): void => {
    storageProto.setItem = originalSetItem;
    storageProto.removeItem = originalRemoveItem;
    storageProto.clear = originalClear;
  };

  const { rows: initialRows, error: initialError } = await readRows(SYNC_KEYS);
  if (initialError) {
    console.warn(`[sync] Failed to initialize from remote storage: ${initialError}`);
  } else {
    applyRemoteRows(initialRows);

    const existingRemoteKeys = new Set(initialRows.map((row) => row.storage_key));
    SYNC_KEYS.forEach((key) => {
      if (existingRemoteKeys.has(key)) return;
      const localValue = window.localStorage.getItem(key);
      if (localValue !== null) {
        queueWrite(key, localValue);
      }
    });
  }

  await flushWrites();

  pollTimer = window.setInterval(() => {
    void pullRemoteChanges();
  }, SYNC_POLL_INTERVAL_MS);
  void pullRemoteChanges();

  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;

    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }

    if (flushTimer !== null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }

    pendingWrites.clear();
    unpatchStorage();
    activeCleanup = null;
    hasStarted = false;
  };

  activeCleanup = cleanup;
  return cleanup;
};
