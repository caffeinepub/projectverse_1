import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

type StakeholderRole =
  | "Bakanlık"
  | "Belediye"
  | "İşveren"
  | "Müşteri"
  | "Denetçi"
  | "Danışman"
  | "Yüklenici"
  | "Diğer";

type CommunicationMethod = "Email" | "Telefon" | "Toplantı" | "Resmi Yazı";
type CommunicationFrequency = "Günlük" | "Haftalık" | "Aylık" | "Gerektiğinde";
type ImpactLevel = "Yüksek" | "Orta" | "Düşük";

interface Stakeholder {
  id: string;
  name: string;
  organization: string;
  role: StakeholderRole;
  project: string;
  communicationMethod: CommunicationMethod;
  communicationFrequency: CommunicationFrequency;
  impactLevel: ImpactLevel;
  notes: string;
  createdAt: string;
}

const ROLES: StakeholderRole[] = [
  "Bakanlık",
  "Belediye",
  "İşveren",
  "Müşteri",
  "Denetçi",
  "Danışman",
  "Yüklenici",
  "Diğer",
];

const COMM_METHODS: CommunicationMethod[] = [
  "Email",
  "Telefon",
  "Toplantı",
  "Resmi Yazı",
];

const COMM_FREQUENCIES: CommunicationFrequency[] = [
  "Günlük",
  "Haftalık",
  "Aylık",
  "Gerektiğinde",
];

const IMPACT_LEVELS: ImpactLevel[] = ["Yüksek", "Orta", "Düşük"];

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  Yüksek: "bg-red-500/20 text-red-400 border-red-500/30",
  Orta: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Düşük: "bg-green-500/20 text-green-400 border-green-500/30",
};

const EMPTY_FORM = {
  name: "",
  organization: "",
  role: "Diğer" as StakeholderRole,
  project: "",
  communicationMethod: "Email" as CommunicationMethod,
  communicationFrequency: "Haftalık" as CommunicationFrequency,
  impactLevel: "Orta" as ImpactLevel,
  notes: "",
};

export default function StakeholderMatrix() {
  const { projects, currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "default";
  const storageKey = `stakeholders_${companyId}`;

  const [items, setItems] = useState<Stakeholder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [roleFilter, setRoleFilter] = useState("Tümü");
  const [projectFilter, setProjectFilter] = useState("Tümü");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const save = (updated: Stakeholder[]) => {
    setItems(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: Stakeholder) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      organization: item.organization,
      role: item.role,
      project: item.project,
      communicationMethod: item.communicationMethod,
      communicationFrequency: item.communicationFrequency,
      impactLevel: item.impactLevel,
      notes: item.notes,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Ad Soyad zorunludur");
      return;
    }
    if (editingId) {
      save(items.map((it) => (it.id === editingId ? { ...it, ...form } : it)));
      toast.success("Paydaş güncellendi");
    } else {
      const newItem: Stakeholder = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      save([newItem, ...items]);
      toast.success("Paydaş eklendi");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    save(items.filter((it) => it.id !== id));
    toast.success("Paydaş silindi");
  };

  const filtered = items.filter((it) => {
    if (roleFilter !== "Tümü" && it.role !== roleFilter) return false;
    if (projectFilter !== "Tümü" && it.project !== projectFilter) return false;
    return true;
  });

  const kpis = {
    total: items.length,
    high: items.filter((i) => i.impactLevel === "Yüksek").length,
    medium: items.filter((i) => i.impactLevel === "Orta").length,
    low: items.filter((i) => i.impactLevel === "Düşük").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Paydaş & İletişim Matrisi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proje paydaşları ve iletişim planı
          </p>
        </div>
        <Button
          data-ocid="stakeholder.open_modal_button"
          onClick={openNew}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Paydaş Ekle
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Paydaş",
            value: kpis.total,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Yüksek Etki",
            value: kpis.high,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
          {
            label: "Orta Etki",
            value: kpis.medium,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
          },
          {
            label: "Düşük Etki",
            value: kpis.low,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
        ].map((k) => (
          <Card key={k.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg} ${k.color}`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44" data-ocid="stakeholder.select">
            <SelectValue placeholder="Rol filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tümü">Tüm Roller</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48" data-ocid="stakeholder.select">
            <SelectValue placeholder="Proje filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tümü">Tüm Projeler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.title}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table or Empty State */}
      {filtered.length === 0 ? (
        <div
          data-ocid="stakeholder.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Paydaş kaydı yok
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Proje paydaşlarını ve iletişim planını kaydedin
          </p>
          <Button
            onClick={openNew}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Paydaş Ekle
          </Button>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Kurum</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>İletişim Yöntemi</TableHead>
                <TableHead>Sıklık</TableHead>
                <TableHead>Etki</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow
                  key={item.id}
                  className="border-border hover:bg-muted/30"
                  data-ocid={`stakeholder.item.${i + 1}`}
                >
                  <TableCell className="font-medium text-foreground">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.organization || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs border">
                      {item.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.project || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.communicationMethod}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.communicationFrequency}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${IMPACT_COLORS[item.impactLevel]}`}
                    >
                      {item.impactLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                        onClick={() => openEdit(item)}
                        data-ocid={`stakeholder.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() => handleDelete(item.id)}
                        data-ocid={`stakeholder.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="stakeholder.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Paydaş Düzenle" : "Yeni Paydaş"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ad Soyad *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ahmet Yılmaz"
                  data-ocid="stakeholder.input"
                />
              </div>
              <div>
                <Label>Kurum / Şirket</Label>
                <Input
                  value={form.organization}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, organization: e.target.value }))
                  }
                  placeholder="İstanbul Belediyesi"
                  data-ocid="stakeholder.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, role: v as StakeholderRole }))
                  }
                >
                  <SelectTrigger data-ocid="stakeholder.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proje</Label>
                <Input
                  value={form.project}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, project: e.target.value }))
                  }
                  placeholder="Proje adı"
                  data-ocid="stakeholder.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>İletişim Yöntemi</Label>
                <Select
                  value={form.communicationMethod}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      communicationMethod: v as CommunicationMethod,
                    }))
                  }
                >
                  <SelectTrigger data-ocid="stakeholder.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMM_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>İletişim Sıklığı</Label>
                <Select
                  value={form.communicationFrequency}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      communicationFrequency: v as CommunicationFrequency,
                    }))
                  }
                >
                  <SelectTrigger data-ocid="stakeholder.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMM_FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Etki Seviyesi</Label>
              <Select
                value={form.impactLevel}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, impactLevel: v as ImpactLevel }))
                }
              >
                <SelectTrigger data-ocid="stakeholder.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Ek bilgiler..."
                data-ocid="stakeholder.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              data-ocid="stakeholder.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="stakeholder.submit_button"
            >
              {editingId ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
