import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminNavbar } from './AdminNavbar';
import { AdminBottomNav } from './AdminBottomNav';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigateHome,
  children,
}) => {
  return (
    <div className="min-h-screen flex bg-stone-50/60 dark:bg-[#150F0B] text-stone-900 dark:text-stone-100 transition-colors">
      {/* Desktop Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <AdminNavbar currentTab={currentTab} onNavigateHome={onNavigateHome} />
        
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <AdminBottomNav
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onNavigateHome={onNavigateHome}
      />
    </div>
  );
};
