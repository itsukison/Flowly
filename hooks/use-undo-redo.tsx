"use client";

import { useCallback, useRef, useState } from "react";

interface HistoryEntry<T> {
  data: T[];
  timestamp: number;
}

interface UseUndoRedoProps<T> {
  initialData: T[];
  maxHistorySize?: number;
  onRestore?: (data: T[]) => void;
}

export function useUndoRedo<T>({
  initialData,
  maxHistorySize = 50,
  onRestore,
}: UseUndoRedoProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const historyRef = useRef<HistoryEntry<T>[]>([
    { data: initialData, timestamp: Date.now() },
  ]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < historyRef.current.length - 1;

  // Push new state to history
  const pushHistory = useCallback(
    (data: T[]) => {
      // Remove any redo history after current index
      historyRef.current = historyRef.current.slice(0, currentIndex + 1);

      // Add new entry
      historyRef.current.push({
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        timestamp: Date.now(),
      });

      // Limit history size
      if (historyRef.current.length > maxHistorySize) {
        historyRef.current.shift();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, maxHistorySize]
  );

  // Undo to previous state
  const undo = useCallback(() => {
    if (!canUndo) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);

    const entry = historyRef.current[newIndex];
    if (entry && onRestore) {
      onRestore(entry.data);
    }

    return entry?.data ?? null;
  }, [canUndo, currentIndex, onRestore]);

  // Redo to next state
  const redo = useCallback(() => {
    if (!canRedo) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    const entry = historyRef.current[newIndex];
    if (entry && onRestore) {
      onRestore(entry.data);
    }

    return entry?.data ?? null;
  }, [canRedo, currentIndex, onRestore]);

  // Clear history
  const clearHistory = useCallback(() => {
    historyRef.current = [{ data: initialData, timestamp: Date.now() }];
    setCurrentIndex(0);
  }, [initialData]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    clearHistory,
    historySize: historyRef.current.length,
    currentIndex,
  };
}
