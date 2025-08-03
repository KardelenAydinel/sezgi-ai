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
  height: 100vh; // Use full viewport height since header is removed
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.sm}; // Reduced padding for more content
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const MessageBubble = styled.div<{ sender: Sender }>`
  max-width: 70%;
  width: fit-content; // Adjust width to content size
  min-width: 60px; // Minimum width for very short messages
  align-self: ${({ sender }) => sender === Sender.USER ? 'flex-end !important' : 'flex-start !important'};
  margin-left: ${({ sender }) => sender === Sender.USER ? 'auto' : '0'};
  margin-right: ${({ sender }) => sender === Sender.USER ? '0' : 'auto'};
  background-color: ${({ sender, theme }) => 
    sender === Sender.USER ? theme.colors.primary : theme.colors.grey[200]};
  color: ${({ sender, theme }) => 
    sender === Sender.USER ? theme.colors.onPrimary : theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  word-wrap: break-word;
`;

const ProductsBubble = styled.div`
  max-width: 70%;
  width: fit-content; // Adjust width to content size (number of products)
  align-self: flex-start;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ProductsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  flex-wrap: nowrap;
  justify-content: space-between;
`;

const EcommerceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 900px; // Consistent with ProductsGrid
  align-self: flex-start; // Align with assistant messages on the left
`;

const TagResultContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  max-width: 900px; // Consistent with other grids
  align-self: flex-start; // Align with assistant messages on the left
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
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      const sendInitialMessage = async () => {
        const textToSend = initialMessage.trim();
        if (!textToSend) return;

        // Add user message
        const userMessage: ChatMessage = {
          sender: Sender.USER,
          text: textToSend,
        };
        // If there are previous messages, append, otherwise start new chat
        setMessages(prev => (prev.length > 0 ? [...prev, userMessage] : [userMessage]));
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
    }
  }, [initialMessage]); 

  const handleShowSimilar = async (productName: string, productDescription?: string) => {
    setIsLoading(true);
    
    try {
      // Use agentic AI workflow: tag generation → cosine similarity search
      const similarProducts = await findSimilarProducts(productName, productDescription);
      
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
        <ProductsBubble>
          <ProductsContainer>
            {message.products.map((product, idx) => (
              <ProductCard 
                key={idx} 
                product={product} 
                onShowSimilar={handleShowSimilar}
              />
            ))}
          </ProductsContainer>
        </ProductsBubble>
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
    </Container>
  );
};

export default ChatPage;