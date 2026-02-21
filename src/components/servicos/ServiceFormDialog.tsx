import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Service, ServiceInsert } from "@/hooks/useServices";

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (data: ServiceInsert) => void;
  loading?: boolean;
}

export function ServiceFormDialog({ open, onOpenChange, service, onSubmit, loading }: ServiceFormDialogProps) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service?.price?.toString() ?? "");
  const [durationMinutes, setDurationMinutes] = useState(service?.duration_minutes?.toString() ?? "30");
  const [category, setCategory] = useState(service?.category ?? "");
  const [active, setActive] = useState(service?.active ?? true);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(service?.name ?? "");
      setDescription(service?.description ?? "");
      setPrice(service?.price?.toString() ?? "");
      setDurationMinutes(service?.duration_minutes?.toString() ?? "30");
      setCategory(service?.category ?? "");
      setActive(service?.active ?? true);
    }
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(service?.id ? { id: service.id } : {}),
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price) || 0,
      duration_minutes: parseInt(durationMinutes) || 30,
      category: category.trim() || null,
      active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full h-full max-w-none m-0 rounded-none sm:max-w-lg sm:h-auto sm:rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min) *</Label>
              <Input id="duration" type="number" min="5" step="5" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={50} placeholder="Ex: Cabelo, Unha, Estética" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="active">Ativo</Label>
          </div>
          <DialogFooter className="gap-3 p-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
