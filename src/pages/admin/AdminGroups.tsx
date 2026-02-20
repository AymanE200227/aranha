import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { Group, GroupColor, User } from "@/lib/types";
import { getGroups, createGroup, updateGroup, deleteGroup, getUsers } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import AdminShell from "@/components/admin/AdminShell";
import { GROUP_COLOR_OPTIONS, getGroupColorClasses } from "@/lib/groupColors";

const AdminGroups = () => {
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, isLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "primary" as GroupColor,
    description: "",
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
    setGroups(getGroups());
    setUsers(getUsers());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingGroup) {
      updateGroup(editingGroup.id, formData);
      toast.success("Groupe modifie avec succes");
    } else {
      createGroup(formData);
      toast.success("Groupe cree avec succes");
    }

    resetForm();
    loadData();
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      color: group.color,
      description: group.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const usersInGroup = users.filter((u) => u.groupId === id);
    if (usersInGroup.length > 0) {
      toast.error(`Ce groupe contient ${usersInGroup.length} utilisateur(s). Veuillez les reassigner d'abord.`);
      return;
    }
    if (window.confirm("Etes-vous sur de vouloir supprimer ce groupe ?")) {
      deleteGroup(id);
      toast.success("Groupe supprime");
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", color: "primary", description: "" });
    setEditingGroup(null);
    setIsDialogOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getMemberCount = (groupId: string) => {
    return users.filter((u) => u.groupId === groupId).length;
  };

  if (isLoading) return null;

  return (
    <AdminShell onLogout={handleLogout}>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              GESTION DES <span className="text-gradient-gold">GROUPES</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Creer et gerer les groupes d'entrainement
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Groupe
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingGroup ? "Modifier le groupe" : "Nouveau Groupe"}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup ? "Modifiez les informations du groupe." : "Creez un nouveau groupe d'entrainement."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Nom du groupe</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Group du Matin"
                    required
                    className="mt-1 bg-secondary"
                  />
                </div>
                <div>
                  <Label>Couleur</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(v) =>
                      setFormData({ ...formData, color: v as GroupColor })
                    }
                  >
                    <SelectTrigger className="mt-1 bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_COLOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${opt.dotClass}`} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du groupe..."
                    className="mt-1 bg-secondary"
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full">
                  {editingGroup ? "Modifier" : "Creer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const colorClasses = getGroupColorClasses(group.color);
            return (
            <div key={group.id} className="card-elevated p-6 group hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses.soft}`}
                >
                  <Users className={`w-6 h-6 ${colorClasses.text}`} />
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(group)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-display text-xl text-foreground mb-1">{group.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{group.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Membres</span>
                <span className="font-display text-lg text-foreground">{getMemberCount(group.id)}</span>
              </div>
            </div>
          )})}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminGroups;

