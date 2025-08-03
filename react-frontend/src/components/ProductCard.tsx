import React from 'react';
import styled from 'styled-components';
import { Product } from '../types';

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.sm}; // Reduced padding for more compact cards
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1; // Allow cards to grow and shrink equally
  min-width: 150px; // Smaller minimum width to fit more cards
  max-width: 250px; // Maximum width to prevent too wide cards

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 100%; // 1:1 aspect ratio (square)
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  background-color: ${({ theme }) => theme.colors.grey[100]};
`;

const ProductImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;



const ProductName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  line-height: 1.3;
  text-align: center; // Center align like in the photo
`;

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.3;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3; // Limit to 3 lines
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: center; // Center align like in the photo
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
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: #FF8C00; // Orange color like in the photo
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${({ theme }) => theme.spacing.xs};

  &:hover {
    background-color: #FF7F00;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;



interface ProductCardProps {
  product: Product;
  onShowSimilar?: (productName: string, productDescription?: string) => void;
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
      <ProductName>{product.name}</ProductName>
      
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
                position: absolute;
                top: 0;
                left: 0;
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
      
      <ProductDescription>{product.description}</ProductDescription>

      {onShowSimilar ? (
        // AI Generated products - show "Benzer Ürünleri Göster" button
        <ActionButton onClick={() => onShowSimilar(product.name, product.description)}>
          Benzer Ürünleri Göster
        </ActionButton>
      ) : (
        // Database products - show rating and review count
        <MetadataContainer>
          {product.rating && (
            <RatingContainer>
              <Stars>{renderStars(product.rating)}</Stars>
              <RatingText>({product.rating.toFixed(1)})</RatingText>
            </RatingContainer>
          )}
          
          {product.reviewCount && (
            <RatingText>{product.reviewCount} yorum</RatingText>
          )}
        </MetadataContainer>
      )}
    </Card>
  );
};

export default ProductCard;