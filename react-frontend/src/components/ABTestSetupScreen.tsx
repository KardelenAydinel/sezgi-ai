import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { BusinessProduct } from '../types';
import { startABTest, getABTestAISuggestion, ABTestSuggestionRequest } from '../services/api';

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
  padding-right: calc(${({ theme }) => theme.spacing.md} + 30px);
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  background-color: ${({ theme }) => theme.colors.surface};
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
  background-repeat: no-repeat;
  background-position: right calc(${({ theme }) => theme.spacing.md} + 5px) center;
  background-size: 12px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
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
  position: relative;
`;

const InfoBox = styled.div`
  background-color: ${({ theme }) => theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[200]};
    color: ${({ theme }) => theme.colors.text.primary};
  }
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

const AIButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${({ theme }) => theme.spacing.sm};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}20;
    border-color: ${({ theme }) => theme.colors.primary}50;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DisabledOverlay = styled.div`
  position: relative;
  cursor: not-allowed;
  display: inline-block;
  font-size: 0;
  line-height: 0;
  width: 100%;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(230, 230, 230, 0.4);
    border-radius: ${({ theme }) => theme.borderRadius.md};
    z-index: 1;
    box-sizing: border-box;
  }
`;

const VariantHelperText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.sm};
  text-align: center;
  line-height: 1.4;
`;

const TooltipContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: inline-block;
`;

const InfoIcon = styled.img`
  width: 16px;
  height: 16px;
  cursor: help;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.text.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  max-width: 300px;
  white-space: normal;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.text.primary};
  }

  ${TooltipContainer}:hover & {
    opacity: 1;
    visibility: visible;
  }
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
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestionResult, setAiSuggestionResult] = useState<string>('');
  const [showInfoBox, setShowInfoBox] = useState(true);

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

  const handleAIGenerate = async () => {
    if (!product || !aVariant.trim()) {
      setError('Önce A varyantını doldurmalısınız.');
      return;
    }

    setIsAILoading(true);
    setAiSuggestionResult('');
    setError('');

    try {
      const request: ABTestSuggestionRequest = {
        product_id: product.id,
        current_text: aVariant.trim(),
        test_field: testField
      };

      const response = await getABTestAISuggestion(request);
      
      // Set the AI suggestion as the B variant
      setBVariant(response.suggestion);
      setAiSuggestionResult(`AI Önerisi: ${response.reasoning} (Güven: ${Math.round(response.confidence * 100)}%)`);
      
    } catch (error) {
      console.error('AI suggestion error:', error);
      setError('AI önerisi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsAILoading(false);
    }
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

        {showInfoBox && (
          <InfoBox>
            <CloseButton onClick={() => setShowInfoBox(false)}>
              ×
            </CloseButton>
            <InfoText>
              <strong>A/B Testing Nedir?</strong><br />
              A/B testi, ürününüze ait sayfanın iki farklı versiyonunu (A ve B) karşılaştırarak 
              hangisinin daha fazla satış ve müşteri etkileşimi getirdiğini ölçmenizi sağlayan 
              güçlü bir yöntemdir. Bu sayede müşteri davranışlarını analiz ederek tahminlere 
              değil, somut verilere dayalı kararlar alabilirsiniz.
              <br />
              <br />
              <strong>Yapay Zeka Destekli B Varyantı ile Tanışın!</strong><br />
              Sezgi, yapay zeka entegrasyonu sayesinde genel satış trendlerini ve müşteri davranışlarını analiz ederek size yüksek performans potansiyeline sahip B varyantı önerileri sunar. Bu sayede en etkili değişiklikleri kolayca test edebilir ve satışlarınızı artırabilirsiniz.




            </InfoText>
          </InfoBox>
        )}

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
              <VariantCard style={{ paddingBottom: 0 }}>
                <VariantLabel>A Varyantı (Mevcut)</VariantLabel>
                <DisabledOverlay>
                  <TextArea
                    value={aVariant}
                    readOnly
                    placeholder={testField === 'title' ? 'Mevcut ürün başlığı' : 'Mevcut ürün açıklaması'}
                  />
                </DisabledOverlay>
                <VariantHelperText>
                  A Varyantı, ürününüzün mevcut durumunu temsil eder. Değişiklik yapmak için Satıcı Paneli'nden ürünü düzenleyebilirsiniz.
                </VariantHelperText>
              </VariantCard>
              
              <VariantCard>
                <VariantLabel>
                  B Varyantı (Yeni)
                  <TooltipContainer>
                    <InfoIcon src="/info_symbol.png" alt="Info" />
                    <Tooltip>
                      Manuel olarak karar verebilir veya yapay zekamızın önerilerinden yararlanabilirsiniz.
                    </Tooltip>
                  </TooltipContainer>
                </VariantLabel>
                <TextArea
                  value={bVariant}
                  onChange={(e) => setBVariant(e.target.value)}
                  placeholder={testField === 'title' ? 'Yeni ürün başlığı' : 'Yeni ürün açıklaması'}
                />
                <AIButton 
                  onClick={handleAIGenerate}
                  disabled={isAILoading || !aVariant.trim()}
                >
                  <span>✨</span>
                  {isAILoading ? 'AI ile Oluşturuluyor...' : 'AI ile Oluştur'}
                </AIButton>
                {aiSuggestionResult && (
                  <VariantHelperText>{aiSuggestionResult}</VariantHelperText>
                )}
              </VariantCard>
            </VariantContainer>
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <InfoBox>
            <InfoText>
              <strong>İpucu:</strong> Güvenilir sonuçlara ulaşmak adına testinizi en az 7 gün aktif tutmanızı ve her seçeneğin minimum 100 defa görüntülenmesini beklemenizi öneririz.

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