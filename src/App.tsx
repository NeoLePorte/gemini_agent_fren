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

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

// Define theme
const theme = {
  colors: {
    primary: '#00ff00',
    secondary: '#ff00ff',
    accent: '#00ffff',
    warning: '#ff6600',
    background: '#000000',
    surface: '#111111',
    text: {
      primary: '#00ff00',
      secondary: '#cccccc',
      accent: '#ffffff'
    }
  },
  effects: {
    glow: (color: string) => `0 0 10px ${color}44, 0 0 20px ${color}22, 0 0 30px ${color}11`,
    scanlines: `
      linear-gradient(
        to bottom,
        transparent 50%,
        rgba(0, 255, 0, 0.02) 50%
      )
    `,
    noise: `
      repeating-radial-gradient(
        rgba(0, 255, 0, 0.03) 100px,
        transparent 100px,
        transparent 200px
      )
    `
  },
  fonts: {
    mono: "'Space Mono', monospace",
    display: "'Share Tech Mono', monospace"
  }
};

function AppContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const { volume } = useLiveAPIContext();
  const [showDebug, setShowDebug] = useState(false);

  const handleDebugToggle = useCallback(() => {
    console.log('Toggling debug, current state:', showDebug);
    setShowDebug(prev => !prev);
  }, []);

  return (
    <>
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
      />
      
      {showDebug && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <FloatingDebugWindow 
              onClose={() => setShowDebug(false)}
              defaultPosition={{ x: window.innerWidth - 350, y: 40 }}
            >
              <DebugPanel />
            </FloatingDebugWindow>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App terminal-screen" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
          <AppContent />
        </LiveAPIProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
