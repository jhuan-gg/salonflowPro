import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, DollarSign, Scissors, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const hoje = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).split('/').reverse().join('-');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // 1. Contagens básicas
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      const { count: totalHoje } = await supabase.from("appointments").select("*", { count: 'exact', head: true }).eq("date", hoje);
      const { count: totalClientes } = await supabase.from("clients").select("*", { count: 'exact', head: true });
      const { count: totalServicos } = await supabase.from("services").select("*", { count: 'exact', head: true });

      const { data: pagamentosHoje } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", hojeInicio.toISOString());

      const faturamentoDiario = pagamentosHoje?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;


      // 2. Faturamento Mensal
      const primeiroDiaMes = new Date();
      primeiroDiaMes.setDate(1);
      primeiroDiaMes.setHours(0, 0, 0, 0); // Ajuste: garantindo que o início do mês comece à meia-noite
      const { data: pagamentosMes } = await supabase.from("payments").select("amount").gte("created_at", primeiroDiaMes.toISOString());
      const faturamento = pagamentosMes?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      // 3. Dados para Gráfico de Faturamento (Últimos 7 dias)
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6); // Ajuste: -6 dias + hoje = 7 dias
      seteDiasAtras.setHours(0, 0, 0, 0); // Ajuste: Iniciar precisamente na meia-noite local
      const { data: faturamentoSemanal } = await supabase.from("payments").select("amount, created_at").gte("created_at", seteDiasAtras.toISOString());

      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const revenueData = faturamentoSemanal?.reduce((acc: any, curr) => {
        const dia = diasSemana[new Date(curr.created_at).getDay()];
        acc[dia] = (acc[dia] || 0) + Number(curr.amount);
        return acc;
      }, {});

      const chartRevenue = diasSemana.map(dia => ({ name: dia, total: revenueData?.[dia] || 0 }));

      return {
        hoje: totalHoje || 0,
        clientes: totalClientes || 0,
        faturamento: faturamento,
        faturamentoDiario: faturamentoDiario,
        servicos: totalServicos || 0,
        chartRevenue
      };
    }
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const stats = [
    { label: "Faturamento Hoje", value: formatCurrency(statsData?.faturamentoDiario || 0), icon: DollarSign, color: "text-emerald-500" },
    { label: "Faturamento Mensal", value: formatCurrency(statsData?.faturamento || 0), icon: DollarSign, color: "text-green-600" },
    { label: "Agendamentos Hoje", value: statsData?.hoje.toString() || "0", icon: CalendarDays, color: "text-primary" },
    { label: "Clientes Ativos", value: statsData?.clientes.toString() || "0", icon: Users, color: "text-blue-500" },
    { label: "Serviços Ativos", value: statsData?.servicos.toString() || "0", icon: Scissors, color: "text-orange-500" },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground font-sans">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Visão geral do seu negócio {isLoading && "..."}</p>
          </div>
          <Button onClick={() => navigate("/agenda")} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Agendamento
          </Button>
        </div>


        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 font-sans">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className={index === 0 ? "col-span-2 md:col-span-1" : ""}
            >
              <CardContent className="p-4 md:p-6">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
                <div className="text-xl md:text-2xl font-bold">
                  {isLoading ? "---" : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-1 gap-6">
          <Card className="p-0 bg-transparent border-none shadow-none md:p-6 md:bg-card md:border md:border-border md:shadow-sm">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-sans">Desempenho Semanal (R$)</CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsData?.chartRevenue}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }} >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}