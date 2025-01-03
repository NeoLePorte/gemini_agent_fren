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

import "./logger.scss";

import { Part } from "@google/generative-ai";
import cn from "classnames";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useLoggerStore } from "../../lib/store-logger";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import {
  ClientContentMessage,
  isClientContentMessage,
  isInterrupted,
  isModelTurn,
  isServerContenteMessage,
  isToolCallCancellationMessage,
  isToolCallMessage,
  isToolResponseMessage,
  isTurnComplete,
  ModelTurn,
  ServerContentMessage,
  StreamingLog,
  ToolCallCancellationMessage,
  ToolCallMessage,
  ToolResponseMessage,
  LiveOutgoingMessage,
  LiveIncomingMessage,
} from "../../multimodal-live-types";
import styled from "styled-components";

const LoggerContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  text-align: left;
  
  .log-entry {
    margin-bottom: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    
    .timestamp {
      color: ${props => props.theme.colors.primary};
      opacity: 0.7;
      margin-right: 10px;
      flex-shrink: 0;
      min-width: 80px;
    }

    .message {
      flex: 1;
    }

    .rich-log {
      width: 100%;
      margin: 10px 0 10px 80px;
      padding: 10px;
      border-radius: 4px;
      text-align: left;
      
      &.client-content {
        border: 1px solid ${props => `${props.theme.colors.primary}33`};
        h4 { 
          color: ${props => props.theme.colors.primary}; 
          border-bottom: 1px solid ${props => `${props.theme.colors.primary}33`};
        }
      }
      
      &.model-turn {
        border: 1px solid ${props => `${props.theme.colors.accent}33`};
        h4 { 
          color: ${props => props.theme.colors.accent}; 
          border-bottom: 1px solid ${props => `${props.theme.colors.accent}33`};
        }
      }
      
      &.tool-call {
        border: 1px solid ${props => `${props.theme.colors.secondary}33`};
        h4 { 
          color: ${props => props.theme.colors.secondary}; 
          border-bottom: 1px solid ${props => `${props.theme.colors.secondary}33`};
        }
      }
      
      &.tool-response {
        border: 1px solid ${props => `${props.theme.colors.chartGreen}33`};
        h4 { 
          color: ${props => props.theme.colors.chartGreen}; 
          border-bottom: 1px solid ${props => `${props.theme.colors.chartGreen}33`};
        }
      }
      
      &.tool-call-cancellation {
        border: 1px solid ${props => `${props.theme.colors.warning}33`};
        h4 { 
          color: ${props => props.theme.colors.warning}; 
          border-bottom: 1px solid ${props => `${props.theme.colors.warning}33`};
        }
      }
      
      h4 {
        margin: 0 0 10px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-shadow: 0 0 10px currentColor;
        padding-bottom: 8px;
      }
      
      .part {
        margin: 5px 0;
        background: ${props => `${props.theme.colors.background}cc`};
        padding: 10px;
        border-radius: 4px;
        border: 1px solid ${props => `${props.theme.colors.primary}11`};
        
        &.part-text {
          white-space: pre-wrap;
        }
        
        &.part-executableCode, &.part-codeExecutionResult {
          h5 {
            margin: 10px 0 5px;
            font-size: 12px;
            opacity: 0.8;
            color: inherit;
          }
        }

        pre {
          margin: 0;
          text-align: left;
        }
      }
    }
  }
