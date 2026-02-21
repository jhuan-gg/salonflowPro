import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function Materiais() {
  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Materiais</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de estoque</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              A gestão de materiais será implementada na Fase 6.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
