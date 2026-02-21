import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import type { Client, ClientInsert } from "@/hooks/useClients";
import { ClientFormDialog } from "@/components/clientes/ClientFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


export default function Clientes() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = clients?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf_cnpj?.includes(search)
  ) ?? [];

  const handleSubmit = async (data: ClientInsert) => {
    try {
      if (editing) {
        await updateClient.mutateAsync({ id: editing.id, ...data });
        toast({ title: "Cliente atualizado com sucesso" });
      } else {
        await createClient.mutateAsync(data);
        toast({ title: "Cliente cadastrado com sucesso" });
      }
      setFormOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Erro ao salvar cliente", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteClient.mutateAsync(deleteId);
      toast({ title: "Cliente excluído" });
      setDeleteId(null);
    } catch {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    }
  };


  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground text-sm mt-1">{clients?.length ?? 0} clientes cadastrados</p>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:max-w-sm bg-background rounded-lg px-3 border border-input shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Buscar por nome, telefone..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent h-10 w-full p-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((client) => (
                <Card key={client.id} className="overflow-hidden border-border shadow-sm bg-card hover:shadow-md transition-all">
                  <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">Cadastro Ativo</span>
                      <Badge variant={client.active ? "default" : "outline"} className="text-[10px] h-4">
                        {client.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </span>
                    <span className="text-[10px] opacity-70">ID: {client.id.slice(0, 8)}</span>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base truncate">{client.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {client.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3 text-primary" /> {client.phone}
                            </span>
                          )}
                          {client.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {client.email}
                            </span>
                          )}
                          {client.cpf_cnpj && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 border-l pl-4 border-border">
                              <span className="font-medium text-[10px] uppercase">CPF/CNPJ:</span> {client.cpf_cnpj}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-border justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => { setEditing(client); setFormOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar Cliente</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>
      <ClientFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        client={editing}
        onSubmit={handleSubmit}
        loading={createClient.isPending || updateClient.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente?"
        loading={deleteClient.isPending}
      />

    </AppLayout>
  );
}