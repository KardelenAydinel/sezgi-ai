import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Sender } from '../types';
import { sendChatMessage, sendImageWithMessage, findSimilarProducts } from '../services/api';
import ProductCard from './ProductCard';
import EcommerceProductCard from './EcommerceProductCard';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 80px); // Subtract header height
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MessageBubble = styled.div<{ sender: Sender }>`
  max-width: 70%;
  align-self: ${({ sender }) => sender === Sender.USER ? 'flex-end' : 'flex-start'};
  background-color: ${({ sender, theme }) => 
    sender === Sender.USER ? theme.colors.primary : theme.colors.surface};
  color: ${({ sender, theme }) => 
    sender === Sender.USER ? theme.colors.onPrimary : theme.colors.onSurface};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  word-wrap: break-word;
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

const EcommerceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

const TagResultContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const TagResultTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const Tag = styled.span`
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const InputContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const InputRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-end;
`;

const TextInput = styled.textarea`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  font-size: inherit;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const SendButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryVariant};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ImageButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.grey[200]};
  color: ${({ theme }) => theme.colors.text.primary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[300]};
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  align-self: flex-start;
`;

interface ChatPageProps {
  initialMessage?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      sender: Sender.USER,
      text: textToSend,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(textToSend);
      
      // Add LLM response
      const llmMessage: ChatMessage = {
        sender: Sender.LLM,
        text: response.response,
        products: response.products,
        searchResults: response.search_results,
        tagResult: response.tag_result,
      };
      setMessages(prev => [...prev, llmMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        sender: Sender.LLM,
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading]);

  // Send initial message if provided - use ref to prevent re-runs
  const hasInitialMessageBeenSent = useRef(false);
  
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !hasInitialMessageBeenSent.current) {
      hasInitialMessageBeenSent.current = true;
      setInputText(initialMessage);
      
      // Delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        const sendInitialMessage = async () => {
          const textToSend = initialMessage.trim();
          if (!textToSend) return;

          // Add user message
          const userMessage: ChatMessage = {
            sender: Sender.USER,
            text: textToSend,
          };
          setMessages([userMessage]); // Use direct set instead of prev => [...prev]
          setIsLoading(true);

          try {
            const response = await sendChatMessage(textToSend);
            
            // Add LLM response
            const llmMessage: ChatMessage = {
              sender: Sender.LLM,
              text: response.response,
              products: response.products,
              searchResults: response.search_results,
              tagResult: response.tag_result,
            };
            setMessages(prev => [...prev, llmMessage]);
          } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ChatMessage = {
              sender: Sender.LLM,
              text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
            };
            setMessages(prev => [...prev, errorMessage]);
          } finally {
            setIsLoading(false);
          }
        };
        
        sendInitialMessage();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [initialMessage]); // Only depend on initialMessage

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isLoading) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix

        // Add user message with image
        const userMessage: ChatMessage = {
          sender: Sender.USER,
          text: '📷 Görsel yüklendi',
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const response = await sendImageWithMessage(base64Data, inputText || 'Bu görseldeki ürünü analiz et');
        
        // Add LLM response
        const llmMessage: ChatMessage = {
          sender: Sender.LLM,
          text: response.response,
          products: response.products,
          searchResults: response.search_results,
          tagResult: response.tag_result,
        };
        setMessages(prev => [...prev, llmMessage]);
        setInputText('');
      } catch (error) {
        console.error('Error uploading image:', error);
        const errorMessage: ChatMessage = {
          sender: Sender.LLM,
          text: 'Görsel yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleShowSimilar = async (productName: string) => {
    setIsLoading(true);
    
    try {
      const similarProducts = await findSimilarProducts(productName);
      
      // Add a new message with similar products
      const similarMessage: ChatMessage = {
        sender: Sender.LLM,
        text: `"${productName}" ürününe benzer ${similarProducts.length} ürün bulundu:`,
        products: similarProducts,
      };
      
      setMessages(prev => [...prev, similarMessage]);
    } catch (error) {
      console.error('Error finding similar products:', error);
      const errorMessage: ChatMessage = {
        sender: Sender.LLM,
        text: 'Benzer ürünler aranırken bir hata oluştu.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => (
    <div key={index}>
      <MessageBubble sender={message.sender}>
        {message.text && (
          <ReactMarkdown>{message.text}</ReactMarkdown>
        )}
      </MessageBubble>

      {message.products && message.products.length > 0 && (
        <ProductsGrid>
          {message.products.map((product, idx) => (
            <ProductCard 
              key={idx} 
              product={product} 
              onShowSimilar={handleShowSimilar}
            />
          ))}
        </ProductsGrid>
      )}

      {message.searchResults && message.searchResults.length > 0 && (
        <EcommerceGrid>
          {message.searchResults.map((product, idx) => (
            <EcommerceProductCard key={idx} product={product} />
          ))}
        </EcommerceGrid>
      )}

      {message.tagResult && (
        <TagResultContainer>
          <TagResultTitle>Ürün Etiketleri</TagResultTitle>
          <p><strong>Kategori:</strong> {message.tagResult.category}</p>
          <p><strong>Güven Skoru:</strong> {(message.tagResult.confidence * 100).toFixed(1)}%</p>
          <TagsContainer>
            {message.tagResult.tags.map((tag: string, idx: number) => (
              <Tag key={idx}>{tag}</Tag>
            ))}
          </TagsContainer>
          <p><strong>Açıklama:</strong> {message.tagResult.reasoning}</p>
          <p><strong>Görsel Tanım:</strong> {message.tagResult.visualDescription}</p>
        </TagResultContainer>
      )}
    </div>
  );

  return (
    <Container>
      <MessagesContainer>
        {messages.map(renderMessage)}
        {isLoading && (
          <LoadingIndicator>
            <span>🤖</span>
            <span>Düşünüyorum...</span>
          </LoadingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <InputRow>
          <ImageButton onClick={() => fileInputRef.current?.click()}>
            📷
          </ImageButton>
          <FileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <TextInput
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            disabled={isLoading}
          />
          <SendButton 
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            📤
          </SendButton>
        </InputRow>
      </InputContainer>
    </Container>
  );
};

export default ChatPage;