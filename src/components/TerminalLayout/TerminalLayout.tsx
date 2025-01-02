import styled from 'styled-components';
import React, { RefObject } from 'react';

const TerminalContainer = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  height: 100vh;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.primary};
  font-family: 'Space Mono', monospace;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(
        0deg,
        transparent 0%,
        ${props => props.theme.colors.primary}11 50%,
        transparent 100%
      );
    pointer-events: none;
    z-index: 1;
  }
`;

const ChatSection = styled.div`
  border: 1px solid ${props => props.theme.colors.primary}44;
  border-radius: 4px;
  background: ${props => props.theme.colors.background}dd;
  box-shadow: 0 0 20px ${props => props.theme.colors.primary}22;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  &::before {
    content: 'TERMINAL OUTPUT';
    position: absolute;
    top: 8px;
    left: 12px;
    font-size: 12px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.7;
    letter-spacing: 1px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: ${props => props.theme.colors.primary}11;
    border-bottom: 1px solid ${props => props.theme.colors.primary}22;
  }
`;

const MediaSection = styled.div`
  border: 1px solid ${props => props.theme.colors.primary}44;
  border-radius: 4px;
  background: ${props => props.theme.colors.background}dd;
  box-shadow: 0 0 20px ${props => props.theme.colors.primary}22;
  overflow: hidden;
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 12px;
  padding: 40px 12px 12px 12px;

  &::before {
    content: 'MEDIA OUTPUT';
    position: absolute;
    top: 8px;
    left: 12px;
    font-size: 12px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.7;
    letter-spacing: 1px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: ${props => props.theme.colors.primary}11;
    border-bottom: 1px solid ${props => props.theme.colors.primary}22;
  }
`;

const ControlSection = styled.div`
  grid-column: 1 / -1;
  border: 1px solid ${props => props.theme.colors.primary}44;
  border-radius: 4px;
  background: ${props => props.theme.colors.background}dd;
  box-shadow: 0 0 20px ${props => props.theme.colors.primary}22;
  padding: 12px;
  position: relative;

  &::before {
    content: 'SYSTEM CONTROLS';
    position: absolute;
    top: 8px;
    left: 12px;
    font-size: 12px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.7;
    letter-spacing: 1px;
  }
`;

const MediaCell = styled.div`
  border: 1px solid ${props => props.theme.colors.primary}44;
  border-radius: 4px;
  background: ${props => props.theme.colors.background};
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid ${props => props.theme.colors.primary}22;
    border-radius: 4px;
  }

  img, video {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

interface TerminalLayoutProps {
  debugPanel: React.ReactNode;
  chatPanel: React.ReactNode;
  controlPanel: React.ReactNode;
  videoRef: RefObject<HTMLVideoElement>;
  volume: number;
}

export default function TerminalLayout({ 
  debugPanel,
  chatPanel,
  controlPanel,
  videoRef,
  volume 
}: TerminalLayoutProps) {
  return (
    <TerminalContainer>
      <ChatSection>
        {chatPanel}
      </ChatSection>
      
      <MediaSection>
        {/* Media cells for images, videos, graphs etc */}
        {Array(9).fill(null).map((_, i) => (
          <MediaCell key={i} />
        ))}
      </MediaSection>
      
      <ControlSection>
        {controlPanel}
      </ControlSection>
    </TerminalContainer>
  );
}