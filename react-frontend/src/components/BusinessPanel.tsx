import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BusinessProduct, Sale, Review, ABTestInfo, createABTestInfoFromJson } from '../types';
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

const HeaderCenter = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const LogoContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.grey[400]};
  border-radius: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.grey[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[100]};
    transform: translateY(-1px);
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

const WelcomeTitle = styled.h1`
  font-size: 40px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  line-height: 1.2;

  .highlight {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
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

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ViewAllButton = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ProductCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
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
  color: ${({ theme }) => theme.colors.primary};
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
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.primary : theme.colors.grey[400]};
  background-color: ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.onPrimary : theme.colors.grey[600]};
  border-radius: 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ variant, theme }) => 
      variant === 'primary' ? theme.colors.primaryVariant : theme.colors.grey[100]};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
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
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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
    loadProducts();
  }, []);

  const loadActiveTests = async () => {
    try {
      const tests = await getActiveABTests();
      const testsMap = new Map<string, ABTestInfo>();
      
      Object.entries(tests).forEach(([productId, testData]: [string, any]) => {
        testsMap.set(productId, createABTestInfoFromJson(testData));
      });
      
      setActiveTests(testsMap);
    } catch (error) {
      console.error('Failed to load active tests:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await fetch('http://localhost:8000/ecommerce_products?limit=10');
      const data = await response.json();
      
      // Convert EcommerceProduct to BusinessProduct format
      const businessProducts: BusinessProduct[] = data.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        rating: product.rating || 4.5,
        reviewCount: product.review_count || 100,
        salesCount: Math.floor(Math.random() * 1000) + 100 // Random sales count for demo
      }));
      
      setProducts(businessProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Fallback to hardcoded products if API fails
      setProducts([
        {
          id: 'dbce18d4-f2a7-4167-99cf-932bf508da73',
          name: 'Modern C Yan Sehpa - Siyah',
          description: 'Minimalist tasarımlı, koltuk yanına kolayca yerleştirilebilen C şeklinde yan sehpa.',
          rating: 4.7,
          reviewCount: 156,
          salesCount: 850,
        },
        {
          id: 'b8a872a5-48d9-4c5f-9da1-274c4ca52762',
          name: 'Ayarlanabilir Kucak Sehpası - Siyah',
          description: 'Yüksekliği ayarlanabilir, tekerlekli kucak sehpası. Laptop ve tablet kullanımı için ideal.',
          rating: 4.7,
          reviewCount: 234,
          salesCount: 650,
        },
        {
          id: '61261e6e-094f-4caa-af19-c1c8b2acd9db',
          name: 'Modern Orta Sehpa',
          description: 'Geniş tablalı, modern tasarımlı oturma odası orta sehpası.',
          rating: 4.7,
          reviewCount: 234,
          salesCount: 480,
        }
      ]);
    } finally {
      setIsLoadingProducts(false);
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
        <HeaderCenter>
          <LogoContainer>
            <LogoImage 
              src="/sezgi_logo-preview.png" 
              alt="Sezgi Logo"
            />
          </LogoContainer>
          <Title>Satıcı Paneli</Title>
        </HeaderCenter>
        <div style={{ width: '100px' }} /> {/* Spacer */}
      </Header>

      <Content>
        <WelcomeSection>
          <WelcomeTitle>
          <span className="highlight">Hoş Geldiniz!</span>
        </WelcomeTitle>
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
              <StatNumber>
                {averageRating.toFixed(1)}
                <svg style={{ width: '24px', height: '24px', marginLeft: '4px', display: 'inline-block' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </StatNumber>
              <StatLabel>Ortalama Puan</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{activeTestsCount}</StatNumber>
              <StatLabel>Aktif A/B Test</StatLabel>
            </StatCard>
          </StatsGrid>
        </WelcomeSection>

        <Section>
          <SectionHeader>
            <SectionTitle style={{ marginBottom: 0 }}>
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              Ürünleriniz
            </SectionTitle>
            <ViewAllButton onClick={() => console.log('Tümünü Gör clicked')}>
              &gt; Tümünü Gör
            </ViewAllButton>
          </SectionHeader>
          <ProductsGrid>
            {isLoadingProducts ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                Ürünler yükleniyor...
              </div>
            ) : (
              products.slice(0, 3).map(product => (
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
              ))
            )}
          </ProductsGrid>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '48px' }}>
          <Section>
            <SectionTitle>
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
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
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
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