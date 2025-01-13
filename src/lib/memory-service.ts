import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Pinecone, 
  Index, 
  ScoredPineconeRecord,
  RecordMetadata 
} from "@pinecone-database/pinecone";
import { useLoggerStore } from "./store-logger";

// Helper function for logging
const log = (message: string, data?: any) => {
  useLoggerStore.getState().log({
    date: new Date(),
    type: 'tool',
    message: data ? `${message} ${JSON.stringify(data)}` : message
  });
};

const logError = (message: string, err: unknown) => {
  useLoggerStore.getState().log({
    date: new Date(),
    type: 'error',
    message: `${message} ${err instanceof Error ? err.message : String(err)}`
  });
};

// Helper function to get byte length of a string
const getByteLength = (str: string): number => {
  return new TextEncoder().encode(str).length;
};

const PINECONE_API_KEY = process.env.REACT_APP_PINECONE_API_KEY as string;
const PINECONE_HOST = process.env.REACT_APP_PINECONE_HOST as string;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;

if (!PINECONE_API_KEY) {
  throw new Error("REACT_APP_PINECONE_API_KEY is required");
}

// Initialize Gemini client for embeddings
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize Pinecone client
log('🌲 Initializing Pinecone client...');
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY
});

// Index configuration
const INDEX_NAME = "gemini-memory";
const DIMENSION = 768; // Dimension for Gemini embeddings

const MAX_CHUNK_SIZE = 2048; // Maximum size in bytes for each chunk
const CHUNK_OVERLAP = 200;   // Overlap between chunks in bytes

// Export class and interface first
export interface Memory {
  id: string;
  text: string;
  embedding: number[];
  timestamp: number;
  type: 'user' | 'assistant';
  mode: 'text' | 'voice';
}

interface MemoryMetadata extends RecordMetadata {
  text: string;
  timestamp: string;
  type: string;
  mode: string;
}

export class MemoryService {
  private index!: Index;

