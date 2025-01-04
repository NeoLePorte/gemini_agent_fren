import { GiphyFetch } from '@giphy/js-fetch-api';
import type { IGif } from '@giphy/js-types';

const GIPHY_API_KEY = process.env.REACT_APP_GIPHY_API_KEY;
if (!GIPHY_API_KEY) {
  throw new Error('REACT_APP_GIPHY_API_KEY must be set in .env file');
}

// Initialize Giphy client with API key from environment
const gf = new GiphyFetch(GIPHY_API_KEY);

export interface GiphySearchParams {
  query: string;
  rating?: 'g' | 'pg' | 'pg-13' | 'r';
  limit?: number;
}

export interface GiphyResult {
  url: string;
  title: string;
  id: string;
  width: number;
  height: number;
}

/**
 * Search for GIFs using the GIPHY API
 * @param params Search parameters
 * @returns Array of GIF results
 */
export const searchGifs = async ({ 
  query, 
  rating = 'g', 
  limit = 1 
}: GiphySearchParams): Promise<GiphyResult[]> => {
  console.log('GIPHY Service: Searching for GIFs with params:', { query, rating, limit });
  
  try {
    console.log('GIPHY Service: Calling GIPHY API...');
    const { data } = await gf.search(query, { 
      rating,
      limit,
      type: 'gifs',
      sort: 'relevant',
      lang: 'en'
    });

    console.log('GIPHY Service: API call successful, received', data.length, 'results');
    const results = data.map(mapGifToResult);
    console.log('GIPHY Service: Mapped results:', results);
    return results;
  } catch (error) {
    console.error('GIPHY Service: Error searching GIFs:', error);
    throw new Error('Failed to search for GIFs');
  }
};

/**
 * Get a random GIF based on a search query
 * @param params Search parameters
 * @returns A single GIF result or null if none found
 */
export const getRandomGif = async ({ 
  query, 
  rating = 'g' 
}: Omit<GiphySearchParams, 'limit'>): Promise<GiphyResult | null> => {
  try {
    const { data } = await gf.random({ 
      tag: query, 
      rating,
      type: 'gifs'
    });

    return mapGifToResult(data);
  } catch (error) {
    console.error('Error getting random GIF:', error);
    throw new Error('Failed to get random GIF');
  }
};

// Helper function to map GIPHY API response to our result type
const mapGifToResult = (gif: IGif): GiphyResult => {
  console.log('GIPHY Service: Mapping GIF result:', gif.id);
  const result = {
    url: gif.images.original.url,
    title: gif.title,
    id: gif.id.toString(),
    width: gif.images.original.width ? Number(gif.images.original.width) : 0,
    height: gif.images.original.height ? Number(gif.images.original.height) : 0
  };
  console.log('GIPHY Service: Mapped result:', result);
  return result;
}; 