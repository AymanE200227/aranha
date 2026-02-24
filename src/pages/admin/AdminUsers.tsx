import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  ShieldCheck,
  Users as UsersIcon,
  UserCheck,
  Layers3,
} from "lucide-react";
import { toast } from "sonner";
import { User, Group } from "@/lib/types";
import { getUsers, createUser, updateUser, deleteUser, getGroups } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import AdminShell from "@/components/admin/AdminShell";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, isLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "client">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "client" as "admin" | "client",
    groupIds: [] as string[],
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(getUsers());
    setGroups(getGroups());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      groupIds: formData.groupIds,
      groupId: formData.groupIds[0] || null,
    };

    if (editingUser) {
      const updatePayload = {
        ...payload,
        ...(formData.password.trim() ? { password: formData.password } : {}),
      };
      updateUser(editingUser.id, updatePayload);
      toast.success("Utilisateur modifie avec succes");
    } else {
      if (!formData.password.trim()) {
        toast.error("Le mot de passe est obligatoire");
        return;
      }
      createUser({
        ...payload,
        password: formData.password,
      });
      toast.success("Utilisateur cree avec succes");
    }

    resetForm();
    loadData();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      groupIds: Array.from(new Set([...(user.groupIds || []), user.groupId].filter(Boolean))) as string[],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Etes-vous sur de vouloir supprimer cet utilisateur ?")) {
      deleteUser(id);
      toast.success("Utilisateur supprime");
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "client", groupIds: [] });
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const stats = useMemo(() => {
    const adminCount = users.filter((user) => user.role === "admin").length;
    const clientCount = users.filter((user) => user.role === "client").length;
    const multiGroupCount = users.filter((user) => {
      const ids = Array.from(new Set([...(user.groupIds || []), user.groupId].filter(Boolean)));
      return ids.length > 1;
    }).length;

    return {
      total: users.length,
      admins: adminCount,
      clients: clientCount,
      multiGroups: multiGroupCount,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const getGroupNames = (user: User): string[] => {
    const ids = Array.from(new Set([...(user.groupIds || []), user.groupId].filter(Boolean))) as string[];
    return ids
      .map((groupId) => groups.find((g) => g.id === groupId)?.name)
      .filter((name): name is string => Boolean(name));
  };

  const toggleGroupSelection = (groupId: string, checked: boolean) => {
    setFormData((previous) => ({
      ...previous,
      groupIds: checked
        ? Array.from(new Set([...previous.groupIds, groupId]))
        : previous.groupIds.filter((id) => id !== groupId),
    }));
  };

  if (isLoading) return null;

  return (
    <AdminShell onLogout={handleLogout}>
      <div className="mx-auto max-w-[1400px]">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/40 via-card to-secondary/20 p-5 sm:p-6 mb-8 animate-fade-in">
          <div className="pointer-events-none absolute -top-14 -right-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-foreground">
                GESTION DES <span className="text-gradient-gold">UTILISATEURS</span>
              </h1>
              <p className="text-muted-foreground mt-1">Creer, modifier et gerer les comptes utilisateurs</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="font-display text-lg text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Admins</p>
                <p className="font-display text-lg text-foreground">{stats.admins}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Clients</p>
                <p className="font-display text-lg text-foreground">{stats.clients}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Multi-groupes</p>
                <p className="font-display text-lg text-foreground">{stats.multiGroups}</p>
              </div>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={resetForm} className="relative mt-4 sm:mt-5">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Modifiez les informations de l'utilisateur."
                    : "Remplissez les informations pour creer un nouvel utilisateur."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Nom complet</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jean Dupont"
                      required
                      className="mt-1 bg-secondary transition-colors focus-visible:ring-primary/50"
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemple.com"
                      required
                      className="mt-1 bg-secondary transition-colors focus-visible:ring-primary/50"
                    />
                  </div>

                  <div>
                    <Label>Mot de passe</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? "Laisser vide pour conserver l'actuel" : "********"}
                      required={!editingUser}
                      className="mt-1 bg-secondary transition-colors focus-visible:ring-primary/50"
                    />
                  </div>

                  <div>
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) => setFormData({ ...formData, role: v as "admin" | "client" })}
                    >
                      <SelectTrigger className="mt-1 bg-secondary transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Groupes</Label>
                    <div className="mt-2 rounded-md border border-border/60 bg-secondary/80 p-3 space-y-2 max-h-48 overflow-y-auto">
                      <p className="text-xs text-muted-foreground mb-2">
                        {formData.groupIds.length} groupe(s) selectionne(s)
                      </p>
                      {groups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun groupe disponible</p>
                      ) : (
                        groups.map((group) => (
                          <label
                            key={group.id}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-background/60"
                          >
                            <Checkbox
                              checked={formData.groupIds.includes(group.id)}
                              onCheckedChange={(checked) => toggleGroupSelection(group.id, Boolean(checked))}
                            />
                            <span>{group.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" variant="gold" className="w-full">
                  {editingUser ? "Modifier" : "Creer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/80 transition-colors focus-visible:ring-primary/50"
            />
          </div>

          <div className="inline-flex rounded-lg border border-border/60 p-1 bg-secondary/40">
            <Button
              size="sm"
              variant={roleFilter === "all" ? "default" : "ghost"}
              className={roleFilter === "all" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setRoleFilter("all")}
            >
              <UsersIcon className="w-4 h-4 mr-1.5" />
              Tous
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "admin" ? "default" : "ghost"}
              className={roleFilter === "admin" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setRoleFilter("admin")}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Admins
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "client" ? "default" : "ghost"}
              className={roleFilter === "client" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setRoleFilter("client")}
            >
              <UserCheck className="w-4 h-4 mr-1.5" />
              Clients
            </Button>
          </div>
        </div>

        <div className="card-elevated overflow-hidden border-border/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="bg-secondary/75 backdrop-blur supports-[backdrop-filter]:bg-secondary/55">
                <tr>
                  <th className="text-left p-4 font-display text-foreground">Nom</th>
                  <th className="text-left p-4 font-display text-foreground">Email</th>
                  <th className="text-left p-4 font-display text-foreground">Role</th>
                  <th className="text-left p-4 font-display text-foreground">Groupes</th>
                  <th className="text-right p-4 font-display text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <div className="mx-auto w-fit rounded-xl border border-border/60 bg-secondary/25 px-6 py-5">
                        <p className="text-foreground font-medium">Aucun utilisateur trouve</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Essayez un autre filtre ou creez un nouvel utilisateur.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const userGroups = getGroupNames(user);
                    const initials = user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={user.id} className="border-t border-border/60 transition-colors hover:bg-secondary/20">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
                              <span className="text-xs font-display text-primary">{initials}</span>
                            </div>
                            <span className="text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{user.email}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              user.role === "admin"
                                ? "bg-primary/20 text-primary border-primary/35"
                                : "bg-accent/20 text-accent border-accent/35"
                            }`}
                          >
                            {user.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {user.role === "admin" ? "Admin" : "Client"}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {userGroups.length === 0 ? (
                            <span>-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {userGroups.map((groupName) => (
                                <span
                                  key={`${user.id}-${groupName}`}
                                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/70 px-2 py-0.5 text-xs text-foreground"
                                >
                                  <Layers3 className="w-3 h-3 text-muted-foreground" />
                                  {groupName}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-primary/15 hover:text-primary"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/15 hover:text-destructive"
                              onClick={() => handleDelete(user.id)}
                              disabled={user.email === "admin@aranha.ma"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminUsers;
