import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user } = useAuth();

  // Si no hay usuario o no es administrador, mostrar mensaje de acceso denegado
  if (!user || user.role !== 'admin') {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No tienes permisos para acceder a esta sección. 
                Solo los administradores pueden ver la configuración del sistema.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Si crees que esto es un error, contacta al administrador del sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si es administrador, mostrar el contenido
  return <>{children}</>;
}
