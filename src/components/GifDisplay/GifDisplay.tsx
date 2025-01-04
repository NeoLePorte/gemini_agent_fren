import React from 'react';
import styled from 'styled-components';

const GifContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.theme.effects.scanlines};
    pointer-events: none;
    opacity: 0.3;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.theme.effects.noise};
    pointer-events: none;
    opacity: 0.2;
    z-index: 1;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background}dd;
  color: ${props => props.theme.colors.primary};
  font-family: ${props => props.theme.fonts.mono};
  z-index: 2;
`;

interface GifDisplayProps {
  gifUrl: string | null;
  isLoading?: boolean;
}

const GifDisplay: React.FC<GifDisplayProps> = ({ gifUrl, isLoading = false }) => {
  return (
    <GifContainer>
      {isLoading && (
        <LoadingOverlay>
          <span>Loading GIF...</span>
        </LoadingOverlay>
      )}
      {gifUrl && <img src={gifUrl} alt="GIPHY Response" />}
    </GifContainer>
  );
};

export default GifDisplay; 