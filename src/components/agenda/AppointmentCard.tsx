import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, CheckCircle, XCircle, Trash2, Clock, ExternalLink, User, MoreVertical, Pencil } from "lucide-react";
import type { Appointment } from "@/hooks/useAppointments";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  scheduled: { label: "Agendado", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "Em execução", variant: "default", icon: <Play className="h-3 w-3" /> },
  completed: { label: "Concluído", variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
  canceled: { label: "Cancelado", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

interface AppointmentCardProps {
  appointment: Appointment;
  onChangeStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onComplete: (appointment: Appointment) => void;
  onEdit: () => void;
}

export function AppointmentCard({ appointment, onChangeStatus, onDelete, onComplete, onEdit }: AppointmentCardProps) {
  const statusCfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.scheduled;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const serviceNames = appointment.appointment_services
    ?.map((as) => as.services?.name)
    .filter(Boolean)
    .join(", ") ?? "";

  return (
    <TooltipProvider>
      <Card className="overflow-hidden border-border shadow-sm bg-card hover:shadow-md transition-all">
        {/* Header do Card */}
        <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-2 font-medium">
            <span className="text-foreground font-bold">{appointment.start_time?.slice(0, 5)}</span>
            <span className="opacity-50">|</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: appointment.attendants?.color }} />
              {appointment.attendants?.name}
            </span>
          </span>
          <Badge variant={statusCfg.variant} className="text-[10px] font-normal gap-1">
            {statusCfg.icon} {statusCfg.label}
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-foreground text-base">{appointment.clients?.name}</h3>
              <div className="flex flex-wrap gap-1">
                {appointment.appointment_services?.map((as: any, idx: number) => (
                  <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border border-border">
                    {as.services?.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
              <span className="font-bold text-lg text-primary">
                {formatCurrency(appointment.total_price)}
              </span>

              <div className="flex items-center gap-1">
                {/* BOTÃO EDITAR */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:bg-accent"
                      onClick={onEdit}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar Agendamento</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => window.open(`/comprovante/${appointment.id}`, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver Comanda</TooltipContent>
                </Tooltip>

                {appointment.status === "scheduled" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-green-500 hover:bg-green-500/10" onClick={() => onChangeStatus(appointment.id, "in_progress")}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Iniciar</TooltipContent>
                  </Tooltip>
                )}

                {(appointment.status === "scheduled" || appointment.status === "in_progress") && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:bg-blue-500/10" onClick={() => onComplete(appointment)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Concluir</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => onDelete(appointment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          {/* Notas seguem iguais */}
          {appointment.notes && (
            <p className="text-[11px] text-muted-foreground italic mt-3 bg-muted/30 p-2 rounded border-l-2 border-primary/30">
              {appointment.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}