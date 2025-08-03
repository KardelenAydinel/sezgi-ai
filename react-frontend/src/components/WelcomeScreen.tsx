import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import ChatPage from './ChatPage';

// Animation keyframes
const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.grey[50]};
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

// Landing page wrapper with fade-out animation
const LandingWrapper = styled.div<{ isHiding: boolean }>`
  position: ${({ isHiding }) => isHiding ? 'absolute' : 'relative'};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: ${({ isHiding }) => isHiding ? fadeOut : 'none'} 0.2s ease-out forwards;
  pointer-events: ${({ isHiding }) => isHiding ? 'none' : 'auto'};
`;

// Chat wrapper with fade-in animation  
const ChatWrapper = styled.div<{ isShowing: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: ${({ isShowing }) => isShowing ? 'flex' : 'none'};
  flex-direction: column;
  animation: ${({ isShowing }) => isShowing ? fadeIn : 'none'} 0.2s ease-out 0.1s forwards;
  opacity: 0;
  
  ${({ isShowing }) => isShowing && `
    animation-fill-mode: forwards;
  `}
`;

// Bottom search bar with slide-up animation
const BottomSearchWrapper = styled.div<{ isShowing: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  padding: ${({ theme }) => theme.spacing.md};
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
  z-index: 1000;
  
  ${({ isShowing }) => isShowing && `
    transform: translateY(0);
  `}
`;

const BottomSearchContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  max-width: 600px;
  margin: 0 auto;
`;

const BottomSearchInput = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const BottomSearchButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryVariant};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RetryButton = styled.button`
  width: 100%;
  max-width: 400px;
  margin: ${({ theme }) => theme.spacing.lg} auto 0;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: transparent;
`;

const UserIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const BusinessLoginButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.colors.grey[400]};
  border-radius: 20px;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.grey[600]};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[100]};
  }

  .icon {
    font-size: 16px;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const LogoContainer = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 40px;
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LogoFallback = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 60px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  line-height: 1.2;

  .highlight {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.grey[600]};
  margin-bottom: 40px;
  max-width: 600px;
  line-height: 1.5;
`;

const SearchContainer = styled.div`
  width: 100%;
  max-width: 800px; //
  margin-bottom: 40px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px 16px 20px; // 2.5x bigger (was 16px 20px), extra right padding for send icon
  font-size: 15px; // 2.5x bigger (was 16px)
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 62.5px; // 2.5x bigger (was 25px)
  background-color: white;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[500]};
  }
`;

const SendButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 45px;
  height: 45px;
  background-color: white;
  color: ${({ theme }) => theme.colors.grey[500]};
  border: none;
  border-radius: 50%;
  font-size: 45px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[100]};
    color: ${({ theme }) => theme.colors.grey[600]};
    transform: translateY(-50%) scale(1.05);
  }

  &:disabled {
    opacity: 0.6;
    transform: translateY(-50%);
    cursor: not-allowed;
  }
`;

const ExampleSection = styled.section`
  width: 100%;
  max-width: 800px;
`;

const ExampleTitle = styled.h2`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ExampleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExampleCard = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const ExampleText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
`;

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [bottomSearchText, setBottomSearchText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBottomSearch, setShowBottomSearch] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  const handleSearch = () => {
    if (searchText.trim()) {
      setInitialMessage(searchText);
      setIsTransitioning(true);
      
      // Start fade-out animation
      setTimeout(() => {
        setShowChat(true);
      }, 500); // Wait for fade-out to complete
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setSearchText(exampleText);
    setInitialMessage(exampleText);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setShowChat(true);
    }, 500);
  };

  const handleRetrySearch = () => {
    setShowBottomSearch(true);
  };

  const handleBottomSearch = () => {
    if (bottomSearchText.trim()) {
      setInitialMessage(''); // Reset to allow re-triggering useEffect
      
      setTimeout(() => {
        setInitialMessage(bottomSearchText);
      }, 50); // Give React time to process state change
      
      setBottomSearchText('');
      setShowBottomSearch(false);
    }
  };

  const handleBusinessLogin = () => {
    navigate('/business');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBottomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBottomSearch();
    }
  };

  const examples = [
    "Rahat bir spor ayakkabısı arıyorum",
    "Vintage tarzda bir ceket önerir misin?",
    "Minimalist ev dekorasyonu için ürünler"
  ];

  return (
    <Container>
      {/* Landing Page */}
      <LandingWrapper isHiding={isTransitioning}>
        <Header>
          <UserIcon>
            <img src="/user_icon.svg" alt="User" style={{width: "100%", height: "100%", objectFit: "cover"}} />
          </UserIcon>
          <BusinessLoginButton onClick={handleBusinessLogin}>
            <span className="icon">🏢</span>
            <span>Satıcı Girişi</span>
          </BusinessLoginButton>
        </Header>

        <MainContent>
          <LogoContainer>
            <LogoImage 
              src="/sezgi_logo.jpeg" 
              alt="Sezgi Logo"
            />
            <LogoFallback style={{ display: 'none' }}>
              🖼️
            </LogoFallback>
          </LogoContainer>

          <Title>
            Aklındaki <span className="highlight">o şeyi</span> tarif et.
          </Title>

          <Subtitle>
            Adı dilinin ucunda, kendisi bir tık uzağında.
          </Subtitle>

          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Ne arıyorsunuz? (örn: rahat spor ayakkabısı)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <SendButton 
              onClick={handleSearch} 
              disabled={!searchText.trim()}
            >
              <img src="/search_logo.png" alt="Search" style={{width: "50%", height: "50%", opacity: 0.65}} />
            </SendButton>
          </SearchContainer>

          <ExampleSection>
            <ExampleGrid>
              {examples.map((example, index) => (
                <ExampleCard 
                  key={index} 
                  onClick={() => handleExampleClick(example)}
                >
                  <ExampleText>{example}</ExampleText>
                </ExampleCard>
              ))}
            </ExampleGrid>
          </ExampleSection>
        </MainContent>
      </LandingWrapper>

      {/* Chat Page */}
      <ChatWrapper isShowing={showChat}>
        <ChatPage initialMessage={initialMessage} />
        <RetryButton onClick={handleRetrySearch}>
          Hiçbiri değil, tekrar tarif edeyim
        </RetryButton>
      </ChatWrapper>

      {/* Bottom Search Bar */}
      <BottomSearchWrapper isShowing={showBottomSearch}>
        <BottomSearchContainer>
          <BottomSearchInput
            type="text"
            placeholder="Yeni arama yapmak için yazın..."
            value={bottomSearchText}
            onChange={(e) => setBottomSearchText(e.target.value)}
            onKeyPress={handleBottomKeyPress}
          />
          <BottomSearchButton 
            onClick={handleBottomSearch}
            disabled={!bottomSearchText.trim()}
          >
            Ara
          </BottomSearchButton>
        </BottomSearchContainer>
      </BottomSearchWrapper>
    </Container>
  );
};

export default WelcomeScreen;