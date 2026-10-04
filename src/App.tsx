import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicHomePage } from './pages/PublicHomePage';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminFormBuilderPage } from './pages/admin/AdminFormBuilderPage';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage';
import { AdminTemplatesPage } from './pages/admin/AdminTemplatesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPlaceholderPage } from './pages/AdminPlaceholderPage';

// Main Router Content Component
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Basic routing state ('public' | 'admin')
  const [currentRoute, setCurrentRoute] = useState<'public' | 'admin'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'public';
  });

  // Admin active sub-tab ('dashboard' | 'events' | 'builder' | 'registrations' | 'templates' | 'admins')
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  // Sync browser URL / history
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('public');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    setCurrentRoute('admin');
    window.history.pushState({}, '', '/admin');
  };

  const navigateToPublic = () => {
    setCurrentRoute('public');
    window.history.pushState({}, '', '/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-festival-pattern flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-fredoka font-bold text-xl animate-bounce">
            K
          </div>
          <p className="font-baloo text-stone-600 dark:text-stone-300 text-sm font-semibold">
            Memuat KOBAR EXPO 2026...
          </p>
        </div>
      </div>
    );
  }

  // 1. PUBLIC PARTICIPANT PORTAL ('/')
  if (currentRoute === 'public') {
    return (
      <PublicHomePage
        onNavigateAdmin={navigateToAdmin}
      />
    );
  }

  // 2. ADMIN LOGIN PAGE (If user is not logged in)
  if (!user) {
    return (
      <AdminLogin
        onBackToHome={navigateToPublic}
      />
    );
  }

  // 3. ADMIN PORTAL WITH LAYOUT ('/admin')
  return (
    <AdminLayout
      currentTab={adminTab}
      onSelectTab={setAdminTab}
      onNavigateHome={navigateToPublic}
    >
      {/* Module 1: Dashboard Utama */}
      {adminTab === 'dashboard' && (
        <AdminDashboardPage onNavigateTab={setAdminTab} />
      )}

      {/* Module 2: Manajemen Event & Kode Undangan (Tahap 2) */}
      {adminTab === 'events' && (
        <AdminEventsPage />
      )}

      {/* Module 3: Form Builder Dinamis (Tahap 3) */}
      {adminTab === 'builder' && (
        <AdminFormBuilderPage />
      )}

      {/* Module 4: Data Pendaftar & Tindakan Massal (Tahap 5) */}
      {adminTab === 'registrations' && (
        <AdminRegistrationsPage />
      )}

      {/* Module 5: Template Email & Invoice PDF (Tahap 6) */}
      {adminTab === 'templates' && (
        <AdminTemplatesPage />
      )}

      {/* Module 6: Kelola Akun Admin & Hak Akses (Tahap 2) */}
      {adminTab === 'admins' && (
        <AdminUsersPage />
      )}
    </AdminLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
