import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppointmentsByRange, useCreateAppointment, useUpdateAppointmentStatus, useDeleteAppointment } from "@/hooks/useAppointments";
import type { Appointment } from "@/hooks/useAppointments";
import { useAttendants } from "@/hooks/useAttendants";
import { AppointmentFormDialog } from "@/components/agenda/AppointmentFormDialog";
import { AppointmentCard } from "@/components/agenda/AppointmentCard";
import { CompleteAppointmentDialog } from "@/components/agenda/CompleteAppointmentDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type ViewMode = "day" | "week" | "month";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [filterAttendant, setFilterAttendant] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: attendants } = useAttendants();
  const createAppointment = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();

  // Calculate date range based on view mode
  const { rangeStart, rangeEnd } = useMemo(() => {
    switch (viewMode) {
      case "week":
        return {
          rangeStart: format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          rangeEnd: format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "month":
        return {
          rangeStart: format(startOfMonth(selectedDate), "yyyy-MM-dd"),
          rangeEnd: format(endOfMonth(selectedDate), "yyyy-MM-dd"),
        };
      default:
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        return { rangeStart: dateStr, rangeEnd: dateStr };
    }
  }, [selectedDate, viewMode]);

  const { data: appointments, isLoading } = useAppointmentsByRange(rangeStart, rangeEnd);

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (filterAttendant === "all") return appointments;
    return appointments.filter((a) => a.attendant_id === filterAttendant);
  }, [appointments, filterAttendant]);

  const navigate = (direction: number) => {
    switch (viewMode) {
      case "day":
        setSelectedDate((d) => addDays(d, direction));
        break;
      case "week":
        setSelectedDate((d) => addDays(d, direction * 7));
        break;
      case "month":
        setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1));
        break;
    }
  };

  const handleCreateAppointment = async (data: any) => {
    try {
      await createAppointment.mutateAsync(data);
      toast({ title: "Agendamento criado com sucesso" });
      setFormOpen(false);
    } catch {
      toast({ title: "Erro ao criar agendamento", variant: "destructive" });
    }
  };

  const handleChangeStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Status atualizado" });
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAppointment.mutateAsync(deleteId);
      toast({ title: "Agendamento excluído" });
      setDeleteId(null);
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  // Group appointments by date for week/month view
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [filteredAppointments]);

  const renderDayView = () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayAppointments = appointmentsByDate[dateStr] ?? [];

    return (
      <div className="space-y-3">
        {dayAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
            </CardContent>
          </Card>
        ) : (
          dayAppointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onChangeStatus={handleChangeStatus}
              onDelete={setDeleteId}
              onComplete={setCompletingAppointment}
            />
          ))
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="space-y-4">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayAppts = appointmentsByDate[dateStr] ?? [];
          return (
            <div key={dateStr}>
              <div className={cn(
                "flex items-center gap-2 mb-2 py-1",
                isToday(day) && "text-primary font-semibold"
              )}>
                <span className={cn(
                  "text-sm font-medium px-2 py-0.5 rounded",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "EEE dd", { locale: ptBR })}
                </span>
                <Badge variant="outline" className="text-xs">{dayAppts.length}</Badge>
              </div>
              {dayAppts.length > 0 ? (
                <div className="space-y-2 ml-2 border-l-2 border-border pl-3">
                  {dayAppts.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      onChangeStatus={handleChangeStatus}
                      onDelete={setDeleteId}
                      onComplete={setCompletingAppointment}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground ml-2 pl-3 border-l-2 border-border">Sem agendamentos</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    const startDow = start.getDay();
    const blanks = (startDow === 0 ? 6 : startDow - 1); // Mon=0

    return (
      <div>
        <div className="grid grid-cols-7 gap-px mb-1">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
            <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: blanks }).map((_, i) => (
            <div key={`blank-${i}`} className="h-16 sm:h-24" />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const count = appointmentsByDate[dateStr]?.length ?? 0;
            return (
              <button
                key={dateStr}
                onClick={() => { setSelectedDate(day); setViewMode("day"); }}
                className={cn(
                  "h-16 sm:h-24 p-1 text-left rounded-lg border border-transparent hover:border-primary/30 transition-colors",
                  isToday(day) && "bg-primary/5 border-primary/20",
                  isSameDay(day, selectedDate) && "ring-2 ring-primary/50"
                )}
              >
                <span className={cn(
                  "text-xs font-medium",
                  isToday(day) && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {count > 0 && (
                  <div className="mt-0.5">
                    <Badge variant="secondary" className="text-xs px-1 py-0">{count}</Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (viewMode) {
      case "day": return format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
      case "week": {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(start, "dd/MM")} - ${format(end, "dd/MM/yyyy")}`;
      }
      case "month": return format(selectedDate, "MMMM yyyy", { locale: ptBR });
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Agenda</h1>
            <p className="text-muted-foreground text-sm mt-1 capitalize">{getTitle()}</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Agendamento
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diário</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAttendant} onValueChange={setFilterAttendant}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Atendente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {attendants?.filter((a) => a.active).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                      {a.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6">
          {/* Sidebar calendar on desktop */}
          {!isMobile && viewMode !== "month" && (
            <div className="hidden lg:block shrink-0">
              <Card>
                <CardContent className="p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                </CardContent>
              </Card>
            ) : (
              <>
                {viewMode === "day" && renderDayView()}
                {viewMode === "week" && renderWeekView()}
                {viewMode === "month" && renderMonthView()}
              </>
            )}
          </div>
        </div>
      </div>

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateAppointment}
        loading={createAppointment.isPending}
        initialDate={format(selectedDate, "yyyy-MM-dd")}
      />

      <CompleteAppointmentDialog
        open={!!completingAppointment}
        onOpenChange={(v) => { if (!v) setCompletingAppointment(null); }}
        appointment={completingAppointment}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Excluir agendamento"
        description="Tem certeza que deseja excluir este agendamento?"
        loading={deleteAppointment.isPending}
      />
    </AppLayout>
  );
}
