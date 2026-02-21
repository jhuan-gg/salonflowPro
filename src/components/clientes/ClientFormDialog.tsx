import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Client, ClientInsert } from "@/hooks/useClients";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: ClientInsert) => void;
  loading?: boolean;
}

export function ClientFormDialog({ open, onOpenChange, client, onSubmit, loading }: ClientFormDialogProps) {
  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [cpfCnpj, setCpfCnpj] = useState(client?.cpf_cnpj ?? "");
  const [birthDate, setBirthDate] = useState(client?.birth_date ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [active, setActive] = useState(client?.active ?? true);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(client?.name ?? "");
      setPhone(client?.phone ?? "");
      setEmail(client?.email ?? "");
      setCpfCnpj(client?.cpf_cnpj ?? "");
      setBirthDate(client?.birth_date ?? "");
      setAddress(client?.address ?? "");
      setNotes(client?.notes ?? "");
      setActive(client?.active ?? true);
    }
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(client?.id ? { id: client.id } : {}),
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      cpf_cnpj: cpfCnpj.trim() || null,
      birth_date: birthDate || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full h-full max-w-none m-0 rounded-none sm:max-w-lg sm:h-auto sm:rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cli-name">Nome *</Label>
            <Input id="cli-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cli-phone">Telefone</Label>
              <Input id="cli-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-email">E-mail</Label>
              <Input id="cli-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cli-cpf">CPF/CNPJ</Label>
              <Input id="cli-cpf" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} maxLength={18} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-birth">Data de Nascimento</Label>
              <Input id="cli-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-address">Endereço</Label>
            <Input id="cli-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-notes">Observações</Label>
            <Textarea id="cli-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cli-active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="cli-active">Ativo</Label>
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
