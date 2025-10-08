import { useState, useEffect } from 'react';
import { MySQLAuthGuard } from '@/components/auth/mysql-auth-guard';
import { AdminGuard } from '@/components/auth/admin-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Dashboard } from '@/components/dashboard/dashboard';
import { TicketList } from '@/components/tickets/ticket-list';
import { ReportsPage } from '@/components/reports/reports-page';
import { SettingsPage } from '@/components/settings/settings-page';
import { useAuth } from '@/contexts/auth-context';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user } = useAuth();

  // Verificar acceso a configuración
  useEffect(() => {
    if (activeSection === 'settings' && user?.role !== 'admin') {
      setActiveSection('dashboard');
    }
  }, [activeSection, user?.role]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'tickets':
        return <TicketList />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return (
          <AdminGuard fallback={<Dashboard />}>
            <SettingsPage />
          </AdminGuard>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <MySQLAuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </MySQLAuthGuard>
  );
};

export default Index;