import { useState, useMemo, useEffect } from "react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, Check } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useAttendants } from "@/hooks/useAttendants";
import { cn } from "@/lib/utils";


interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    id?: string; 
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
  initialData?: any; 
}

const RETURN_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 15, label: "15 dias" },
  { value: 20, label: "20 dias" },
  { value: 25, label: "25 dias" },
  { value: 30, label: "30 dias" },
];

export function AppointmentFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  loading, 
  initialDate,
  initialData 
}: AppointmentFormDialogProps) {
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
  if (open) {
    if (initialData) {
      setClientId(initialData.client_id || "");
      setAttendantId(initialData.attendant_id || "");
      setDate(initialData.date || "");
      setStartTime(initialData.start_time?.slice(0, 5) || "09:00");
      setNotes(initialData.notes || "");
      setReturnDays(initialData.return_days || null);

      const serviceIds = initialData.appointment_services?.map((as: any) => as.service_id) || [];
      setSelectedServices(serviceIds);
      
    } else {
      setClientId("");
      setAttendantId("");
      setDate(initialDate || new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setNotes("");
      setSelectedServices([]);
      setReturnDays(null);
    }
  }
}, [open, initialData, initialDate]);

  const activeClients = clients?.filter((c) => c.active || c.id === clientId) ?? [];
  const activeServices = services?.filter((s) => s.active || selectedServices.includes(s.id)) ?? [];
  const activeAttendants = attendants?.filter((a) => a.active || a.id === attendantId) ?? [];

  const filteredServices = useMemo(() => {
    if (!searchTerm) return activeServices;
    return activeServices.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activeServices]);

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
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(initialData?.id && { id: initialData.id }), 
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
          <DialogTitle>{initialData ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4" id="appointment-form">
            <div className="space-y-2">
              <Label>Clientes *</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={!!initialData}>
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
              
              {/* Input de Busca */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>

              {/* Lista Resultante */}
              <div className="border rounded-lg p-1 space-y-1 max-h-48 overflow-y-auto bg-background">
                {filteredServices.length === 0 ? (
                  <p className="text-xs text-center py-4 text-muted-foreground">
                    Nenhum serviço encontrado
                  </p>
                ) : (
                  filteredServices.map((s) => {
                    const isSelected = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={cn(
                          "flex items-center justify-between gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors",
                          isSelected && "bg-accent/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatCurrency(s.price)}</span>
                      </div>
                    );
                  })
                )}
              </div>
              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedServices.map((sid) => {
                    const svc = activeServices.find((s) => s.id === sid);
                    return svc ? (
                      <Badge key={sid} variant="secondary" className="gap-1 pr-1">
                        {svc.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleService(sid);
                          }} 
                        />
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
              <Textarea id="appt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} placeholder="Ex: Adicionar novos serviços durante a consulta..." />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter className="gap-3 p-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="appointment-form" disabled={loading || !canSubmit}>
            {loading ? "Salvando..." : initialData ? "Salvar Alterações" : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}