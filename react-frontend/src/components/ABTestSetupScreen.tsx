import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { BusinessProduct } from '../types';
import { startABTest } from '../services/api';

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
  max-width: 800px;
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

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

const FormSection = styled.section`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
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

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  background-color: ${({ theme }) => theme.colors.surface};
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-family: inherit;
  background-color: ${({ theme }) => theme.colors.surface};
  resize: vertical;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const VariantContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`;

const VariantCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.grey[50]};
`;

const VariantLabel = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const InfoBox = styled.div`
  background-color: ${({ theme }) => theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const InfoText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.5;
  margin: 0;

  strong {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.grey[200]};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.primary : theme.colors.grey[300]};
  background-color: ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.onPrimary : theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ variant, theme }) => 
      variant === 'primary' ? theme.colors.primaryVariant : theme.colors.grey[50]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error}10;
  border: 1px solid ${({ theme }) => theme.colors.error}30;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ABTestSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product as BusinessProduct;

  const [testField, setTestField] = useState<string>('title');
  const [aVariant, setAVariant] = useState<string>('');
  const [bVariant, setBVariant] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Redirect if no product is provided
  React.useEffect(() => {
    if (!product) {
      navigate('/business');
    }
  }, [product, navigate]);

  // Pre-fill variants based on current product data
  React.useEffect(() => {
    if (product && testField === 'title') {
      setAVariant(product.name);
      setBVariant('');
    } else if (product && testField === 'description') {
      setAVariant(product.description);
      setBVariant('');
    }
  }, [testField, product]);

  if (!product) {
    return null;
  }

  const handleStartTest = async () => {
    if (!aVariant.trim() || !bVariant.trim()) {
      setError('Lütfen her iki varyant için de içerik girin.');
      return;
    }

    if (aVariant.trim() === bVariant.trim()) {
      setError('A ve B varyantları farklı olmalıdır.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await startABTest({
        product_id: product.id,
        test_field: testField,
        a_variant: aVariant.trim(),
        b_variant: bVariant.trim(),
        start_date: new Date().toISOString(),
      });

      // Navigate to results page
      navigate('/ab-test-results', {
        state: {
          product,
          testField,
          aVariant: aVariant.trim(),
          bVariant: bVariant.trim(),
        }
      });
    } catch (error) {
      console.error('Error starting A/B test:', error);
      setError('A/B test başlatılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/business');
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={handleCancel}>
          <span>←</span>
          <span>Geri</span>
        </BackButton>
        <Title>A/B Test Kurulumu</Title>
        <div style={{ width: '80px' }} /> {/* Spacer */}
      </Header>

      <Content>
        <ProductInfo>
          <ProductName>{product.name}</ProductName>
          <ProductDescription>{product.description}</ProductDescription>
        </ProductInfo>

        <InfoBox>
          <InfoText>
            <strong>A/B Testing Nedir?</strong><br />
            A/B testing, ürününüzün farklı versiyonlarını müşterilere göstererek 
            hangisinin daha iyi performans gösterdiğini ölçmenizi sağlar. 
            Bu sayede daha fazla satış ve müşteri memnuniyeti elde edebilirsiniz.
          </InfoText>
        </InfoBox>

        <FormSection>
          <SectionTitle>
            <span>🧪</span>
            Test Ayarları
          </SectionTitle>

          <FormGroup>
            <Label htmlFor="testField">Test Edilecek Alan</Label>
            <Select
              id="testField"
              value={testField}
              onChange={(e) => setTestField(e.target.value)}
            >
              <option value="title">Ürün Başlığı</option>
              <option value="description">Ürün Açıklaması</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Varyantlar</Label>
            <VariantContainer>
              <VariantCard>
                <VariantLabel>A Varyantı (Mevcut)</VariantLabel>
                <TextArea
                  value={aVariant}
                  onChange={(e) => setAVariant(e.target.value)}
                  placeholder={testField === 'title' ? 'Mevcut ürün başlığı' : 'Mevcut ürün açıklaması'}
                />
              </VariantCard>
              
              <VariantCard>
                <VariantLabel>B Varyantı (Yeni)</VariantLabel>
                <TextArea
                  value={bVariant}
                  onChange={(e) => setBVariant(e.target.value)}
                  placeholder={testField === 'title' ? 'Yeni ürün başlığı' : 'Yeni ürün açıklaması'}
                />
              </VariantCard>
            </VariantContainer>
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <InfoBox>
            <InfoText>
              <strong>Önemli:</strong> Test en az 7 gün sürmeli ve her varyant 
              minimum 100 görüntülenme almalıdır. Anlamlı sonuçlar için sabırlı olun.
            </InfoText>
          </InfoBox>

          <ActionButtons>
            <Button variant="secondary" onClick={handleCancel}>
              İptal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleStartTest}
              disabled={isLoading || !aVariant.trim() || !bVariant.trim()}
            >
              {isLoading ? 'Başlatılıyor...' : 'Testi Başlat'}
            </Button>
          </ActionButtons>
        </FormSection>
      </Content>
    </Container>
  );
};

export default ABTestSetupScreen;