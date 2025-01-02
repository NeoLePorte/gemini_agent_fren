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

import cn from "classnames";
import styled from "styled-components";

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import AudioViz from "../audio-viz";
import "./control-tray.scss";
import { useTheme } from "styled-components";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onDebugToggle?: () => void;
  debugEnabled?: boolean;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <button className="action-button" onClick={stop}>
        <span className="material-symbols-outlined">{onIcon}</span>
      </button>
    ) : (
      <button className="action-button" onClick={start}>
        <span className="material-symbols-outlined">{offIcon}</span>
      </button>
    ),
);

const AudioToggle = styled.button<{ active: boolean }>`
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.background : props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 8px 16px;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.active ? props.theme.colors.primary + 'dd' : props.theme.colors.primary + '22'};
  }
`;

const AudioPulseContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const AudioPulseLabel = styled.span`
  font-size: 10px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DisplayPanel = styled.div<{ isRight?: boolean }>`
  width: 320px;
  height: 180px;
  border: 1px solid #00ff0044;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: #00ff0008;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    background: #00ff0011;
    border-bottom: 1px solid #00ff0022;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const GeminiPortrait = styled(DisplayPanel)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .audio-viz-container {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-container {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }
`;

const DisplayTitle = styled.div<{ isRight?: boolean }>`
  position: absolute;
  top: 4px;
  ${props => props.isRight ? 'right: 8px' : 'left: 8px'};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
  transform: ${props => props.isRight ? 'scaleX(-1)' : 'none'};
  color: ${props => props.theme.colors.primary};
`;

const MediaSection = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  width: 100%;
  gap: 20px;
  align-items: center;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-width: 320px;
  height: 180px;
  border: 1px solid #00ff0044;
  border-radius: 4px;
  background: #00ff0008;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    background: #00ff0011;
    border-bottom: 1px solid #00ff0022;
  }
`;

const MainControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: ${props => props.theme.colors.primary}11;
  border: 1px solid ${props => props.theme.colors.primary}22;
`;

const ActionNav = styled.nav`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  background: ${props => props.theme.colors.primary}11;
  border: 1px solid ${props => props.theme.colors.primary}22;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.primary}44;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      ${props => props.theme.colors.primary}11,
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  &:hover::before {
    transform: translateX(0);
  }

  &.mic-button {
    background: ${props => props.theme.colors.primary}22;
  }

  &.connect-toggle {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    
    &.connected {
      background: ${props => props.theme.colors.primary};
      color: ${props => props.theme.colors.background};
    }
  }

  &.active {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.background};
  }
`;

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
  onDebugToggle,
  debugEnabled = false,
}: ControlTrayProps) {
  const theme = useTheme();
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [isAudioResponse, setIsAudioResponse] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect, volume, setConfig } =
    useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`,
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  // Handle mode switch
  const handleModeSwitch = async () => {
    // If we're connected, disconnect first
    if (connected) {
      await disconnect();
    }
    
    // Toggle the mode
    setIsAudioResponse(!isAudioResponse);
    
    // Reconnect with new config
    if (connected) {
      setTimeout(connect, 100); // Small delay to ensure disconnect completes
    }
  };

  // Update configuration when response type changes
  useEffect(() => {
    const config = {
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: isAudioResponse ? "audio" as const : "text" as const,
        ...(isAudioResponse ? {
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: "Aoede" 
              } 
            }
          }
        } : {}),
      },
      tools: [{ googleSearch: {} }],
    };
    
    console.log('Setting config:', config); // Debug log
    setConfig(config);
  }, [setConfig, isAudioResponse]);

  return (
    <section className="control-tray">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      
      <MediaSection>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ 
            width: '320px', 
            height: '180px', 
            objectFit: 'cover',
            borderRadius: '4px',
            border: `1px solid ${theme.colors.primary}33`,
            transform: 'none'
          }} 
        />

        <ControlsContainer>
          <MainControls>
            <ActionButton
              className="mic-button"
              onClick={() => setMuted(!muted)}
            >
              <span className="material-symbols-outlined filled">
                {!muted ? "mic" : "mic_off"}
              </span>
            </ActionButton>

            {supportsVideo && (
              <>
                <ActionButton
                  onClick={screenCapture.isStreaming ? changeStreams() : changeStreams(screenCapture)}
                >
                  <span className="material-symbols-outlined">
                    {screenCapture.isStreaming ? "cancel_presentation" : "present_to_all"}
                  </span>
                </ActionButton>
                <ActionButton
                  onClick={webcam.isStreaming ? changeStreams() : changeStreams(webcam)}
                >
                  <span className="material-symbols-outlined">
                    {webcam.isStreaming ? "videocam_off" : "videocam"}
                  </span>
                </ActionButton>
              </>
            )}

            <ActionButton
              ref={connectButtonRef}
              className={cn("connect-toggle", { connected })}
              onClick={connected ? disconnect : connect}
            >
              <span className="material-symbols-outlined filled">
                {connected ? "pause" : "play_arrow"}
              </span>
            </ActionButton>

            <ActionButton
              onClick={() => {
                console.log('Debug button clicked, current state:', debugEnabled);
                onDebugToggle?.();
              }}
              className={cn({ active: debugEnabled })}
            >
              <span className="material-symbols-outlined">
                terminal
              </span>
            </ActionButton>
          </MainControls>

          <AudioToggle 
            active={isAudioResponse} 
            onClick={handleModeSwitch}
          >
            <span className="material-symbols-outlined">
              {isAudioResponse ? 'volume_up' : 'text_fields'}
            </span>
            {isAudioResponse ? 'Voice Response' : 'Text Response'}
          </AudioToggle>
        </ControlsContainer>

        <GeminiPortrait>
          <DisplayTitle isRight>Gemini</DisplayTitle>
          <div className="audio-viz-container">
            <AudioViz 
              volume={isAudioResponse ? volume : 0}
              isActive={connected && isAudioResponse}
            />
          </div>
          <div className="pulse-container">
            <AudioPulse 
              volume={isAudioResponse ? volume : 0} 
              active={connected && isAudioResponse} 
              hover={false} 
            />
          </div>
        </GeminiPortrait>
      </MediaSection>
    </section>
  );
}

export default memo(ControlTray);
