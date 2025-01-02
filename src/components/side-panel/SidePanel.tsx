/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { StreamingLog } from "../../multimodal-live-types";
import styled from "styled-components";
import Select from "react-select";
import cn from "classnames";

const DebugContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  color: ${props => props.theme.colors.primary};
  font-family: 'Space Mono', monospace;

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;

    .filter-select {
      flex: 1;
      
      .react-select__control {
        background: ${props => props.theme.colors.background};
        border: 2px solid ${props => props.theme.colors.primary};
        min-height: 33px;
        
        &:hover {
          border-color: ${props => props.theme.colors.primary};
        }
      }
      
      .react-select__single-value {
        color: ${props => props.theme.colors.primary};
      }
      
      .react-select__menu {
        background: ${props => props.theme.colors.background};
        border: 2px solid ${props => props.theme.colors.primary};
        
        .react-select__option {
          color: ${props => props.theme.colors.primary};
          
          &:hover {
            background: ${props => `${props.theme.colors.primary}22`};
          }
        }
      }
    }

    .status-indicator {
      padding: 6px 12px;
      border-radius: 4px;
      border: 2px solid ${props => props.theme.colors.primary};
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      background: ${props => props.theme.colors.background};
      
      &.connected {
        color: ${props => props.theme.colors.primary};
      }
    }
  }

  .debug-content {
    flex: 1;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.4;
    text-align: left;

    .debug-line {
      display: flex;
      gap: 10px;
      padding: 4px 0;
      
      .timestamp {
        color: ${props => props.theme.colors.primary};
        opacity: 0.8;
        min-width: 80px;
      }
      
      .message {
        flex: 1;
        white-space: pre-wrap;
        word-break: break-word;
        
        &.server {
          opacity: 0.7;
        }
        
        &.client {
          opacity: 1;
        }
      }
    }
  }
`;

interface FilterOption {
  value: 'none' | 'client' | 'server';
  label: string;
}

const filterOptions: FilterOption[] = [
  { value: "none", label: "All Messages" },
  { value: "client", label: "Client Messages" },
  { value: "server", label: "Server Messages" },
];

export default function SidePanel() {
  const { connected, client } = useLiveAPIContext();
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(filterOptions[0]);
  const { logs, log } = useLoggerStore();
  const debugContentRef = useRef<HTMLDivElement>(null);

  // Connect to client logs
  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

  // Auto-scroll to bottom when new logs come in
  useEffect(() => {
    if (debugContentRef.current) {
      debugContentRef.current.scrollTop = debugContentRef.current.scrollHeight;
    }
  }, [logs]);

  // Format timestamp to HH:MM:SS
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format message based on its type
  const formatMessage = (message: StreamingLog['message']) => {
    if (typeof message === 'string') return message;
    return JSON.stringify(message, null, 2);
  };

  return (
    <DebugContainer>
      <div className="controls">
        <Select<FilterOption>
          className="filter-select"
          classNamePrefix="react-select"
          value={selectedFilter}
          options={filterOptions}
          onChange={(option) => setSelectedFilter(option || filterOptions[0])}
        />
        <div className={cn("status-indicator", { connected })}>
          {connected ? "🟢 Connected" : "⏸️ Paused"}
        </div>
      </div>
      <div className="debug-content" ref={debugContentRef}>
        {logs
          .filter((log: StreamingLog) => {
            if (selectedFilter.value === "none") return true;
            return log.type.startsWith(selectedFilter.value);
          })
          .map((log: StreamingLog, index: number) => (
            <div key={index} className="debug-line">
              <span className="timestamp">{formatTimestamp(log.date)}</span>
              <span className={cn("message", {
                server: log.type.startsWith('server'),
                client: log.type.startsWith('client')
              })}>
                {formatMessage(log.message)}
                {log.count && log.count > 1 ? ` (${log.count}x)` : ''}
              </span>
            </div>
          ))}
      </div>
    </DebugContainer>
  );
}
