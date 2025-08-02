import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.grey[50]};
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: transparent;
`;

const UserIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
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
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  line-height: 1.2;

  .highlight {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.grey[600]};
  margin-bottom: 40px;
  max-width: 600px;
  line-height: 1.5;
`;

const SearchContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin-bottom: 40px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  font-size: 16px;
  border: 2px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 25px;
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

const SearchButton = styled.button`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: 12px 24px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 25px;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryVariant};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:disabled {
    opacity: 0.6;
    transform: none;
    box-shadow: ${({ theme }) => theme.shadows.sm};
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

  const handleSearch = () => {
    if (searchText.trim()) {
      navigate('/chat', { state: { initialMessage: searchText } });
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setSearchText(exampleText);
    navigate('/chat', { state: { initialMessage: exampleText } });
  };

  const handleBusinessLogin = () => {
    navigate('/business');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const examples = [
    "Rahat bir spor ayakkabısı arıyorum",
    "Vintage tarzda bir ceket önerir misin?",
    "Minimalist ev dekorasyonu için ürünler",
    "Doğal malzemeli cilt bakım ürünleri",
    "Çalışma masası için ergonomik sandalye",
    "Seyahat için pratik bavul modelleri"
  ];

  return (
    <Container>
      <Header>
        <UserIcon>👤</UserIcon>
        <BusinessLoginButton onClick={handleBusinessLogin}>
          <span className="icon">🏢</span>
          <span>Satıcı Girişi</span>
        </BusinessLoginButton>
      </Header>

      <MainContent>
        <LogoContainer>
          <LogoImage 
            src="/assets/logo.jpeg" 
            alt="Logo"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <LogoFallback style={{ display: 'none' }}>
            🖼️
          </LogoFallback>
        </LogoContainer>

        <Title>
          <span className="highlight">Görsel</span> Alışveriş Asistanı
        </Title>

        <Subtitle>
          Aradığınız ürünü tarif edin, size en uygun seçenekleri bulalım. 
          Yapay zeka destekli kişisel alışveriş deneyimi.
        </Subtitle>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Ne arıyorsunuz? (örn: rahat spor ayakkabısı)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <SearchButton 
            onClick={handleSearch} 
            disabled={!searchText.trim()}
          >
            Ara
          </SearchButton>
        </SearchContainer>

        <ExampleSection>
          <ExampleTitle>Örnek Aramalar</ExampleTitle>
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
    </Container>
  );
};

export default WelcomeScreen;