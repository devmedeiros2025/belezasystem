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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Users, Crown, Power, PowerOff, Calendar, LogOut, Plus, Trash2, UserPlus, Globe, Mail, Shield, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  ativo: boolean;
  estabelecimento_id: string | null;
  created_at: string;
  role?: string;
}

interface AuthUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string;
  providers: string[];
  avatar_url: string | null;
  full_name: string | null;
  is_google: boolean;
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEstab, setNewEstab] = useState({ nome: "", slug: "", ownerEmail: "", plano: "basico" });
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ nome: "", email: "", senha: "", role: "colaborador" });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    totalEstabelecimentos: 0, ativos: 0, inativos: 0, emTrial: 0,
    planoBasico: 0, planoPro: 0, planoEnterprise: 0,
  });

  useEffect(() => {
    fetchEstabelecimentos();
    fetchUsers();
  }, []);

  const fetchEstabelecimentos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("estabelecimentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar estabelecimentos");
    } else {
      setEstabelecimentos(data || []);
      calculateMetrics(data || []);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("*");

    const rolesMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
    
    setUsers(
      (profiles || []).map((p) => ({
        ...p,
        role: rolesMap.get(p.user_id) || "colaborador",
      }))
    );
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
    return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleCreateEstabelecimento = async () => {
    if (!newEstab.nome.trim() || !newEstab.ownerEmail.trim()) {
      toast.error("Preencha o nome e e-mail do proprietário");
      return;
    }
    setCreating(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", newEstab.ownerEmail.trim().toLowerCase())
        .single();

      if (!profile) {
        toast.error("Usuário não encontrado. Verifique se o e-mail está cadastrado.");
        setCreating(false);
        return;
      }

      const slug = newEstab.slug.trim() || generateSlug(newEstab.nome);
      const { error } = await supabase.from("estabelecimentos").insert({
        nome: newEstab.nome.trim(), slug, plano: newEstab.plano, owner_user_id: profile.user_id,
      });

      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        const { data: estab } = await supabase.from("estabelecimentos").select("id").eq("slug", slug).single();
        if (estab) {
          await supabase.from("profiles").update({ estabelecimento_id: estab.id }).eq("user_id", profile.user_id);
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

  const handleCreateUser = async () => {
    if (!newUser.nome.trim() || !newUser.email.trim() || !newUser.senha.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (newUser.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newUser.email.trim(), password: newUser.senha, nome: newUser.nome.trim(), role: newUser.role },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Erro ao criar usuário");
      } else {
        toast.success("Usuário criado com sucesso!");
        setCreateUserOpen(false);
        setNewUser({ nome: "", email: "", senha: "", role: "colaborador" });
        fetchUsers();
      }
    } catch {
      toast.error("Erro inesperado ao criar usuário");
    }
    setCreatingUser(false);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Erro ao excluir usuário");
      } else {
        toast.success("Usuário excluído com sucesso!");
        setDeleteUserId(null);
        fetchUsers();
      }
    } catch {
      toast.error("Erro inesperado ao excluir usuário");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao atualizar role");
    } else {
      toast.success("Role atualizada!");
      fetchUsers();
    }
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Administrador",
      financeiro: "Financeiro",
      colaborador: "Colaborador",
    };
    return map[role] || role;
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

        {/* Tabs */}
        <Tabs defaultValue="estabelecimentos">
          <TabsList>
            <TabsTrigger value="estabelecimentos" className="gap-2">
              <Building2 className="w-4 h-4" /> Estabelecimentos
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="w-4 h-4" /> Usuários ({users.length})
            </TabsTrigger>
          </TabsList>

          {/* Estabelecimentos Tab */}
          <TabsContent value="estabelecimentos">
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
                      <DialogDescription>Preencha os dados para criar um novo salão/barbearia.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome do Estabelecimento *</Label>
                        <Input placeholder="Ex: Beleza & Estilo" value={newEstab.nome} onChange={(e) => setNewEstab({ ...newEstab, nome: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug (URL)</Label>
                        <Input placeholder="beleza-estilo (gerado automaticamente)" value={newEstab.slug} onChange={(e) => setNewEstab({ ...newEstab, slug: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail do Proprietário *</Label>
                        <Input type="email" placeholder="proprietario@email.com" value={newEstab.ownerEmail} onChange={(e) => setNewEstab({ ...newEstab, ownerEmail: e.target.value })} />
                        <p className="text-xs text-muted-foreground">O proprietário deve estar cadastrado no sistema</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Plano</Label>
                        <Select value={newEstab.plano} onValueChange={(v) => setNewEstab({ ...newEstab, plano: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basico">Básico (com trial)</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreateEstabelecimento} disabled={creating}>{creating ? "Criando..." : "Criar Estabelecimento"}</Button>
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
                              <Select value={est.plano} onValueChange={(value) => updatePlano(est.id, value)}>
                                <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
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
                                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => extendTrial(est.id, 7)}>+7d</Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={est.ativo ? "default" : "secondary"}>{est.ativo ? "Ativo" : "Inativo"}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(est.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant={est.ativo ? "destructive" : "default"} size="sm" onClick={() => toggleAtivo(est.id, est.ativo)}>
                                {est.ativo ? (<><PowerOff className="w-4 h-4 mr-1" /> Desativar</>) : (<><Power className="w-4 h-4 mr-1" /> Ativar</>)}
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
          </TabsContent>

          {/* Usuários Tab */}
          <TabsContent value="usuarios">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>Visualize, crie e gerencie todos os usuários cadastrados</CardDescription>
                </div>
                <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="gold-gradient">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuário</DialogTitle>
                      <DialogDescription>O usuário será criado com e-mail já confirmado.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input placeholder="Nome completo" value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail *</Label>
                        <Input type="email" placeholder="usuario@email.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Senha *</Label>
                        <Input type="password" placeholder="Mínimo 6 caracteres" value={newUser.senha} onChange={(e) => setNewUser({ ...newUser, senha: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Perfil</Label>
                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="financeiro">Financeiro</SelectItem>
                            <SelectItem value="colaborador">Colaborador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreateUser} disabled={creatingUser}>{creatingUser ? "Criando..." : "Criar Usuário"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          Nenhum usuário cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.nome}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{user.email || "—"}</TableCell>
                          <TableCell>
                            <Select value={user.role || "colaborador"} onValueChange={(v) => handleUpdateRole(user.user_id, v)}>
                              <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="financeiro">Financeiro</SelectItem>
                                <SelectItem value="colaborador">Colaborador</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.ativo ? "default" : "secondary"}>
                              {user.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.user_id !== usuarioLogado?.id && (
                              <>
                                {deleteUserId === user.user_id ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-xs text-destructive">Confirmar?</span>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.user_id)}>
                                      Sim
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setDeleteUserId(null)}>
                                      Não
                                    </Button>
                                  </div>
                                ) : (
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteUserId(user.user_id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
