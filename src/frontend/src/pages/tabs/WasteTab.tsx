import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Flame, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../contexts/AppContext";

interface WasteRecord {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: "Hasar" | "Hırsızlık" | "Kullanım Hatası" | "Diğer";
  projectId: string;
  date: string;
  cost: number;
  notes: string;
}

export default function WasteTab({ companyId }: { companyId: string }) {
  const { projects } = useApp();
  const key = `waste_${companyId}`;
  const matKey = `inventory_${companyId}`;

  const loadWaste = (): WasteRecord[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const loadMaterials = (): {
    id: string;
    name: string;
    unit: string;
    unitPrice?: number;
  }[] => {
    try {
      return JSON.parse(localStorage.getItem(matKey) || "[]");
    } catch {
      return [];
    }
  };

  const [waste, setWaste] = useState<WasteRecord[]>(loadWaste);
  const [open, setOpen] = useState(false);
  const [filterReason, setFilterReason] = useState("Tümü");
  const [filterProject, setFilterProject] = useState("Tümü");

  const companyProjects = projects.filter((p) => p.companyId === companyId);
  const materials = loadMaterials();

  const save = (data: WasteRecord[]) => {
    setWaste(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const emptyForm = {
    materialId: "",
    materialName: "",
    quantity: "",
    unit: "",
    reason: "Hasar" as WasteRecord["reason"],
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    cost: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const handleMaterialSelect = (id: string) => {
    const mat = materials.find((m) => m.id === id);
    setForm({
      ...form,
      materialId: id,
      materialName: mat?.name || "",
      unit: mat?.unit || "",
      cost: mat?.unitPrice
        ? String(mat.unitPrice * Number(form.quantity || 1))
        : form.cost,
    });
  };

  const handleAdd = () => {
    if (!form.materialName.trim() || !form.quantity) return;
    const item: WasteRecord = {
      id: Date.now().toString(),
      materialId: form.materialId,
      materialName: form.materialName,
      quantity: Number(form.quantity),
      unit: form.unit,
      reason: form.reason,
      projectId: form.projectId,
      date: form.date,
      cost: Number(form.cost) || 0,
      notes: form.notes,
    };
    save([...waste, item]);
    setForm(emptyForm);
    setOpen(false);
  };

  const now = new Date();
  const thisMonthWaste = waste.filter((w) => {
    const d = new Date(w.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const monthCost = thisMonthWaste.reduce((s, w) => s + w.cost, 0);

  const materialCounts = useMemo(() => {
    const map: Record<string, { name: string; count: number; cost: number }> =
      {};
    for (const w of waste) {
      if (!map[w.materialName])
        map[w.materialName] = { name: w.materialName, count: 0, cost: 0 };
      map[w.materialName].count += w.quantity;
      map[w.materialName].cost += w.cost;
    }
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [waste]);

  const topMaterial = materialCounts[0]?.name || "—";

  const projectCosts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of waste) {
      const proj = companyProjects.find((p) => p.id === w.projectId);
      const name = proj?.title || "Genel";
      map[name] = (map[name] || 0) + w.cost;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [waste, companyProjects]);

  const totalProjectCost = projectCosts.reduce((s, [, v]) => s + v, 0);

  const filtered = waste.filter((w) => {
    const rMatch = filterReason === "Tümü" || w.reason === filterReason;
    const pMatch = filterProject === "Tümü" || w.projectId === filterProject;
    return rMatch && pMatch;
  });

  const reasonColors: Record<string, string> = {
    Hasar: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    Hırsızlık: "bg-red-500/15 text-red-400 border-red-500/30",
    "Kullanım Hatası": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    Diğer: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">
              Bu Ay Toplam Fire Maliyeti
            </p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {monthCost.toLocaleString("tr-TR")} ₺
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">En Çok Fire Malzeme</p>
            <p className="text-lg font-bold text-amber-400 mt-1 truncate">
              {topMaterial}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Toplam Kayıt</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {waste.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project pie chart */}
      {projectCosts.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="pt-5 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              Proje Bazlı Fire Dağılımı
            </p>
            {projectCosts.map(([name, cost]) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground truncate max-w-[60%]">
                    {name}
                  </span>
                  <span className="text-amber-400">
                    {cost.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500/70 rounded-full"
                    style={{
                      width: `${totalProjectCost ? (cost / totalProjectCost) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Header + add */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="bg-background border-border w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Tümü">Tüm Nedenler</SelectItem>
              <SelectItem value="Hasar">Hasar</SelectItem>
              <SelectItem value="Hırsızlık">Hırsızlık</SelectItem>
              <SelectItem value="Kullanım Hatası">Kullanım Hatası</SelectItem>
              <SelectItem value="Diğer">Diğer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="bg-background border-border w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Tümü">Tüm Projeler</SelectItem>
              {companyProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gradient-bg text-white"
              data-ocid="waste.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-1" /> Fire Kaydı
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                Fire / İsraf Kaydı
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Malzeme *</Label>
                {materials.length > 0 ? (
                  <Select
                    value={form.materialId}
                    onValueChange={handleMaterialSelect}
                  >
                    <SelectTrigger className="bg-background border-border mt-1">
                      <SelectValue placeholder="Malzeme seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="bg-background border-border mt-1"
                    value={form.materialName}
                    onChange={(e) =>
                      setForm({ ...form, materialName: e.target.value })
                    }
                    placeholder="Malzeme adı"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Miktar *</Label>
                  <Input
                    type="number"
                    className="bg-background border-border mt-1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Birim</Label>
                  <Input
                    className="bg-background border-border mt-1"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="adet, kg, m²..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Neden</Label>
                  <Select
                    value={form.reason}
                    onValueChange={(v) =>
                      setForm({ ...form, reason: v as WasteRecord["reason"] })
                    }
                  >
                    <SelectTrigger className="bg-background border-border mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Hasar">Hasar</SelectItem>
                      <SelectItem value="Hırsızlık">Hırsızlık</SelectItem>
                      <SelectItem value="Kullanım Hatası">
                        Kullanım Hatası
                      </SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Maliyet (₺)</Label>
                  <Input
                    type="number"
                    className="bg-background border-border mt-1"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Proje</Label>
                  <Select
                    value={form.projectId}
                    onValueChange={(v) => setForm({ ...form, projectId: v })}
                  >
                    <SelectTrigger className="bg-background border-border mt-1">
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">—</SelectItem>
                      {companyProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    className="bg-background border-border mt-1"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Notlar</Label>
                <Textarea
                  className="bg-background border-border mt-1"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setOpen(false)}
              >
                İptal
              </Button>
              <Button
                className="gradient-bg text-white"
                data-ocid="waste.submit_button"
                onClick={handleAdd}
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          data-ocid="waste.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Flame className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Fire / israf kaydı bulunamadı</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Malzeme</TableHead>
                <TableHead className="text-muted-foreground">Miktar</TableHead>
                <TableHead className="text-muted-foreground">Neden</TableHead>
                <TableHead className="text-muted-foreground">Maliyet</TableHead>
                <TableHead className="text-muted-foreground">Proje</TableHead>
                <TableHead className="text-muted-foreground">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((w, i) => {
                const proj = companyProjects.find((p) => p.id === w.projectId);
                return (
                  <TableRow
                    key={w.id}
                    data-ocid={`waste.item.${i + 1}`}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="font-medium text-foreground">
                      {w.materialName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.quantity} {w.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${reasonColors[w.reason]}`}
                      >
                        {w.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-red-400 font-semibold">
                      {w.cost.toLocaleString("tr-TR")} ₺
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {proj?.title || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {w.date}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
