import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useAttendants } from "@/hooks/useAttendants";

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    client_id: string;
    attendant_id: string;
    date: string;
    start_time: string;
    notes: string;
    service_ids: string[];
    total_price: number;
    return_days: number | null;
  }) => void;
  loading?: boolean;
  initialDate?: string;
}

const RETURN_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 15, label: "15 dias" },
  { value: 20, label: "20 dias" },
  { value: 25, label: "25 dias" },
  { value: 30, label: "30 dias" },
];

export function AppointmentFormDialog({ open, onOpenChange, onSubmit, loading, initialDate }: AppointmentFormDialogProps) {
  const { data: clients } = useClients();
  const { data: services } = useServices();
  const { data: attendants } = useAttendants();

  const [clientId, setClientId] = useState("");
  const [attendantId, setAttendantId] = useState("");
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [returnDays, setReturnDays] = useState<number | null>(null);

  const activeClients = clients?.filter((c) => c.active) ?? [];
  const activeServices = services?.filter((s) => s.active) ?? [];
  const activeAttendants = attendants?.filter((a) => a.active) ?? [];

  const totalPrice = useMemo(() => {
    return activeServices
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices, activeServices]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setClientId("");
      setAttendantId("");
      setDate(initialDate || new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setNotes("");
      setSelectedServices([]);
      setReturnDays(null);
    }
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      client_id: clientId,
      attendant_id: attendantId,
      date,
      start_time: startTime,
      notes: notes.trim(),
      service_ids: selectedServices,
      total_price: totalPrice,
      return_days: returnDays,
    });
  };

  const canSubmit = clientId && attendantId && date && startTime && selectedServices.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full h-[100dvh] max-w-none m-0 rounded-none sm:max-w-lg sm:h-auto sm:m-auto sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[100vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4" id="appointment-form">
            <div className="space-y-2">
              <Label>Clientes *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {activeClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Serviços *</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {activeServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
                ) : (
                  activeServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <Checkbox
                        checked={selectedServices.includes(s.id)}
                        onCheckedChange={() => toggleService(s.id)}
                      />
                      <span className="text-sm flex-1">{s.name}</span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(s.price)}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedServices.map((sid) => {
                    const svc = activeServices.find((s) => s.id === sid);
                    return svc ? (
                      <Badge key={sid} variant="secondary" className="gap-1">
                        {svc.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleService(sid)} />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Atendente *</Label>
              <Select value={attendantId} onValueChange={setAttendantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o atendente" />
                </SelectTrigger>
                <SelectContent>
                  {activeAttendants.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: a.color }} />
                        {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appt-date">Data *</Label>
                <Input id="appt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-time">Horário *</Label>
                <Input id="appt-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valor Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Retorno Automático</Label>
              <div className="flex flex-wrap gap-2">
                {RETURN_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={returnDays === opt.value}
                      onCheckedChange={(checked) => setReturnDays(checked ? opt.value : null)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-notes">Observações</Label>
              <Textarea id="appt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} placeholder="Observações opcionais..." />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter className="gap-3 p-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="appointment-form" disabled={loading || !canSubmit}>
            {loading ? "Salvando..." : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
