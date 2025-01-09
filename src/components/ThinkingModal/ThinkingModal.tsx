import React from 'react';
import styled from 'styled-components';
// @ts-ignore
import Draggable from 'react-draggable';

const FloatingWindow = styled.div`
  position: fixed;
  width: 400px;
  height: 600px;
  background: ${props => props.theme.colors.background};
  overflow: hidden;
  z-index: 9999;
  font-family: ${props => props.theme.fonts.mono};
  color: ${props => props.theme.colors.chartGreen};
  display: flex;
  flex-direction: column;
  position: relative;
  pointer-events: auto;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.theme.effects.scanlines};
    pointer-events: none;
    opacity: 0.5;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.theme.effects.noise};
    pointer-events: none;
    opacity: 0.3;
    z-index: 1;
  }
`;

const FrameContainer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .frame-border {
    fill: none;
    stroke: ${props => props.theme.colors.chartGreen};
    stroke-width: 3;
    filter: drop-shadow(0 0 10px ${props => props.theme.colors.chartGreen})
           drop-shadow(0 0 5px ${props => props.theme.colors.chartGreen});
    stroke-dasharray: 1500;
    stroke-dashoffset: 0;
    animation: borderFlow 3s linear infinite;
    opacity: 1;
  }

  .frame-dots {
    fill: ${props => props.theme.colors.secondary};
    filter: drop-shadow(0 0 8px ${props => props.theme.colors.secondary})
           drop-shadow(0 0 4px ${props => props.theme.colors.secondary});
    animation: dotsPulse 2s ease-in-out infinite;
    opacity: 1;
  }

  .frame-accent {
    fill: ${props => props.theme.colors.accent};
    filter: drop-shadow(0 0 12px ${props => props.theme.colors.accent})
           drop-shadow(0 0 6px ${props => props.theme.colors.accent});
    animation: accentPulse 2s ease-in-out infinite alternate;
    opacity: 1;
  }

  @keyframes borderFlow {
    0% {
      stroke-dashoffset: 1500;
      filter: drop-shadow(0 0 15px ${props => props.theme.colors.chartGreen})
             drop-shadow(0 0 8px ${props => props.theme.colors.chartGreen});
    }
    50% {
      filter: drop-shadow(0 0 25px ${props => props.theme.colors.chartGreen})
             drop-shadow(0 0 12px ${props => props.theme.colors.chartGreen});
    }
    100% {
      stroke-dashoffset: 0;
      filter: drop-shadow(0 0 15px ${props => props.theme.colors.chartGreen})
             drop-shadow(0 0 8px ${props => props.theme.colors.chartGreen});
    }
  }

  @keyframes dotsPulse {
    0%, 100% {
      opacity: 0.8;
      filter: drop-shadow(0 0 8px ${props => props.theme.colors.secondary})
             drop-shadow(0 0 4px ${props => props.theme.colors.secondary});
    }
    50% {
      opacity: 1;
      filter: drop-shadow(0 0 15px ${props => props.theme.colors.secondary})
             drop-shadow(0 0 8px ${props => props.theme.colors.secondary});
    }
  }

  @keyframes accentPulse {
    0% {
      filter: drop-shadow(0 0 12px ${props => props.theme.colors.accent})
             drop-shadow(0 0 6px ${props => props.theme.colors.accent});
    }
    100% {
      filter: drop-shadow(0 0 20px ${props => props.theme.colors.accent})
             drop-shadow(0 0 10px ${props => props.theme.colors.accent});
    }
  }
`;

const WindowContent = styled.div`
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 4px;
`;

const TitleBar = styled.div`
  background: ${props => props.theme.colors.background};
  padding: 8px 12px;
  font-size: 14px;
  color: ${props => props.theme.colors.chartGreen};
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: move;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  text-shadow: 
    2px 2px 0px ${props => props.theme.colors.chartGreen}44,
    -1px -1px 0px ${props => props.theme.colors.chartGreen}22,
    0 0 10px ${props => props.theme.colors.chartGreen}66;
  font-weight: bold;
  font-family: ${props => props.theme.fonts.display};
  margin-bottom: 4px;
