import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Sender } from '../types';
import { sendChatMessage, sendChatMessageTwoPhase, sendImageWithMessage, findSimilarProducts } from '../services/api';
import ProductCard from './ProductCard';
import EcommerceProductCard from './EcommerceProductCard';
import DatabaseProductCarousel from './DatabaseProductCarousel';

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
  margin-bottom: 60px; // RetryButton için yeterli alan bırak (button height + spacing)
  position: relative; // RetryButton'ın absolute positioning için gerekli
`;

const ProductsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  flex-wrap: nowrap;
  justify-content: space-between;
  
  /* Kartlar geldiğinde smooth reveal animasyonu */
  animation: fadeInUp 0.6s ease-out;
  
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
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

// Ghost Card Components
const GhostCard = styled.div`
  width: 180px;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;
  overflow: hidden;
  
  /* Shimmer animasyonu için base */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: shimmer 1.5s infinite;
    z-index: 1;
  }
  
  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
`;

const GhostImage = styled.div`
  width: 100%;
  height: 120px;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  animation: pulse 1.5s ease-in-out infinite alternate;
  
  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }
`;

const GhostTitle = styled.div`
  height: 16px;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  border-radius: 4px;
  width: 80%;
  animation: pulse 1.5s ease-in-out infinite alternate;
`;

const GhostDescription = styled.div`
  height: 12px;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  border-radius: 4px;
  width: 100%;
  margin-bottom: 4px;
  animation: pulse 1.5s ease-in-out infinite alternate;
  
  &:last-child {
    width: 60%;
  }
`;

const GhostPrice = styled.div`
  height: 14px;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  border-radius: 4px;
  width: 50%;
  margin-top: 8px;
  animation: pulse 1.5s ease-in-out infinite alternate;
`;

const GhostProductsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  flex-wrap: nowrap;
  justify-content: space-between;
`;

const RetryButton = styled.button`
  width: auto;
  max-width: 200px; // %50 küçültüldü (400px -> 200px)
  padding: ${({ theme }) => theme.spacing.sm}; // Padding azaltıldı
  background-color: rgba(255, 255, 255, 0.9); // Hafif saydam beyaz arkaplan
  color: ${({ theme }) => theme.colors.grey[600]}; // Gri renk
  border: 2px solid ${({ theme }) => theme.colors.grey[400]}; // Gri border
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  position: absolute; // Absolute positioning
  left: 50%; // Baloncuğun genişliğinin yarısı (dinamik)
  top: 100%; // Baloncuğun altında konumlandır
  transform: translate(-50%, 0.5rem); // Yatayda ortala, dikeyde biraz aşağı kaydır
  z-index: 10; // Üstte görünmesi için
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[100]};
    color: ${({ theme }) => theme.colors.grey[700]};
    border-color: ${({ theme }) => theme.colors.grey[500]};
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
  const [expectedProductCount, setExpectedProductCount] = useState(0); // Ghost cards sayısı
  const [showGhostCards, setShowGhostCards] = useState(false); // Ghost cards gösterilsin mi?
  const [loadingMessage, setLoadingMessage] = useState('🔎 Harika, ipuçlarını birleştiriyorum...'); // Dynamic loading message


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
    setShowGhostCards(false); // Reset ghost cards
    setLoadingMessage('🔎 Harika, ipuçlarını birleştiriyorum...'); // Reset loading message

    try {
      // Use two-phase API with ghost cards callback
      const response = await sendChatMessageTwoPhase(textToSend, (ghostCardCount) => {
        // Phase 1 completed: Show ghost cards immediately and update message
        console.log(`[GHOST_CARDS] Showing ${ghostCardCount} ghost cards`);
        setExpectedProductCount(ghostCardCount);
        setShowGhostCards(true);
        setLoadingMessage('🎨 Aradığın ürünleri görselleştiriyorum, birkaç saniye sürebilir.');
      });
      
      const llmMessage: ChatMessage = {
        sender: Sender.LLM,
        text: response.response,
        products: response.products,
        searchResults: response.search_results,
        tagResult: response.tag_result,
        numberOfCards: response.number_of_cards,
      };
      
      // Ghost cards'ı gizle ve gerçek mesajı göster
      setShowGhostCards(false);
      setMessages([...messagesWithUser, llmMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setShowGhostCards(false); // Hata durumunda ghost cards'ı gizle
      setLoadingMessage('🔎 Harika, ipuçlarını birleştiriyorum...'); // Reset loading message on error
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
    setShowGhostCards(false); // Similar products için ghost cards gerekmiyor
    setLoadingMessage('Benzer ürünler aranıyor...'); // Different message for similar products
    
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

  // Ghost Cards render fonksiyonu
  const renderGhostCards = (count: number) => {
    return (
      <ProductsBubble>
        <GhostProductsContainer>
          {Array.from({ length: count }, (_, index) => (
            <GhostCard key={`ghost-${index}`}>
              <GhostImage />
              <GhostTitle />
              <GhostDescription />
              <GhostDescription />
              <GhostPrice />
            </GhostCard>
          ))}
        </GhostProductsContainer>
      </ProductsBubble>
    );
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
          {message.fromDatabase ? (
            // Database ürünleri için carousel kullan - bubble dışında
            <DatabaseProductCarousel 
              products={message.products}
              onSeeAll={() => {
                // Tümünü gör fonksiyonu - şimdilik console log
                console.log('Tüm database ürünlerini göster');
              }}
            />
          ) : (
            // AI generated ürünler için mevcut layout - bubble içinde
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
              {message.sender === Sender.LLM && (
                <RetryButton onClick={() => handleRetrySearch(index)}>
                  Hiçbiri değil, tekrar tarif edeyim
                </RetryButton>
              )}
            </ProductsBubble>
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
          <MessageWrapper sender={Sender.LLM}>
            <LoadingIndicator>
              <span></span>
              <span>{loadingMessage}</span>
            </LoadingIndicator>
            {showGhostCards && renderGhostCards(expectedProductCount)}
          </MessageWrapper>
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
            <img src="/search_logo.png" alt="Search" style={{width: "100%", height: "100%", opacity: 0.65}} />
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