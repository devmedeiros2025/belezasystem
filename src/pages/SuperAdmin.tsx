import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Users, TrendingUp, Crown, Power, PowerOff, Calendar, LogOut, Plus } from "lucide-react";

interface Estabelecimento {
  id: string;
  nome: string;
  slug: string;
  plano: string;
  ativo: boolean;
  trial_expires_at: string | null;
  created_at: string;
  owner_user_id: string;
}

interface Metrics {
  totalEstabelecimentos: number;
  ativos: number;
  inativos: number;
  emTrial: number;
  planoBasico: number;
  planoPro: number;
  planoEnterprise: number;
}

export default function SuperAdmin() {
  const { usuarioLogado, logout } = useAuth();
  const navigate = useNavigate();
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEstab, setNewEstab] = useState({ nome: "", slug: "", ownerEmail: "", plano: "basico" });
  const [metrics, setMetrics] = useState<Metrics>({
    totalEstabelecimentos: 0,
    ativos: 0,
    inativos: 0,
    emTrial: 0,
    planoBasico: 0,
    planoPro: 0,
    planoEnterprise: 0,
  });

  useEffect(() => {
    fetchEstabelecimentos();
  }, []);

  const fetchEstabelecimentos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("estabelecimentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar estabelecimentos");
      console.error(error);
    } else {
      setEstabelecimentos(data || []);
      calculateMetrics(data || []);
    }
    setLoading(false);
  };

  const calculateMetrics = (data: Estabelecimento[]) => {
    const now = new Date();
    setMetrics({
      totalEstabelecimentos: data.length,
      ativos: data.filter((e) => e.ativo).length,
      inativos: data.filter((e) => !e.ativo).length,
      emTrial: data.filter((e) => {
        if (!e.trial_expires_at) return false;
        return new Date(e.trial_expires_at) > now && e.plano === "basico";
      }).length,
      planoBasico: data.filter((e) => e.plano === "basico").length,
      planoPro: data.filter((e) => e.plano === "pro").length,
      planoEnterprise: data.filter((e) => e.plano === "enterprise").length,
    });
  };

  const toggleAtivo = async (id: string, currentAtivo: boolean) => {
    const { error } = await supabase
      .from("estabelecimentos")
      .update({ ativo: !currentAtivo })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(currentAtivo ? "Estabelecimento desativado" : "Estabelecimento ativado");
      fetchEstabelecimentos();
    }
  };

  const updatePlano = async (id: string, plano: string) => {
    const { error } = await supabase
      .from("estabelecimentos")
      .update({ plano })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar plano");
    } else {
      toast.success("Plano atualizado com sucesso");
      fetchEstabelecimentos();
    }
  };

  const extendTrial = async (id: string, days: number) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    
    const { error } = await supabase
      .from("estabelecimentos")
      .update({ trial_expires_at: newExpiry.toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao estender trial");
    } else {
      toast.success(`Trial estendido por ${days} dias`);
      fetchEstabelecimentos();
    }
  };

  const getTrialStatus = (est: Estabelecimento) => {
    if (!est.trial_expires_at || est.plano !== "basico") return null;
    const expiresAt = new Date(est.trial_expires_at);
    const now = new Date();
    const daysLeft = differenceInDays(expiresAt, now);
    
    if (daysLeft < 0) return { label: "Expirado", variant: "destructive" as const };
    if (daysLeft <= 1) return { label: `${daysLeft}d restante`, variant: "destructive" as const };
    return { label: `${daysLeft}d restantes`, variant: "secondary" as const };
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleCreateEstabelecimento = async () => {
    if (!newEstab.nome.trim() || !newEstab.ownerEmail.trim()) {
      toast.error("Preencha o nome e e-mail do proprietário");
      return;
    }

    setCreating(true);
    try {
      // Find user by email in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", newEstab.ownerEmail.trim().toLowerCase())
        .single();

      if (!profile) {
        toast.error("Usuário não encontrado. Verifique se o e-mail está cadastrado no sistema.");
        setCreating(false);
        return;
      }

      const slug = newEstab.slug.trim() || generateSlug(newEstab.nome);

      const { error } = await supabase.from("estabelecimentos").insert({
        nome: newEstab.nome.trim(),
        slug,
        plano: newEstab.plano,
        owner_user_id: profile.user_id,
      });

      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        // Link profile to establishment
        const { data: estab } = await supabase
          .from("estabelecimentos")
          .select("id")
          .eq("slug", slug)
          .single();

        if (estab) {
          await supabase
            .from("profiles")
            .update({ estabelecimento_id: estab.id })
            .eq("user_id", profile.user_id);
        }

        toast.success("Estabelecimento criado com sucesso!");
        setCreateOpen(false);
        setNewEstab({ nome: "", slug: "", ownerEmail: "", plano: "basico" });
        fetchEstabelecimentos();
      }
    } catch {
      toast.error("Erro inesperado ao criar estabelecimento");
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Super Admin</h1>
              <p className="text-xs text-muted-foreground">Painel de Controle SaaS</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{usuarioLogado?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.totalEstabelecimentos}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Power className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{metrics.ativos}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <PowerOff className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{metrics.inativos}</p>
                  <p className="text-xs text-muted-foreground">Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{metrics.emTrial}</p>
                  <p className="text-xs text-muted-foreground">Em Trial</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-bold">{metrics.planoBasico}</p>
              <p className="text-xs text-muted-foreground">Básico</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-bold text-primary">{metrics.planoPro}</p>
              <p className="text-xs text-muted-foreground">Pro</p>
            </CardContent>
          </Card>
          <Card className="gold-gradient">
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-bold text-primary-foreground">{metrics.planoEnterprise}</p>
              <p className="text-xs text-primary-foreground/80">Enterprise</p>
            </CardContent>
          </Card>
        </div>

        {/* Estabelecimentos Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Estabelecimentos Cadastrados</CardTitle>
              <CardDescription>Gerencie todos os salões, barbearias e clínicas</CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gold-gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Estabelecimento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Estabelecimento</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo salão/barbearia no sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Estabelecimento *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Beleza & Estilo"
                      value={newEstab.nome}
                      onChange={(e) => setNewEstab({ ...newEstab, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      placeholder="beleza-estilo (gerado automaticamente)"
                      value={newEstab.slug}
                      onChange={(e) => setNewEstab({ ...newEstab, slug: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">E-mail do Proprietário *</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="proprietario@email.com"
                      value={newEstab.ownerEmail}
                      onChange={(e) => setNewEstab({ ...newEstab, ownerEmail: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      O proprietário deve estar cadastrado no sistema
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano">Plano</Label>
                    <Select value={newEstab.plano} onValueChange={(v) => setNewEstab({ ...newEstab, plano: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico">Básico (com trial)</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateEstabelecimento} disabled={creating}>
                    {creating ? "Criando..." : "Criar Estabelecimento"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estabelecimentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Nenhum estabelecimento cadastrado ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  estabelecimentos.map((est) => {
                    const trialStatus = getTrialStatus(est);
                    return (
                      <TableRow key={est.id}>
                        <TableCell className="font-medium">{est.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{est.slug}</TableCell>
                        <TableCell>
                          <Select
                            value={est.plano}
                            onValueChange={(value) => updatePlano(est.id, value)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basico">Básico</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {trialStatus ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={trialStatus.variant}>{trialStatus.label}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => extendTrial(est.id, 7)}
                              >
                                +7d
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={est.ativo ? "default" : "secondary"}>
                            {est.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(est.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={est.ativo ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleAtivo(est.id, est.ativo)}
                          >
                            {est.ativo ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-1" /> Desativar
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-1" /> Ativar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
