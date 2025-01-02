import styled from 'styled-components';
import React from 'react';

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
  gap: 20px;
`;

const VideoContainer = styled.div`
  width: 320px;
  height: 100%;
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  overflow: hidden;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ControlsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

interface TerminalLayoutProps {
  debugPanel: React.ReactNode;
  chatPanel: React.ReactNode;
  controlPanel: React.ReactNode;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function TerminalLayout({
  debugPanel,
  chatPanel,
  controlPanel,
  videoRef
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
        <VideoContainer>
          <video ref={videoRef} autoPlay playsInline muted />
        </VideoContainer>
        <ControlsContainer>
          {controlPanel}
        </ControlsContainer>
      </BottomPanel>
    </TerminalContainer>
  );
}