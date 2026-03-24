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
import { Leaf, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

const WASTE_TYPES = ["İnşaat atığı", "Tehlikeli madde", "Organik", "Diğer"];
const DISPOSAL_METHODS = [
  "Düzenli depolama",
  "Geri dönüşüm",
  "Yakma",
  "Kompost",
  "Özel bertaraf",
];
const PERMIT_STATUSES = ["Geçerli", "Süresi Dolmuş", "Yenileme Gerekli"];

interface WasteRecord {
  id: string;
  wasteType: string;
  amount: number;
  disposalMethod: string;
  date: string;
  projectId: string;
  projectName: string;
  notes: string;
}

interface EnvPermit {
  id: string;
  permitType: string;
  issuingAuthority: string;
  validUntil: string;
  status: string;
  notes: string;
}

export default function EnvironmentalManagement() {
  const { activeCompanyId, checkPermission } = useApp();
  const companyId = activeCompanyId || "default";
  const canView = checkPermission("fieldOps", "view");
  const canEdit = checkPermission("fieldOps", "edit");

  const projects: { id: string; title: string }[] = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_${companyId}_projects`) || "[]",
      );
    } catch {
      return [];
    }
  })();

  const [wastes, setWastes] = useState<WasteRecord[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_${companyId}_environmentalWaste`) || "[]",
      );
    } catch {
      return [];
    }
  });

  const [permits, setPermits] = useState<EnvPermit[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_${companyId}_environmentalPermits`) || "[]",
      );
    } catch {
      return [];
    }
  });

  const saveWastes = (updated: WasteRecord[]) => {
    setWastes(updated);
    localStorage.setItem(
      `pv_${companyId}_environmentalWaste`,
      JSON.stringify(updated),
    );
  };

  const savePermits = (updated: EnvPermit[]) => {
    setPermits(updated);
    localStorage.setItem(
      `pv_${companyId}_environmentalPermits`,
      JSON.stringify(updated),
    );
  };

  // Waste form
  const emptyWaste = {
    wasteType: WASTE_TYPES[0],
    amount: "",
    disposalMethod: DISPOSAL_METHODS[0],
    date: new Date().toISOString().slice(0, 10),
    projectId: "",
    projectName: "",
    notes: "",
  };
  const [wasteOpen, setWasteOpen] = useState(false);
  const [wasteForm, setWasteForm] = useState(emptyWaste);

  const saveWaste = () => {
    if (!wasteForm.amount) return;
    const project = projects.find((p) => p.id === wasteForm.projectId);
    const entry: WasteRecord = {
      id: Date.now().toString(),
      ...wasteForm,
      amount: Number(wasteForm.amount) || 0,
      projectName: project?.title || "-",
    };
    saveWastes([entry, ...wastes]);
    setWasteForm(emptyWaste);
    setWasteOpen(false);
  };

  // Permit form
  const emptyPermit = {
    permitType: "",
    issuingAuthority: "",
    validUntil: "",
    status: PERMIT_STATUSES[0],
    notes: "",
  };
  const [permitOpen, setPermitOpen] = useState(false);
  const [permitForm, setPermitForm] = useState(emptyPermit);

  const savePermit = () => {
    if (!permitForm.permitType || !permitForm.issuingAuthority) return;
    const entry: EnvPermit = { id: Date.now().toString(), ...permitForm };
    savePermits([entry, ...permits]);
    setPermitForm(emptyPermit);
    setPermitOpen(false);
  };

  // Monthly chart data
  const monthlyData: Record<string, number> = {};
  for (const w of wastes) {
    const month = w.date.slice(0, 7);
    monthlyData[month] = (monthlyData[month] || 0) + w.amount;
  }
  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month: month.slice(5), amount }));

  const permitSummary = PERMIT_STATUSES.map((s) => ({
    status: s,
    count: permits.filter((p) => p.status === s).length,
  }));

  if (!canView) return <AccessDenied />;

  const statusColor = (s: string) => {
    if (s === "Geçerli")
      return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (s === "Süresi Dolmuş")
      return "text-rose-400 border-rose-500/30 bg-rose-500/10";
    return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">
          Çevre & Atık Yönetimi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Atık takibi, çevresel izinler ve raporlama
        </p>
      </div>

      <Tabs defaultValue="waste">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="env.waste.tab"
            value="waste"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Atık Takibi
          </TabsTrigger>
          <TabsTrigger
            data-ocid="env.permits.tab"
            value="permits"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Çevresel İzinler
          </TabsTrigger>
          <TabsTrigger
            data-ocid="env.reporting.tab"
            value="reporting"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Leaf className="w-4 h-4 mr-2" /> Raporlama
          </TabsTrigger>
        </TabsList>

        {/* ATIK TAKİBİ */}
        <TabsContent value="waste" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-foreground">Atık Kayıtları</h2>
            {canEdit && (
              <Button
                data-ocid="env.waste.add_button"
                onClick={() => setWasteOpen(true)}
                className="gradient-bg text-white gap-2"
              >
                <Plus className="w-4 h-4" /> Atık Kaydı Ekle
              </Button>
            )}
          </div>
          {wastes.length === 0 ? (
            <div
              data-ocid="env.waste.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Trash2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Henüz atık kaydı eklenmemiş
              </p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Atık Türü</TableHead>
                      <TableHead>Miktar (ton)</TableHead>
                      <TableHead>Bertaraf Yöntemi</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Proje</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wastes.map((w, idx) => (
                      <TableRow
                        key={w.id}
                        data-ocid={`env.waste.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-amber-400 border-amber-500/30"
                          >
                            {w.wasteType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {w.amount}
                        </TableCell>
                        <TableCell className="text-sm">
                          {w.disposalMethod}
                        </TableCell>
                        <TableCell className="text-sm">{w.date}</TableCell>
                        <TableCell className="text-sm">
                          {w.projectName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {w.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ÇEVRESEL İZİNLER */}
        <TabsContent value="permits" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-foreground">Çevresel İzinler</h2>
            {canEdit && (
              <Button
                data-ocid="env.permit.add_button"
                onClick={() => setPermitOpen(true)}
                className="gradient-bg text-white gap-2"
              >
                <Plus className="w-4 h-4" /> İzin Ekle
              </Button>
            )}
          </div>
          {permits.length === 0 ? (
            <div
              data-ocid="env.permits.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Henüz çevresel izin eklenmemiş
              </p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>İzin Türü</TableHead>
                      <TableHead>Veren Kurum</TableHead>
                      <TableHead>Geçerlilik Tarihi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permits.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        data-ocid={`env.permit.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-medium">
                          {p.permitType}
                        </TableCell>
                        <TableCell>{p.issuingAuthority}</TableCell>
                        <TableCell className="text-sm">
                          {p.validUntil || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColor(p.status)}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RAPORLAMA */}
        <TabsContent value="reporting" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base">
                  Aylık Atık Miktarı (ton)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div
                    data-ocid="env.reporting.chart.empty_state"
                    className="flex items-center justify-center h-48 text-muted-foreground text-sm"
                  >
                    Veri yok
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.3 0 0)"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "oklch(0.5 0 0)" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0 0)" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.2 0 0)",
                          border: "1px solid oklch(0.3 0 0)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        name="Miktar (ton)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base">İzin Durum Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                {permits.length === 0 ? (
                  <div
                    data-ocid="env.reporting.permits.empty_state"
                    className="flex items-center justify-center h-48 text-muted-foreground text-sm"
                  >
                    İzin kaydı yok
                  </div>
                ) : (
                  <div className="space-y-3 mt-2">
                    {permitSummary.map((s) => (
                      <div
                        key={s.status}
                        className="flex items-center justify-between"
                      >
                        <Badge
                          variant="outline"
                          className={statusColor(s.status)}
                        >
                          {s.status}
                        </Badge>
                        <span className="text-lg font-bold text-foreground">
                          {s.count}
                        </span>
                      </div>
                    ))}
                    <div className="mt-4 space-y-2">
                      {permitSummary.map((s) => (
                        <div key={s.status}>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{s.status}</span>
                            <span>
                              {permits.length > 0
                                ? Math.round((s.count / permits.length) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${s.status === "Geçerli" ? "bg-emerald-500" : s.status === "Süresi Dolmuş" ? "bg-rose-500" : "bg-amber-500"}`}
                              style={{
                                width: `${permits.length > 0 ? (s.count / permits.length) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Waste Dialog */}
      <Dialog open={wasteOpen} onOpenChange={setWasteOpen}>
        <DialogContent
          data-ocid="env.waste.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Atık Kaydı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Atık Türü</Label>
              <Select
                value={wasteForm.wasteType}
                onValueChange={(v) =>
                  setWasteForm((p) => ({ ...p, wasteType: v }))
                }
              >
                <SelectTrigger
                  data-ocid="env.waste.type.select"
                  className="mt-1 bg-card border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {WASTE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Miktar (ton) *</Label>
                <Input
                  data-ocid="env.waste.amount.input"
                  type="number"
                  value={wasteForm.amount}
                  onChange={(e) =>
                    setWasteForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Tarih</Label>
                <Input
                  data-ocid="env.waste.date.input"
                  type="date"
                  value={wasteForm.date}
                  onChange={(e) =>
                    setWasteForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div>
              <Label>Bertaraf Yöntemi</Label>
              <Select
                value={wasteForm.disposalMethod}
                onValueChange={(v) =>
                  setWasteForm((p) => ({ ...p, disposalMethod: v }))
                }
              >
                <SelectTrigger
                  data-ocid="env.waste.disposal.select"
                  className="mt-1 bg-card border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {DISPOSAL_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proje</Label>
              <Select
                value={wasteForm.projectId}
                onValueChange={(v) =>
                  setWasteForm((p) => ({ ...p, projectId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="env.waste.project.select"
                  className="mt-1 bg-card border-border"
                >
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notlar</Label>
              <Input
                data-ocid="env.waste.notes.input"
                value={wasteForm.notes}
                onChange={(e) =>
                  setWasteForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Ek açıklama..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWasteOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="env.waste.save_button"
              onClick={saveWaste}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permit Dialog */}
      <Dialog open={permitOpen} onOpenChange={setPermitOpen}>
        <DialogContent
          data-ocid="env.permit.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Çevresel İzin Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>İzin Türü *</Label>
              <Input
                data-ocid="env.permit.type.input"
                value={permitForm.permitType}
                onChange={(e) =>
                  setPermitForm((p) => ({ ...p, permitType: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Örn: ÇED İzni"
              />
            </div>
            <div>
              <Label>Veren Kurum *</Label>
              <Input
                data-ocid="env.permit.authority.input"
                value={permitForm.issuingAuthority}
                onChange={(e) =>
                  setPermitForm((p) => ({
                    ...p,
                    issuingAuthority: e.target.value,
                  }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Örn: Çevre ve Şehircilik Bakanlığı"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Geçerlilik Tarihi</Label>
                <Input
                  data-ocid="env.permit.valid.input"
                  type="date"
                  value={permitForm.validUntil}
                  onChange={(e) =>
                    setPermitForm((p) => ({ ...p, validUntil: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Durum</Label>
                <Select
                  value={permitForm.status}
                  onValueChange={(v) =>
                    setPermitForm((p) => ({ ...p, status: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="env.permit.status.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PERMIT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notlar</Label>
              <Input
                data-ocid="env.permit.notes.input"
                value={permitForm.notes}
                onChange={(e) =>
                  setPermitForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Ek açıklama..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPermitOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="env.permit.save_button"
              onClick={savePermit}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
