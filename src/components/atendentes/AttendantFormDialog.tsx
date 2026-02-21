import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { Attendant, AttendantInsert } from "@/hooks/useAttendants";

const WEEK_DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

interface AttendantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendant?: Attendant | null;
  onSubmit: (data: AttendantInsert) => void;
  loading?: boolean;
}

export function AttendantFormDialog({ open, onOpenChange, attendant, onSubmit, loading }: AttendantFormDialogProps) {
  const getWorkDays = () => {
    if (attendant?.work_days && Array.isArray(attendant.work_days)) return attendant.work_days as number[];
    return [1, 2, 3, 4, 5, 6];
  };
  const getWorkHours = () => {
    if (attendant?.work_hours && typeof attendant.work_hours === "object" && !Array.isArray(attendant.work_hours)) {
      const wh = attendant.work_hours as Record<string, string>;
      return { start: wh.start || "08:00", end: wh.end || "18:00" };
    }
    return { start: "08:00", end: "18:00" };
  };

  const [name, setName] = useState(attendant?.name ?? "");
  const [specialty, setSpecialty] = useState(attendant?.specialty ?? "");
  const [phone, setPhone] = useState(attendant?.phone ?? "");
  const [commissionRate, setCommissionRate] = useState(attendant?.commission_rate?.toString() ?? "0");
  const [color, setColor] = useState(attendant?.color ?? "#6366f1");
  const [active, setActive] = useState(attendant?.active ?? true);
  const [workDays, setWorkDays] = useState<number[]>(getWorkDays());
  const [workStart, setWorkStart] = useState(getWorkHours().start);
  const [workEnd, setWorkEnd] = useState(getWorkHours().end);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(attendant?.name ?? "");
      setSpecialty(attendant?.specialty ?? "");
      setPhone(attendant?.phone ?? "");
      setCommissionRate(attendant?.commission_rate?.toString() ?? "0");
      setColor(attendant?.color ?? "#6366f1");
      setActive(attendant?.active ?? true);
      setWorkDays(getWorkDays());
      const wh = getWorkHours();
      setWorkStart(wh.start);
      setWorkEnd(wh.end);
    }
    onOpenChange(v);
  };

  const toggleDay = (day: number) => {
    setWorkDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(attendant?.id ? { id: attendant.id } : {}),
      name: name.trim(),
      specialty: specialty.trim() || null,
      phone: phone.trim() || null,
      commission_rate: parseFloat(commissionRate) || 0,
      color,
      active,
      work_days: workDays,
      work_hours: { start: workStart, end: workEnd },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{attendant ? "Editar Atendente" : "Novo Atendente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="att-name">Nome *</Label>
            <Input id="att-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="att-specialty">Especialidade</Label>
            <Input id="att-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} maxLength={100} placeholder="Ex: Colorista, Manicure" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="att-phone">Telefone</Label>
              <Input id="att-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="att-commission">Comissão (%)</Label>
              <Input id="att-commission" type="number" min="0" max="100" step="0.5" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dias de Trabalho</Label>
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.map((d) => (
                <label key={d.value} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={workDays.includes(d.value)} onCheckedChange={() => toggleDay(d.value)} />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="att-start">Início</Label>
              <Input id="att-start" type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="att-end">Fim</Label>
              <Input id="att-end" type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="att-color">Cor</Label>
              <input id="att-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="att-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="att-active">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
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
