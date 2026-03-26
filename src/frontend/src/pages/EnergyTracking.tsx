import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Droplets, Flame, PlusCircle, Trash2, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../contexts/AppContext";

type ResourceType = "Elektrik" | "Su" | "Doğalgaz" | "Yakıt";

interface EnergyRecord {
  id: string;
  tarih: string;
  proje: string;
  tur: ResourceType;
  miktar: number;
  birim: string;
  maliyet: number;
  notlar: string;
}

const BIRIM_MAP: Record<ResourceType, string> = {
  Elektrik: "kWh",
  Su: "m³",
  Doğalgaz: "m³",
  Yakıt: "L",
};

const STORAGE_KEY = "energyRecords";

function useStorage(companyId: string | undefined) {
  const key = `${STORAGE_KEY}_${companyId}`;

  const load = (): EnergyRecord[] => {
    if (!companyId) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const save = (records: EnergyRecord[]) => {
    if (!companyId) return;
    localStorage.setItem(key, JSON.stringify(records));
  };

  return { load, save };
}

export default function EnergyTracking() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id;
  const { load, save } = useStorage(companyId);

  const [records, setRecords] = useState<EnergyRecord[]>(load);
  const [filterProje, setFilterProje] = useState<string>("all");
  const [filterTur, setFilterTur] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Omit<EnergyRecord, "id">>({
    tarih: new Date().toISOString().split("T")[0],
    proje: "",
    tur: "Elektrik",
    miktar: 0,
    birim: "kWh",
    maliyet: 0,
    notlar: "",
  });

  const projeList = useMemo(() => {
    const projes = Array.from(
      new Set(records.map((r) => r.proje).filter(Boolean)),
    );
    return projes;
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterProje !== "all" && r.proje !== filterProje) return false;
      if (filterTur !== "all" && r.tur !== filterTur) return false;
      return true;
    });
  }, [records, filterProje, filterTur]);

  // Current month summary
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRecords = records.filter((r) => r.tarih.startsWith(thisMonth));
  const summary = {
    Elektrik: thisMonthRecords
      .filter((r) => r.tur === "Elektrik")
      .reduce((s, r) => s + r.miktar, 0),
    Su: thisMonthRecords
      .filter((r) => r.tur === "Su")
      .reduce((s, r) => s + r.miktar, 0),
    Doğalgaz: thisMonthRecords
      .filter((r) => r.tur === "Doğalgaz")
      .reduce((s, r) => s + r.miktar, 0),
    Yakıt: thisMonthRecords
      .filter((r) => r.tur === "Yakıt")
      .reduce((s, r) => s + r.miktar, 0),
  };

  // Monthly chart data (last 6 months)
  const chartData = useMemo(() => {
    const months: {
      ay: string;
      Elektrik: number;
      Su: number;
      Doğalgaz: number;
      Yakıt: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("tr-TR", {
        month: "short",
        year: "2-digit",
      });
      const mo = records.filter((r) => r.tarih.startsWith(key));
      months.push({
        ay: label,
        Elektrik: mo
          .filter((r) => r.tur === "Elektrik")
          .reduce((s, r) => s + r.miktar, 0),
        Su: mo.filter((r) => r.tur === "Su").reduce((s, r) => s + r.miktar, 0),
        Doğalgaz: mo
          .filter((r) => r.tur === "Doğalgaz")
          .reduce((s, r) => s + r.miktar, 0),
        Yakıt: mo
          .filter((r) => r.tur === "Yakıt")
          .reduce((s, r) => s + r.miktar, 0),
      });
    }
    return months;
  }, [records]);

  const handleAdd = () => {
    const newRecord: EnergyRecord = {
      ...form,
      id: Date.now().toString(),
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    save(updated);
    setDialogOpen(false);
    setForm({
      tarih: new Date().toISOString().split("T")[0],
      proje: "",
      tur: "Elektrik",
      miktar: 0,
      birim: "kWh",
      maliyet: 0,
      notlar: "",
    });
  };

  const handleDelete = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    save(updated);
  };

  const turBadgeColor: Record<ResourceType, string> = {
    Elektrik: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Su: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Doğalgaz: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Yakıt: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Enerji & Kaynak Tüketimi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Şantiye bazlı enerji ve kaynak tüketim takibi
          </p>
        </div>
        <Button
          data-ocid="energy.open_modal_button"
          onClick={() => setDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Kayıt Ekle
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Elektrik (Bu Ay)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">
              {summary.Elektrik.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-muted-foreground">kWh</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" /> Su (Bu Ay)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">
              {summary.Su.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-muted-foreground">m³</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" /> Doğalgaz (Bu Ay)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-400">
              {summary.Doğalgaz.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-muted-foreground">m³</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-400" /> Yakıt (Bu Ay)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {summary.Yakıt.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-muted-foreground">L</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">
            Aylık Tüketim Trendi (Son 6 Ay)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis dataKey="ay" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f9fafb",
                }}
              />
              <Bar dataKey="Elektrik" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Su" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Doğalgaz" fill="#f97316" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Yakıt" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterProje} onValueChange={setFilterProje}>
          <SelectTrigger data-ocid="energy.select" className="w-48">
            <SelectValue placeholder="Proje filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Projeler</SelectItem>
            {projeList.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTur} onValueChange={setFilterTur}>
          <SelectTrigger data-ocid="energy.filter.tab" className="w-48">
            <SelectValue placeholder="Tür filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            <SelectItem value="Elektrik">Elektrik</SelectItem>
            <SelectItem value="Su">Su</SelectItem>
            <SelectItem value="Doğalgaz">Doğalgaz</SelectItem>
            <SelectItem value="Yakıt">Yakıt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              data-ocid="energy.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Henüz kayıt yok</p>
              <p className="text-xs mt-1">
                Kayıt Ekle butonuyla ilk tüketim kaydını oluşturun
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Tarih</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Notlar</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    data-ocid={`energy.item.${idx + 1}`}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="text-sm">{r.tarih}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {r.proje || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${turBadgeColor[r.tur]}`}
                      >
                        {r.tur}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.miktar.toLocaleString("tr-TR")} {r.birim}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.maliyet > 0
                        ? `₺${r.maliyet.toLocaleString("tr-TR")}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {r.notlar || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        data-ocid={`energy.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="energy.dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tüketim Kaydı Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tarih</Label>
                <Input
                  data-ocid="energy.input"
                  type="date"
                  value={form.tarih}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tarih: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Kaynak Türü</Label>
                <Select
                  value={form.tur}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      tur: v as ResourceType,
                      birim: BIRIM_MAP[v as ResourceType],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="energy.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elektrik">⚡ Elektrik (kWh)</SelectItem>
                    <SelectItem value="Su">💧 Su (m³)</SelectItem>
                    <SelectItem value="Doğalgaz">🔥 Doğalgaz (m³)</SelectItem>
                    <SelectItem value="Yakıt">⛽ Yakıt (L)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Proje / Şantiye</Label>
              <Input
                data-ocid="energy.input"
                placeholder="Proje adı"
                value={form.proje}
                onChange={(e) =>
                  setForm((f) => ({ ...f, proje: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Miktar ({form.birim})</Label>
                <Input
                  data-ocid="energy.input"
                  type="number"
                  min={0}
                  value={form.miktar || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      miktar: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Maliyet (₺)</Label>
                <Input
                  data-ocid="energy.input"
                  type="number"
                  min={0}
                  value={form.maliyet || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maliyet: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notlar</Label>
              <Textarea
                data-ocid="energy.textarea"
                placeholder="Opsiyonel notlar"
                value={form.notlar}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notlar: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="energy.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="energy.submit_button"
              onClick={handleAdd}
              disabled={!form.proje || form.miktar <= 0}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
