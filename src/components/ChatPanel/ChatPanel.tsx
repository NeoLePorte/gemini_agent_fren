import { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import styled from 'styled-components';
import { Part } from '@google/generative-ai';
import { isModelTurn, isServerContenteMessage } from '../../multimodal-live-types';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.secondary};
  font-family: ${props => props.theme.fonts.mono};
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      ${props => props.theme.colors.secondary}03 0px,
      ${props => props.theme.colors.secondary}03 1px,
      transparent 1px,
      transparent 2px
    );
    pointer-events: none;
    z-index: 1;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 2;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.secondary}22;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.secondary}44;
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.colors.secondary}66;
    }
  }
`;

const Message = styled.div<{ $isUser?: boolean }>`
  padding: 12px 16px;
  border-radius: 4px;
  position: relative;
  font-size: 14px;
  line-height: 1.5;
  max-width: 85%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  white-space: pre-wrap;
  
  pre {
    margin: 0;
    font-family: ${props => props.theme.fonts.mono};
    white-space: pre;
    overflow-x: auto;
  }
  
  ${props => props.$isUser ? `
    background: ${props.theme.colors.accent}11;
    border: 1px solid ${props.theme.colors.accent}44;
    color: ${props.theme.colors.accent};
    box-shadow: 0 0 20px ${props.theme.colors.accent}22;
    
    &::before {
      content: 'USER';
      position: absolute;
      top: -18px;
      right: 0;
      font-size: 10px;
      color: ${props.theme.colors.accent};
      opacity: 0.7;
      letter-spacing: 1px;
    }
  ` : `
    background: ${props.theme.colors.secondary}11;
    border: 1px solid ${props.theme.colors.secondary}44;
    color: ${props.theme.colors.secondary};
    box-shadow: 0 0 20px ${props.theme.colors.secondary}22;
    
    &::before {
      content: 'GEMINI';
      position: absolute;
      top: -18px;
      left: 0;
      font-size: 10px;
      color: ${props.theme.colors.secondary};
      opacity: 0.7;
      letter-spacing: 1px;
    }
  `}

  &:hover {
    border-color: ${props => props.$isUser ? 
      `${props.theme.colors.accent}88` : 
      `${props.theme.colors.secondary}88`
    };
    box-shadow: 0 0 30px ${props => props.$isUser ? 
      `${props.theme.colors.accent}33` : 
      `${props.theme.colors.secondary}33`
    };
  }
`;

const InputContainer = styled.div`
  padding: 16px;
  background: ${props => props.theme.colors.surface};
  border-top: 1px solid ${props => props.theme.colors.primary}44;
  position: relative;
  z-index: 2;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${props => props.theme.colors.primary};
    opacity: 0.2;
    box-shadow: 0 0 10px ${props => props.theme.colors.primary}66;
  }
`;

const Input = styled.input`
  width: 100%;
  height: 40px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.secondary}44;
  border-radius: 4px;
  color: ${props => props.theme.colors.secondary};
  padding: 0 16px;
  font-family: ${props => props.theme.fonts.mono};
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.secondary}88;
    box-shadow: 0 0 20px ${props => props.theme.colors.secondary}22;
  }

  &::placeholder {
    color: ${props => props.theme.colors.secondary}66;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  const [currentMessage, setCurrentMessage] = useState<string>('');
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
          // If we have a current message, append to it
          if (currentMessage) {
            setCurrentMessage(prev => prev + textContent);
            // Update the last message
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: currentMessage + textContent
                };
              }
              return newMessages;
            });
          } else {
            // Start a new message
            setCurrentMessage(textContent);
            setMessages(prev => [...prev, {
              role: 'model',
              content: textContent,
              timestamp: new Date()
            }]);
          }
        }
      }
    };

    const handleInterrupted = () => {
      console.log('Message interrupted, preserving current state');
      // Don't clear currentMessage here, keep it for continuation
    };

    const handleTurnComplete = () => {
      console.log('Turn complete, clearing current message');
      setCurrentMessage(''); // Clear current message only on turn complete
    };

    client.on('content', handleContent);
    client.on('interrupted', handleInterrupted);
    client.on('turncomplete', handleTurnComplete);
    
    return () => {
      client.off('content', handleContent);
      client.off('interrupted', handleInterrupted);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client, currentMessage]);

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
          <Message key={index} $isUser={message.role === 'user'}>
            {message.content.includes('\n') || /[│┌┐└┘├┤┬┴┼]/.test(message.content) ? (
              <pre>{message.content}</pre>
            ) : message.content}
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <form onSubmit={handleSubmit}>
        <InputContainer>
          <Input
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