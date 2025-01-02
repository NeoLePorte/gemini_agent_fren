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
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
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
    primary: '#ff6b6b',
    background: '#000000',
    surface: 'rgba(20, 20, 20, 0.95)',
  },
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <div className="App terminal-screen">
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
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
          />
        </LiveAPIProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
