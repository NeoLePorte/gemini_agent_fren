import { useEffect, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import styled from 'styled-components';
import Logger, { LoggerFilterType } from '../logger/Logger';
import { useLoggerStore } from '../../lib/store-logger';
import { StreamingLog } from '../../multimodal-live-types';
import Select from 'react-select';

const DebugContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
  color: ${props => props.theme.colors.primary};

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;

    .filter-select {
      flex: 1;
      
      .react-select__control {
        background: ${props => props.theme.colors.background};
        border-color: ${props => props.theme.colors.primary};
        
        &:hover {
          border-color: ${props => props.theme.colors.primary};
        }
      }
      
      .react-select__menu {
        background: ${props => props.theme.colors.background};
        border: 1px solid ${props => props.theme.colors.primary};
      }
      
      .react-select__option {
        background: ${props => props.theme.colors.background};
        color: ${props => props.theme.colors.primary};
        
        &:hover, &--is-focused {
          background: ${props => `${props.theme.colors.primary}22`};
        }
        
        &--is-selected {
          background: ${props => `${props.theme.colors.primary}44`};
        }
      }
      
      .react-select__single-value {
        color: ${props => props.theme.colors.primary};
      }
    }
  }

  .logs {
    flex: 1;
    overflow-y: auto;
    text-align: left;
    padding-right: 10px;
  }
`;

const filterOptions = [
  { value: 'none', label: 'All Logs' },
  { value: 'conversations', label: 'Conversations' },
  { value: 'tools', label: 'Tools' }
];

export function DebugPanel() {
  const { client } = useLiveAPIContext();
  const [filter, setFilter] = useState<LoggerFilterType>('none');

  useEffect(() => {
    const handleLog = (log: StreamingLog) => {
      useLoggerStore.setState(state => ({
        logs: [...state.logs, log]
      }));
    };

    client.on('log', handleLog);
    return () => {
      client.off('log', handleLog);
    };
  }, [client]);

  return (
    <DebugContainer>
      <div className="controls">
        <Select
          className="filter-select"
          classNamePrefix="react-select"
          options={filterOptions}
          value={filterOptions.find(opt => opt.value === filter)}
          onChange={(option) => setFilter(option?.value as LoggerFilterType)}
          isSearchable={false}
        />
      </div>
      <div className="logs">
        <Logger filter={filter} />
      </div>
    </DebugContainer>
  );
} 