`;

const WindowLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::after {
    content: '';
    display: block;
    width: 40px;
    height: 2px;
    background: ${props => props.theme.colors.secondary};
    box-shadow: 0 0 10px ${props => props.theme.colors.secondary}66;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
  background: ${props => props.theme.colors.background}dd;
  color: ${props => props.theme.colors.chartGreen};
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid ${props => props.theme.colors.chartGreen}33;
  box-shadow: inset 0 0 20px ${props => props.theme.colors.chartGreen}22;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.chartGreen}22;
    box-shadow: inset 0 0 10px ${props => props.theme.colors.chartGreen}11;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.chartGreen}44;
    border-radius: 4px;
    box-shadow: 0 0 10px ${props => props.theme.colors.chartGreen}22;
    
    &:hover {
      background: ${props => props.theme.colors.chartGreen}66;
      box-shadow: 0 0 15px ${props => props.theme.colors.chartGreen}33;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.chartGreen};
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.2s ease;
  border-radius: 4px;
  text-shadow: 0 0 10px ${props => props.theme.colors.chartGreen}66;

  &:hover {
    opacity: 1;
    background: ${props => props.theme.colors.chartGreen}22;
    box-shadow: 
      0 0 10px ${props => props.theme.colors.chartGreen}33,
      inset 0 0 5px ${props => props.theme.colors.chartGreen}22;
  }
`;

const ThoughtProcess = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.chartGreen}44;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
  position: relative;

  &::before {
    content: 'THOUGHT PROCESS';
    position: absolute;
    top: -10px;
    left: 16px;
    background: ${props => props.theme.colors.background};
    padding: 0 8px;
    font-size: 12px;
    color: ${props => props.theme.colors.chartGreen};
    letter-spacing: 1px;
  }
`;

const FinalAnswer = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.chartGreen}44;
  border-radius: 4px;
  padding: 16px;
  position: relative;

  &::before {
    content: 'FINAL ANSWER';
    position: absolute;
    top: -10px;
    left: 16px;
    background: ${props => props.theme.colors.background};
    padding: 0 8px;
    font-size: 12px;
    color: ${props => props.theme.colors.chartGreen};
    letter-spacing: 1px;
  }
`;

interface ThinkingModalProps {
  thoughtProcess?: string;
  finalAnswer?: string;
  onClose: () => void;
}

export default function ThinkingModal({ thoughtProcess, finalAnswer, onClose }: ThinkingModalProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      <Draggable handle=".handle" defaultPosition={{ x: window.innerWidth - 450, y: 40 }}>
        <FloatingWindow>
          <FrameContainer>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" preserveAspectRatio="none">
              {/* Main frame with animated stroke-dashoffset */}
              <path 
                className="frame-border" 
                d="M10,30 L30,10 L370,10 L390,30 L390,570 L370,590 L30,590 L10,570 Z" 
              />
              
              {/* Top dots */}
              <circle className="frame-dots" cx="40" cy="10" r="2" />
              <circle className="frame-dots" cx="50" cy="10" r="2" />
              <circle className="frame-dots" cx="60" cy="10" r="2" />
              <circle className="frame-dots" cx="340" cy="10" r="2" />
              <circle className="frame-dots" cx="350" cy="10" r="2" />
              <circle className="frame-dots" cx="360" cy="10" r="2" />
              
              {/* Corner accents */}
              <path className="frame-accent" d="M30,10 L50,10 L30,30 Z" />
              <path className="frame-accent" d="M350,10 L370,10 L370,30 Z" />
              <path className="frame-accent" d="M30,570 L30,590 L50,590 Z" />
              <path className="frame-accent" d="M370,570 L370,590 L350,590 Z" />
            </svg>
          </FrameContainer>
          <WindowContent>
            <TitleBar className="handle">
              <WindowLabel>THINKING MODE</WindowLabel>
              <CloseButton onClick={onClose}>
                <span className="material-symbols-outlined">close</span>
              </CloseButton>
            </TitleBar>
            <Content>
              <ThoughtProcess>
                {thoughtProcess || "No thoughts yet. Ask me a question that requires deep thinking!"}
              </ThoughtProcess>
              <FinalAnswer>
                {finalAnswer || "Waiting for final answer..."}
              </FinalAnswer>
            </Content>
          </WindowContent>
        </FloatingWindow>
      </Draggable>
    </div>
  );
} 