import { useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Dashboard } from '@/components/dashboard/dashboard';
import { TicketList } from '@/components/tickets/ticket-list';
import { ReportsPage } from '@/components/reports/reports-page';
import { SettingsPage } from '@/components/settings/settings-page';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'tickets':
        return <TicketList />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </AuthGuard>
  );
};

export default Index;