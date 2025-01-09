import { useCallback } from 'react';
import { memoryService } from '../memory-service';

export function useMemory() {
  const storeMemory = useCallback(async (
    text: string,
    type: 'user' | 'assistant',
    mode: 'text' | 'voice' = 'text'
  ) => {
    try {
      await memoryService.storeMemory(text, type, mode);
    } catch (error) {
      console.error('Error storing memory:', error);
    }
  }, []);

  const queryMemories = useCallback(async (
    query: string,
    limit: number = 5,
    mode?: 'text' | 'voice'
  ) => {
    try {
      return await memoryService.queryMemories(query, limit, mode);
    } catch (error) {
      console.error('Error querying memories:', error);
      return [];
    }
  }, []);

  return {
    storeMemory,
    queryMemories,
    memoryService
  };
} 