import { useEffect, useRef } from 'react';
import styled from 'styled-components';

const VizContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface AudioVizProps {
  volume: number;
  isActive: boolean;
}

// Temporary placeholder component until we implement Three.js
export default function AudioViz({ volume, isActive }: AudioVizProps) {
  return (
    <VizContainer>
      <span 
        className="material-symbols-outlined"
        style={{ 
          fontSize: '64px', 
          opacity: isActive ? 0.8 : 0.3,
          color: 'var(--color-primary)',
          transition: 'all 0.3s ease',
          transform: `scale(${1 + volume * 0.5})`
        }}
      >
        smart_toy
      </span>
    </VizContainer>
  );
} 