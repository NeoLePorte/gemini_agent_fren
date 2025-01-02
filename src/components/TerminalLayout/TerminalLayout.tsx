import styled from 'styled-components';
import React from 'react';
import AudioViz from '../audio-viz';

const TerminalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.primary};
  font-family: 'Space Mono', monospace;
  padding: 20px;
  gap: 30px;
  position: relative;
  
  // Geometric pattern overlay
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(45deg, ${props => props.theme.colors.primary}11 25%, transparent 25%),
      linear-gradient(-45deg, ${props => props.theme.colors.secondary}11 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${props => props.theme.colors.accent1}11 75%),
      linear-gradient(-45deg, transparent 75%, ${props => props.theme.colors.accent2}11 75%);
    background-size: 100px 100px;
    background-position: 0 0, 50px 0, 50px -50px, 0px 50px;
    pointer-events: none;
    opacity: 0.2;
    z-index: 1;
  }

  // Scanlines
  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.1) 0px,
      rgba(0, 0, 0, 0.1) 1px,
      transparent 1px,
      transparent 2px
    );
    pointer-events: none;
    opacity: 0.3;
    z-index: 2;
    animation: scanline 10s linear infinite;
  }

  @keyframes scanline {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 100%;
    }
  }
`;

const Panel = styled.div<{ 'data-title': string }>`
  position: relative;
  border: 2px solid ${props => props.theme.colors.primary}44;
  border-radius: 0;
  padding: 20px;
  margin-top: 12px;
  background: ${props => props.theme.colors.surface};
  box-shadow: inset 0 0 30px rgba(0, 255, 0, 0.1);
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
  
  &:before {
    content: attr(data-title);
    position: absolute;
    top: -24px;
    left: 20px;
    background: ${props => props.theme.colors.background};
    padding: 0 10px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: ${props => props.theme.colors.primary};
    text-shadow: ${props => props.theme.colors.led.green.glow};
    font-weight: bold;
    z-index: 3;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1px solid ${props => props.theme.colors.primary}22;
    pointer-events: none;
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
  }
`;

const TopPanel = styled(Panel)`
  height: 120px;
  overflow-y: auto;
  border-color: ${props => props.theme.colors.accent2}66;
  background: linear-gradient(
    135deg,
    ${props => props.theme.colors.surface} 0%,
    rgba(0, 255, 255, 0.05) 100%
  );

  &:before {
    color: ${props => props.theme.colors.accent2};
    text-shadow: ${props => props.theme.colors.led.blue.glow};
  }

  &:after {
    border-color: ${props => props.theme.colors.accent2}22;
  }
`;

const MiddlePanel = styled(Panel)`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-color: ${props => props.theme.colors.secondary}66;
  background: linear-gradient(
    135deg,
    ${props => props.theme.colors.surface} 0%,
    rgba(255, 0, 255, 0.05) 100%
  );
  padding: 30px;

  // Improved readability styles
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0.5px;

  // Scrollbar styling
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: ${props => props.theme.colors.secondary}44 transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.secondary}44;
    border-radius: 3px;
    border: 2px solid transparent;
  }

  &:before {
    color: ${props => props.theme.colors.secondary};
    text-shadow: ${props => props.theme.colors.led.pink.glow};
  }

  &:after {
    border-color: ${props => props.theme.colors.secondary}22;
  }
`;

const BottomPanel = styled(Panel)`
  height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  background: linear-gradient(
    135deg,
    ${props => props.theme.colors.surface} 0%,
    rgba(255, 102, 0, 0.05) 100%
  );
  border-color: ${props => props.theme.colors.accent1}66;
  
  &:before {
    color: ${props => props.theme.colors.accent1};
    text-shadow: ${props => props.theme.colors.led.orange.glow};
  }

  &:after {
    border-color: ${props => props.theme.colors.accent1}22;
  }
  
  &::after {
    content: 'MEMORY';
    position: absolute;
    bottom: -10px;
    right: 20px;
    color: ${props => props.theme.colors.primary};
    font-size: 12px;
    letter-spacing: 2px;
    text-shadow: ${props => props.theme.colors.led.green.glow};
    font-family: 'Space Mono', monospace;
    transform: skew(-10deg);
  }
`;

const CommunicationDisplay = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  gap: 20px;
  width: 100%;
  padding: 20px;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid ${props => props.theme.colors.primary}33;
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
  
  &::before {
    content: 'PTT';
    position: absolute;
    top: -20px;
    left: 20px;
    color: ${props => props.theme.colors.secondary};
    font-size: 12px;
    letter-spacing: 2px;
    background: #000;
    padding: 0 10px;
    text-shadow: ${props => props.theme.colors.led.pink.glow};
    transform: skew(-10deg);
    z-index: 3;
  }
`;

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

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 50px rgba(0, 255, 0, 0.2);
    border: 1px solid ${props => props.theme.colors.primary}22;
    pointer-events: none;
    z-index: 1;
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
  }
  
  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(1.2) contrast(1.1) saturate(1.2);
    z-index: 0;
  }
