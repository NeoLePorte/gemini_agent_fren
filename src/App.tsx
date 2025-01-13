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
import ThinkingModal from './components/ThinkingModal/ThinkingModal';
import { callThinkingMode } from './lib/thinking-service';
import { Part } from "@google/generative-ai";
import { useMemory } from './lib/hooks/useMemory';
import { Memory } from './lib/memory-service';

// Verify environment variables at startup
console.log('Checking environment variables:', {
  hasGeminiKey: !!process.env.REACT_APP_GEMINI_API_KEY,
  hasPineconeKey: !!process.env.REACT_APP_PINECONE_API_KEY,
  nodeEnv: process.env.NODE_ENV,
  availableEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
});

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

// Also verify Pinecone key
const PINECONE_KEY = process.env.REACT_APP_PINECONE_API_KEY;
if (typeof PINECONE_KEY !== "string") {
  throw new Error("set REACT_APP_PINECONE_API_KEY in .env");
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
  const [messages, setMessages] = useState<Array<{
    role: string;
    content: string;
    complete: boolean;
    thinking?: boolean;
  }>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [currentGifUrl, setCurrentGifUrl] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const { volume, client } = useLiveAPIContext();
  const [showDebug, setShowDebug] = useState(false);
  const { log } = useLoggerStore();
  const [isThinkingModalOpen, setIsThinkingModalOpen] = useState(false);
  const [thinkingResult, setThinkingResult] = useState<{
    thoughtProcess?: string;
    finalAnswer: string;
  } | null>(null);
  const [thinkingModeEnabled, setThinkingModeEnabled] = useState(false);
  const { storeMemory, queryMemories } = useMemory();

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

  // Add thinking mode toggle handler
  const handleThinkingModeToggle = useCallback(() => {
    console.log('Thinking mode toggle clicked');
    console.log('Current thinking mode state:', thinkingModeEnabled);
    console.log('Current thinking result:', thinkingResult);
    
    const newThinkingModeEnabled = !thinkingModeEnabled;
    setThinkingModeEnabled(newThinkingModeEnabled);
    
    // Only show modal if thinking mode is being enabled and we have results
    if (newThinkingModeEnabled) {
      setIsThinkingModalOpen(true);
    } else {
      setIsThinkingModalOpen(false);
    }
  }, [thinkingModeEnabled, thinkingResult]);

  // Add effect to log state changes
  useEffect(() => {
    console.log('Thinking mode enabled:', thinkingModeEnabled);
    console.log('Thinking modal open:', isThinkingModalOpen);
    console.log('Thinking result:', thinkingResult);
  }, [thinkingModeEnabled, isThinkingModalOpen, thinkingResult]);

  // Simplified message handling without storage
  const handleMessage = useCallback(async (parts: Part[], turnComplete: boolean = true) => {
    if (!client) return;
    client.send(parts, turnComplete);
  }, [client]);

  // Handle user message submissions from the chat panel
  const handleUserMessage = useCallback(async (parts: Part[]) => {
    if (!client) return;

    // Get relevant memories before sending the message
    const userMessage = parts[0].text || '';
    const relevantMemories = await queryMemories(userMessage);
    
    // If we have relevant memories, add them as context
    if (relevantMemories.length > 0) {
      const contextMessage: Part = {
        text: "Here's some relevant context from our previous conversation:\n" +
          relevantMemories.map((m: Memory) => 
            `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.text}`
          ).join('\n')
      };
      handleMessage([contextMessage], false); // false means this isn't the end of the turn
    }

    // Send the actual user message
    client.send(parts, true);

    // Store the message in memory
    await storeMemory(userMessage, 'user');
  }, [client, queryMemories, storeMemory]);

  // Simplified response handling
  useEffect(() => {
    const handleContent = async (content: any) => {
      if (!content.modelTurn?.parts) return;

      const message = content.modelTurn.parts
        .map((p: any) => p.text || '')
        .join(' ');

      if (!message) return;

      const config = client.getConfig();
      const mode = Boolean(videoStream) || config.generationConfig?.responseModalities === 'audio'
        ? 'voice'
        : 'text';

      await storeMemory(message, 'assistant', mode);
    };

    client.on('content', handleContent);
    return () => {
      client.off('content', handleContent);
      return undefined;
    };
  }, [client, videoStream, storeMemory]);

  // Simplified thinking mode handling
  useEffect(() => {
    const handleToolCall = async (toolCall: any) => {
      const thinkingCall = toolCall.functionCalls.find(
        (call: { name: string; args: any; id: string }) => call.name === 'useThinkingMode'
      );

      if (thinkingCall) {
        try {
          // Call the thinking service
          const thinkingResult = await callThinkingMode(thinkingCall.args.query, thinkingCall.args.showThoughtProcess);

          // Update thinking modal state
          setThinkingResult({
            thoughtProcess: thinkingResult.thoughtProcess,
            finalAnswer: thinkingResult.finalAnswer
          });
          setIsThinkingModalOpen(true);

          // Send the result back to the model as a tool response
          client.sendToolResponse({
            functionResponses: [{
              response: {
                success: true,
                result: thinkingResult.contextForGemini
              },
              id: thinkingCall.id
            }]
          });

        } catch (error) {
          console.error('Thinking tool error:', error);
          client.sendToolResponse({
            functionResponses: [{
              response: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
              id: thinkingCall.id
            }]
          });
        }
      }

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
      return undefined;
    };
  }, [client, thinkingModeEnabled]);

  // Remove the message sending logic wrapper
  useEffect(() => {
    if (!client) return;
    return () => undefined;
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
        chatPanel={<ChatPanel onSendMessage={handleUserMessage} />}
        controlPanel={
          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
            onDebugToggle={handleDebugToggle}
            debugEnabled={showDebug}
            onThinkingModeToggle={handleThinkingModeToggle}
            thinkingModeEnabled={thinkingModeEnabled}
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

      {isThinkingModalOpen && (
        <div style={{ 
          position: 'fixed', 
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999
        }}>
          <ThinkingModal
            thoughtProcess={thinkingResult?.thoughtProcess}
            finalAnswer={thinkingResult?.finalAnswer}
            onClose={() => setIsThinkingModalOpen(false)}
          />
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
