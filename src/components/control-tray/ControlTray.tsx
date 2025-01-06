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
import { searchGifDeclaration, getAudioConfig, getTextConfig } from '../../lib/config';

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

const AudioToggle = styled.button<{ active: boolean; $color?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 2px;
  border: 2px solid ${props => props.active ? (props.$color || props.theme.colors.primary) : (props.$color || props.theme.colors.primary)}88;
  background: ${props => props.active ? (props.$color || props.theme.colors.primary) : props.theme.colors.background}dd;
  color: ${props => props.active ? props.theme.colors.background : (props.$color || props.theme.colors.primary)};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 0 15px ${props => props.active ? (props.$color || props.theme.colors.primary) + '66' : (props.$color || props.theme.colors.primary) + '33'},
    0 0 30px ${props => props.active ? (props.$color || props.theme.colors.primary) + '44' : (props.$color || props.theme.colors.primary) + '22'},
    inset 0 0 4px ${props => props.active ? (props.$color || props.theme.colors.primary) : (props.$color || props.theme.colors.primary) + '66'};

  &:hover {
    border-color: ${props => (props.$color || props.theme.colors.primary)}cc;
    box-shadow: 
      0 0 20px ${props => (props.$color || props.theme.colors.primary)}66,
      0 0 40px ${props => (props.$color || props.theme.colors.primary)}44,
      inset 0 0 8px ${props => (props.$color || props.theme.colors.primary)}88;
    background: ${props => props.active ? (props.$color || props.theme.colors.primary) : (props.$color || props.theme.colors.primary) + '22'};
  }

  .material-symbols-outlined {
    font-size: 22px;
    text-shadow: ${props => props.active ? 
      `0 0 10px ${props.theme.colors.background}` : 
      `0 0 10px ${props.$color || props.theme.colors.primary}88`
    };
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
  border: 2px solid ${props => props.theme.colors.primary}66;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: ${props => props.theme.colors.background}88;
  box-shadow: 
    0 0 20px ${props => props.theme.colors.primary}22,
    inset 0 0 10px ${props => props.theme.colors.primary}22;
  justify-self: ${props => props.isRight ? 'end' : 'start'};
  backdrop-filter: blur(4px);

  &::before {
    content: ${props => props.isRight ? "'GEMINI'" : "'FEED'"};
    position: absolute;
    top: 4px;
    ${props => props.isRight ? 'right: 8px' : 'left: 8px'};
    font-size: 12px;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.9;
    color: ${props => props.theme.colors.primary};
    text-shadow: 
      0 0 10px ${props => props.theme.colors.primary}cc,
      0 0 20px ${props => props.theme.colors.primary}88;
    z-index: 2;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 3px,
      ${props => props.theme.colors.primary}22 3px,
      ${props => props.theme.colors.primary}22 6px
    );
    pointer-events: none;
    opacity: 0.4;
    z-index: 2;
    animation: scanlines 10s linear infinite;
  }

  @keyframes scanlines {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  .audio-viz-container {
    position: absolute;
    inset: 24px 0 0 0;
    width: 100%;
    height: calc(100% - 24px);
    z-index: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;

    canvas {
      width: 100% !important;
      height: 100% !important;
      position: absolute;
      top: 0;
      left: 0;
    }
  }

  .pulse-container {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 2;
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

const MediaSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  gap: 20px;
  padding: 12px;
  position: relative;
  background: ${props => props.theme.colors.background}cc;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      ${props => props.theme.colors.primary}11 2px,
      ${props => props.theme.colors.primary}11 4px
    );
    pointer-events: none;
    z-index: 0;
  }
`;

const VideoFrame = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.chartGreen}44;
  box-shadow: inset 0 0 20px ${props => props.theme.colors.chartGreen}22;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      ${props => props.theme.colors.chartGreen}11 25%,
      transparent 25%,
      transparent 50%,
      ${props => props.theme.colors.chartGreen}11 50%,
      ${props => props.theme.colors.chartGreen}11 75%,
      transparent 75%
    );
    background-size: 8px 8px;
    opacity: 0.3;
    pointer-events: none;
  }

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .label {
    position: absolute;
    top: 8px;
    left: 12px;
    font-size: 12px;
    color: ${props => props.theme.colors.chartGreen};
    opacity: 0.8;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-shadow: 0 0 10px ${props => props.theme.colors.chartGreen}66;
    z-index: 2;
  }
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 20px;
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? 
    props.theme.colors.chartGreen + '22' : 
    props.theme.colors.background
  };
  border: 2px solid ${props => props.$active ?
    props.theme.colors.chartGreen + '88' :
    props.theme.colors.chartGreen + '44'
  };
  color: ${props => props.theme.colors.chartGreen};
  padding: 8px 16px;
  font-family: ${props => props.theme.fonts.mono};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      45deg,
      ${props => props.theme.colors.chartGreen}11 25%,
      transparent 25%,
      transparent 50%,
      ${props => props.theme.colors.chartGreen}11 50%,
      ${props => props.theme.colors.chartGreen}11 75%,
      transparent 75%
    );
    background-size: 8px 8px;
    opacity: ${props => props.$active ? 0.3 : 0.1};
    transition: opacity 0.2s ease;
  }

  &:hover {
    border-color: ${props => props.theme.colors.chartGreen}88;
    box-shadow: 
      0 0 20px ${props => props.theme.colors.chartGreen}33,
      inset 0 0 10px ${props => props.theme.colors.chartGreen}22;
    
    &::before {
      opacity: 0.3;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LogoContainer = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 1;
  margin-top: 20px;

  svg {
    width: 80%;
    height: auto;
    max-height: 100%;
    filter: drop-shadow(0 0 10px ${props => props.theme.colors.primary}44);
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0;
  position: relative;
  z-index: 1;
`;

const MainControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-top: 0;
  width: fit-content;
  background: ${props => props.theme.colors.background}88;
  border: 2px solid ${props => props.theme.colors.primary}44;
  border-radius: 4px;
  box-shadow: 
    0 0 20px ${props => props.theme.colors.primary}22,
    inset 0 0 10px ${props => props.theme.colors.primary}22;
  position: relative;
  backdrop-filter: blur(4px);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -45deg,
      ${props => props.theme.colors.primary}11 0px,
      ${props => props.theme.colors.primary}11 2px,
      transparent 2px,
      transparent 6px
    );
    pointer-events: none;
    opacity: 0.5;
  }
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

