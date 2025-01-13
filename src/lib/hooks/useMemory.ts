import { useCallback } from 'react';
import { Memory, storeMemory, queryMemories } from '../memory-service';

export function useMemory() {
  const storeMemoryFn = useCallback(
    async (text: string, type: 'user' | 'assistant', mode: 'text' | 'voice' = 'text', conversationId?: string) => {
      return storeMemory(text, type, mode, conversationId);
    },
    []
  );

  const queryMemoriesFn = useCallback(
    async (query: string, limit: number = 5, mode?: 'text' | 'voice') => {
      return queryMemories(query, limit, mode);
    },
    []
  );

  return {
    storeMemory: storeMemoryFn,
    queryMemories: queryMemoriesFn,
  };
} 