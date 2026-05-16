import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, BarChart3, TrendingUp, Users, Calculator, Calendar as CalendarIcon, ArrowDownCircle, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function Relatorios() {
  // Inicializamos a data para pegar por padrão os últimos 30 dias
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const queryClient = useQueryClient();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", date: new Date().toISOString().split("T")[0] });

  const { data: records, isLoading } = useQuery({
    queryKey: ["reports-data-range"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          date,
          total_price,
          clients (name),
          attendants (id, name, commission_rate),
          payments (amount, commission_amount, method)
        `)
        .eq("status", "completed")
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    
    return records.filter((item) => {
      // Ajusta o fuso horário para bater corretamente com as datas locais
      const itemDateStr = item.date.split("T")[0] || item.date;
      
      // Filtrar pelo range selecionado
      if (startDate && itemDateStr < startDate) return false;
      if (endDate && itemDateStr > endDate) return false;
      
      return true;
    });
  }, [records, startDate, endDate]);

  const { data: expensesRecords, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses-data-range"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          // Tabela não existe ainda
          return [];
        }
        throw error;
      }
      return data;
    },
  });

  const filteredExpenses = useMemo(() => {
    if (!expensesRecords) return [];
    
    return expensesRecords.filter((item) => {
      const itemDateStr = item.date.split("T")[0] || item.date;
      if (startDate && itemDateStr < startDate) return false;
      if (endDate && itemDateStr > endDate) return false;
      return true;
    });
  }, [expensesRecords, startDate, endDate]);

  const summaryByAttendant = useMemo(() => {
    const summary: Record<string, { name: string, totalFaturamento: number, totalComissao: number, atendimentos: number }> = {};
    
    filteredRecords?.forEach(item => {
      const attendantId = item.attendants?.id;
      if (!attendantId) return;

      if (!summary[attendantId]) {
        summary[attendantId] = {
          name: item.attendants?.name || 'Desconhecido',
          totalFaturamento: 0,
          totalComissao: 0,
          atendimentos: 0
        };
      }

      summary[attendantId].totalFaturamento += item.total_price || 0;
      
      const comissao = item.payments?.[0]?.commission_amount || 0;
      summary[attendantId].totalComissao += comissao;
      summary[attendantId].atendimentos += 1;
    });

    return Object.values(summary).sort((a, b) => b.totalFaturamento - a.totalFaturamento);
  }, [filteredRecords]);

  // Calculos Globais
  const totalGeral = summaryByAttendant.reduce((acc, curr) => acc + curr.totalFaturamento, 0);
  const comissaoGeral = summaryByAttendant.reduce((acc, curr) => acc + curr.totalComissao, 0);
  const totalSaidas = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalAtendimentos = summaryByAttendant.reduce((acc, curr) => acc + curr.atendimentos, 0);
  const receitaLiquida = totalGeral - comissaoGeral - totalSaidas;
  const ticketMedio = totalAtendimentos > 0 ? totalGeral / totalAtendimentos : 0;

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: { description: string, amount: number, date: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert([{
          description: expenseData.description,
          amount: expenseData.amount,
          date: expenseData.date
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses-data-range"] });
      toast.success("Saída registrada com sucesso!");
      setIsExpenseModalOpen(false);
      setNewExpense({ description: "", amount: "", date: new Date().toISOString().split("T")[0] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao registrar saída. Verifique se a tabela foi criada no banco.");
    }
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.date) {
      toast.error("Preencha todos os campos");
      return;
    }
    addExpenseMutation.mutate({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount.replace(',', '.')),
      date: newExpense.date
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDownloadGeral = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.error("Sem dados para exportar nesse período.");
      return;
    }
    
    const headers = ["Data", "Cliente", "Atendente", "Método", "Valor cobrado", "Comissão"];
    const rows = filteredRecords.map(r => {
      const dateStr = formatDateString(r.date);
      const comissao = r.payments?.[0]?.commission_amount || 0;
      const metodo = r.payments?.[0]?.method || '-';
      return `${dateStr},"${r.clients?.name}","${r.attendants?.name}",${metodo},${r.total_price},${comissao}`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_geral_${startDate}_ate_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Download do relatório detalhado iniciado!");
  };

  const handleDownloadComissoes = () => {
    if (!summaryByAttendant || summaryByAttendant.length === 0) {
      toast.error("Sem dados para exportar nesse período.");
      return;
    }
    
    const headers = ["Atendente", "Qtd. Atendimentos", "Faturamento Total", "Comissão Total", "Média por Atendimento"];
    const rows = summaryByAttendant.map(s => `"${s.name}",${s.atendimentos},${s.totalFaturamento},${s.totalComissao},${s.totalFaturamento / s.atendimentos}`);

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_comissoes_${startDate}_ate_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Download do relatório de comissões iniciado!");
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in font-sans pb-24 md:pb-8 text-foreground">
        
        {/* Cabeçalho e Filtros */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Relatórios e Dados
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Painel avançado de métricas, filtros por período e análise de comissões.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-medium text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Data Inicial
              </label>
              <Input 
                type="date" 
                className="w-full sm:w-[150px] bg-background border-border shadow-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="hidden sm:flex self-end pb-3 text-muted-foreground">até</div>
            
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-medium text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Data Final
              </label>
              <Input 
                type="date" 
                className="w-full sm:w-[150px] bg-background border-border shadow-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Blocos de Métricas Elaboradas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-l-4 border-l-primary/70">
            <CardContent className="p-4 md:p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full">
                  <p className="text-sm font-semibold text-foreground">Faturamento Bruto</p>
                  <p className="text-[10px] text-muted-foreground mb-1">(Dinheiro total que entrou)</p>
                  <p className="text-xl md:text-2xl font-bold truncate">{formatCurrency(totalGeral)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-l-4 border-l-destructive/70">
            <CardContent className="p-4 md:p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full">
                  <p className="text-sm font-semibold text-foreground">Comissões Pagas</p>
                  <p className="text-[10px] text-muted-foreground mb-1">(Repasse aos Atendentes)</p>
                  <p className="text-xl md:text-2xl font-bold text-destructive/80 truncate">{formatCurrency(comissaoGeral)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-l-4 border-l-green-500/70">
            <CardContent className="p-4 md:p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full">
                  <p className="text-sm font-semibold text-foreground">Caixa Líquido do Salão</p>
                  <p className="text-[10px] text-muted-foreground mb-1">(O que sobrou dos atendimentos)</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 truncate">{formatCurrency(receitaLiquida)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-l-4 border-l-orange-500/70">
            <CardContent className="p-4 md:p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full">
                  <p className="text-sm font-semibold text-foreground">Saídas</p>
                  <p className="text-[10px] text-muted-foreground mb-1">(Gastos, materiais, contas)</p>
                  <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400 truncate">{formatCurrency(totalSaidas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabelas de Listagem de Dados */}
        <Tabs defaultValue="comissoes" className="w-full">
          <div className="sticky top-[64px] z-10 bg-background pt-2 pb-1">
            <TabsList className="w-full flex md:justify-start overflow-x-auto rounded-xl p-1 bg-muted">
              <TabsTrigger value="comissoes" className="flex-1 md:flex-none px-6 py-2 rounded-lg gap-2">
                <Users className="h-4 w-4" /> Resumo por Equipe
              </TabsTrigger>
              <TabsTrigger value="geral" className="flex-1 md:flex-none px-6 py-2 rounded-lg gap-2">
                <TrendingUp className="h-4 w-4" /> Extrato Completo
              </TabsTrigger>
              <TabsTrigger value="saidas" className="flex-1 md:flex-none px-6 py-2 rounded-lg gap-2">
                <ArrowDownCircle className="h-4 w-4" /> Saídas
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="comissoes" className="mt-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <CardTitle className="text-lg">Performance de Atendentes</CardTitle>
                <Button variant="default" className="w-full sm:w-auto shadow-sm" onClick={handleDownloadComissoes}>
                  <Download className="mr-2 h-4 w-4" /> Baixar Tabela (CSV)
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <p className="text-center py-10 text-muted-foreground animate-pulse">Carregando métricas...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-semibold px-4 md:px-6">Profissional</TableHead>
                          <TableHead className="text-center font-semibold">Volume (Qtd)</TableHead>
                          <TableHead className="text-right font-semibold">Bruto Gerado</TableHead>
                          <TableHead className="text-right font-semibold px-4 md:px-6">Sua Comissão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summaryByAttendant.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Nenhuma performance no período selecionado.</TableCell></TableRow>
                        ) : summaryByAttendant.map((item, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="font-medium px-4 md:px-6">{item.name}</TableCell>
                            <TableCell className="text-center">
                              <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-semibold">{item.atendimentos}</span>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(item.totalFaturamento)}</TableCell>
                            <TableCell className="text-right font-bold text-primary px-4 md:px-6">{formatCurrency(item.totalComissao)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geral" className="mt-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <CardTitle className="text-lg">Extrato Histórico Detalhado</CardTitle>
                <Button variant="default" className="w-full sm:w-auto shadow-sm" onClick={handleDownloadGeral}>
                  <Download className="mr-2 h-4 w-4" /> Baixar Tabela (CSV)
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                   <p className="text-center py-10 text-muted-foreground animate-pulse">Buscando histórico completo...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-semibold px-4 md:px-6 whitespace-nowrap">Data</TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">Cliente</TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">Atendente</TableHead>
                          <TableHead className="text-right font-semibold whitespace-nowrap">Bruto</TableHead>
                          <TableHead className="text-right font-semibold px-4 md:px-6 whitespace-nowrap">Comissão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords?.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum atendimento no período selecionado.</TableCell></TableRow>
                        ) : filteredRecords?.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell className="px-4 md:px-6 whitespace-nowrap text-sm">{formatDateString(item.date)}</TableCell>
                            <TableCell className="whitespace-nowrap font-medium text-sm">{item.clients?.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{item.attendants?.name}</TableCell>
                            <TableCell className="text-right whitespace-nowrap text-sm">{formatCurrency(item.total_price)}</TableCell>
                            <TableCell className="text-right text-destructive/80 px-4 md:px-6 whitespace-nowrap font-medium text-sm">{formatCurrency(item.payments?.[0]?.commission_amount || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saidas" className="mt-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <CardTitle className="text-lg">Extrato de Saídas</CardTitle>
                <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="w-full sm:w-auto shadow-sm">
                      <Plus className="mr-2 h-4 w-4" /> Nova Saída
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Registrar Nova Saída</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Descrição</label>
                        <Input 
                          placeholder="Ex: Pagamento de Luz, Material, etc."
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Valor</label>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data do Pagamento</label>
                        <Input 
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        />
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={addExpenseMutation.isPending}>
                          {addExpenseMutation.isPending ? "Salvando..." : "Salvar Saída"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingExpenses ? (
                   <p className="text-center py-10 text-muted-foreground animate-pulse">Buscando saídas...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-semibold px-4 md:px-6 whitespace-nowrap">Data</TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">Descrição</TableHead>
                          <TableHead className="text-right font-semibold px-4 md:px-6 whitespace-nowrap">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExpenses?.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Nenhuma saída no período selecionado.</TableCell></TableRow>
                        ) : filteredExpenses?.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell className="px-4 md:px-6 whitespace-nowrap text-sm">{formatDateString(item.date)}</TableCell>
                            <TableCell className="whitespace-nowrap font-medium text-sm">{item.description}</TableCell>
                            <TableCell className="text-right text-destructive/80 px-4 md:px-6 whitespace-nowrap font-medium text-sm">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

