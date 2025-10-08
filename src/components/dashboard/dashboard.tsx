import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/contexts/auth-context';
import { Ticket, PriorityLevel, TicketStatus } from '@/types/database';
import { 
  TicketIcon, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResolutionTime: number;
  ticketsByPriority: Record<PriorityLevel, number>;
  ticketsByStatus: Record<TicketStatus, number>;
  recentTickets: any[];
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    avgResolutionTime: 0,
    ticketsByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
    ticketsByStatus: { open: 0, assigned: 0, in_progress: 0, closed: 0 },
    recentTickets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Get dashboard stats for the current user (if user is a resolver)
      const userId = user?.role === 'agent' ? user.id : null;
      const stats = await api.getDashboardStats(userId);

      setStats({
        totalTickets: stats.totalTickets,
        openTickets: stats.openTickets,
        closedTickets: stats.closedTickets,
        avgResolutionTime: stats.avgResolutionTime,
        ticketsByPriority: {
          low: stats.priorityStats.find((p: any) => p.priority === 'low')?.count || 0,
          medium: stats.priorityStats.find((p: any) => p.priority === 'medium')?.count || 0,
          high: stats.priorityStats.find((p: any) => p.priority === 'high')?.count || 0,
          urgent: stats.priorityStats.find((p: any) => p.priority === 'urgent')?.count || 0,
        },
        ticketsByStatus: {
          open: stats.statusStats.find((s: any) => s.status === 'open')?.count || 0,
          assigned: stats.statusStats.find((s: any) => s.status === 'assigned')?.count || 0,
          in_progress: stats.statusStats.find((s: any) => s.status === 'in_progress')?.count || 0,
          closed: stats.statusStats.find((s: any) => s.status === 'closed')?.count || 0,
        },
        recentTickets: stats.recentTickets,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-warning';
      case 'assigned': return 'bg-primary';
      case 'in_progress': return 'bg-accent';
      case 'closed': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'low': return 'bg-muted';
      case 'medium': return 'bg-warning';
      case 'high': return 'bg-destructive';
      case 'urgent': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        {user?.role === 'agent' ? 'Mi Dashboard' : 'Dashboard'}
      </h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'agent' ? 'Mis Tickets' : 'Total Tickets'}
            </CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalTickets}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'agent' ? 'Mis Tickets Abiertos' : 'Tickets Abiertos'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.openTickets}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'agent' ? 'Mis Tickets Cerrados' : 'Tickets Cerrados'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.closedTickets}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {typeof stats.avgResolutionTime === 'number' && !isNaN(stats.avgResolutionTime) 
                ? `${stats.avgResolutionTime.toFixed(1)}h` 
                : '0.0h'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {user?.role === 'agent' ? 'Mis Tickets por Estado' : 'Tickets por Estado'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.ticketsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status as TicketStatus)}`}></div>
                  <span className="text-sm font-medium capitalize">
                    {status === 'in_progress' ? 'En Progreso' : 
                     status === 'open' ? 'Abierto' :
                     status === 'assigned' ? 'Asignado' :
                     status === 'closed' ? 'Cerrado' : status}
                  </span>
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {user?.role === 'agent' ? 'Mis Tickets Recientes' : 'Tickets Recientes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats.recentTickets || []).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{ticket.ticket_number}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {ticket.title}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(stats.recentTickets || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tickets recientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}