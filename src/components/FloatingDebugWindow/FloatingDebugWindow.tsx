import React, { useState } from 'react';
import styled from 'styled-components';
// @ts-ignore
import Draggable from 'react-draggable';

const FloatingWindow = styled.div`
  position: fixed;
  min-width: 300px;
  min-height: 200px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.primary}44;
  border-radius: 4px;
  box-shadow: 0 0 20px ${props => props.theme.colors.primary}22;
  overflow: hidden;
  resize: both;
  z-index: 9999;
  font-family: ${props => props.theme.fonts.mono};
  color: ${props => props.theme.colors.primary};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.theme.effects.scanlines};
    pointer-events: none;
    opacity: 0.5;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.theme.effects.noise};
    pointer-events: none;
    opacity: 0.3;
  }
`;

const TitleBar = styled.div`
  background: ${props => props.theme.colors.primary}22;
  border-bottom: 1px solid ${props => props.theme.colors.primary}44;
  padding: 8px 12px;
  font-size: 12px;
  color: ${props => props.theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: move;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      ${props => props.theme.colors.primary}11 20%,
      ${props => props.theme.colors.primary}22 50%,
      ${props => props.theme.colors.primary}11 80%,
      transparent
    );
    pointer-events: none;
  }
`;

const Content = styled.div`
  padding: 12px;
  height: calc(100% - 33px);
  overflow: auto;
  position: relative;
  z-index: 1;
  background: ${props => props.theme.colors.background}dd;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.primary}44;
    border-radius: 4px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;
  border-radius: 4px;

  &:hover {
    opacity: 1;
    background: ${props => props.theme.colors.primary}22;
  }
`;

interface FloatingDebugWindowProps {
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
}

export default function FloatingDebugWindow({ 
  children, 
  defaultPosition = { x: 20, y: 20 },
  onClose 
}: FloatingDebugWindowProps) {
  return (
    <Draggable handle=".handle" defaultPosition={defaultPosition}>
      <FloatingWindow>
        <TitleBar className="handle">
          <span>DEBUG INFO</span>
          <CloseButton onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </CloseButton>
        </TitleBar>
        <Content>
          {children}
        </Content>
      </FloatingWindow>
    </Draggable>
  );
} 