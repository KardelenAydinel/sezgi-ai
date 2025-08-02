import React from 'react';
import styled from 'styled-components';
import { Product } from '../types';

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.grey[100]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;



const ProductName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  line-height: 1.3;
`;

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.4;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex: 1;
`;

const MetadataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Stars = styled.div`
  color: #FFA726;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RatingText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SimilarityScore = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primary}20;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const VisualDescription = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.grey[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;

const Subcategory = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary}10;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  display: inline-block;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${({ theme }) => theme.spacing.md};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryVariant};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface ProductCardProps {
  product: Product;
  onShowSimilar?: (productName: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onShowSimilar }) => {
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

  const getImageSrc = () => {
    if (product.imageBase64) {
      return `data:image/jpeg;base64,${product.imageBase64}`;
    }
    return '/assets/placeholder.png';
  };

  return (
    <Card>
      <ImageContainer>
        <ProductImage 
          src={getImageSrc()}
          alt={product.name}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const container = target.parentElement;
            if (container) {
              const placeholder = document.createElement('div');
              placeholder.className = 'placeholder';
              placeholder.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #EEEEEE;
                color: #9E9E9E;
                font-size: 48px;
              `;
              placeholder.textContent = '🖼️';
              container.appendChild(placeholder);
            }
          }}
        />
      </ImageContainer>

      <ProductName>{product.name}</ProductName>
      
      {product.subcategory && (
        <div style={{ marginBottom: '8px' }}>
          <Subcategory>{product.subcategory}</Subcategory>
        </div>
      )}
      
      <ProductDescription>{product.description}</ProductDescription>

      <MetadataContainer>
        {product.rating !== undefined && (
          <RatingContainer>
            <Stars>{renderStars(product.rating)}</Stars>
            <RatingText>
              {product.rating.toFixed(1)}
              {product.reviewCount && ` (${product.reviewCount} değerlendirme)`}
            </RatingText>
          </RatingContainer>
        )}

        {product.similarityScore !== undefined && (
          <SimilarityScore>
            <span>🎯</span>
            <span>Eşleşme: %{(product.similarityScore * 100).toFixed(1)}</span>
          </SimilarityScore>
        )}

        {product.visualRepresentation && (
          <VisualDescription>
            <strong>Görsel Tanım:</strong> {product.visualRepresentation}
          </VisualDescription>
        )}
      </MetadataContainer>

      {onShowSimilar && (
        <ActionButton onClick={() => onShowSimilar(product.name)}>
          🔍 Bunun Gibileri Göster
        </ActionButton>
      )}
    </Card>
  );
};

export default ProductCard;