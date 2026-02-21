import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2 } from "lucide-react";

export default function Receipt() {
    const { id } = useParams();

    const { data: appointment, isLoading } = useQuery({
        queryKey: ["public-receipt", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("appointments")
                .select(`
            *,
            clients (name),
            attendants (name),
            appointment_services (
                services (name, price)
            )
        `)
                .eq("id", id)
                .single();

            if (error) throw error;

            console.log("Dados do agendamento:", data);

            return data;
        },
    });

    const formatDate = (obj: any) => {
        try {
            if (!obj?.date || !obj?.start_time) return "Data não disponível";

            const combinedDateTime = `${obj.date}T${obj.start_time}`;
            const date = new Date(combinedDateTime);

            if (isNaN(date.getTime())) return "Formato inválido";

            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch (e) {
            return "Erro ao formatar data";
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

    if (isLoading) return <div className="flex h-screen items-center justify-center font-sans text-muted-foreground">Carregando comprovante...</div>;
    if (!appointment) return <div className="flex h-screen items-center justify-center text-destructive">Comprovante não encontrado.</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans antialiased text-slate-900 dark:bg-slate-50 dark:text-slate-900">
            <div className="mx-auto max-w-md bg-white p-8 rounded-xl border border-gray-200 dark:bg-white dark:border-gray-200">

                <div className="text-center space-y-2 mb-8">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">SALONFLOW PRO</h1>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Comprovante de Serviço</p>
                </div>

                <div className="space-y-4 border-t border-b border-dashed border-gray-300 py-6 my-6 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Cliente:</span>
                        <span className="font-semibold text-gray-900 text-right">{appointment.clients?.name || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Data e Hora:</span>
                        <span className="font-semibold text-gray-900 text-right">
                            {formatDate(appointment)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Atendente:</span>
                        <span className="font-semibold text-gray-900 text-right">{appointment.attendants?.name || 'Não informado'}</span>
                    </div>

                    <div className="pt-2">
                        <span className="text-gray-500 block mb-2">Serviços:</span>
                        <div className="space-y-2">
                            {appointment.appointment_services && appointment.appointment_services.length > 0 ? (
                                appointment.appointment_services.map((as: any, idx: number) => (
                                    <div key={idx} className="flex justify-between pl-2 border-l-2 border-primary/30">
                                        <span className="text-gray-700">{as.services?.name}</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(as.services?.price || 0)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic">Nenhum serviço listado.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-8">
                    <span className="text-lg font-bold text-gray-900">TOTAL PAGO</span>
                    <span className="text-2xl font-extrabold text-primary">
                        {formatCurrency(appointment.total_price)}
                    </span>
                </div>

                <div className="flex flex-col gap-3 print:hidden">
                    <Button
                        onClick={() => window.print()}
                        className="w-full gap-2 bg-primary hover:bg-primary/90 text-white"
                    >
                        <Printer className="w-4 h-4" /> Imprimir ou Salvar PDF
                    </Button>
                    <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                        Obrigado pela preferência!
                    </p>
                </div>
            </div>
        </div>
    );
}