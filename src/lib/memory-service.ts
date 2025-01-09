import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Pinecone, 
  Index, 
  ScoredPineconeRecord,
  RecordMetadata 
} from "@pinecone-database/pinecone";
import { useLoggerStore } from './store-logger';
import { StreamingLog } from "../multimodal-live-types";

const PINECONE_API_KEY = process.env.REACT_APP_PINCONE_API_KEY as string;
const PINECONE_HOST = process.env.REACT_APP_PINCONE_HOST as string;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;

if (!PINECONE_API_KEY) {
  throw new Error("REACT_APP_PINCONE_API_KEY is required");
}

// Initialize Gemini client for embeddings
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY
});

// Get logger instance
const { log } = useLoggerStore.getState();

// Helper function to create log entries
function createLog(message: string, type: 'info' | 'error' = 'info'): StreamingLog {
  return {
    date: new Date(),
    message,
    type
  };
}

// Index configuration
const INDEX_NAME = "gemini-memory";
const DIMENSION = 768; // Dimension for Gemini embeddings

const MAX_CHUNK_SIZE = 2048; // Maximum size in bytes for each chunk
const CHUNK_OVERLAP = 200;   // Overlap between chunks in bytes

interface Memory {
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
    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      log(createLog('Initializing Pinecone connection...'));
      
      // List all indexes
      const indexes = await pinecone.listIndexes();
      log(createLog(`Found ${indexes.indexes?.length || 0} existing indexes`));
      
      // Check if our index exists
      const existingIndex = indexes.indexes?.find(idx => idx.name === INDEX_NAME);
      
      if (!existingIndex) {
        // Only create if index doesn't exist
        log(createLog(`Creating new index: ${INDEX_NAME}`));
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

        // Wait for index to be ready
        log(createLog('Waiting for index to be ready...'));
        let isReady = false;
        while (!isReady) {
          const description = await pinecone.describeIndex(INDEX_NAME);
          if (description.status?.ready) {
            isReady = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        log(createLog(`Using existing index: ${INDEX_NAME}`));
      }

      // Initialize index connection
      this.index = pinecone.index(INDEX_NAME);
      log(createLog(`Successfully connected to Pinecone index: ${INDEX_NAME}`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error initializing Pinecone';
      log(createLog(`Failed to initialize Pinecone: ${errorMessage}`, 'error'));
      throw error;
    }
  }

  /**
   * Calculate the byte size of a string
   */
  private getByteSize(str: string): number {
    return new TextEncoder().encode(str).length;
  }

  /**
   * Split text into chunks that fit within the embedding model's limits
   */
  private chunkText(text: string): string[] {
    try {
      log(createLog(`Chunking text of length ${text.length}`));
      const chunks: string[] = [];
      let currentChunk = '';
      const words = text.split(' ');

      for (const word of words) {
        const potentialChunk = currentChunk + ' ' + word;
        
        if (this.getByteSize(potentialChunk) > 2048) { // Gemini's limit
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = word;
          } else {
            // If a single word is too long, split it
            chunks.push(word.slice(0, 100)); // Take first 100 chars
            currentChunk = word.slice(100);
          }
        } else {
          currentChunk = potentialChunk;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      log(createLog(`Split text into ${chunks.length} chunks`));
      return chunks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error chunking text';
      log(createLog(`Error chunking text: ${errorMessage}`, 'error'));
      throw error;
    }
  }

  /**
   * Generate embedding for text using Gemini
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      log(createLog(`Generating embedding for text of length ${text.length}`));
      
      // Ensure text is within size limit
      if (this.getByteSize(text) > 2048) {
        throw new Error(`Text exceeds maximum size of 2048 bytes`);
      }

      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      const embedding = await result.embedding;
      
      log(createLog(`Successfully generated embedding`));
      return [...Object.values(embedding)];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error generating embedding';
      log(createLog(`Error generating embedding: ${errorMessage}`, 'error'));
      throw error;
    }
  }

  /**
   * Store a new memory
   */
  async storeMemory(
    text: string, 
    type: 'user' | 'assistant',
    mode: 'text' | 'voice' = 'text'
  ): Promise<void> {
    try {
      // Generate a hash of the text to use as ID
      const id = Date.now().toString();
      
      // Generate embedding for the text
      let embedding: number[];
      try {
        embedding = await this.generateEmbedding(text);
      } catch (error) {
        // If the text is too long, chunk it and use the first chunk's embedding
        const chunks = this.chunkText(text);
        embedding = await this.generateEmbedding(chunks[0]);
      }

      // Store the memory
      await this.index.upsert([{
        id,
        values: embedding,
        metadata: {
          text,
          timestamp: Date.now().toString(),
          type: type.toString(),
          mode: mode.toString()
        } as MemoryMetadata
      }]);

      log(createLog(`Successfully stored memory with ID: ${id}`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error storing memory';
      log(createLog(`Error storing memory: ${errorMessage}`, 'error'));
      throw error;
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
      const queryEmbedding = await this.generateEmbedding(query);
      
      const queryParams: any = {
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true
      };

      if (mode) {
        queryParams.filter = {
          mode: { $eq: mode.toString() }
        };
      }

      const results = await this.index.query(queryParams);
      
      return results.matches
        .filter((match: ScoredPineconeRecord) => match.metadata)
        .map((match: ScoredPineconeRecord) => {
          const metadata = match.metadata as MemoryMetadata;
          return {
            id: match.id,
            text: metadata.text,
            embedding: match.values || [],
            timestamp: parseInt(metadata.timestamp),
            type: metadata.type as 'user' | 'assistant',
            mode: metadata.mode as 'text' | 'voice'
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error querying memories:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService(); 