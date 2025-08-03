import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import ChatPage from './ChatPage';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const AppBar = styled.header`
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

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[50]};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  .icon {
    font-size: 20px;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: ${({ theme }) => theme.spacing.xs};
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  min-width: 160px;
  z-index: 1000;
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[50]};
  }

  &:first-child {
    border-radius: ${({ theme }) => theme.borderRadius.md} ${({ theme }) => theme.borderRadius.md} 0 0;
  }

  &:last-child {
    border-radius: 0 0 ${({ theme }) => theme.borderRadius.md} ${({ theme }) => theme.borderRadius.md};
  }

  .icon {
    font-size: 18px;
  }
`;

const Content = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const MainScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isBusinessMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Get initial message from navigation state
  const initialMessage = location.state?.initialMessage;

  const toggleMode = () => {
    if (isBusinessMode) {
      navigate('/');
    } else {
      navigate('/business');
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Container>
      <Content>
        <ChatPage initialMessage={initialMessage} />
      </Content>
    </Container>
  );
};

export default MainScreen;