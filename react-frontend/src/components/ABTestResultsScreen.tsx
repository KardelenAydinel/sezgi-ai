import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
// import { BusinessProduct } from '../types'; // Used in props interface

const Container = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary}40;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[50]};
  }
`;

const Content = styled.main`
  padding: ${({ theme }) => theme.spacing.lg};
  max-width: 1000px;
  margin: 0 auto;
`;

const ProductInfo = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const ProductName = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TestInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StatusBadge = styled.span<{ status: 'active' | 'completed' }>`
  background-color: ${({ status, theme }) => 
    status === 'active' ? theme.colors.primary : '#4CAF50'}20;
  color: ${({ status, theme }) => 
    status === 'active' ? theme.colors.primary : '#4CAF50'};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const OverviewSection = styled.section`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.grey[50]};
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const VariantsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const VariantCard = styled.div<{ isWinner?: boolean }>`
  border: 2px solid ${({ isWinner, theme }) => 
    isWinner ? '#4CAF50' : theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ isWinner, theme }) => 
    isWinner ? '#4CAF5010' : theme.colors.surface};
  position: relative;
`;

const VariantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const VariantTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const WinnerBadge = styled.span`
  background-color: #4CAF50;
  color: white;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const VariantContent = styled.div`
  background-color: ${({ theme }) => theme.colors.grey[50]};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
`;

const VariantText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.5;
  margin: 0;
`;

const VariantStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`;

const VariantStat = styled.div`
  text-align: center;
`;

const VariantStatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const VariantStatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  border-radius: 4px;
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const ProgressFill = styled.div<{ percentage: number; color?: string }>`
  width: ${({ percentage }) => percentage}%;
  height: 100%;
  background-color: ${({ color, theme }) => color || theme.colors.primary};
  transition: width 0.3s ease;
`;

