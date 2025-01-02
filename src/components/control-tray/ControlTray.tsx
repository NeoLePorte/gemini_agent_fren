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

import styled, { useTheme } from 'styled-components';
import cn from "classnames";
import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import AudioViz from "../audio-viz";
import "./control-tray.scss";

const VideoFrame = styled.div`
  width: 320px;
  height: 180px;
  border: 2px solid ${props => props.theme.colors.primary}44;
  border-radius: 0;
  overflow: hidden;
  position: relative;
  background: #000;
  clip-path: polygon(
    0 10px,
    10px 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    10px 100%,
    0 calc(100% - 10px)
  );

  &::before {
    content: 'FEED';
    position: absolute;
    top: 4px;
    left: 8px;
    color: ${props => props.theme.colors.primary};
    font-size: 10px;
    letter-spacing: 2px;
    text-shadow: ${props => props.theme.colors.led.green.glow};
    z-index: 2;
    transform: skew(-10deg);
  }

  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(1.2) contrast(1.1) saturate(1.2);
    z-index: 1;
  }
`;

const GeminiFrame = styled(VideoFrame)`
  border-color: ${props => props.theme.colors.secondary}44;
  background: linear-gradient(135deg, #000 0%, rgba(255, 0, 255, 0.1) 100%);

  &::before {
    content: 'GEMINI';
    color: ${props => props.theme.colors.secondary};
    text-shadow: ${props => props.theme.colors.led.pink.glow};
  }
`;

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

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
`;

const StreamButton = styled(ActionButton)`
  &.streaming {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.background};
  }
`;

const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <StreamButton className="streaming" onClick={stop}>
        <span className="material-symbols-outlined">{onIcon}</span>
      </StreamButton>
    ) : (
      <StreamButton onClick={start}>
        <span className="material-symbols-outlined">{offIcon}</span>
      </StreamButton>
    )
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
  gap: 20px;
  width: 100%;
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
  border: 2px solid ${props => props.theme.colors.accent1}44;
  border-radius: 0;
  background: linear-gradient(135deg, #000 0%, rgba(255, 102, 0, 0.1) 100%);
  position: relative;
  clip-path: polygon(
    0 10px,
    10px 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
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

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
}: ControlTrayProps) {
  const theme = useTheme();
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] = useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [isAudioResponse, setIsAudioResponse] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect, volume, setConfig } = useLiveAPIContext();

  // Focus connect button when disconnected
  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Handle audio recording
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

  // Handle video stream
  useEffect(() => {
    if (!videoRef.current || !activeVideoStream) return;

    const video = videoRef.current;
    video.srcObject = activeVideoStream;
    video.style.display = 'block'; // Ensure video is visible
    
    // Play the video
    video.play().catch(err => {
      console.error('Error playing video:', err);
    });

    onVideoStreamChange(activeVideoStream);

    // Handle video frame sending
    let timeoutId = -1;
    const sendVideoFrame = () => {
      if (!videoRef.current || !renderCanvasRef.current || !connected) return;

      const canvas = renderCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;

      // Only send frame if we have valid dimensions
      if (canvas.width > 0 && canvas.height > 0) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL("image/jpeg", 0.8);
          const data = base64.substring(base64.indexOf(",") + 1);
          client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
        } catch (err) {
          console.error('Error sending video frame:', err);
        }
      }

      // Schedule next frame
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    };

    // Start sending frames if connected
    if (connected) {
      requestAnimationFrame(sendVideoFrame);
    }

    // Cleanup
    return () => {
      if (timeoutId !== -1) {
        clearTimeout(timeoutId);
      }
    };
  }, [activeVideoStream, connected, client, onVideoStreamChange]);

  // Handler for swapping video streams
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    try {
      // Stop current stream
      if (activeVideoStream) {
        activeVideoStream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setActiveVideoStream(null);
        onVideoStreamChange(null);
      }

      // Start new stream
      if (next) {
        const mediaStream = await next.start();
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Ensure video plays
          await videoRef.current.play().catch(console.error);
        }
        setActiveVideoStream(mediaStream);
        onVideoStreamChange(mediaStream);
      }

      // Stop other streams
      videoStreams
        .filter(msr => msr !== next)
        .forEach(msr => msr.isStreaming && msr.stop());
    } catch (err) {
      console.error('Failed to change video stream:', err);
    }
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
        <VideoFrame>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ display: 'block' }}
          />
        </VideoFrame>

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
                <MediaStreamButton
                  isStreaming={screenCapture.isStreaming}
                  onIcon="cancel_presentation"
                  offIcon="present_to_all"
                  start={changeStreams(screenCapture)}
                  stop={changeStreams()}
                />
                <MediaStreamButton
                  isStreaming={webcam.isStreaming}
                  onIcon="videocam_off"
                  offIcon="videocam"
                  start={changeStreams(webcam)}
                  stop={changeStreams()}
                />
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

        <GeminiFrame>
          <AudioViz 
            volume={isAudioResponse ? volume : 0}
            isActive={connected && isAudioResponse}
          />
        </GeminiFrame>
      </MediaSection>
    </section>
  );
}

export default memo(ControlTray);
