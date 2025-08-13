import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketStatus, PriorityLevel, Resolver } from '@/types/database';
import { 
  Clock, 
  User, 
  Calendar, 
  Tag, 
  MessageSquare,
  Save,
  CheckCircle 
} from 'lucide-react';

interface TicketDetailsProps {
  ticket: any;
  onUpdate: () => void;
}

export function TicketDetails({ ticket, onUpdate }: TicketDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [agents, setAgents] = useState<Resolver[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionHours, setResolutionHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  const [editData, setEditData] = useState({
    status: ticket.status,
    priority: ticket.priority,
    assigned_to: ticket.assigned_to || 'unassigned',
    description: ticket.description || '',
  });

  useEffect(() => {
    loadAgents();
    loadCurrentUserRole();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('resolvers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al cargar agentes: " + error.message,
        variant: "destructive",
      });
    }
  };

  const loadCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCurrentUserRole(data?.role || 'agent');
    } catch (error: any) {
      console.error('Error loading user role:', error);
      setCurrentUserRole('agent'); // Default to agent if error
    }
  };

  const handleUpdate = async () => {
    // Validation: Check if closing ticket without resolution time
    if (editData.status === 'closed' && (!resolutionHours || parseFloat(resolutionHours) <= 0)) {
      toast({
        title: "Error de validación",
        description: "Debe ingresar el tiempo empleado para cerrar el ticket",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        ...editData,
        assigned_to: editData.assigned_to === 'unassigned' ? null : editData.assigned_to,
        updated_at: new Date().toISOString(),
      };

      // Set assigned_at if assigning for the first time
      if (editData.assigned_to && editData.assigned_to !== 'unassigned' && !ticket.assigned_to) {
        updateData.assigned_at = new Date().toISOString();
      }

      // Handle closing ticket
      if (editData.status === 'closed' && ticket.status !== 'closed') {
        updateData.closed_at = new Date().toISOString();
        updateData.resolution_time_hours = parseFloat(resolutionHours);
        if (resolutionNotes) {
          updateData.resolution_notes = resolutionNotes;
        }
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ticket actualizado correctamente",
      });
      
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al actualizar el ticket: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-warning text-warning-foreground';
      case 'assigned': return 'bg-primary text-primary-foreground';
      case 'in_progress': return 'bg-accent text-accent-foreground';
      case 'closed': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'low': return 'bg-muted text-muted-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatStatus = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'assigned': return 'Asignado';
      case 'in_progress': return 'En Progreso';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  const formatPriority = (priority: PriorityLevel) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">{ticket.ticket_number}</h2>
          <h3 className="text-lg text-muted-foreground">{ticket.title}</h3>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            // Only show edit button if user is admin OR ticket is not closed
            (currentUserRole === 'admin' || ticket.status !== 'closed') && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar
              </Button>
            )
          ) : (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={loading || (editData.status === 'closed' && (!resolutionHours || parseFloat(resolutionHours) <= 0))} 
                variant="corporate"
              >
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Estado:</span>
              {isEditing ? (
                <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value as TicketStatus })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="assigned">Asignado</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getStatusColor(ticket.status)}>
                  {formatStatus(ticket.status)}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Prioridad:</span>
              {isEditing ? (
                <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value as PriorityLevel })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getPriorityColor(ticket.priority)}>
                  {formatPriority(ticket.priority)}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cliente:</span>
              <span className="text-sm">{ticket.client?.name || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tipo:</span>
              <span className="text-sm capitalize">{ticket.request_type}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Asignación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Creado por:</span>
              <span className="text-sm">{ticket.created_user?.full_name || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Asignado a:</span>
              {isEditing ? (
                <Select value={editData.assigned_to} onValueChange={(value) => setEditData({ ...editData, assigned_to: value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">{ticket.assigned_resolver?.name || 'No asignado'}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Fechas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium">Creado:</span>
            <p className="text-sm text-muted-foreground">
              {new Date(ticket.created_at).toLocaleString('es-ES')}
            </p>
          </div>
          {ticket.assigned_at && (
            <div>
              <span className="text-sm font-medium">Asignado:</span>
              <p className="text-sm text-muted-foreground">
                {new Date(ticket.assigned_at).toLocaleString('es-ES')}
              </p>
            </div>
          )}
          {ticket.closed_at && (
            <div>
              <span className="text-sm font-medium">Cerrado:</span>
              <p className="text-sm text-muted-foreground">
                {new Date(ticket.closed_at).toLocaleString('es-ES')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Descripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={4}
              placeholder="Descripción del ticket..."
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {ticket.description || 'Sin descripción'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resolution (only when closing) */}
      {isEditing && editData.status === 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Resolución
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="resolution_hours">
                Tiempo empleado (horas) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="resolution_hours"
                type="number"
                step="0.5"
                min="0.1"
                value={resolutionHours}
                onChange={(e) => setResolutionHours(e.target.value)}
                placeholder="Ej: 2.5"
                className={!resolutionHours && editData.status === 'closed' ? "border-destructive" : ""}
              />
              {!resolutionHours && editData.status === 'closed' && (
                <p className="text-sm text-destructive mt-1">Este campo es obligatorio para cerrar el ticket</p>
              )}
            </div>
            <div>
              <Label htmlFor="resolution_notes">Notas de resolución</Label>
              <Textarea
                id="resolution_notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                placeholder="Describe cómo se resolvió el ticket..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution info (when already closed) */}
      {ticket.status === 'closed' && (ticket.resolution_notes || ticket.resolution_time_hours) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Información de Resolución
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ticket.resolution_time_hours && (
              <div>
                <span className="text-sm font-medium">Tiempo empleado:</span>
                <p className="text-sm text-muted-foreground">{ticket.resolution_time_hours} horas</p>
              </div>
            )}
            {ticket.resolution_notes && (
              <div>
                <span className="text-sm font-medium">Notas:</span>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.resolution_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}