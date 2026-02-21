import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAttendants, useCreateAttendant, useUpdateAttendant, useDeleteAttendant } from "@/hooks/useAttendants";
import type { Attendant, AttendantInsert } from "@/hooks/useAttendants";
import { AttendantFormDialog } from "@/components/atendentes/AttendantFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_LABELS: Record<number, string> = { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" };

export default function Atendentes() {
  const { data: attendants, isLoading } = useAttendants();
  const createAttendant = useCreateAttendant();
  const updateAttendant = useUpdateAttendant();
  const deleteAttendant = useDeleteAttendant();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Attendant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = attendants?.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.specialty?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleSubmit = async (data: AttendantInsert) => {
    try {
      if (editing) {
        await updateAttendant.mutateAsync({ id: editing.id, ...data });
        toast({ title: "Atendente atualizado com sucesso" });
      } else {
        await createAttendant.mutateAsync(data);
        toast({ title: "Atendente criado com sucesso" });
      }
      setFormOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Erro ao salvar atendente", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAttendant.mutateAsync(deleteId);
      toast({ title: "Atendente excluído" });
      setDeleteId(null);
    } catch {
      toast({ title: "Erro ao excluir atendente", variant: "destructive" });
    }
  };

  const getWorkHours = (a: Attendant) => {
    if (a.work_hours && typeof a.work_hours === "object" && !Array.isArray(a.work_hours)) {
      const wh = a.work_hours as Record<string, string>;
      return `${wh.start || "08:00"} - ${wh.end || "18:00"}`;
    }
    return "08:00 - 18:00";
  };

  const getWorkDays = (a: Attendant) => {
    if (a.work_days && Array.isArray(a.work_days)) {
      return (a.work_days as number[]).map((d) => DAY_LABELS[d] || d).join(", ");
    }
    return "Seg-Sáb";
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Atendentes</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie sua equipe</p>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Atendente
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar atendente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum atendente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((att) => (
              <Card key={att.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: att.color }}>
                        {att.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{att.name}</CardTitle>
                        {att.specialty && <p className="text-sm text-muted-foreground truncate">{att.specialty}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(att); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(att.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {att.phone && <p className="text-sm text-muted-foreground">📞 {att.phone}</p>}
                  <p className="text-sm text-muted-foreground">💰 Comissão: {att.commission_rate}%</p>
                  <p className="text-sm text-muted-foreground">🕐 {getWorkHours(att)}</p>
                  <p className="text-sm text-muted-foreground">📅 {getWorkDays(att)}</p>
                  {!att.active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AttendantFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        attendant={editing}
        onSubmit={handleSubmit}
        loading={createAttendant.isPending || updateAttendant.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Excluir atendente"
        description="Tem certeza que deseja excluir este atendente?"
        loading={deleteAttendant.isPending}
      />
    </AppLayout>
  );
}
