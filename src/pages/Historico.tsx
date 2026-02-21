import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Search, MessageCircle, Copy, ExternalLink, Calendar, User, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

export default function Historico() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: ["appointments-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (name, phone),
          attendants (name),
          payments (method, amount),
          appointment_services (
            services (name)
          )
        `)
        .eq("status", "completed")
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/comprovante/${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link do comprovante copiado!");
  };

  const handleWhatsAppShare = (item: any) => {
    const phone = item.clients?.phone?.replace(/\D/g, "");
    if (!phone) {
      toast.error("Cliente não possui telefone cadastrado.");
      return;
    }
    const link = `${window.location.origin}/comprovante/${item.id}`;
    const text = encodeURIComponent(`Olá, ${item.clients.name}! Aqui está o seu comprovante do atendimento: ${link}`);
    window.open(`https://wa.me/55${phone}?text=${text}`, "_blank");
  };

  const filteredHistory = history?.filter((item) =>
    item.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.attendants?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in font-sans pb-24 md:pb-8 text-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Histórico</h1>
            <p className="text-muted-foreground text-sm mt-1">Consulte atendimentos realizados</p>
          </div>

          {/* Input ajustado para tema escuro */}
          <div className="flex items-center gap-2 w-full md:max-w-sm bg-background rounded-lg px-3 border border-input shadow-sm focus-within:ring-1 focus-within:ring-primary">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente..." 
              className="border-none focus-visible:ring-0 shadow-none bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- VERSÃO MOBILE (CARDS) --- */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {isLoading ? (
            <p className="text-center py-10 text-muted-foreground animate-pulse">Carregando...</p>
          ) : filteredHistory?.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border shadow-sm bg-card">
              <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.date).toLocaleDateString('pt-BR')}
                </span>
                <Badge variant="outline" className="text-[10px] font-normal border-primary/20 text-primary">
                  {item.payments?.[0]?.method || "Dinheiro"}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    {/* Texto em Foreground para garantir contraste no Dark Mode */}
                    <h3 className="font-bold text-foreground">{item.clients?.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.attendants?.name}
                    </p>
                  </div>
                  <span className="font-bold text-primary">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {item.appointment_services?.map((as: any, idx: number) => (
                    <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border border-border">
                      {as.services?.name}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="h-9 gap-1 text-xs border-primary/20 hover:bg-primary/10" onClick={() => handleWhatsAppShare(item)}>
                    <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 gap-1 text-xs border-border" onClick={() => handleCopyLink(item.id)}>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Link
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 gap-1 text-xs border-primary/20 text-primary hover:bg-primary/10" onClick={() => window.open(`/comprovante/${item.id}`, "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5" /> Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* --- VERSÃO DESKTOP (TABELA) --- */}
        <div className="hidden md:block">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-sans">
                <History className="h-5 w-5 text-primary" />
                Relatório Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-foreground font-semibold">Data</TableHead>
                        <TableHead className="text-foreground font-semibold">Cliente</TableHead>
                        <TableHead className="text-foreground font-semibold">Pagamento</TableHead>
                        <TableHead className="text-right text-foreground font-semibold">Total</TableHead>
                        <TableHead className="text-center w-[150px] text-foreground font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-10">Carregando...</TableCell></TableRow>
                      ) : filteredHistory?.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 border-border">
                          <TableCell className="font-medium text-foreground">
                            {new Date(item.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-sm text-foreground">{item.clients?.name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize bg-secondary text-secondary-foreground hover:bg-secondary">
                              {item.payments?.[0]?.method || "Dinheiro"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => handleWhatsAppShare(item)}>
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>WhatsApp</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleCopyLink(item.id)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copiar Link</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => window.open(`/comprovante/${item.id}`, "_blank")}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver Comprovante</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}