const ActionButton = styled.button<{ $color?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 4px;
  border: 2px solid ${props => props.$color || props.theme.colors.primary}88;
  background: ${props => props.theme.colors.background}88;
  color: ${props => props.$color || props.theme.colors.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(4px);
  box-shadow: 
    0 0 15px ${props => props.$color || props.theme.colors.primary}33,
    0 0 30px ${props => props.$color || props.theme.colors.primary}22,
    inset 0 0 4px ${props => props.$color || props.theme.colors.primary}66;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      45deg,
      transparent,
      ${props => props.$color || props.theme.colors.primary}44,
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  &:hover {
    border-color: ${props => props.$color || props.theme.colors.primary}cc;
    box-shadow: 
      0 0 20px ${props => props.$color || props.theme.colors.primary}66,
      0 0 40px ${props => props.$color || props.theme.colors.primary}44,
      inset 0 0 8px ${props => props.$color || props.theme.colors.primary}88;
    color: ${props => props.$color || props.theme.colors.primary};
    text-shadow: 
      0 0 10px ${props => props.$color || props.theme.colors.primary}cc,
      0 0 20px ${props => props.$color || props.theme.colors.primary}88;
  }

  &:hover::before {
    transform: translateX(0);
  }

  &.mic-button {
    background: ${props => props.$color || props.theme.colors.primary}33;
  }

  &.connect-toggle {
    width: 52px;
    height: 52px;
    border-radius: 26px;
    border-width: 2px;
    
    &.connected {
      background: ${props => props.$color || props.theme.colors.primary};
      color: ${props => props.theme.colors.background};
      box-shadow: 
        0 0 30px ${props => props.$color || props.theme.colors.primary}88,
        0 0 60px ${props => props.$color || props.theme.colors.primary}44,
        inset 0 0 8px ${props => props.$color || props.theme.colors.primary};
    }
  }

  &.active {
    background: ${props => props.$color || props.theme.colors.primary};
    color: ${props => props.theme.colors.background};
    box-shadow: 
      0 0 20px ${props => props.$color || props.theme.colors.primary}88,
      0 0 40px ${props => props.$color || props.theme.colors.primary}44,
      inset 0 0 8px ${props => props.$color || props.theme.colors.primary};
  }

  .material-symbols-outlined {
    font-size: 22px;
    position: relative;
    z-index: 2;
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
  const feedVideoRef = useRef<HTMLVideoElement>(null);

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
      const video = feedVideoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(video as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
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
    const config = isAudioResponse ? getAudioConfig() : getTextConfig();
    console.log('Setting config:', config);
    setConfig(config);
  }, [setConfig, isAudioResponse]);

  // Set srcObject for feed video
  useEffect(() => {
    if (feedVideoRef.current) {
      feedVideoRef.current.srcObject = activeVideoStream;
    }
  }, [activeVideoStream]);

  return (
    <section className="control-tray">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      
      <MediaSection>
        <DisplayPanel>
          <video 
            ref={feedVideoRef}
            autoPlay 
            playsInline 
            muted 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              position: 'absolute',
              bottom: 0,
              left: 0,
              transform: 'none'
            }} 
          />
        </DisplayPanel>

        <ControlsContainer>
          <MainControls>
            <ActionButton
              className="mic-button"
              onClick={() => setMuted(!muted)}
              title={muted ? "Enable microphone" : "Disable microphone"}
              $color="#FF3366"
            >
              <span className="material-symbols-outlined filled">
                {!muted ? "mic" : "mic_off"}
              </span>
            </ActionButton>

            {supportsVideo && (
              <>
                <ActionButton
                  onClick={screenCapture.isStreaming ? changeStreams() : changeStreams(screenCapture)}
                  title={screenCapture.isStreaming ? "Stop screen sharing" : "Share your screen"}
                  $color="#33FF99"
                >
                  <span className="material-symbols-outlined">
                    {screenCapture.isStreaming ? "cancel_presentation" : "present_to_all"}
                  </span>
                </ActionButton>
                <ActionButton
                  onClick={webcam.isStreaming ? changeStreams() : changeStreams(webcam)}
                  title={webcam.isStreaming ? "Turn off camera" : "Turn on camera"}
                  $color="#66FFFF"
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
              title={connected ? "Pause conversation" : "Start conversation"}
              $color="#FFFF33"
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
              title={debugEnabled ? "Hide debug window" : "Show debug window"}
              $color="#FF9933"
            >
              <span className="material-symbols-outlined">
                terminal
              </span>
            </ActionButton>

            <AudioToggle 
              active={isAudioResponse} 
              onClick={handleModeSwitch}
              title={isAudioResponse ? "Switch to text responses" : "Switch to voice responses"}
              $color="#9966FF"
            >
              <span className="material-symbols-outlined">
                {isAudioResponse ? 'volume_up' : 'text_fields'}
              </span>
            </AudioToggle>
          </MainControls>

          <LogoContainer>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
              <defs>
                <linearGradient id="slimeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#39FF14"/>
                  <stop offset="50%" stopColor="#32CD32"/>
                  <stop offset="100%" stopColor="#50C878"/>
                </linearGradient>
                
                <radialGradient id="shine" cx="40%" cy="40%" r="50%" fx="40%" fy="40%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.4)"/>
                  <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                </radialGradient>
                
                <filter id="slimeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
                  <feColorMatrix in="blur" type="matrix" values="
                    0 0 0 0 0.2
                    0 1 0 0 1
                    0 0 0 0 0.2
                    0 0 0 1 0" result="greenGlow"/>
                  <feMerge>
                    <feMergeNode in="greenGlow"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <rect width="800" height="800" fill="transparent"/>
              
              <text x="400" y="300" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="100" 
                    fill="#87CEEB" filter="url(#geminiGlow)">GEMINI</text>

              <g filter="url(#slimeGlow)">
                <path d="M 200,400 
                         C 180,390 160,410 170,430
                         Q 180,450 160,470
                         C 150,480 170,500 180,490
                         Q 200,470 190,450
                         L 240,450
                         C 260,450 270,460 260,470
                         C 250,480 230,480 240,490
                         Q 260,500 250,520
                         C 240,540 220,530 230,510
                         L 180,510
                         C 160,510 150,530 160,550
                         C 170,570 190,560 180,540" 
                      fill="url(#slimeGradient)"/>
                
                <path d="M 320,400
                         C 300,390 280,410 290,430
                         Q 300,450 280,470
                         C 270,480 290,500 300,490
                         Q 320,470 310,450
                         C 330,450 350,460 340,480
                         C 330,500 350,520 360,500
                         Q 370,480 350,460"
                      fill="url(#slimeGradient)"/>
                
                <path d="M 440,400
                         C 420,390 400,410 410,430
                         Q 420,450 400,470
                         C 390,480 410,500 420,490
                         Q 440,470 430,450
                         L 480,450
                         C 500,450 510,460 500,470
                         C 490,480 470,480 480,490
                         Q 500,500 490,520
                         C 480,540 460,530 470,510
                         L 420,510
                         C 400,510 390,530 400,550
                         C 410,570 430,560 420,540"
                      fill="url(#slimeGradient)"/>
                
                <path d="M 560,400
                         C 540,390 520,410 530,430
                         Q 540,450 520,470
                         C 510,480 530,500 540,490
                         Q 560,470 550,450
                         L 600,510
                         C 620,530 640,510 630,490
                         Q 620,470 600,450
                         C 580,430 560,450 570,470"
                      fill="url(#slimeGradient)"/>
                      
                <path d="M 240,460 Q 280,470 320,460" fill="url(#slimeGradient)" opacity="0.7"/>
                <path d="M 360,460 Q 400,470 440,460" fill="url(#slimeGradient)" opacity="0.7"/>
                <path d="M 480,460 Q 520,470 560,460" fill="url(#slimeGradient)" opacity="0.7"/>
                
                <g fill="url(#shine)" opacity="0.3">
                  <ellipse cx="220" cy="430" rx="30" ry="20"/>
                  <ellipse cx="340" cy="430" rx="30" ry="20"/>
                  <ellipse cx="460" cy="430" rx="30" ry="20"/>
                  <ellipse cx="580" cy="430" rx="30" ry="20"/>
                </g>
              </g>
              
              <text x="400" y="720" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="40"
                    fill="#ff69b4" filter="url(#geminiGlow)">@GEMINI_FREN</text>
            </svg>
          </LogoContainer>
        </ControlsContainer>

        <DisplayPanel isRight>
          <div className="audio-viz-container">
            {isAudioResponse && (
              <AudioViz 
                volume={volume} 
                isActive={connected && isAudioResponse}
              />
            )}
          </div>
          <div className="pulse-container">
            <AudioPulse 
              volume={isAudioResponse ? volume : 0} 
              active={connected && isAudioResponse} 
              hover={false} 
            />
          </div>
        </DisplayPanel>
      </MediaSection>
    </section>
  );
}

export default memo(ControlTray);
