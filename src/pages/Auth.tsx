import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { constants } from "buffer";

export default function Auth() {
  const { session, loading, signIn } = useAuth(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;

    } catch (err: any) {
      toast({
        title: "Erro de acesso",
        description: "Credenciais inválidas ou acesso não autorizado.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isMobile ? (
        <div className="flex items-center flex-col justify-between min-h-screen bg-background p-4">
          <div />
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Scissors className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">SaloonFlow</CardTitle>
                <CardDescription>
                  Acesso restrito para colaboradores.
                </CardDescription>
              </div>
            </CardHeader>
          </div>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? "Verificando..." : "Entrar no Sistema"}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">
                Precisa de acesso? Entre em contato com o administrador.
              </p>
            </div>
          </CardContent>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="w-full max-w-md animate-fade-in">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Scissors className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">SaloonFlow</CardTitle>
                <CardDescription>
                  Acesso restrito para colaboradores.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={submitting}>
                  {submitting ? "Verificando..." : "Entrar no Sistema"}
                </Button>
              </form>

              <div className="mt-6 p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">
                  Precisa de acesso? Entre em contato com o administrador.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}