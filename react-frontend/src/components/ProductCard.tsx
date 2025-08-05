import React, { useState } from 'react';
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
  flex: 1; // Allow cards to grow and shrink equally
  min-width: 150px; // Smaller minimum width to fit more cards
  max-width: 250px; // Maximum width to prevent too wide cards
  position: relative; // For absolute positioning of heart button

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
  object-position: center; // Center the image vertically and horizontally
`;



const ProductName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  line-height: 1.3;
  text-align: center; // Center align like in the photo
  height: 42px; // Fixed height for consistent layout
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.3;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 5; // Limit to 5 lines
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

const HeartButton = styled.button<{ isLiked: boolean }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px ${({ isLiked }) => isLiked ? 'rgba(255, 71, 87, 0.3)' : 'rgba(0, 0, 0, 0.2)'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px ${({ isLiked }) => isLiked ? 'rgba(255, 71, 87, 0.4)' : 'rgba(0, 0, 0, 0.3)'};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const HeartIcon = styled.svg<{ isLiked: boolean }>`
  width: 20px;
  height: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  path {
    fill: ${({ isLiked }) => isLiked ? '#ff4757' : '#000000'};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  transform: ${({ isLiked }) => isLiked ? 'scale(1)' : 'scale(0.9)'};
`;



interface ProductCardProps {
  product: Product;
  onShowSimilar?: (productName: string, productDescription?: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onShowSimilar }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
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
        {/* Heart button - only for database products */}
        {!onShowSimilar && (
          <HeartButton isLiked={isLiked} onClick={handleHeartClick}>
            <HeartIcon 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
              isLiked={isLiked}
            >
              {isLiked ? (
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              ) : (
                <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
              )}
            </HeartIcon>
          </HeartButton>
        )}
        
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
          <RatingContainer>
            <Stars>{renderStars(product.rating ?? 0)}</Stars>
            <RatingText>
              {(product.rating ?? 0).toFixed(1)}
              {product.reviewCount && ` (${product.reviewCount} yorum)`}
            </RatingText>
          </RatingContainer>
          {product.subcategory && (
            <Subcategory>{product.subcategory}</Subcategory>
          )}
        </MetadataContainer>
      )}
    </Card>
  );
};

export default ProductCard;