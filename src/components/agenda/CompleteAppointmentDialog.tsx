import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Appointment } from "@/hooks/useAppointments";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "other", label: "Outros" },
];

interface CompleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function CompleteAppointmentDialog({ open, onOpenChange, appointment }: CompleteAppointmentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const qc = useQueryClient();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // FUNÇÃO PARA ENVIAR WHATSAPP
  const handleWhatsAppSend = (app: Appointment) => {
    const rawPhone = app.clients?.phone?.replace(/\D/g, "");
    if (!rawPhone || rawPhone.length < 10) {
      toast.error("Cliente sem telefone válido para WhatsApp.");
      return;
    }

    const formattedPhone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
    
    // ATENÇÃO: Use aqui a sua URL real da Vercel
    const receiptUrl = `${window.location.origin}/comprovante/${app.id}`;

    const mensagem = encodeURIComponent(
      `*Olá, ${app.clients?.name}!* 😊\n\n` +
      `Seu atendimento no *SalonFlow Pro* foi concluído.\n\n` +
      `📄 *Acesse seu comprovante digital aqui:* \n${receiptUrl}\n\n` +
      `Agradecemos a preferência! 💇‍♂️✨`
    );

    window.open(`https://wa.me/${formattedPhone}?text=${mensagem}`, "_blank");
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) return;

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "completed" as any })
        .eq("id", appointment.id);

      if (updateError) throw updateError;

      const commissionRate = appointment.attendants?.commission_rate ?? 0;
      const commissionAmount = (appointment.total_price * commissionRate) / 100;

      const { error: paymentError } = await supabase.from("payments").insert({
        appointment_id: appointment.id,
        amount: appointment.total_price,
        method: paymentMethod,
        commission_amount: commissionAmount,
      });

      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Atendimento concluído!");
      onOpenChange(false);

      // Pergunta após fechar o modal
      setTimeout(() => {
        const opcao = window.confirm(
          "Atendimento finalizado!\n\nDeseja enviar o comprovante para o WhatsApp do cliente?"
        );

        if (opcao && appointment) {
          handleWhatsAppSend(appointment);
        }
      }, 400);
    },
    onError: (error) => {
      console.error("Erro ao finalizar:", error);
      toast.error("Erro ao salvar o pagamento.");
    }
  });

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none m-0 rounded-none sm:max-w-lg sm:h-auto sm:rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Concluir Atendimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 bg-muted rounded-lg border space-y-2">
            <p className="text-sm"><strong>Cliente:</strong> {appointment.clients?.name}</p>
            <p className="text-sm"><strong>Valor:</strong> {formatCurrency(appointment.total_price)}</p>
            <p className="text-sm"><strong>Atendente:</strong> {appointment.attendants?.name}</p>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-3 p-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
            {completeMutation.isPending ? "Salvando..." : "Confirmar e Finalizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}