  constructor() {
    log('🌲 Creating MemoryService instance...');
    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      log('🌲 Listing available Pinecone indexes...');
      const indexes = await pinecone.listIndexes();
      log('🌲 Found indexes:', { count: indexes.indexes?.length || 0, names: indexes.indexes?.map(idx => idx.name).join(', ') });
      
      const existingIndex = indexes.indexes?.find(idx => idx.name === INDEX_NAME);
      
      if (!existingIndex) {
        log('🌲 Creating new index:', { name: INDEX_NAME, dimension: DIMENSION, metric: 'cosine' });
        await pinecone.createIndex({
          name: INDEX_NAME,
          dimension: DIMENSION,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        log('🌲 Index created successfully');
      } else {
        log('🌲 Using existing index:', {
          name: existingIndex.name,
          dimension: existingIndex.dimension,
          metric: existingIndex.metric,
          status: existingIndex.status
        });
      }

      log('🌲 Connecting to index...');
      this.index = pinecone.index(INDEX_NAME);
      log('🌲 Successfully connected to Pinecone index:', { name: INDEX_NAME });
    } catch (err) {
      logError('🌲 Failed to initialize index', err);
      throw err;
    }
  }

  /**
   * Split text into chunks that fit within the embedding model's limits
   */
  private chunkText(text: string): string[] {
    log('🌲 Chunking text:', { length: text.length, maxSize: MAX_CHUNK_SIZE });
    const chunks: string[] = [];
    let currentChunk = '';
    const words = text.split(' ');

    for (const word of words) {
      const potentialChunk = currentChunk + ' ' + word;
      
      if (getByteLength(potentialChunk) > MAX_CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          // If a single word is too long, split it
          chunks.push(word.slice(0, Math.floor(MAX_CHUNK_SIZE / 2))); // Use character length as approximation
          currentChunk = '';
        }
      } else {
        currentChunk = potentialChunk;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    log('🌲 Text chunked into parts:', { count: chunks.length });
    return chunks;
  }

  /**
   * Generate embedding for text using Gemini
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      log('🌲 Generating embedding for text:', { length: text.length });
      
      if (getByteLength(text) > MAX_CHUNK_SIZE) {
        throw new Error(`Text exceeds maximum chunk size of ${MAX_CHUNK_SIZE} bytes`);
      }

      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      const embedding = await result.embedding;
      const values = [...Object.values(embedding)];
      log('🌲 Embedding generated successfully:', { dimensions: values.length });
      return values;
    } catch (err) {
      logError('🌲 Error generating embedding', err);
      throw err;
    }
  }

  /**
   * Store a new memory, chunking if necessary
   */
  async storeMemory(
    text: string, 
    type: 'user' | 'assistant',
    mode: 'text' | 'voice' = 'text',
    conversationId?: string
  ): Promise<void> {
    try {
      log('🌲 Storing new memory:', { type, mode, textLength: text.length });
      const chunks = this.chunkText(text);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        log('🌲 Processing chunk:', { index: i + 1, total: chunks.length, length: chunk.length });
        
        const embedding = await this.generateEmbedding(chunk);
        const id = `${Date.now()}_${i}`;

        log('🌲 Upserting vector to Pinecone:', { id, chunkIndex: i });
        await this.index.upsert([{
          id,
          values: embedding,
          metadata: {
            text: chunk,
            timestamp: Date.now().toString(),
            type: type.toString(),
            mode: mode.toString(),
            conversationId,
            isChunk: (chunks.length > 1).toString(),
            chunkIndex: i.toString(),
            totalChunks: chunks.length.toString()
          } as MemoryMetadata
        }]);
        log('🌲 Vector upserted successfully');
      }
      log('🌲 Memory storage completed');
    } catch (err) {
      logError('🌲 Error storing memory', err);
      throw err;
    }
  }

  /**
   * Retrieve relevant memories for a given query
   */
  async queryMemories(
    query: string, 
    limit: number = 5,
    mode?: 'text' | 'voice'
  ): Promise<Memory[]> {
    try {
      log('🌲 Querying memories:', { queryLength: query.length, limit, mode });
      const queryChunks = this.chunkText(query);
      const queryEmbedding = await this.generateEmbedding(queryChunks[0]);
      
      const queryParams = {
        vector: queryEmbedding,
        topK: limit * 2,
        includeMetadata: true,
        filter: mode ? { mode: { $eq: mode.toString() } } : undefined
      };

      log('🌲 Executing Pinecone query:', queryParams);
      const results = await this.index.query(queryParams);
      log('🌲 Query returned matches:', { count: results.matches.length });

      const processedResults = new Map<string, Memory>();
      
      results.matches.forEach((match: ScoredPineconeRecord) => {
        if (!match.metadata) {
          throw new Error('No metadata found for match');
        }
        
        const metadata = match.metadata as MemoryMetadata;
        const baseId = match.id.includes('_') ? match.id.split('_')[0] : match.id;

        if (!processedResults.has(baseId)) {
          processedResults.set(baseId, {
            id: match.id,
            text: metadata.text,
            embedding: match.values || [],
            timestamp: parseInt(metadata.timestamp),
            type: metadata.type as 'user' | 'assistant',
            mode: metadata.mode as 'text' | 'voice'
          });
        } else if (metadata.isChunk === 'true') {
          const existing = processedResults.get(baseId)!;
          existing.text += ' ' + metadata.text;
        }
      });

      const finalResults = Array.from(processedResults.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      // Format results for Gemini's context
      const contextString = finalResults.map(memory => {
        const timestamp = new Date(memory.timestamp).toLocaleString();
        return `[${memory.type.toUpperCase()} ${timestamp}]: ${memory.text}`;
      }).join('\n\n');

      log('🌲 Formatted context for Gemini:', { 
        memoryCount: finalResults.length,
        contextPreview: contextString.slice(0, 100) + '...'
      });

      // Return both the raw results and formatted context
      return Object.assign(finalResults, { 
        contextString,
        relevanceExplanation: `Found ${finalResults.length} relevant memories from the conversation history, ordered by recency. These memories provide context about previous interactions and their timestamps.`
      });
    } catch (err) {
      logError('🌲 Error querying memories', err);
      throw err;
    }
  }
}

// Create instance
log('🌲 Creating MemoryService singleton instance...');
const memoryService = new MemoryService();

// Export instance and bound methods
export { memoryService };
export const storeMemory = (text: string, type: 'user' | 'assistant', mode: 'text' | 'voice' = 'text', conversationId?: string) => 
  memoryService.storeMemory(text, type, mode, conversationId);
export const queryMemories = (query: string, limit: number = 5, mode?: 'text' | 'voice') => 
  memoryService.queryMemories(query, limit, mode); 