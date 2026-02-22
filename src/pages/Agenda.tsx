import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppointmentsByRange, useCreateAppointment, useUpdateAppointmentStatus, useDeleteAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
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
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: attendants } = useAttendants();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();

  // Cálculo do intervalo de datas
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

  // Handlers
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingAppointment) {
        await updateAppointment.mutateAsync({ id: editingAppointment.id, ...data });
        toast({ title: "Agendamento atualizado com sucesso" });
      } else {
        await createAppointment.mutateAsync(data);
        toast({ title: "Agendamento criado com sucesso" });
      }
      setFormOpen(false);
      setEditingAppointment(null);
    } catch {
      toast({ title: editingAppointment ? "Erro ao atualizar" : "Erro ao criar", variant: "destructive" });
    }
  };

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormOpen(true);
  };

  const handleCreateClick = () => {
    setEditingAppointment(null);
    setFormOpen(true);
  };

  const navigate = (direction: number) => {
    switch (viewMode) {
      case "day": setSelectedDate((d) => addDays(d, direction)); break;
      case "week": setSelectedDate((d) => addDays(d, direction * 7)); break;
      case "month": setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1)); break;
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
          <Card><CardContent className="py-12 text-center text-muted-foreground"><CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />Nenhum agendamento</CardContent></Card>
        ) : (
          dayAppointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onChangeStatus={(id, status) => updateStatus.mutate({ id, status })}
              onDelete={setDeleteId}
              onComplete={setCompletingAppointment}
              onEdit={() => handleEditClick(a)}
            />))
        )}
      </div>
    );
  };

  const getTitle = () => {
    switch (viewMode) {
      case "day": return format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
      case "week": return `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "dd/MM")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}`;
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
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Agendamento
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diário</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAttendant} onValueChange={setFilterAttendant}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Atendente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {attendants?.filter(a => a.active).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-6">
          {!isMobile && viewMode !== "month" && (
            <div className="hidden lg:block shrink-0">
              <Card>
                <CardContent className="p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    locale={ptBR}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Card><CardContent className="py-12 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></CardContent></Card>
            ) : (
              <>
                {viewMode === "day" && renderDayView()}
              </>
            )}
          </div>
        </div>
      </div>

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditingAppointment(null); }}
        onSubmit={handleFormSubmit}
        loading={createAppointment.isPending || updateAppointment.isPending}
        initialDate={format(selectedDate, "yyyy-MM-dd")}
        initialData={editingAppointment}
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