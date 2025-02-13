import styled from 'styled-components';
import React, { RefObject, useState } from 'react';
import GifDisplay from '../GifDisplay/GifDisplay';
import VideoModal from '../VideoModal/VideoModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  gap: 2px;
  padding: 2px;
  background: ${props => props.theme.colors.background};

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: ${props => props.theme.effects.scanlines};
    pointer-events: none;
    opacity: 0.3;
    z-index: 1;
  }

  &::after {
    content: '';
    position: fixed;
    inset: 0;
    background: ${props => props.theme.effects.noise};
    pointer-events: none;
    opacity: 0.2;
    z-index: 1;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 4px;
  flex: 1;
  min-height: 0;
  padding: 4px;
`;

const ChatPanel = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 2px solid ${props => props.theme.colors.secondary}66;
  box-shadow: 
    inset 0 0 30px ${props => props.theme.colors.secondary}22,
    0 0 10px ${props => props.theme.colors.secondary}22;
  position: relative;
  overflow: hidden;
  border-radius: 4px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      ${props => props.theme.colors.secondary}11 25%,
      transparent 25%,
      transparent 50%,
      ${props => props.theme.colors.secondary}11 50%,
      ${props => props.theme.colors.secondary}11 75%,
      transparent 75%
    );
    background-size: 12px 12px;
    opacity: 0.2;
  }
`;

const MediaPanel = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 2px solid ${props => props.theme.colors.accent}66;
  box-shadow: 
    inset 0 0 20px ${props => props.theme.colors.accent}22,
    0 0 10px ${props => props.theme.colors.accent}22;
  position: relative;
  overflow: hidden;
  border-radius: 4px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      45deg,
      ${props => props.theme.colors.accent}11 25%,
      transparent 25%,
      transparent 50%,
      ${props => props.theme.colors.accent}11 50%,
      ${props => props.theme.colors.accent}11 75%,
      transparent 75%
    );
    background-size: 8px 8px;
    opacity: 0.2;
  }
`;

const ControlPanel = styled.div`
  height: 180px;
  background: ${props => props.theme.colors.surface};
  border: 2px solid ${props => props.theme.colors.primary}66;
  box-shadow: 
    inset 0 0 25px ${props => props.theme.colors.primary}22,
    0 0 10px ${props => props.theme.colors.primary}22;
  position: relative;
  overflow: hidden;
  margin: 4px;
  border-radius: 4px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      -45deg,
      ${props => props.theme.colors.primary}11 25%,
      transparent 25%,
      transparent 50%,
      ${props => props.theme.colors.primary}11 50%,
      ${props => props.theme.colors.primary}11 75%,
      transparent 75%
    );
    background-size: 10px 10px;
    opacity: 0.2;
  }
`;

const SectionLabel = styled.div`
  position: absolute;
  top: 8px;
  left: 12px;
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.accent};
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 
    0 0 10px ${props => props.theme.colors.secondary},
    0 0 20px ${props => props.theme.colors.secondary}66,
    0 0 30px ${props => props.theme.colors.secondary}33;
  z-index: 2;
  
  &::after {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    bottom: -4px;
    height: 1px;
    background: ${props => props.theme.colors.text.accent};
    box-shadow: 0 0 10px ${props => props.theme.colors.secondary};
    opacity: 0.5;
  }
`;

const VideoPreview = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 0 20px ${props => props.theme.colors.accent}44;

    &::after {
      opacity: 1;
    }
  }

  &::after {
    content: 'Click to Play';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.colors.text.accent};
    font-family: ${props => props.theme.fonts.mono};
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  iframe {
    pointer-events: none;
  }
`;

interface TerminalLayoutProps {
  debugPanel: React.ReactNode;
  chatPanel: React.ReactNode;
  controlPanel: React.ReactNode;
  videoRef: React.RefObject<HTMLVideoElement>;
  volume: number;
  gifUrl: string | null;
  videoId?: string | null;
}

export default function TerminalLayout({ 
  chatPanel,
  controlPanel,
  videoRef,
  volume,
  gifUrl,
  videoId
}: TerminalLayoutProps) {
  const [isGifLoading, setIsGifLoading] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <Container>
      <MainContent>
        <ChatPanel>
          <SectionLabel>TERMINAL OUTPUT</SectionLabel>
          {chatPanel}
        </ChatPanel>
        
        <MediaPanel>
          <SectionLabel>MEDIA FEED</SectionLabel>
          {videoId ? (
            <>
              <VideoPreview onClick={() => setIsVideoModalOpen(true)}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                />
              </VideoPreview>
              {isVideoModalOpen && videoId && (
                <VideoModal 
                  videoId={videoId} 
                  onClose={() => setIsVideoModalOpen(false)} 
                />
              )}
            </>
          ) : gifUrl ? (
            <GifDisplay gifUrl={gifUrl} isLoading={isGifLoading} />
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }} 
            />
          )}
        </MediaPanel>
      </MainContent>
      
      <ControlPanel>
        {controlPanel}
      </ControlPanel>
    </Container>
  );
}