`;

const ControlPanel = styled.div`
  width: 320px;
  height: 180px;
  border: 2px solid ${props => props.theme.colors.accent1}44;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
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

  &::before {
    content: 'CTRL';
    position: absolute;
    top: 4px;
    left: 8px;
    color: ${props => props.theme.colors.accent1};
    font-size: 10px;
    letter-spacing: 2px;
    text-shadow: ${props => props.theme.colors.led.orange.glow};
    z-index: 1;
    transform: skew(-10deg);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 50px rgba(255, 102, 0, 0.1);
    border: 1px solid ${props => props.theme.colors.accent1}22;
    pointer-events: none;
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

  &::after {
    box-shadow: inset 0 0 50px rgba(255, 0, 255, 0.1);
    border-color: ${props => props.theme.colors.secondary}22;
  }
`;

const SectionDivider = styled.div`
  position: relative;
  height: 40px;
  margin: -20px -20px;
  z-index: 10;
  overflow: visible;
  pointer-events: none;
  
  // Main horizontal line
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.theme.colors.primary};
    box-shadow: 0 0 10px ${props => props.theme.colors.primary},
                0 0 20px ${props => props.theme.colors.primary};
    opacity: 0.8;
  }
`;

const DiagonalAccent = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  background: none;
  pointer-events: none;
  z-index: 11;
  
  &.x-left, &.x-right {
    &::before, &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background: ${props => props.theme.colors.primary};
      box-shadow: 0 0 10px ${props => props.theme.colors.primary};
      top: 50%;
      left: 0;
    }
    
    &::before {
      transform: rotate(45deg);
    }
    
    &::after {
      transform: rotate(-45deg);
    }
  }

  &.x-left {
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
  }

  &.x-right {
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
`;

const SectionLabel = styled.div<{ align?: 'left' | 'right', variant?: 'pink' | 'orange' | 'blue' }>`
  position: absolute;
  ${props => props.align === 'left' ? 'left: 60px;' : 'right: 60px;'}
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  letter-spacing: 3px;
  color: ${props => {
    switch (props.variant) {
      case 'pink': return props.theme.colors.secondary;
      case 'orange': return props.theme.colors.accent1;
      case 'blue': return props.theme.colors.accent2;
      default: return props.theme.colors.primary;
    }
  }};
  text-shadow: ${props => {
    switch (props.variant) {
      case 'pink': return props.theme.colors.led.pink.glow;
      case 'orange': return props.theme.colors.led.orange.glow;
      case 'blue': return props.theme.colors.led.blue.glow;
      default: return props.theme.colors.led.green.glow;
    }
  }};
  opacity: 0.9;
  z-index: 11;
  white-space: nowrap;
  font-family: 'Space Mono', monospace;
  font-weight: bold;
  pointer-events: none;
  background: ${props => props.theme.colors.background};
  padding: 0 10px;
`;

interface TerminalLayoutProps {
  debugPanel: React.ReactNode;
  chatPanel: React.ReactNode;
  controlPanel: React.ReactNode;
  videoRef: React.RefObject<HTMLVideoElement>;
  volume: number;
}

export function TerminalLayout({
  debugPanel,
  chatPanel,
  controlPanel,
  videoRef,
  volume
}: TerminalLayoutProps) {
  return (
    <TerminalContainer>
      <TopPanel data-title="PERSONAL PARTICULARS">
        {debugPanel}
      </TopPanel>
      <SectionDivider>
        <DiagonalAccent className="x-left" />
        <DiagonalAccent className="x-right" />
        <SectionLabel align="left" variant="pink">OFF-LINE BROWSE</SectionLabel>
        <SectionLabel align="right" variant="blue">SYSTEM PARTITION</SectionLabel>
      </SectionDivider>
      <MiddlePanel data-title="OFF-LINE BROWSE">
        {chatPanel}
      </MiddlePanel>
      <SectionDivider>
        <DiagonalAccent className="x-left" />
        <DiagonalAccent className="x-right" />
        <SectionLabel align="left" variant="orange">MEDIA CONTROLS</SectionLabel>
        <SectionLabel align="right" variant="orange">MEDIA SECTOR</SectionLabel>
      </SectionDivider>
      <BottomPanel data-title="MEDIA CONTROLS">
        <CommunicationDisplay>
          <VideoFrame>
            <video ref={videoRef} autoPlay playsInline muted />
          </VideoFrame>
          <ControlPanel>
            {controlPanel}
          </ControlPanel>
          <GeminiFrame>
            <AudioViz volume={volume} isActive={true} />
          </GeminiFrame>
        </CommunicationDisplay>
      </BottomPanel>
    </TerminalContainer>
  );
}