import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Ticket,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  FileBarChart,
  Key,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const { toast } = useToast();
  const { logout, user } = useAuth();

  // Filtrar elementos del menú basado en el rol del usuario
  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'tickets', label: 'Tickets', icon: Ticket },
      { id: 'reports', label: 'Reportes', icon: FileBarChart },
    ];

    // Solo mostrar configuración para administradores
    if (user?.role === 'admin') {
      baseItems.push({ id: 'settings', label: 'Configuración', icon: Settings });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    try {
      logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordDialog(true);
  };

  return (
    <div
      className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Sistema Tickets
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                collapsed && "px-2"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        {!collapsed && user && (
          <div 
            className="mb-3 px-2 py-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleChangePassword}
            title="Haz clic para cambiar tu contraseña"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {user.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.email}
                </div>
              </div>
              <Key className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive",
            collapsed && "px-2"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </div>

      {/* Diálogo de cambio de contraseña */}
      {user && (
        <ChangePasswordDialog
          open={showChangePasswordDialog}
          onOpenChange={setShowChangePasswordDialog}
          userId={user.id}
        />
      )}
    </div>
  );
}