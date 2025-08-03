import React from 'react';
import styled from 'styled-components';
import { EcommerceProduct } from '../types';

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
  height: 180px;
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

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.grey[200]};
  color: ${({ theme }) => theme.colors.grey[500]};
  font-size: 48px;
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ProductName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  line-height: 1.3;
`;

const BrandName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.grey[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Price = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const StockBadge = styled.span<{ inStock: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ inStock, theme }) => 
    inStock ? theme.colors.primary : theme.colors.error}20;
  color: ${({ inStock, theme }) => 
    inStock ? theme.colors.primary : theme.colors.error};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.4;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Tag = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.grey[100]};
  color: ${({ theme }) => theme.colors.grey[700]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
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

const CategoryBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary}10;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  display: inline-block;
`;

interface EcommerceProductCardProps {
  product: EcommerceProduct;
}

const EcommerceProductCard: React.FC<EcommerceProductCardProps> = ({ product }) => {
  const renderStars = (rating: number | undefined) => {
    const effectiveRating = rating ?? 0;
    const fullStars = Math.floor(effectiveRating);
    const hasHalfStar = effectiveRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(2)} ${currency}`;
  };

  return (
    <Card>
      <ImageContainer>
        {product.imageUrl ? (
          <ProductImage 
            src={product.imageUrl}
            alt={product.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const container = target.parentElement;
              if (container) {
                const placeholder = document.createElement('div');
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
                placeholder.textContent = '🛒';
                container.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <PlaceholderImage>🛒</PlaceholderImage>
        )}
      </ImageContainer>

      <Header>
        <ProductName>{product.name}</ProductName>
        {product.brand && <BrandName>{product.brand}</BrandName>}
      </Header>

      <PriceContainer>
        <Price>{formatPrice(product.price, product.currency)}</Price>
        <StockBadge inStock={product.stock > 0}>
          {product.stock > 0 ? `${product.stock} stokta` : 'Stokta yok'}
        </StockBadge>
      </PriceContainer>

      <div style={{ marginBottom: '8px' }}>
        <CategoryBadge>
          {product.subcategory || product.category}
        </CategoryBadge>
      </div>

      <ProductDescription>{product.description}</ProductDescription>

      {product.tags.length > 0 && (
        <TagsContainer>
          {product.tags.slice(0, 4).map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
          {product.tags.length > 4 && (
            <Tag>+{product.tags.length - 4} daha</Tag>
          )}
        </TagsContainer>
      )}

      <MetadataContainer>
        <RatingContainer>
          <Stars>{renderStars(product.rating ?? 0)}</Stars>
          <RatingText>
            {(product.rating ?? 0).toFixed(1)}
            {product.reviewCount && ` (${product.reviewCount} yorum)`}
          </RatingText>
        </RatingContainer>


      </MetadataContainer>
    </Card>
  );
};

export default EcommerceProductCard;