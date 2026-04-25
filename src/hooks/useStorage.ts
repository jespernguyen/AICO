import { useCallback, useEffect, useState } from "react";
import type { AggregateStats, AnalysisRecord } from "../types/analysis";
import {
  clearAnalysisRecords,
  getApiKey,
  getAggregateStats,
  getAnalysisRecords,
  removeApiKey,
  saveApiKey,
  saveAnalysisRecord,
} from "../utils/storage";

const EMPTY_AGGREGATE: AggregateStats = {
  totalPromptsAnalyzed: 0,
  totalTokensSaved: 0,
  totalCostSavedUsd: 0,
  totalCo2SavedGrams: 0,
};

export function useStorage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [aggregate, setAggregate] = useState<AggregateStats>(EMPTY_AGGREGATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const refreshRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextRecords, nextAggregate] = await Promise.all([
        getAnalysisRecords(),
        getAggregateStats(),
      ]);
      setRecords(nextRecords);
      setAggregate(nextAggregate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRecord = useCallback(
    async (record: AnalysisRecord) => {
      setLoading(true);
      setError(null);

      try {
        await saveAnalysisRecord(record);
        await refreshRecords();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    },
    [refreshRecords]
  );

  const clearRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await clearAnalysisRecords();
      setRecords([]);
      setAggregate(EMPTY_AGGREGATE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKey = useCallback(async () => {
    setStorageLoading(true);
    setStorageError(null);

    try {
      const storedKey = await getApiKey();
      setApiKey(storedKey);
    } catch (err) {
      setStorageError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setStorageLoading(false);
    }
  }, []);

  const saveKey = useCallback(async (key: string) => {
    setStorageLoading(true);
    setStorageError(null);

    try {
      const trimmed = key.trim();
      await saveApiKey(trimmed);
      setApiKey(trimmed || null);
    } catch (err) {
      setStorageError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setStorageLoading(false);
    }
  }, []);

  const removeKey = useCallback(async () => {
    setStorageLoading(true);
    setStorageError(null);

    try {
      await removeApiKey();
      setApiKey(null);
    } catch (err) {
      setStorageError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRecords();
  }, [refreshRecords]);

  useEffect(() => {
    void loadKey();
  }, [loadKey]);

  return {
    records,
    aggregate,
    loading,
    error,
    apiKey,
    hasApiKey: Boolean(apiKey && apiKey.length > 0),
    storageLoading,
    storageError,
    saveRecord,
    saveKey,
    removeKey,
    refreshRecords,
    clearRecords,
  };
}
