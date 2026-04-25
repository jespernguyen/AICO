import type { AggregateStats, AnalysisRecord } from "../types/analysis";

export const STORAGE_KEY = "aico:analysisRecords";
export const API_KEY_STORAGE_KEY = "aico:geminiApiKey";

let inMemoryRecords: AnalysisRecord[] = [];
let inMemoryApiKey: string | null = null;

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== "undefined" &&
    typeof chrome.storage !== "undefined" &&
    typeof chrome.storage.local !== "undefined"
  );
}

function hasChromeSyncStorage(): boolean {
  return (
    typeof chrome !== "undefined" &&
    typeof chrome.storage !== "undefined" &&
    typeof chrome.storage.sync !== "undefined"
  );
}

function storageGet<T>(key: string): Promise<T | undefined> {
  if (!hasChromeStorage()) {
    if (key === STORAGE_KEY) {
      return Promise.resolve(inMemoryRecords as T);
    }
    return Promise.resolve(undefined);
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result[key] as T | undefined);
    });
  });
}

function storageSet<T>(key: string, value: T): Promise<void> {
  if (!hasChromeStorage()) {
    if (key === STORAGE_KEY) {
      inMemoryRecords = value as AnalysisRecord[];
    }
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function syncStorageGet<T>(key: string): Promise<T | undefined> {
  if (!hasChromeSyncStorage()) {
    if (key === API_KEY_STORAGE_KEY) {
      return Promise.resolve(inMemoryApiKey as T | undefined);
    }
    return Promise.resolve(undefined);
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (result) => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result[key] as T | undefined);
    });
  });
}

function syncStorageSet<T>(key: string, value: T): Promise<void> {
  if (!hasChromeSyncStorage()) {
    if (key === API_KEY_STORAGE_KEY) {
      inMemoryApiKey = value as string;
    }
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function syncStorageRemove(key: string): Promise<void> {
  if (!hasChromeSyncStorage()) {
    if (key === API_KEY_STORAGE_KEY) {
      inMemoryApiKey = null;
    }
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(key, () => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

export async function saveAnalysisRecord(record: AnalysisRecord): Promise<void> {
  const existing = await getAnalysisRecords();
  await storageSet(STORAGE_KEY, [record, ...existing]);
}

export async function getAnalysisRecords(): Promise<AnalysisRecord[]> {
  const records = await storageGet<AnalysisRecord[]>(STORAGE_KEY);
  return Array.isArray(records) ? records : [];
}

export async function clearAnalysisRecords(): Promise<void> {
  await storageSet(STORAGE_KEY, []);
}

export async function getApiKey(): Promise<string | null> {
  const value = await syncStorageGet<string>(API_KEY_STORAGE_KEY);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  await syncStorageSet(API_KEY_STORAGE_KEY, trimmed);
}

export async function removeApiKey(): Promise<void> {
  await syncStorageRemove(API_KEY_STORAGE_KEY);
}

export async function getAggregateStats(): Promise<AggregateStats> {
  const records = await getAnalysisRecords();

  return records.reduce<AggregateStats>(
    (aggregate, record) => {
      aggregate.totalPromptsAnalyzed += 1;
      aggregate.totalTokensSaved += record.comparison.tokensSaved;
      aggregate.totalCostSavedUsd += record.comparison.costSavedUsd;
      aggregate.totalCo2SavedGrams += record.comparison.co2SavedGrams;
      return aggregate;
    },
    {
      totalPromptsAnalyzed: 0,
      totalTokensSaved: 0,
      totalCostSavedUsd: 0,
      totalCo2SavedGrams: 0,
    }
  );
}
