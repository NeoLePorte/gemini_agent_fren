import axios from 'axios';

const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  throw new Error('REACT_APP_YOUTUBE_API_KEY must be set in .env file');
}

export interface YouTubeSearchParams {
  query: string;
  maxResults?: number;
}

export interface YouTubeResult {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      thumbnails: {
        high: {
          url: string;
        };
      };
    };
  }>;
}

/**
 * Search for YouTube videos using the YouTube Data API
 * @param params Search parameters
 * @returns Array of video results
 */
export const searchYouTubeVideos = async ({ 
  query, 
  maxResults = 1 
}: YouTubeSearchParams): Promise<YouTubeResult[]> => {
  console.log('YouTube Service: Searching for videos with params:', { query, maxResults });
  
  try {
    console.log('YouTube Service: Calling YouTube API...');
    const response = await axios.get<YouTubeSearchResponse>('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        maxResults,
        key: YOUTUBE_API_KEY,
        type: 'video'
      }
    });

    console.log('YouTube Service: API call successful, received', response.data.items.length, 'results');
    
    const results = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      videoUrl: `https://www.youtube.com/embed/${item.id.videoId}`
    }));

    console.log('YouTube Service: Mapped results:', results);
    return results;
  } catch (error) {
    console.error('YouTube Service: Error searching videos:', error);
    throw new Error('Failed to search for YouTube videos');
  }
}; 