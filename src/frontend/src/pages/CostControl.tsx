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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

interface WorkPackage {
  id: string;
  code: string;
  name: string;
  plannedCost: number;
  actualCost: number;
  percentComplete: number;
  responsible: string;
  notes: string;
}

const empty = (): Omit<WorkPackage, "id"> => ({
  code: "",
  name: "",
  plannedCost: 0,
  actualCost: 0,
  percentComplete: 0,
  responsible: "",
  notes: "",
});

export default function CostControl() {
  const { activeCompanyId, projects } = useApp();
  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    companyProjects[0]?.id ?? "",
  );
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty());

  const storageKey = `pv_workpackages_${activeCompanyId}_${selectedProjectId}`;

  useEffect(() => {
    if (selectedProjectId) {
      setPackages(JSON.parse(localStorage.getItem(storageKey) || "[]"));
    }
  }, [storageKey, selectedProjectId]);

  const savePackages = (data: WorkPackage[]) => {
    setPackages(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingId) {
      savePackages(
        packages.map((p) =>
          p.id === editingId ? { id: editingId, ...form } : p,
        ),
      );
    } else {
      savePackages([...packages, { id: Date.now().toString(), ...form }]);
    }
    setShowDialog(false);
    setEditingId(null);
    setForm(empty());
  };

  const handleEdit = (pkg: WorkPackage) => {
    setEditingId(pkg.id);
    setForm({
      code: pkg.code,
      name: pkg.name,
      plannedCost: pkg.plannedCost,
      actualCost: pkg.actualCost,
      percentComplete: pkg.percentComplete,
      responsible: pkg.responsible,
      notes: pkg.notes,
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    savePackages(packages.filter((p) => p.id !== id));
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  const totalPlanned = packages.reduce((s, p) => s + p.plannedCost, 0);
  const totalActual = packages.reduce((s, p) => s + p.actualCost, 0);
  const totalEV = packages.reduce(
    (s, p) => s + p.plannedCost * (p.percentComplete / 100),
    0,
  );
  const CPI = totalEV > 0 ? totalEV / totalActual : 0;
  const SPI = totalPlanned > 0 ? totalEV / totalPlanned : 0;
  const EAC = CPI > 0 ? totalPlanned / CPI : totalPlanned;

  const varianceData = useMemo(
    () =>
      packages.map((p) => ({
        name: p.name.length > 12 ? `${p.name.slice(0, 12)}…` : p.name,
        Planlanan: p.plannedCost,
        Gerçekleşen: p.actualCost,
      })),
    [packages],
  );

  const getVarianceStatus = (planned: number, actual: number) => {
    if (planned === 0)
      return { label: "Veri Yok", color: "bg-muted/20 text-muted-foreground" };
    const ratio = actual / planned;
    if (ratio <= 0.9)
      return {
        label: "Bütçe İçinde",
        color: "bg-green-500/20 text-green-400 border-green-500/30",
      };
    if (ratio <= 1.0)
      return {
        label: "Uyarı",
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      };
    return {
      label: "Aşıldı",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Maliyet Kontrol Merkezi
          </h1>
          <p className="text-muted-foreground text-sm">
            İş paketi bazlı maliyet kontrolü ve varyans analizi
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="shrink-0">Proje:</Label>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-64" data-ocid="cost_control.select">
            <SelectValue placeholder="Proje seçin" />
          </SelectTrigger>
          <SelectContent>
            {companyProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProjectId && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">
                  Toplam Bütçe (BAC)
                </p>
                <p className="text-xl font-bold text-amber-400">
                  {fmt(totalPlanned)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">
                  Gerçekleşen (AC)
                </p>
                <p className="text-xl font-bold text-red-400">
                  {fmt(totalActual)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">
                  CPI (Maliyet Performansı)
                </p>
                <p
                  className={`text-2xl font-bold ${CPI >= 1 ? "text-green-400" : "text-red-400"}`}
                >
                  {CPI > 0 ? CPI.toFixed(2) : "-"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">
                  SPI (Zaman Performansı)
                </p>
                <p
                  className={`text-2xl font-bold ${SPI >= 1 ? "text-green-400" : "text-red-400"}`}
                >
                  {SPI > 0 ? SPI.toFixed(2) : "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="packages">
            <TabsList>
              <TabsTrigger value="packages">İş Paketi Maliyetleri</TabsTrigger>
              <TabsTrigger value="variance">Varyans Analizi</TabsTrigger>
              <TabsTrigger value="estimate">Tamamlanma Tahmini</TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="mt-4">
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">İş Paketleri</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setForm(empty());
                      setShowDialog(true);
                    }}
                    data-ocid="cost_control.primary_button"
                  >
                    <Plus className="w-4 h-4 mr-1" /> İş Paketi Ekle
                  </Button>
                </CardHeader>
                <CardContent>
                  {packages.length === 0 ? (
                    <div
                      className="text-center py-12 text-muted-foreground"
                      data-ocid="cost_control.empty_state"
                    >
                      <Calculator className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>Henüz iş paketi yok</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kod</TableHead>
                          <TableHead>Ad</TableHead>
                          <TableHead className="text-right">
                            Planlanan
                          </TableHead>
                          <TableHead className="text-right">
                            Gerçekleşen
                          </TableHead>
                          <TableHead className="text-right">
                            % Tamamlanma
                          </TableHead>
                          <TableHead>Sorumlu</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packages.map((p, i) => (
                          <TableRow
                            key={p.id}
                            data-ocid={`cost_control.item.${i + 1}`}
                          >
                            <TableCell className="font-mono text-amber-400">
                              {p.code}
                            </TableCell>
                            <TableCell className="font-medium">
                              {p.name}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmt(p.plannedCost)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmt(p.actualCost)}
                            </TableCell>
                            <TableCell className="text-right">
                              %{p.percentComplete}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {p.responsible}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(p)}
                                  data-ocid={`cost_control.edit_button.${i + 1}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(p.id)}
                                  data-ocid={`cost_control.delete_button.${i + 1}`}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variance" className="mt-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Varyans Analizi</CardTitle>
                </CardHeader>
                <CardContent>
                  {packages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      Varyans için iş paketi ekleyin
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>İş Paketi</TableHead>
                            <TableHead className="text-right">
                              Planlanan
                            </TableHead>
                            <TableHead className="text-right">
                              Gerçekleşen
                            </TableHead>
                            <TableHead className="text-right">
                              Varyans (₺)
                            </TableHead>
                            <TableHead className="text-right">
                              Varyans (%)
                            </TableHead>
                            <TableHead>Durum</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {packages.map((p, i) => {
                            const varTL = p.actualCost - p.plannedCost;
                            const varPct =
                              p.plannedCost > 0
                                ? Math.round((varTL / p.plannedCost) * 100)
                                : 0;
                            const vs = getVarianceStatus(
                              p.plannedCost,
                              p.actualCost,
                            );
                            return (
                              <TableRow
                                key={p.id}
                                data-ocid={`cost_control.variance.item.${i + 1}`}
                              >
                                <TableCell className="font-medium">
                                  {p.name}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmt(p.plannedCost)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmt(p.actualCost)}
                                </TableCell>
                                <TableCell
                                  className={`text-right ${varTL > 0 ? "text-red-400" : "text-green-400"}`}
                                >
                                  {varTL > 0 ? "+" : ""}
                                  {fmt(varTL)}
                                </TableCell>
                                <TableCell
                                  className={`text-right ${varPct > 0 ? "text-red-400" : "text-green-400"}`}
                                >
                                  {varPct > 0 ? "+" : ""}
                                  {varPct}%
                                </TableCell>
                                <TableCell>
                                  <Badge className={vs.color}>{vs.label}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="mt-6">
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={varianceData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fill: "#9ca3af", fontSize: 11 }}
                            />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{
                                background: "#1c1c2e",
                                border: "1px solid rgba(245,158,11,0.3)",
                                borderRadius: 8,
                              }}
                            />
                            <Bar
                              dataKey="Planlanan"
                              fill="#f59e0b"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="Gerçekleşen"
                              fill="#ef4444"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estimate" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Tamamlanma Tahmini (EAC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        Toplam Bütçe (BAC)
                      </span>
                      <span className="font-bold">{fmt(totalPlanned)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        Gerçekleşen Maliyet (AC)
                      </span>
                      <span className="font-bold text-red-400">
                        {fmt(totalActual)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        Kazanılmış Değer (EV)
                      </span>
                      <span className="font-bold text-blue-400">
                        {fmt(totalEV)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        Maliyet Performans Endeksi (CPI)
                      </span>
                      <span
                        className={`font-bold text-xl ${CPI >= 1 ? "text-green-400" : "text-red-400"}`}
                      >
                        {CPI > 0 ? CPI.toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        Zaman Performans Endeksi (SPI)
                      </span>
                      <span
                        className={`font-bold text-xl ${SPI >= 1 ? "text-green-400" : "text-red-400"}`}
                      >
                        {SPI > 0 ? SPI.toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 rounded-lg bg-amber-500/10 px-3">
                      <span className="text-sm font-medium text-amber-400">
                        Tahmini Tamamlanma Maliyeti (EAC)
                      </span>
                      <span className="font-bold text-xl text-amber-400">
                        {fmt(EAC)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Yorum</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {CPI === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Veri girmek için iş paketi ekleyin.
                      </p>
                    ) : (
                      <>
                        {CPI < 1 && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-400">
                              ⚠️ CPI {CPI.toFixed(2)} — Proje bütçeyi aşıyor. Her
                              harcanan 1₺ için yalnızca {CPI.toFixed(2)}₺ değer
                              üretiliyor.
                            </p>
                          </div>
                        )}
                        {CPI >= 1 && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-sm text-green-400">
                              ✅ CPI {CPI.toFixed(2)} — Proje bütçe içinde
                              çalışıyor.
                            </p>
                          </div>
                        )}
                        {SPI < 1 && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-sm text-yellow-400">
                              ⏰ SPI {SPI.toFixed(2)} — Proje planın gerisinde.
                            </p>
                          </div>
                        )}
                        {SPI >= 1 && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-sm text-green-400">
                              ✅ SPI {SPI.toFixed(2)} — Proje zamanında
                              ilerliyor.
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Mevcut gidişle proje tahmini{" "}
                          <strong className="text-amber-400">{fmt(EAC)}</strong>{" "}
                          maliyetle tamamlanacak.
                          {EAC > totalPlanned
                            ? ` Bu, bütçenin ${fmt(EAC - totalPlanned)} üzerinde.`
                            : ` Bu, bütçenin ${fmt(totalPlanned - EAC)} altında.`}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedProjectId && (
        <Card className="border-border">
          <CardContent className="text-center py-16 text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Başlamak için yukarıdan bir proje seçin</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg" data-ocid="cost_control.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "İş Paketi Düzenle" : "İş Paketi Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kod</Label>
                <Input
                  placeholder="WP-001"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  data-ocid="cost_control.input"
                />
              </div>
              <div>
                <Label>% Tamamlanma</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.percentComplete}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      percentComplete: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Ad</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Planlanan Maliyet (₺)</Label>
                <Input
                  type="number"
                  value={form.plannedCost}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      plannedCost: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Gerçekleşen Maliyet (₺)</Label>
                <Input
                  type="number"
                  value={form.actualCost}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      actualCost: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Sorumlu</Label>
              <Input
                value={form.responsible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, responsible: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-ocid="cost_control.cancel_button"
            >
              İptal
            </Button>
            <Button onClick={handleSave} data-ocid="cost_control.submit_button">
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
