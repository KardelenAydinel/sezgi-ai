import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Product } from '../types';
import ProductCard from './ProductCard';

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: 0 50px; // Navigation butonları için alan bırak
  margin: ${({ theme }) => theme.spacing.lg} auto; // Yatay center için auto margin
  padding-top: ${({ theme }) => theme.spacing.md}; // Ekstra üst padding
  display: flex;
  justify-content: center; // İçeriği yatay center'la
  align-self: center; // Chat akışında center'la
`;

const ScrollableContainer = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.grey[300]} transparent;
  width: 100%;
  display: flex;
  justify-content: center; // İçeriği center'la
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.grey[300]};
    border-radius: 4px;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.grey[400]};
    }
  }
`;

const CarouselWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  width: fit-content;
  justify-content: flex-start; // Kartları sıralı olarak hizala
  align-items: center; // Dikey center da ekle
`;

const NavigationButton = styled.button<{ direction: 'left' | 'right'; disabled?: boolean; hide?: boolean }>`
  position: absolute;
  top: 50%;
  ${({ direction }) => direction}: 125px; // 15px içeri alındı (-20px -> -5px)
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled, hide }) => disabled || hide ? 0 : 1};
  visibility: ${({ hide }) => hide ? 'hidden' : 'visible'};
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 18px;
  transition: all 0.2s ease;
  pointer-events: ${({ hide }) => hide ? 'none' : 'auto'};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    transform: translateY(-50%) scale(1.05);
  }

  &:active:not(:disabled) {
    transform: translateY(-50%) scale(0.95);
  }
`;

const SeeAllCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  width: 235px; // CardContainer ile aynı sabit genişlik
  min-width: 235px; // CardContainer ile aynı sabit genişlik
  max-width: 235px; // CardContainer ile aynı sabit genişlik
  height: 415px; // CardContainer ile aynı fixed height
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0; // Küçülmesini engelle

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}10;
  }
`;

const SeeAllIcon = styled.div`
  font-size: 48px;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SeeAllText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  margin: 0;
`;

const CardContainer = styled.div`
  width: 235px; // Sabit genişlik (min-max arası ortalama)
  min-width: 235px; // Sabit genişlik
  max-width: 235px; // Sabit genişlik
  height: 415px; // Fixed height
  flex-shrink: 0; // Küçülmesini engelle
  
  > div {
    height: 100%; // ProductCard'ın tam yüksekliği kullanmasını sağla
  }
`;

interface DatabaseProductCarouselProps {
  products: Product[];
  onSeeAll?: () => void;
}

const DatabaseProductCarousel: React.FC<DatabaseProductCarouselProps> = ({ 
  products, 
  onSeeAll 
}) => {
  const [currentView, setCurrentView] = useState<'first' | 'second'>('first');
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // İlk görünüm: 5 ürün, İkinci görünüm: 4 ürün + "Tümünü Gör" kartı
  const getDisplayProducts = () => {
    if (currentView === 'first') {
      return products.slice(0, 4);
    } else {
      return products.slice(4, 7); // Sonraki 4 ürün
    }
  };

  // Navigasyon fonksiyonları
  const goToNext = () => {
    if (currentView === 'first' && products.length > 5) {
      setCurrentView('second');
    }
  };

  const goToPrev = () => {
    if (currentView === 'second') {
      setCurrentView('first');
    }
  };

  // Mouse tekerleği ile yatay kaydırma
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const canGoLeft = currentView === 'second';
  const canGoRight = currentView === 'first' && products.length > 4; // Kullanıcının değişikliği: 4 kart
  const hideLeftButton = currentView === 'first'; // İlk sayfada sol butonu gizle
  const hideRightButton = currentView === 'second'; // İkinci sayfada sağ butonu gizle
  const showSeeAllCard = currentView === 'second';
  const displayProducts = getDisplayProducts();

  return (
    <CarouselContainer>
      {/* Sol Navigation Buttonu */}
      <NavigationButton
        direction="left"
        disabled={!canGoLeft}
        hide={hideLeftButton}
        onClick={goToPrev}
        aria-label="Önceki görünüm"
      >
        ←
      </NavigationButton>

      {/* Sağ Navigation Buttonu */}
      <NavigationButton
        direction="right"
        disabled={!canGoRight}
        hide={hideRightButton}
        onClick={goToNext}
        aria-label="Sonraki görünüm"
      >
        →
      </NavigationButton>

      {/* Carousel Content */}
      <ScrollableContainer 
        ref={scrollContainerRef}
        onWheel={handleWheel}
      >
        <CarouselWrapper ref={carouselRef}>
          {displayProducts.map((product, idx) => (
            <CardContainer key={`${currentView}-${idx}`}>
              <ProductCard 
                product={product}
                onShowSimilar={undefined} // Database ürünleri için benzer ürün özelliği yok
              />
            </CardContainer>
          ))}
          
          {/* "Tümünü Gör" kartı - sadece ikinci görünümde */}
          {showSeeAllCard && (
            <CardContainer>
              <SeeAllCard onClick={onSeeAll}>
                <SeeAllIcon>📦</SeeAllIcon>
                <SeeAllText>Tümünü Gör</SeeAllText>
              </SeeAllCard>
            </CardContainer>
          )}
        </CarouselWrapper>
      </ScrollableContainer>
    </CarouselContainer>
  );
};

export default DatabaseProductCarousel;