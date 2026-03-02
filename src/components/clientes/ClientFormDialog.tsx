import { useState, useEffect } from "react";
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState(client?.email ?? "");
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

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const maskCpfCnpj = (value: string) => {
    const raw = value.replace(/\D/g, "");
    if (raw.length <= 11) {
      return raw
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return raw
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  useEffect(() => {
    if (open) {
      setName(client?.name ?? "");
      setPhone(client?.phone ? maskPhone(client.phone) : "");
      setCpfCnpj(client?.cpf_cnpj ? maskCpfCnpj(client.cpf_cnpj) : "");
      setEmail(client?.email ?? "");
      setBirthDate(client?.birth_date ?? "");
      setAddress(client?.address ?? "");
      setNotes(client?.notes ?? "");
      setActive(client?.active ?? true);
    }
  }, [open, client]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanValue = (v: string) => v.replace(/\D/g, "");

    onSubmit({
      ...(client?.id ? { id: client.id } : {}),
      name: name.trim(),
      phone: cleanValue(phone) || null,
      cpf_cnpj: cleanValue(cpfCnpj) || null,
      email: email.trim() || null,
      birth_date: birthDate || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-[100dvh] max-w-none m-0 rounded-none sm:max-w-lg sm:h-auto sm:m-auto sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="cli-name">Nome *</Label>
            <Input id="cli-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cli-phone">Telefone</Label>
              <Input
                id="cli-phone"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-email">E-mail</Label>
              <Input id="cli-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cli-cpf">CPF / CNPJ</Label>
              <Input
                id="cli-cpf"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
              />
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
        </form>
          <DialogFooter className="gap-3 p-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
