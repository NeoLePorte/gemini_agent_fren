import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.theme.effects.scanlines};
    pointer-events: none;
    opacity: 0.1;
  }
`;

const ModalContent = styled.div`
  position: relative;
  width: 80vw;
  max-width: 1200px;
  aspect-ratio: 16/9;
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.accent}66;
  border-radius: 8px;
  box-shadow: 
    0 0 30px ${props => props.theme.colors.accent}22,
    inset 0 0 20px ${props => props.theme.colors.accent}22;
  overflow: hidden;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: ${props => props.theme.colors.accent};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${props => props.theme.fonts.mono};
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    color: ${props => props.theme.colors.text.accent};
    text-shadow: 0 0 10px ${props => props.theme.colors.accent};
  }

  .material-symbols-outlined {
    font-size: 24px;
  }
`;

interface VideoModalProps {
  videoId: string;
  onClose: () => void;
}

export default function VideoModal({ videoId, onClose }: VideoModalProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>
          Close <span className="material-symbols-outlined">close</span>
        </CloseButton>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </ModalContent>
    </ModalOverlay>
  );
} 