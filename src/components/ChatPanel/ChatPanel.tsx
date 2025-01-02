import { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import styled from 'styled-components';
import { Part } from '@google/generative-ai';
import { isModelTurn, isServerContenteMessage } from '../../multimodal-live-types';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
  padding: 16px;
  color: ${props => props.theme.colors.primary};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.primary}33;
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.colors.primary}66;
    }
  }
`;

const Message = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  max-width: 80%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};

  .message-header {
    font-size: 12px;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${props => props.theme.colors.primary};
  }

  .message-content {
    background: ${props => props.isUser ? 
      `${props.theme.colors.primary}11` : 
      `${props.theme.colors.primary}22`};
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid ${props => `${props.theme.colors.primary}33`};
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Space Mono', monospace;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      ${props => props.isUser ? 'right: -1px' : 'left: -1px'};
      width: 2px;
      height: 100%;
      background: ${props => props.theme.colors.primary}66;
      border-radius: 1px;
    }
  }
`;

const InputContainer = styled.div`
  position: relative;
  
  input {
    width: 100%;
    height: 40px;
    background: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.primary};
    border-radius: 4px;
    color: ${props => props.theme.colors.primary};
    padding: 0 15px;
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 10px ${props => `${props.theme.colors.primary}33`};
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.primary};
      opacity: 0.5;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const extractTextFromParts = (parts: Part[]): string => {
  return parts
    .filter(part => part.text)
    .map(part => part.text)
    .join('');
};

export default function ChatPanel() {
  const { client, connected } = useLiveAPIContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Listen for model responses
  useEffect(() => {
    const handleContent = (content: any) => {
      console.log('Received content:', content); // Debug log
      
      if (isModelTurn(content)) {
        const { parts } = content.modelTurn;
        const textContent = extractTextFromParts(parts);
        console.log('Extracted text:', textContent); // Debug log
        
        if (textContent) {
          setMessages(prev => [...prev, {
            role: 'model',
            content: textContent,
            timestamp: new Date()
          }]);
        }
      }
    };

    client.on('content', handleContent);
    return () => {
      client.off('content', handleContent);
    };
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !connected) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send message to API
    const part: Part = { text: inputValue.trim() };
    client.send([part]);

    // Clear input
    setInputValue('');
  };

  // Debug log for messages state
  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message key={index} isUser={message.role === 'user'}>
            <div className="message-header">
              {message.role === 'user' ? 'You' : 'Gemini'}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <form onSubmit={handleSubmit}>
        <InputContainer>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type something..."
            disabled={!connected}
          />
        </InputContainer>
      </form>
    </ChatContainer>
  );
} 