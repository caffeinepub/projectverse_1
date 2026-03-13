import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Shield } from "lucide-react";
import { useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { type Role, useApp } from "../contexts/AppContext";

const MODULES = [
  "dashboard",
  "projects",
  "communication",
  "documents",
  "hr",
  "finance",
  "purchasing",
  "inventory",
  "fieldOps",
  "qualitySafety",
  "crm",
  "reports",
];
const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projeler",
  communication: "İletişim",
  documents: "Dokümanlar",
  hr: "İnsan Kaynakları",
  finance: "Finans",
  purchasing: "Satın Alma",
  inventory: "Stok",
  fieldOps: "Saha Operasyonları",
  qualitySafety: "Kalite & Güvenlik",
  crm: "CRM",
  reports: "Raporlama",
};
const ACTIONS = ["view", "create", "edit", "delete", "approve"] as const;
const ACTION_LABELS: Record<string, string> = {
  view: "Görüntüle",
  create: "Oluştur",
  edit: "Düzenle",
  delete: "Sil",
  approve: "Onayla",
};

export default function RoleSettings() {
  const { checkPermission, t, currentCompany, setCompanies, companies } =
    useApp();
  const [open, setOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#a855f7");

  if (!checkPermission("settings", "view")) return <AccessDenied />;

  const roles = currentCompany?.roles || [];

  const handleCreateRole = () => {
    if (!newRoleName.trim() || !currentCompany) return;
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: newRoleName.trim(),
      isDefault: false,
      color: newRoleColor,
      permissions: {},
    };
    const updated = companies.map((c) =>
      c.id === currentCompany.id ? { ...c, roles: [...c.roles, newRole] } : c,
    );
    setCompanies(updated);
    setOpen(false);
    setNewRoleName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.roles}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rol ve İzin Yönetimi
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="roles.primary_button"
              className="gradient-bg text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.newRole}
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="new_role.dialog" className="bg-card">
            <DialogHeader>
              <DialogTitle>{t.newRole}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rol Adı</Label>
                <Input
                  data-ocid="new_role.name_input"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Rol adı..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Renk</Label>
                <div className="flex gap-2 mt-1">
                  {[
                    "#a855f7",
                    "#3b82f6",
                    "#06b6d4",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                  ].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewRoleColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${newRoleColor === c ? "ring-2 ring-white scale-110" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <Button
                data-ocid="new_role.submit_button"
                onClick={handleCreateRole}
                className="w-full gradient-bg text-white"
              >
                {t.create}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role, i) => (
          <div
            key={role.id}
            data-ocid={`roles.item.${i + 1}`}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: `${role.color}33`,
                  border: `1px solid ${role.color}55`,
                }}
              >
                <Shield className="w-4 h-4" style={{ color: role.color }} />
              </div>
              <div>
                <p className="font-semibold text-foreground">{role.name}</p>
                {role.isDefault && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-muted-foreground/30 text-muted-foreground"
                  >
                    Varsayılan
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {MODULES.slice(0, 4).map((mod) => (
                <div
                  key={mod}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {MODULE_LABELS[mod]}
                  </span>
                  <div className="flex gap-1">
                    {ACTIONS.slice(0, 3).map((action) => (
                      <span
                        key={action}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${role.permissions[mod]?.[action] || role.isDefault ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"}`}
                      >
                        {ACTION_LABELS[action][0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-4">
          {t.permissions} Tablosu
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "oklch(0.3 0.012 264)" }}
              >
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  {t.module}
                </th>
                {ACTIONS.map((a) => (
                  <th
                    key={a}
                    className="text-center py-2 px-2 text-muted-foreground font-medium"
                  >
                    {ACTION_LABELS[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr
                  key={mod}
                  className="border-b"
                  style={{ borderColor: "oklch(0.26 0.01 264)" }}
                >
                  <td className="py-2 pr-4 text-foreground">
                    {MODULE_LABELS[mod]}
                  </td>
                  {ACTIONS.map((action) => (
                    <td key={action} className="text-center py-2 px-2">
                      <Checkbox
                        data-ocid={`roles.${mod}.${action}.checkbox`}
                        defaultChecked={
                          mod === "dashboard" || mod === "projects"
                        }
                        className="border-border"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