const InsightsSection = styled.section`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const InsightCard = styled.div`
  background-color: ${({ theme }) => theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InsightText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.5;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ variant, theme }) => {
    if (variant === 'success') return '#4CAF50';
    if (variant === 'primary') return theme.colors.primary;
    return theme.colors.grey[300];
  }};
  background-color: ${({ variant, theme }) => {
    if (variant === 'success') return '#4CAF50';
    if (variant === 'primary') return theme.colors.primary;
    return 'transparent';
  }};
  color: ${({ variant, theme }) => {
    if (variant === 'success') return 'white';
    if (variant === 'primary') return theme.colors.onPrimary;
    return theme.colors.text.primary;
  }};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ variant, theme }) => {
      if (variant === 'success') return '#45a049';
      if (variant === 'primary') return theme.colors.primaryVariant;
      return theme.colors.grey[50];
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface TestResults {
  aImpressions: number;
  bImpressions: number;
  aClicks: number;
  bClicks: number;
  aConversions: number;
  bConversions: number;
  winner: 'A' | 'B' | null;
  confidence: number;
  daysRunning: number;
}

const ABTestResultsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, testField, aVariant, bVariant } = location.state || {};

  const [results, setResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in a real app, this would come from the API
  const mockResults = React.useMemo((): TestResults => ({
    aImpressions: 1250,
    bImpressions: 1183,
    aClicks: 89,
    bClicks: 142,
    aConversions: 12,
    bConversions: 23,
    winner: 'B',
    confidence: 94.2,
    daysRunning: 14,
  }), []);

  useEffect(() => {
    if (!product) {
      navigate('/business');
      return;
    }

    const loadResults = async () => {
      try {
        // In a real app, this would be an actual API call
        // const apiResults = await getABTestResults(product.id);
        
        // Simulate loading delay
        setTimeout(() => {
          setResults(mockResults);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading results:', error);
        setResults(mockResults); // Fallback to mock data
        setIsLoading(false);
      }
    };

    loadResults();
  }, [product, navigate, mockResults]);

  if (!product || isLoading) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate('/business')}>
            <span>←</span>
            <span>Geri</span>
          </BackButton>
          <Title>A/B Test Sonuçları</Title>
          <div style={{ width: '80px' }} />
        </Header>
        <Content>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Sonuçlar yükleniyor...</p>
          </div>
        </Content>
      </Container>
    );
  }

  if (!results) {
    return null;
  }

  const calculateCTR = (clicks: number, impressions: number) => {
    return impressions > 0 ? (clicks / impressions * 100).toFixed(2) : '0.00';
  };



  const aPerformance = (results.aClicks / results.aImpressions) * 100;
  const bPerformance = (results.bClicks / results.bImpressions) * 100;
  const performanceImprovement = ((bPerformance - aPerformance) / aPerformance * 100).toFixed(1);

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/business')}>
          <span>←</span>
          <span>Geri</span>
        </BackButton>
        <Title>A/B Test Sonuçları</Title>
        <div style={{ width: '80px' }} />
      </Header>

      <Content>
        <ProductInfo>
          <ProductName>{product.name}</ProductName>
          <TestInfo>
            <span>Test Alanı: <strong>{testField === 'title' ? 'Ürün Başlığı' : 'Ürün Açıklaması'}</strong></span>
            <StatusBadge status={results.confidence > 95 ? 'completed' : 'active'}>
              {results.confidence > 95 ? 'Tamamlandı' : 'Devam Ediyor'}
            </StatusBadge>
            <span>{results.daysRunning} gün</span>
          </TestInfo>
        </ProductInfo>

        <OverviewSection>
          <SectionTitle>
            <span>📊</span>
            Genel Bakış
          </SectionTitle>
          
          <StatsGrid>
            <StatCard>
              <StatNumber>{(results.aImpressions + results.bImpressions).toLocaleString()}</StatNumber>
              <StatLabel>Toplam Görüntülenme</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{(results.aClicks + results.bClicks)}</StatNumber>
              <StatLabel>Toplam Tıklama</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{(results.aConversions + results.bConversions)}</StatNumber>
              <StatLabel>Toplam Dönüşüm</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>%{results.confidence.toFixed(1)}</StatNumber>
              <StatLabel>Güven Seviyesi</StatLabel>
            </StatCard>
          </StatsGrid>
        </OverviewSection>

        <OverviewSection>
          <SectionTitle>
            <span>🏆</span>
            Varyant Karşılaştırması
          </SectionTitle>

          <VariantsGrid>
            <VariantCard isWinner={results.winner === 'A'}>
              <VariantHeader>
                <VariantTitle>A Varyantı (Mevcut)</VariantTitle>
                {results.winner === 'A' && <WinnerBadge>KAZANAN</WinnerBadge>}
              </VariantHeader>
              
              <VariantContent>
                <VariantText>{aVariant}</VariantText>
              </VariantContent>

              <VariantStats>
                <VariantStat>
                  <VariantStatNumber>{results.aImpressions.toLocaleString()}</VariantStatNumber>
                  <VariantStatLabel>Görüntülenme</VariantStatLabel>
                </VariantStat>
                <VariantStat>
                  <VariantStatNumber>{results.aClicks}</VariantStatNumber>
                  <VariantStatLabel>Tıklama</VariantStatLabel>
                </VariantStat>
              </VariantStats>

              <div>
                <small>Tıklama Oranı (CTR)</small>
                <ProgressBar>
                  <ProgressFill 
                    percentage={Math.min(aPerformance * 10, 100)} 
                    color={results.winner === 'A' ? '#4CAF50' : undefined}
                  />
                </ProgressBar>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  %{calculateCTR(results.aClicks, results.aImpressions)}
                </div>
              </div>
            </VariantCard>

            <VariantCard isWinner={results.winner === 'B'}>
              <VariantHeader>
                <VariantTitle>B Varyantı (Yeni)</VariantTitle>
                {results.winner === 'B' && <WinnerBadge>KAZANAN</WinnerBadge>}
              </VariantHeader>
              
              <VariantContent>
                <VariantText>{bVariant}</VariantText>
              </VariantContent>

              <VariantStats>
                <VariantStat>
                  <VariantStatNumber>{results.bImpressions.toLocaleString()}</VariantStatNumber>
                  <VariantStatLabel>Görüntülenme</VariantStatLabel>
                </VariantStat>
                <VariantStat>
                  <VariantStatNumber>{results.bClicks}</VariantStatNumber>
                  <VariantStatLabel>Tıklama</VariantStatLabel>
                </VariantStat>
              </VariantStats>

              <div>
                <small>Tıklama Oranı (CTR)</small>
                <ProgressBar>
                  <ProgressFill 
                    percentage={Math.min(bPerformance * 10, 100)} 
                    color={results.winner === 'B' ? '#4CAF50' : undefined}
                  />
                </ProgressBar>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  %{calculateCTR(results.bClicks, results.bImpressions)}
                </div>
              </div>
            </VariantCard>
          </VariantsGrid>
        </OverviewSection>

        <InsightsSection>
          <SectionTitle>
            <span>💡</span>
            Öneriler
          </SectionTitle>

          {results.winner === 'B' && (
            <InsightCard>
              <InsightText>
                <strong>Harika! B varyantı %{performanceImprovement} daha iyi performans gösteriyor.</strong><br />
                Bu değişikliği kalıcı hale getirmenizi öneririz. Benzer iyileştirmeleri diğer ürünlerinizde de deneyebilirsiniz.
              </InsightText>
            </InsightCard>
          )}

          {results.winner === 'A' && (
            <InsightCard>
              <InsightText>
                <strong>Mevcut versiyonunuz daha iyi performans gösteriyor.</strong><br />
                B varyantını revize ederek yeni bir test başlatmayı düşünebilirsiniz.
              </InsightText>
            </InsightCard>
          )}

          {!results.winner && (
            <InsightCard>
              <InsightText>
                <strong>Test henüz yeterli güven seviyesine ulaşmadı.</strong><br />
                Daha kesin sonuçlar için testin daha uzun süre çalışmasını bekleyin.
              </InsightText>
            </InsightCard>
          )}
        </InsightsSection>

        <ActionButtons>
          <Button variant="secondary" onClick={() => navigate('/business')}>
            Panel'e Dön
          </Button>
          {results.winner === 'B' && results.confidence > 95 && (
            <Button variant="success">
              B Varyantını Uygula
            </Button>
          )}
          <Button variant="primary">
            Yeni Test Başlat
          </Button>
        </ActionButtons>
      </Content>
    </Container>
  );
};

export default ABTestResultsScreen;