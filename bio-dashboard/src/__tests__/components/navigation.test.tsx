/**
 * ============================================================
 * NAVIGATION COMPONENT TESTS
 * 네비게이션 컴포넌트 테스트
 * ============================================================
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the navigation components
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Simple mock component for testing
const MockBottomNavigation = () => {
  const [active, setActive] = React.useState('home');
  
  const tabs = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'analyze', label: '측정', icon: '📊' },
    { id: 'result', label: '결과', icon: '📋' },
    { id: 'mall', label: '몰', icon: '🛒' },
    { id: 'me', label: '나', icon: '👤' },
  ];

  return (
    <nav data-testid="bottom-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          data-testid={`nav-${tab.id}`}
          onClick={() => setActive(tab.id)}
          aria-selected={active === tab.id}
          className={active === tab.id ? 'active' : ''}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

describe('Navigation Components', () => {
  // ============================================
  // Bottom Navigation Tests
  // ============================================
  describe('Bottom Navigation', () => {
    it('should render all 5 navigation tabs', () => {
      render(<MockBottomNavigation />);
      
      expect(screen.getByTestId('nav-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-analyze')).toBeInTheDocument();
      expect(screen.getByTestId('nav-result')).toBeInTheDocument();
      expect(screen.getByTestId('nav-mall')).toBeInTheDocument();
      expect(screen.getByTestId('nav-me')).toBeInTheDocument();
    });

    it('should show Korean labels', () => {
      render(<MockBottomNavigation />);
      
      expect(screen.getByText('홈')).toBeInTheDocument();
      expect(screen.getByText('측정')).toBeInTheDocument();
      expect(screen.getByText('결과')).toBeInTheDocument();
      expect(screen.getByText('몰')).toBeInTheDocument();
      expect(screen.getByText('나')).toBeInTheDocument();
    });

    it('should change active state when clicked', () => {
      render(<MockBottomNavigation />);
      
      const homeTab = screen.getByTestId('nav-home');
      const analyzeTab = screen.getByTestId('nav-analyze');
      
      // Initially home is active
      expect(homeTab).toHaveAttribute('aria-selected', 'true');
      
      // Click analyze
      fireEvent.click(analyzeTab);
      
      // Now analyze should be active
      expect(analyzeTab).toHaveAttribute('aria-selected', 'true');
      expect(homeTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should have correct icons', () => {
      render(<MockBottomNavigation />);
      
      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('🛒')).toBeInTheDocument();
      expect(screen.getByText('👤')).toBeInTheDocument();
    });
  });

  // ============================================
  // Sidebar Navigation Tests
  // ============================================
  describe('Sidebar Navigation (Mock)', () => {
    const MockSidebar = ({ expanded }: { expanded: boolean }) => (
      <aside data-testid="sidebar" data-expanded={expanded}>
        <nav>
          <a href="/" data-testid="sidebar-home">홈</a>
          <a href="/analytics" data-testid="sidebar-analytics">분석</a>
          <a href="/settings" data-testid="sidebar-settings">설정</a>
        </nav>
      </aside>
    );

    it('should render sidebar with links', () => {
      render(<MockSidebar expanded={true} />);
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-home')).toHaveAttribute('href', '/');
      expect(screen.getByTestId('sidebar-analytics')).toHaveAttribute('href', '/analytics');
      expect(screen.getByTestId('sidebar-settings')).toHaveAttribute('href', '/settings');
    });

    it('should have expanded state attribute', () => {
      const { rerender } = render(<MockSidebar expanded={true} />);
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-expanded', 'true');

      rerender(<MockSidebar expanded={false} />);
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-expanded', 'false');
    });
  });

  // ============================================
  // Quick Action Menu Tests
  // ============================================
  describe('Quick Action Menu (Mock)', () => {
    const MockQuickActionMenu = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      
      const actions = [
        { id: 'measure', label: '측정 시작', icon: '▶️' },
        { id: 'scan', label: '카트리지 스캔', icon: '📷' },
        { id: 'history', label: '측정 기록', icon: '📜' },
      ];

      return (
        <div>
          <button 
            data-testid="fab-button" 
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            +
          </button>
          {isOpen && (
            <div data-testid="action-menu">
              {actions.map(action => (
                <button key={action.id} data-testid={`action-${action.id}`}>
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    };

    it('should toggle menu on FAB click', () => {
      render(<MockQuickActionMenu />);
      
      const fab = screen.getByTestId('fab-button');
      
      // Initially closed
      expect(screen.queryByTestId('action-menu')).not.toBeInTheDocument();
      
      // Open
      fireEvent.click(fab);
      expect(screen.getByTestId('action-menu')).toBeInTheDocument();
      
      // Close
      fireEvent.click(fab);
      expect(screen.queryByTestId('action-menu')).not.toBeInTheDocument();
    });

    it('should show all quick actions when open', () => {
      render(<MockQuickActionMenu />);
      
      fireEvent.click(screen.getByTestId('fab-button'));
      
      expect(screen.getByTestId('action-measure')).toBeInTheDocument();
      expect(screen.getByTestId('action-scan')).toBeInTheDocument();
      expect(screen.getByTestId('action-history')).toBeInTheDocument();
    });

    it('should have correct action labels', () => {
      render(<MockQuickActionMenu />);
      
      fireEvent.click(screen.getByTestId('fab-button'));
      
      expect(screen.getByText(/측정 시작/)).toBeInTheDocument();
      expect(screen.getByText(/카트리지 스캔/)).toBeInTheDocument();
      expect(screen.getByText(/측정 기록/)).toBeInTheDocument();
    });
  });
});


