import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BusinessProduct, Sale, Review, ABTestInfo } from '../types';
import { getActiveABTests } from '../services/api';

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
  padding: ${({ theme }) => theme.spacing.md};
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}20, ${({ theme }) => theme.colors.primary}10);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const WelcomeTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xxxl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ProductCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const ProductName = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.4;
`;

const ProductStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Stars = styled.span`
  color: #FFA726;
`;

const SalesCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.primary : theme.colors.grey[300]};
  background-color: ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.onPrimary : theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ variant, theme }) => 
      variant === 'primary' ? theme.colors.primaryVariant : theme.colors.grey[50]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ABTestBadge = styled.div`
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: inline-block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const RecentActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ActivityCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ActivityInfo = styled.div`
  flex: 1;
`;

const ActivityName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ActivityDetail = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ActivityTime = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: right;
`;

const BusinessPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTests, setActiveTests] = useState<Map<string, ABTestInfo>>(new Map());

  // Sample data (in a real app, this would come from an API)
  const products: BusinessProduct[] = [
    {
      id: '1',
      name: 'Premium Bluetooth Kulaklık',
      description: 'Aktif gürültü önleme özellikli premium bluetooth kulaklık',
      rating: 4.7,
      reviewCount: 345,
      salesCount: 1250,
    },
    {
      id: '2',
      name: 'Sport Bluetooth Kulaklık',
      description: 'Ter ve su dirençli spor bluetooth kulaklık',
      rating: 4.6,
      reviewCount: 289,
      salesCount: 850,
    },
    {
      id: '3',
      name: 'Gaming Kulaklık',
      description: 'Profesyonel oyuncular için tasarlanmış kablolu gaming kulaklık',
      rating: 4.8,
      reviewCount: 456,
      salesCount: 650,
    },
  ];

  const recentSales: Sale[] = [
    { productName: 'Premium Bluetooth Kulaklık', amount: 899.90, date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { productName: 'Sport Bluetooth Kulaklık', amount: 449.90, date: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { productName: 'Gaming Kulaklık', amount: 699.90, date: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  ];

  const recentReviews: Review[] = [
    { productName: 'Premium Bluetooth Kulaklık', rating: 5, comment: 'Harika ses kalitesi!', date: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    { productName: 'Sport Bluetooth Kulaklık', rating: 4, comment: 'Spor için ideal', date: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { productName: 'Gaming Kulaklık', rating: 5, comment: 'Oyun deneyimi mükemmel', date: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  ];

  useEffect(() => {
    loadActiveTests();
  }, []);

  const loadActiveTests = async () => {
    try {
      const tests = await getActiveABTests();
      const testsMap = new Map();
      tests.forEach(test => {
        // Assuming the API returns tests with product IDs
        testsMap.set('1', test); // This would need proper mapping in a real app
      });
      setActiveTests(testsMap);
    } catch (error) {
      console.error('Error loading A/B tests:', error);
    }
  };

  const handleABTestSetup = (product: BusinessProduct) => {
    navigate('/ab-test-setup', { state: { product } });
  };

  const handleViewResults = (product: BusinessProduct) => {
    const test = activeTests.get(product.id);
    if (test) {
      navigate('/ab-test-results', { 
        state: { 
          product, 
          testField: test.testField,
          aVariant: test.aVariant,
          bVariant: test.bVariant 
        } 
      });
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Az önce';
    if (diffHours === 1) return '1 saat önce';
    return `${diffHours} saat önce`;
  };

  const totalSales = recentSales.reduce((sum, sale) => sum + sale.amount, 0);
  const averageRating = products.reduce((sum, product) => sum + product.rating, 0) / products.length;
  const totalProducts = products.length;
  const activeTestsCount = activeTests.size;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          <span>←</span>
          <span>Ana Sayfa</span>
        </BackButton>
        <Title>Satıcı Paneli</Title>
        <div style={{ width: '100px' }} /> {/* Spacer */}
      </Header>

      <Content>
        <WelcomeSection>
          <WelcomeTitle>Hoş Geldiniz! 👋</WelcomeTitle>
          <WelcomeSubtitle>
            İşletmenizi büyütün ve müşteri deneyimini iyileştirin
          </WelcomeSubtitle>
          
          <StatsGrid>
            <StatCard>
              <StatNumber>{totalProducts}</StatNumber>
              <StatLabel>Aktif Ürün</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>₺{totalSales.toFixed(0)}</StatNumber>
              <StatLabel>Günlük Satış</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{averageRating.toFixed(1)}⭐</StatNumber>
              <StatLabel>Ortalama Puan</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{activeTestsCount}</StatNumber>
              <StatLabel>Aktif A/B Test</StatLabel>
            </StatCard>
          </StatsGrid>
        </WelcomeSection>

        <Section>
          <SectionTitle>
            <span>📦</span>
            Ürünleriniz
          </SectionTitle>
          <ProductsGrid>
            {products.map(product => (
              <ProductCard key={product.id}>
                {activeTests.has(product.id) && (
                  <ABTestBadge>A/B Test Aktif</ABTestBadge>
                )}
                
                <ProductName>{product.name}</ProductName>
                <ProductDescription>{product.description}</ProductDescription>
                
                <ProductStats>
                  <RatingContainer>
                    <Stars>{renderStars(product.rating)}</Stars>
                    <span>{product.rating} ({product.reviewCount})</span>
                  </RatingContainer>
                  <SalesCount>{product.salesCount} satış</SalesCount>
                </ProductStats>

                <ActionButtons>
                  {activeTests.has(product.id) ? (
                    <Button 
                      variant="primary" 
                      onClick={() => handleViewResults(product)}
                    >
                      Sonuçları Gör
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      onClick={() => handleABTestSetup(product)}
                    >
                      A/B Test Başlat
                    </Button>
                  )}
                  <Button variant="secondary">Düzenle</Button>
                </ActionButtons>
              </ProductCard>
            ))}
          </ProductsGrid>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <Section>
            <SectionTitle>
              <span>💰</span>
              Son Satışlar
            </SectionTitle>
            <RecentActivityList>
              {recentSales.map((sale, index) => (
                <ActivityCard key={index}>
                  <ActivityInfo>
                    <ActivityName>{sale.productName}</ActivityName>
                    <ActivityDetail>₺{sale.amount.toFixed(2)}</ActivityDetail>
                  </ActivityInfo>
                  <ActivityTime>{formatTimeAgo(sale.date)}</ActivityTime>
                </ActivityCard>
              ))}
            </RecentActivityList>
          </Section>

          <Section>
            <SectionTitle>
              <span>⭐</span>
              Son Değerlendirmeler
            </SectionTitle>
            <RecentActivityList>
              {recentReviews.map((review, index) => (
                <ActivityCard key={index}>
                  <ActivityInfo>
                    <ActivityName>{review.productName}</ActivityName>
                    <ActivityDetail>
                      {renderStars(review.rating)} "{review.comment}"
                    </ActivityDetail>
                  </ActivityInfo>
                  <ActivityTime>{formatTimeAgo(review.date)}</ActivityTime>
                </ActivityCard>
              ))}
            </RecentActivityList>
          </Section>
        </div>
      </Content>
    </Container>
  );
};

export default BusinessPanel;