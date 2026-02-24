import { useState, useEffect } from "react";
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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupNames = (user: User) => {
    const ids = Array.from(new Set([...(user.groupIds || []), user.groupId].filter(Boolean))) as string[];
    if (ids.length === 0) return "-";
    return ids
      .map((groupId) => groups.find((g) => g.id === groupId)?.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              GESTION DES <span className="text-gradient-gold">UTILISATEURS</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Creer, modifier et gerer les comptes utilisateurs
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? "Modifiez les informations de l'utilisateur." : "Remplissez les informations pour creer un nouvel utilisateur."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Nom complet</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                    className="mt-1 bg-secondary"
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
                    className="mt-1 bg-secondary"
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
                    className="mt-1 bg-secondary"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v as "admin" | "client" })}
                  >
                    <SelectTrigger className="mt-1 bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Groupes</Label>
                  <div className="mt-2 rounded-md border border-border/60 bg-secondary p-3 space-y-2 max-h-48 overflow-y-auto">
                    {groups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun groupe disponible</p>
                    ) : (
                      groups.map((group) => (
                        <label key={group.id} className="flex items-center gap-2 text-sm text-foreground">
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
                <Button type="submit" variant="gold" className="w-full">
                  {editingUser ? "Modifier" : "Creer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        {/* Users Table */}
        <div className="card-elevated overflow-hidden">
          <table className="w-full min-w-[760px]">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-display text-foreground">Nom</th>
                <th className="text-left p-4 font-display text-foreground">Email</th>
                <th className="text-left p-4 font-display text-foreground">Role</th>
                <th className="text-left p-4 font-display text-foreground">Groupes</th>
                <th className="text-right p-4 font-display text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-display text-primary">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <span className="text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-primary/20 text-primary"
                          : "bg-accent/20 text-accent"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Client"}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{getGroupNames(user)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.email === "admin@aranha.ma"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminUsers;


