/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import { DebugPanel } from "./components/debug-panel/DebugPanel";
import ControlTray from "./components/control-tray/ControlTray";
import TerminalLayout from "./components/TerminalLayout/TerminalLayout";
import ChatPanel from "./components/ChatPanel/ChatPanel";
import { ThemeProvider } from 'styled-components';
import FloatingDebugWindow from "./components/FloatingDebugWindow/FloatingDebugWindow";
import { searchGifs } from './lib/giphy-service';
import Logger from './components/logger/Logger';
import { useLoggerStore } from './lib/store-logger';
import { searchYouTubeVideos } from './lib/youtube-service';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

// Define theme
const theme = {
  colors: {
    primary: '#00ff66',     // Neon green (for system controls)
    secondary: '#ff3366',   // Neon pink (for terminal/chat)
    accent: '#00ccff',      // Neon blue (for media feed)
    warning: '#ffae00',     // Amber (for warnings/alerts)
    chartGreen: '#33ff99',  // Bright mint (for charts/viz)
    chartRed: '#ff3366',    // Hot pink (for charts/viz)
    chartBlue: '#00ccff',   // Cyan (for charts/viz)
    background: '#0a0b16',  // Deep navy blue
    surface: '#141829',     // Lighter navy blue
    text: {
      primary: '#00ff66',   // Neon green
      secondary: '#ff3366', // Neon pink
      accent: '#ffffff',    // Pure white
      warning: '#ffae00'    // Amber
    }
  },
  effects: {
    glow: (color: string) => `0 0 10px ${color}cc, 0 0 20px ${color}66, 0 0 30px ${color}33`,
    scanlines: `
      linear-gradient(
        to bottom,
        transparent 50%,
        rgba(20, 24, 41, 0.8) 50%
      )
    `,
    noise: `
      repeating-radial-gradient(
        rgba(0, 204, 255, 0.05) 100px,
        transparent 100px,
        transparent 200px
      )
    `,
    chartGlow: `0 0 15px rgba(51, 255, 153, 0.5)`,
    terminalShadow: `
      0 0 10px rgba(255, 51, 102, 0.3),
      0 0 20px rgba(255, 51, 102, 0.2),
      0 0 30px rgba(255, 51, 102, 0.1)
    `
  },
  fonts: {
    mono: "'Share Tech Mono', monospace",
    display: "'Share Tech Mono', monospace"
  }
};

function AppContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [currentGifUrl, setCurrentGifUrl] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const { volume, client } = useLiveAPIContext();
  const [showDebug, setShowDebug] = useState(false);
  const { log } = useLoggerStore();

  const handleDebugToggle = useCallback(() => {
    console.log('Toggling debug, current state:', showDebug);
    setShowDebug(prev => !prev);
  }, []);

  // Connect to client logs
  useEffect(() => {
    client.on('log', log);
    return () => {
      client.off('log', log);
    };
  }, [client, log]);

  // Add debug logging for tool calls
  useEffect(() => {
    const handleToolCall = (toolCall: any) => {
      console.log('Tool call received:', toolCall);
      
      const gifCall = toolCall.functionCalls.find(
        (fc: any) => fc.name === 'searchGif'
      );

      if (gifCall) {
        console.log('GIF tool call detected:', gifCall);
        console.log('Attempting to search GIF with query:', gifCall.args.query);
        // Clear any existing video from media feed
        setCurrentVideoId(null);
        searchGifs({
          query: gifCall.args.query,
          rating: gifCall.args.rating || 'g',
          limit: 1
        })
        .then(results => {
          if (results.length > 0) {
            console.log('GIF search successful:', results[0]);
            setCurrentGifUrl(results[0].url);
            // Send success response back
            const response = {
              functionResponses: [{
                response: { success: true, url: results[0].url },
                id: gifCall.id
              }]
            };
            console.log('Sending tool response:', response);
            client.sendToolResponse(response);
          } else {
            console.log('No GIFs found for query:', gifCall.args.query);
            const response = {
              functionResponses: [{
                response: { success: false, error: 'No GIFs found' },
                id: gifCall.id
              }]
            };
            console.log('Sending error response:', response);
            client.sendToolResponse(response);
          }
        })
        .catch(error => {
          console.error('GIF search failed:', error);
          const response = {
            functionResponses: [{
              response: { success: false, error: error.message },
              id: gifCall.id
            }]
          };
          console.log('Sending error response:', response);
          client.sendToolResponse(response);
        });
      }

      const youtubeCall = toolCall.functionCalls.find(
        (fc: any) => fc.name === 'searchYouTube'
      );

      if (youtubeCall) {
        console.log('YouTube tool call detected:', youtubeCall);
        // Clear any existing GIF from media feed
        setCurrentGifUrl(null);
        searchYouTubeVideos({ query: youtubeCall.args.query })
          .then(results => {
            if (results.length > 0) {
              console.log('YouTube search successful:', results[0]);
              setCurrentVideoId(results[0].id);
              client.sendToolResponse({
                functionResponses: [{
                  response: { 
                    success: true, 
                    id: results[0].id,
                    title: results[0].title,
                    thumbnail: results[0].thumbnailUrl
                  },
                  id: youtubeCall.id
                }]
              });
            } else {
              console.log('No videos found for query:', youtubeCall.args.query);
              client.sendToolResponse({
                functionResponses: [{
                  response: { success: false, error: 'No videos found' },
                  id: youtubeCall.id
                }]
              });
            }
          })
          .catch(error => {
            console.error('YouTube search failed:', error);
            client.sendToolResponse({
              functionResponses: [{
                response: { success: false, error: error.message },
                id: youtubeCall.id
              }]
            });
          });
      }
    };

    client.on('toolcall', handleToolCall);
    return () => {
      client.off('toolcall', handleToolCall);
    };
  }, [client]);

  return (
    <div style={{ 
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <TerminalLayout
        debugPanel={<DebugPanel />}
        chatPanel={<ChatPanel />}
        controlPanel={
          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
            onDebugToggle={handleDebugToggle}
            debugEnabled={showDebug}
          />
        }
        videoRef={videoRef}
        volume={volume}
        gifUrl={currentGifUrl}
        videoId={currentVideoId}
      />
      
      {showDebug && (
        <div style={{ 
          position: 'fixed', 
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999
        }}>
          <FloatingDebugWindow 
            onClose={() => setShowDebug(false)}
            defaultPosition={{ x: window.innerWidth - 350, y: 40 }}
          >
            <Logger filter="none" />
          </FloatingDebugWindow>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div 
        className="App terminal-screen" 
        style={{ 
          position: 'fixed',
          inset: 0,
          background: theme.colors.background,
          overflow: 'hidden'
        }}
      >
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
          <AppContent />
        </LiveAPIProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
