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

import { useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import { DebugPanel } from "./components/debug-panel/DebugPanel";
import ControlTray from "./components/control-tray/ControlTray";
import { TerminalLayout } from "./components/TerminalLayout/TerminalLayout";
import ChatPanel from "./components/ChatPanel/ChatPanel";
import { ThemeProvider } from 'styled-components';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

// Define theme
const theme = {
  colors: {
    primary: '#00ff00', // Neon green
    secondary: '#ff00ff', // Neon pink
    accent1: '#ff6600', // Neon orange
    accent2: '#00ffff', // Neon blue
    background: '#000000',
    surface: 'rgba(20, 20, 20, 0.95)',
    led: {
      green: {
        glow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
        dim: '0 0 5px #00ff0033'
      },
      pink: {
        glow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff',
        dim: '0 0 5px #ff00ff33'
      },
      orange: {
        glow: '0 0 10px #ff6600, 0 0 20px #ff6600, 0 0 30px #ff6600',
        dim: '0 0 5px #ff660033'
      },
      blue: {
        glow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
        dim: '0 0 5px #00ffff33'
      }
    }
  },
  effects: {
    scanline: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
    noise: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVfgnsAAAACHRSTlMzMzMzMzMzM85JBgUAAAAJcEhZcwAADdcAAA3XAUIom3gAAAAVdEVYdFNvZnR3YXJlAGdpZjJwbmcgMi40LjKy80OWAAAAQUlEQVQ4y2NgYPj/n4GBgYmBgYGFgYGBDYgZgMQjIP4DxH+gNAOQYAYyLBiwAKCJDHgBVhOxAqK8TpQrmNgYGADxKhRQMTz1rQAAAABJRU5ErkJggg==")'
  }
};

function AppContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const { volume } = useLiveAPIContext();

  return (
    <TerminalLayout
      debugPanel={<DebugPanel />}
      chatPanel={<ChatPanel />}
      controlPanel={
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
        />
      }
      videoRef={videoRef}
      volume={volume}
    />
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App terminal-screen">
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
          <AppContent />
        </LiveAPIProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