`;

type MessageType = string | LiveOutgoingMessage | LiveIncomingMessage;

interface MessageProps {
  message: MessageType;
}

const tryParseCodeExecutionResult = (output: string) => {
  try {
    return JSON.stringify(JSON.parse(output), null, 2);
  } catch {
    return output;
  }
};

const RenderPart = ({ part }: { part: Part }) =>
  part.text && part.text.length ? (
    <p className="part part-text">{part.text}</p>
  ) : part.executableCode ? (
    <div className="part part-executableCode">
      <h5>executableCode: {part.executableCode.language}</h5>
      <SyntaxHighlighter
        language={part.executableCode.language.toLowerCase()}
        style={dark}
      >
        {part.executableCode.code}
      </SyntaxHighlighter>
    </div>
  ) : part.codeExecutionResult ? (
    <div className="part part-codeExecutionResult">
      <h5>codeExecutionResult: {part.codeExecutionResult.outcome}</h5>
      <SyntaxHighlighter language="json" style={dark}>
        {tryParseCodeExecutionResult(part.codeExecutionResult.output)}
      </SyntaxHighlighter>
    </div>
  ) : (
    <div className="part part-inlinedata">
      <h5>Inline Data: {part.inlineData?.mimeType}</h5>
    </div>
  );

const PlainTextMessage = ({ message }: { message: string }) => (
  <span className="message">{message}</span>
);

const ClientContentLog = ({ message }: MessageProps) => {
  if (!isClientContentMessage(message)) return null;
  const { turns, turnComplete } = message.clientContent;
  return (
    <div className="rich-log client-content">
      <h4>👤 User</h4>
      {turns.map((turn, i) => (
        <div key={`message-turn-${i}`}>
          {turn.parts
            .filter((part) => !(part.text && part.text === "\n"))
            .map((part, j) => (
              <RenderPart part={part} key={`message-turn-${i}-part-${j}`} />
            ))}
        </div>
      ))}
      {!turnComplete ? <span>turnComplete: false</span> : ""}
    </div>
  );
};

const ToolCallLog = ({ message }: MessageProps) => {
  if (!isToolCallMessage(message)) return null;
  const { toolCall } = message;
  return (
    <div className="rich-log tool-call">
      <h4>🛠️ Tool Call</h4>
      {toolCall.functionCalls.map((call, index) => (
        <div key={index} className="part">
          <h5>Function: {call.name}</h5>
          <SyntaxHighlighter language="json" style={dark}>
            {JSON.stringify(call.args, null, 2)}
          </SyntaxHighlighter>
          <div style={{ fontSize: '0.8em', opacity: 0.7 }}>ID: {call.id}</div>
        </div>
      ))}
    </div>
  );
};

const ToolCallCancellationLog = ({ message }: MessageProps) => {
  if (!isToolCallCancellationMessage(message)) return null;
  const { toolCallCancellation } = message;
  return (
    <div className="rich-log tool-call-cancellation">
      <h4>❌ Tool Call Cancelled</h4>
      <div className="part">
        <SyntaxHighlighter language="json" style={dark}>
          {JSON.stringify(toolCallCancellation, null, 2)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const ToolResponseLog = ({ message }: MessageProps) => {
  if (!isToolResponseMessage(message)) return null;
  const { toolResponse } = message;
  return (
    <div className="rich-log tool-response">
      <h4>✅ Tool Response</h4>
      {toolResponse.functionResponses.map((response, index) => (
        <div key={index} className="part">
          <div style={{ fontSize: '0.8em', opacity: 0.7 }}>ID: {response.id}</div>
          <SyntaxHighlighter language="json" style={dark}>
            {JSON.stringify(response.response, null, 2)}
          </SyntaxHighlighter>
        </div>
      ))}
    </div>
  );
};

const ModelTurnLog = ({ message }: MessageProps) => {
  if (!isServerContenteMessage(message)) return null;
  const { serverContent } = message;
  if (!isModelTurn(serverContent)) return null;
  const { parts } = serverContent.modelTurn;

  return (
    <div className="rich-log model-turn">
      <h4>🤖 Model</h4>
      {parts
        .filter((part) => !(part.text && part.text === "\n"))
        .map((part, j) => (
          <RenderPart part={part} key={`model-turn-part-${j}`} />
        ))}
    </div>
  );
};

const AnyMessage = ({ message }: MessageProps) => (
  <div className="log-entry">
    <SyntaxHighlighter language="json" style={dark}>
      {JSON.stringify(message, null, 2)}
    </SyntaxHighlighter>
  </div>
);

export type LoggerFilterType = "conversations" | "tools" | "none";

export type LoggerProps = {
  filter: LoggerFilterType;
};

const filters: Record<LoggerFilterType, (log: StreamingLog) => boolean> = {
  tools: (log: StreamingLog) =>
    isToolCallMessage(log.message) ||
    isToolResponseMessage(log.message) ||
    isToolCallCancellationMessage(log.message),
  conversations: (log: StreamingLog) =>
    isClientContentMessage(log.message) || isServerContenteMessage(log.message),
  none: () => true,
};

const getComponent = (log: StreamingLog): React.FC<MessageProps> => {
  if (typeof log.message === "string") {
    return () => <PlainTextMessage message={log.message as string} />;
  }
  if (isClientContentMessage(log.message)) {
    return ClientContentLog;
  }
  if (isToolCallMessage(log.message)) {
    return ToolCallLog;
  }
  if (isToolCallCancellationMessage(log.message)) {
    return ToolCallCancellationLog;
  }
  if (isToolResponseMessage(log.message)) {
    return ToolResponseLog;
  }
  if (isServerContenteMessage(log.message)) {
    const { serverContent } = log.message;
    if (isInterrupted(serverContent)) {
      return () => <PlainTextMessage message="interrupted" />;
    }
    if (isTurnComplete(serverContent)) {
      return () => <PlainTextMessage message="turnComplete" />;
    }
    if (isModelTurn(serverContent)) {
      return ModelTurnLog;
    }
  }
  return AnyMessage;
};

export default function Logger({ filter }: LoggerProps) {
  const logs = useLoggerStore((state) => state.logs);
  const filteredLogs = logs.filter(filters[filter]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle scroll events to determine if we should auto-scroll
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider "near bottom" if within 100px of the bottom
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      setShouldAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new logs come in
  useEffect(() => {
    if (logContainerRef.current && shouldAutoScroll) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, shouldAutoScroll]);

  return (
    <LoggerContainer ref={logContainerRef}>
      {filteredLogs.map((log, i) => {
        const Component = getComponent(log);
        return (
          <div key={i} className={cn("log-entry", {
            'client-message': log.type.startsWith('client'),
            'server-message': log.type.startsWith('server'),
            'tool-message': log.type.includes('tool')
          })}>
            <span className="timestamp">{log.date.toLocaleTimeString()}</span>
            <Component message={log.message} />
          </div>
        );
      })}
    </LoggerContainer>
  );
}
