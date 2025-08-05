import React, { useState, useEffect } from 'react';
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



const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  
`;

const HeaderLine = styled.div`
  width: 100%;
  height: 3px;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  margin-top: 0px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const HamburgerMenu = styled.button<{ isOpen: boolean }>`
  width: 32px;
  height: 32px;
  background-color: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1001;
  position: relative;

  &:hover {
    opacity: 0.7;
  }

  .line {
    width: 20px;
    height: 1.5px;
    background-color: ${({ theme }) => theme.colors.grey[400]};
    border-radius: 1px;
    transition: all 0.3s ease;
  }
`;

const SideMenuOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${({ isOpen }) => isOpen ? 1 : 0};
  visibility: ${({ isOpen }) => isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const SideMenu = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform: translateX(${({ isOpen }) => isOpen ? '0' : '-100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const SideMenuHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[200]};
  
  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const SideMenuContent = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const SideMenuItem = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[100]};
  }

  .icon {
    font-size: 20px;
    width: 24px;
    text-align: center;
  }
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
  margin-top: 5px;
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
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const Footer = styled.footer`
  padding: 0;
  text-align: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.grey[500]};
`;

// box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
const LogoContainer = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 60px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin-top: -79px;
  margin-bottom: 40px;
  background-color: ${({ theme }) => theme.colors.grey[50]};
  position: relative;
  z-index: 1;
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
  font-size: 40px;
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
  margin-top: 5px;
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
    transition: opacity 0.1s ease;
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
  position: relative;

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

const TrendingIcon = styled.img`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
`;

// How It Works Section Styles
const HowItWorksSection = styled.section`
  width: 100%;
  margin: 20px -${({ theme }) => theme.spacing.lg} 0;
  padding: 15px ${({ theme }) => theme.spacing.lg};
  background-color: #F9F9F9;
`;

const HowItWorksTitle = styled.h2`
  font-size: 22px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  text-align: center;
  margin-bottom: 20px;
  margin-top: 5px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StepsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 35px;
    left: calc(16.66% + 20px);
    right: calc(16.66% + 20px);
    height: 1px;
    background: repeating-linear-gradient(
      to right,
      ${({ theme }) => theme.colors.grey[400]} 0,
      ${({ theme }) => theme.colors.grey[400]} 8px,
      transparent 8px,
      transparent 16px
    );
    z-index: 0;
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const StepCard = styled.div`
  flex: 1;
  position: relative;
  padding: 10px 8px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  z-index: 1;
`;

const StepIconContainer = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  /* Beyaz arka plan üzerine gradient ekle - dash'lerin arkasında kalmaması için */
  background: 
    linear-gradient(135deg, ${({ theme }) => theme.colors.primary}20, ${({ theme }) => theme.colors.primary}10),
    white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10; /* Dash çizgilerinin üstünde kalması için z-index artırıldı */
`;

const StepTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  text-align: center;
`;

const StepDescription = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.grey[600]};
  line-height: 1.4;
  margin: 0;
  text-align: center;
  max-width: 200px;
`;

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const placeholderExamples = [
    "Prize takılan gece lambası...",
    "Fayans arasına sürülen şey...", 
    "Yekpare çerçeveli günlük spor gözlük...",
    "Duvara asılan örgü saksı tutucu...",
    "Taş fırın lezzeti veren fırın tepsisi...",
  ];

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

  const handleBusinessLogin = () => {
    navigate('/business');
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (item: string) => {
    console.log(`${item} tıklandı`);
    setIsMenuOpen(false);
    // TODO: Add specific functionality for each menu item
  };

  const handleOverlayClick = () => {
    setIsMenuOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Placeholder animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % placeholderExamples.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [placeholderExamples.length]);

  const examples = [
    "çekilebilen, ayakları koltuğun altına giren sehpa",
    "fayans arasına sürülen dolgu",
    "saçımı tepede topuz yapan o sünger halka"
  ];

  return (
    <Container>
      {/* Side Menu Overlay */}
      <SideMenuOverlay isOpen={isMenuOpen} onClick={handleOverlayClick} />
      
      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen}>
        <SideMenuHeader>
          {/*<h3>Menü</h3>*/}
        </SideMenuHeader>
        <SideMenuContent>
          <SideMenuItem onClick={() => handleMenuItemClick('Kullanıcı Hesabım')}>
            <span className="icon"></span>
            <span>Kullanıcı Hesabım</span>
          </SideMenuItem>
          <SideMenuItem onClick={() => handleMenuItemClick('Favorilerim')}>
            <span className="icon"></span>
            <span>Favorilerim</span>
          </SideMenuItem>
          <SideMenuItem onClick={() => handleMenuItemClick('Sepetim')}>
            <span className="icon"></span>
            <span>Sepetim</span>
          </SideMenuItem>
        </SideMenuContent>
      </SideMenu>

      {/* Landing Page */}
      <LandingWrapper isHiding={isTransitioning}>
        <Header>
          <HamburgerMenu isOpen={isMenuOpen} onClick={handleMenuClick}>
            <div className="line"></div>
            <div className="line"></div>
            <div className="line"></div>
          </HamburgerMenu>
          <BusinessLoginButton onClick={handleBusinessLogin}>
            <span className="icon">🏢</span>
            <span>Satıcı Girişi</span>
          </BusinessLoginButton>
        </Header>
        
        <HeaderLine />

        <MainContent>
          <LogoContainer>
            <LogoImage 
              src="/sezgi_logo-preview.png" 
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
            Adı dilinin ucunda, Sezgi ile bir tık uzağında.
          </Subtitle>

          <SearchContainer>
            <SearchInput
              type="text"
              placeholder={placeholderExamples[currentPlaceholderIndex]}
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
                  <TrendingIcon src="/trending_up.svg" alt="Trending" />
                  <ExampleText>{example}</ExampleText>
                </ExampleCard>
              ))}
            </ExampleGrid>
          </ExampleSection>

          <HowItWorksSection>
            <StepsContainer>
              <StepCard>
                <StepIconContainer>
                  💭
                </StepIconContainer>
                <StepTitle>Tarif Et</StepTitle>
                <StepDescription>
                  Aklındaki 'o şey'i, sanki bir arkadaşına anlatır gibi, birkaç kelimeyle yaz.
                </StepDescription>
              </StepCard>

              <StepCard>
                <StepIconContainer>
                  🎯
                </StepIconContainer>
                <StepTitle>Onayla</StepTitle>
                <StepDescription>
                  Sezgi'nin senin için bulduğu ve resmettiği kavramlardan doğru olanı tek bir tıkla seç.
                </StepDescription>
              </StepCard>

              <StepCard>
                <StepIconContainer>
                  ✨
                </StepIconContainer>
                <StepTitle>Keşfet</StepTitle>
                <StepDescription>
                  Artık adını bildiğin o ürünün en iyi alternatiflerini anında karşına getirelim.
                </StepDescription>
              </StepCard>
            </StepsContainer>
          </HowItWorksSection>
        </MainContent>
        <Footer>
          © 2025 Sezgi
        </Footer>
      </LandingWrapper>

      {/* Chat Page */}
      <ChatWrapper isShowing={showChat}>
        <ChatPage initialMessage={initialMessage} />
      </ChatWrapper>
    </Container>
  );
};

export default WelcomeScreen;