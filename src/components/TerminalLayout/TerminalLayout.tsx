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
  gap: 20px;
`;

const Panel = styled.div<{ 'data-title': string }>`
  position: relative;
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 20px;
  background: ${props => props.theme.colors.surface};
  
  &:before {
    content: attr(data-title);
    position: absolute;
    top: -12px;
    left: 20px;
    background: ${props => props.theme.colors.background};
    padding: 0 10px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const TopPanel = styled(Panel)`
  height: 200px;
  overflow-y: auto;
`;

const MiddlePanel = styled(Panel)`
  flex: 1;
  min-height: 0;
`;

const BottomPanel = styled(Panel)`
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  background: #000;
  position: relative;
  
  &::after {
    content: 'MEMORY';
    position: absolute;
    bottom: -10px;
    right: 20px;
    color: #00ff00;
    font-size: 12px;
    letter-spacing: 2px;
  }
`;

const CommunicationDisplay = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 20px;
  width: 100%;
  padding: 20px;
  background: rgba(0, 255, 0, 0.02);
  border: 1px solid #00ff0033;
  position: relative;
  
  &::before {
    content: 'PTT';
    position: absolute;
    top: -10px;
    left: 20px;
    color: #00ff00;
    font-size: 12px;
    letter-spacing: 2px;
    background: #000;
    padding: 0 10px;
  }
`;

const VideoFrame = styled.div`
  width: 320px;
  height: 180px;
  border: 1px solid #00ff0044;
  border-radius: 4px;
  overflow: hidden;
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
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ControlPanel = styled.div`
  min-width: 320px;
  height: 180px;
  border: 1px solid #00ff0044;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #00ff0008;
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

const GeminiFrame = styled(VideoFrame)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #00ff0008;
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
      <MiddlePanel data-title="OFF-LINE BROWSE">
        {chatPanel}
      </MiddlePanel>
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