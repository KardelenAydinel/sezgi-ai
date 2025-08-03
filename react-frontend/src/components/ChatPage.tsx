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

const MessageWrapper = styled.div<{ sender: Sender }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ sender }) => (sender === Sender.USER ? 'flex-end' : 'flex-start')};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const MessageBubble = styled.div<{ sender: Sender }>`
  max-width: 70%;
  width: fit-content; // Adjust width to content size
  min-width: 60px; // Minimum width for very short messages
  background-color: ${({ sender, theme }) =>
    sender === Sender.USER ? theme.colors.primary : theme.colors.grey[200]};
  color: ${({ sender, theme }) =>
    sender === Sender.USER ? theme.colors.onPrimary : theme.colors.text.primary};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
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

const RetryButton = styled.button`
  width: 100%;
  max-width: 400px;
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
  }
`;

const SearchBarContainer = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SearchInput = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  outline: none;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}DD;
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.grey[400]};
    cursor: not-allowed;
  }
`;

const CloseSearchButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  border: 2px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[200]};
  }
`;



interface ChatPageProps {
  initialMessage?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [hiddenRetryButtons, setHiddenRetryButtons] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const el = messagesContainerRef.current;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    setIsUserAtBottom(atBottom);
  };

  useEffect(() => {
    if (isUserAtBottom) {
      scrollToBottom();
    }
    messagesRef.current = messages;
  }, [messages, isUserAtBottom]);

  const sendMessage = useCallback(async (text: string) => {
    const textToSend = text.trim();
    if (!textToSend) return;

    const userMessage: ChatMessage = {
      sender: Sender.USER,
      text: textToSend,
    };

    const messagesWithUser = [...messagesRef.current, userMessage];
    setMessages(messagesWithUser);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(textToSend);
      
      const llmMessage: ChatMessage = {
        sender: Sender.LLM,
        text: response.response,
        products: response.products,
        searchResults: response.search_results,
        tagResult: response.tag_result,
      };
      setMessages([...messagesWithUser, llmMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        sender: Sender.LLM,
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      };
      setMessages([...messagesWithUser, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      sendMessage(initialMessage);
    }
  }, [initialMessage, messages.length, sendMessage]);

  const handleShowSimilar = async (productName: string, productDescription?: string) => {
    setIsLoading(true);
    
    try {
      // Use agentic AI workflow: tag generation → cosine similarity search
      const similarProducts = await findSimilarProducts(productName, productDescription);
      
      // Add a new message with similar products
      const similarMessage: ChatMessage = {
        sender: Sender.LLM,
                content: (
          <>
            <span style={{ color: '#FFA500' }}>Alışveriş Sitesi</span>'nden istediğin ürünleri getirdim. <strong>{productName}</strong> ürününe benzer {similarProducts.length} ürün bulundu:
          </>
        ),
        products: similarProducts,
        fromDatabase: true,
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

  const handleRetrySearch = (messageIndex: number) => {
    setHiddenRetryButtons(prev => {
      const newSet = new Set(prev);
      newSet.add(messageIndex);
      return newSet;
    });
    setShowSearchBar(true);
    setSearchQuery('');
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      sendMessage(searchQuery.trim());
      setShowSearchBar(false);
      setSearchQuery('');
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleCloseSearch = () => {
    setShowSearchBar(false);
    setSearchQuery('');
  };




  const renderMessage = (message: ChatMessage, index: number) => (
    <MessageWrapper key={index} sender={message.sender}>
      <MessageBubble sender={message.sender}>
        {message.content ? (
          <div>{message.content}</div>
        ) : (
          message.text && <ReactMarkdown>{message.text}</ReactMarkdown>
        )}
      </MessageBubble>

      {message.products && message.products.length > 0 && (
        <>
          <ProductsBubble>
            <ProductsContainer>
              {message.products.map((product, idx) => (
                <ProductCard 
                  key={idx} 
                  product={product}
                  onShowSimilar={message.fromDatabase ? undefined : handleShowSimilar}
                />
              ))}
            </ProductsContainer>
          </ProductsBubble>
          {message.sender === Sender.LLM && !hiddenRetryButtons.has(index) && (
            <RetryButton onClick={() => handleRetrySearch(index)}>
              Hiçbiri değil, tekrar tarif edeyim
            </RetryButton>
          )}
        </>
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
    </MessageWrapper>
  );

  return (
    <Container>
      <MessagesContainer ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.map(renderMessage)}
        {isLoading && (
          <LoadingIndicator>
            <span>🤖</span>
            <span>Düşünüyorum...</span>
          </LoadingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {showSearchBar && (
        <SearchBarContainer>
          <SearchInput
            type="text"
            placeholder="Ürününüzü yeniden tarif edin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            autoFocus
          />
          <SearchButton 
            onClick={handleSearchSubmit}
            disabled={!searchQuery.trim()}
          >
            Ara
          </SearchButton>
          <CloseSearchButton onClick={handleCloseSearch}>
            ✕
          </CloseSearchButton>
        </SearchBarContainer>
      )}
    </Container>
  );
};

export default ChatPage;