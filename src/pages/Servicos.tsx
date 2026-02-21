import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scissors, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServices";
import type { Service, ServiceInsert } from "@/hooks/useServices";
import { ServiceFormDialog } from "@/components/servicos/ServiceFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, DollarSign, Tag } from "lucide-react"; 
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function Servicos() {
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = services?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];


  const handleSubmit = async (data: ServiceInsert) => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...data });
        toast({ title: "Serviço atualizado com sucesso" });
      } else {
        await createService.mutateAsync(data);
        toast({ title: "Serviço criado com sucesso" });
      }
      setFormOpen(false);
      setEditingService(null);
    } catch {
      toast({ title: "Erro ao salvar serviço", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteService.mutateAsync(deleteId);
      toast({ title: "Serviço excluído" });
      setDeleteId(null);
    } catch {
      toast({ title: "Erro ao excluir serviço", variant: "destructive" });
    }
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Serviços</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie o catálogo e preços</p>
          </div>
          <Button onClick={openNew} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Novo Serviço
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:max-w-sm bg-background rounded-lg px-3 border border-input shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Buscar serviço ou categoria..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent h-10 w-full p-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Scissors className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>Nenhum serviço encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <TooltipProvider>
            <div className="flex flex-col gap-3">
              {filtered.map((service) => (
                <Card key={service.id} className="overflow-hidden border-border shadow-sm bg-card hover:shadow-md transition-all group">
                  <div className="bg-muted/50 px-4 py-1.5 border-b flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      {service.category || "Geral"}
                    </span>
                    {!service.active && (
                      <Badge variant="destructive" className="h-4 text-[9px]">Inativo</Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-base truncate">{service.name}</h3>
                        </div>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Duração</p>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {service.duration_minutes} min
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Valor</p>
                            <p className="text-lg font-bold text-primary leading-none">
                              {formatCurrency(service.price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 border-l pl-4 border-border">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEdit(service)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(service.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditingService(null); }}
        service={editingService}
        onSubmit={handleSubmit}
        loading={createService.isPending || updateService.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Excluir serviço"
        description="Tem certeza que deseja excluir este serviço?"
        loading={deleteService.isPending}
      />

    </AppLayout>
  );
}