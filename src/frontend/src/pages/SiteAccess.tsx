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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car,
  CheckCircle2,
  HardHat,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface Visitor {
  id: string;
  name: string;
  company: string;
  purpose: string;
  phone: string;
  entryTime: string;
  exitTime: string;
  status: "İçeride" | "Çıktı";
  projectId: string;
  date: string;
}

interface VehicleEntry {
  id: string;
  plate: string;
  vehicleType: string;
  driver: string;
  entryTime: string;
  exitTime: string;
  purpose: string;
  projectId: string;
  date: string;
}

interface SafetyTraining {
  id: string;
  personName: string;
  trainingDate: string;
  trainingType: string;
  approvedBy: string;
  validUntil: string;
  status: "Geçerli" | "Süresi Doldu" | "Beklemede";
}

interface PPERecord {
  id: string;
  personName: string;
  ppeType: string;
  deliveryDate: string;
  serialNo: string;
  returnDate: string;
}

type SiteAccessData = {
  visitors: Visitor[];
  vehicles: VehicleEntry[];
  trainings: SafetyTraining[];
  ppe: PPERecord[];
};

export default function SiteAccess() {
  const { activeCompanyId, projects, user } = useApp();
  const companyId = activeCompanyId || "default";
  const storageKey = `pv_site_access_${companyId}`;

  const [data, setData] = useState<SiteAccessData>(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s
        ? JSON.parse(s)
        : { visitors: [], vehicles: [], trainings: [], ppe: [] };
    } catch {
      return { visitors: [], vehicles: [], trainings: [], ppe: [] };
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, storageKey]);

  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );
  const today = new Date().toISOString().slice(0, 10);

  // KPIs
  const todayInside = data.visitors.filter(
    (v) => v.date === today && v.status === "İçeride",
  ).length;
  const todayVehicles = data.vehicles.filter((v) => v.date === today).length;
  const pendingTraining = data.trainings.filter(
    (t) => t.status === "Beklemede",
  ).length;
  const thisMonthVisitors = data.visitors.filter((v) =>
    v.date.startsWith(new Date().toISOString().slice(0, 7)),
  ).length;

  // ─── Visitor Dialog ───────────────────────────────────────────────────────
  const emptyVis: Omit<Visitor, "id"> = {
    name: "",
    company: "",
    purpose: "",
    phone: "",
    entryTime: new Date().toTimeString().slice(0, 5),
    exitTime: "",
    status: "İçeride",
    projectId: "",
    date: today,
  };
  const [visOpen, setVisOpen] = useState(false);
  const [visForm, setVisForm] = useState(emptyVis);

  const saveVisitor = () => {
    if (!visForm.name.trim()) return;
    const v: Visitor = { ...visForm, id: Date.now().toString() };
    setData((prev) => ({ ...prev, visitors: [v, ...prev.visitors] }));
    setVisForm(emptyVis);
    setVisOpen(false);
  };

  const checkoutVisitor = (id: string) => {
    setData((prev) => ({
      ...prev,
      visitors: prev.visitors.map((v) =>
        v.id === id
          ? {
              ...v,
              status: "Çıktı" as const,
              exitTime: new Date().toTimeString().slice(0, 5),
            }
          : v,
      ),
    }));
  };

  // ─── Vehicle Dialog ───────────────────────────────────────────────────────
  const emptyVeh: Omit<VehicleEntry, "id"> = {
    plate: "",
    vehicleType: "Kamyon",
    driver: "",
    entryTime: new Date().toTimeString().slice(0, 5),
    exitTime: "",
    purpose: "",
    projectId: "",
    date: today,
  };
  const [vehOpen, setVehOpen] = useState(false);
  const [vehForm, setVehForm] = useState(emptyVeh);

  const saveVehicle = () => {
    if (!vehForm.plate.trim()) return;
    setData((prev) => ({
      ...prev,
      vehicles: [{ ...vehForm, id: Date.now().toString() }, ...prev.vehicles],
    }));
    setVehForm(emptyVeh);
    setVehOpen(false);
  };

  // ─── Training Dialog ──────────────────────────────────────────────────────
  const emptyTr: Omit<SafetyTraining, "id"> = {
    personName: "",
    trainingDate: today,
    trainingType: "Genel İSG",
    approvedBy: user?.name || "",
    validUntil: "",
    status: "Beklemede",
  };
  const [trOpen, setTrOpen] = useState(false);
  const [trForm, setTrForm] = useState(emptyTr);

  const saveTraining = () => {
    if (!trForm.personName.trim()) return;
    setData((prev) => ({
      ...prev,
      trainings: [{ ...trForm, id: Date.now().toString() }, ...prev.trainings],
    }));
    setTrForm(emptyTr);
    setTrOpen(false);
  };

  // ─── PPE Dialog ───────────────────────────────────────────────────────────
  const emptyPPE: Omit<PPERecord, "id"> = {
    personName: "",
    ppeType: "Baret",
    deliveryDate: today,
    serialNo: "",
    returnDate: "",
  };
  const [ppeOpen, setPpeOpen] = useState(false);
  const [ppeForm, setPpeForm] = useState(emptyPPE);

  const savePPE = () => {
    if (!ppeForm.personName.trim()) return;
    setData((prev) => ({
      ...prev,
      ppe: [{ ...ppeForm, id: Date.now().toString() }, ...prev.ppe],
    }));
    setPpeForm(emptyPPE);
    setPpeOpen(false);
  };

  const getProjectName = (id: string) =>
    companyProjects.find((p) => p.id === id)?.title || "-";

  const statusColor = (s: string) =>
    s === "İçeride" || s === "Geçerli"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : s === "Çıktı"
        ? "bg-slate-500/15 text-slate-400 border-slate-500/30"
        : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">
          Şantiye Girişi & Ziyaretçi Yönetimi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ziyaretçi, araç ve KKD kayıtları
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Bugün İçeride",
            value: todayInside,
            icon: Users,
            color: "text-emerald-400",
          },
          {
            label: "Bugün Araç Girişi",
            value: todayVehicles,
            icon: Car,
            color: "text-blue-400",
          },
          {
            label: "Bekleyen Eğitim",
            value: pendingTraining,
            icon: ShieldCheck,
            color: "text-amber-400",
          },
          {
            label: "Bu Ay Ziyaretçi",
            value: thisMonthVisitors,
            icon: MapPin,
            color: "text-purple-400",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="visitors">
        <TabsList className="bg-card border border-border flex flex-wrap h-auto gap-1">
          <TabsTrigger
            data-ocid="siteaccess.visitors.tab"
            value="visitors"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2" /> Ziyaretçiler
          </TabsTrigger>
          <TabsTrigger
            data-ocid="siteaccess.vehicles.tab"
            value="vehicles"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Car className="w-4 h-4 mr-2" /> Araç Girişleri
          </TabsTrigger>
          <TabsTrigger
            data-ocid="siteaccess.training.tab"
            value="training"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Şantiye Eğitimi
          </TabsTrigger>
          <TabsTrigger
            data-ocid="siteaccess.ppe.tab"
            value="ppe"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <HardHat className="w-4 h-4 mr-2" /> KKD Teslim
          </TabsTrigger>
        </TabsList>

        {/* ZİYARETÇİLER */}
        <TabsContent value="visitors" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Ziyaretçi Kaydı</h2>
            <Button
              data-ocid="siteaccess.add_visitor.button"
              onClick={() => setVisOpen(true)}
              className="gradient-bg text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Ziyaretçi Ekle
            </Button>
          </div>
          {data.visitors.length === 0 ? (
            <div
              data-ocid="siteaccess.visitors.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Henüz ziyaretçi kaydı yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Amaç</TableHead>
                      <TableHead>Giriş</TableHead>
                      <TableHead>Çıkış</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.visitors.map((v, idx) => (
                      <TableRow
                        key={v.id}
                        data-ocid={`siteaccess.visitor.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>{v.company}</TableCell>
                        <TableCell>{v.purpose}</TableCell>
                        <TableCell>{v.entryTime}</TableCell>
                        <TableCell>{v.exitTime || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColor(v.status)}
                          >
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {v.status === "İçeride" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => checkoutVisitor(v.id)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Çıkış
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ARAÇ GİRİŞLERİ */}
        <TabsContent value="vehicles" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Araç Girişleri</h2>
            <Button
              data-ocid="siteaccess.add_vehicle.button"
              onClick={() => setVehOpen(true)}
              className="gradient-bg text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Araç Giriş
            </Button>
          </div>
          {data.vehicles.length === 0 ? (
            <div
              data-ocid="siteaccess.vehicles.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Car className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Henüz araç kaydı yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Plaka</TableHead>
                      <TableHead>Araç Tipi</TableHead>
                      <TableHead>Sürücü</TableHead>
                      <TableHead>Giriş</TableHead>
                      <TableHead>Çıkış</TableHead>
                      <TableHead>Amaç</TableHead>
                      <TableHead>Proje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.vehicles.map((v, idx) => (
                      <TableRow
                        key={v.id}
                        data-ocid={`siteaccess.vehicle.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-mono font-semibold">
                          {v.plate}
                        </TableCell>
                        <TableCell>{v.vehicleType}</TableCell>
                        <TableCell>{v.driver}</TableCell>
                        <TableCell>{v.entryTime}</TableCell>
                        <TableCell>{v.exitTime || "-"}</TableCell>
                        <TableCell>{v.purpose}</TableCell>
                        <TableCell>{getProjectName(v.projectId)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ŞANTİYE EĞİTİMİ */}
        <TabsContent value="training" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Şantiye Eğitim Kayıtları</h2>
            <Button
              data-ocid="siteaccess.add_training.button"
              onClick={() => setTrOpen(true)}
              className="gradient-bg text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Eğitim Ekle
            </Button>
          </div>
          {data.trainings.length === 0 ? (
            <div
              data-ocid="siteaccess.training.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Henüz eğitim kaydı yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Kişi Adı</TableHead>
                      <TableHead>Eğitim Türü</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Onaylayan</TableHead>
                      <TableHead>Geçerlilik</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.trainings.map((t, idx) => (
                      <TableRow
                        key={t.id}
                        data-ocid={`siteaccess.training.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-medium">
                          {t.personName}
                        </TableCell>
                        <TableCell>{t.trainingType}</TableCell>
                        <TableCell>{t.trainingDate}</TableCell>
                        <TableCell>{t.approvedBy}</TableCell>
                        <TableCell>{t.validUntil || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColor(t.status)}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* KKD TESLİM */}
        <TabsContent value="ppe" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">KKD Teslim Kayıtları</h2>
            <Button
              data-ocid="siteaccess.add_ppe.button"
              onClick={() => setPpeOpen(true)}
              className="gradient-bg text-white gap-2"
            >
              <Plus className="w-4 h-4" /> KKD Teslim
            </Button>
          </div>
          {data.ppe.length === 0 ? (
            <div
              data-ocid="siteaccess.ppe.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <HardHat className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Henüz KKD kaydı yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Kişi Adı</TableHead>
                      <TableHead>KKD Türü</TableHead>
                      <TableHead>Teslim Tarihi</TableHead>
                      <TableHead>Seri No</TableHead>
                      <TableHead>İade Tarihi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ppe.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        data-ocid={`siteaccess.ppe.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-medium">
                          {p.personName}
                        </TableCell>
                        <TableCell>{p.ppeType}</TableCell>
                        <TableCell>{p.deliveryDate}</TableCell>
                        <TableCell className="font-mono">
                          {p.serialNo || "-"}
                        </TableCell>
                        <TableCell>{p.returnDate || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Visitor Dialog */}
      <Dialog open={visOpen} onOpenChange={setVisOpen}>
        <DialogContent
          data-ocid="siteaccess.visitor.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Ziyaretçi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ad Soyad *</Label>
                <Input
                  data-ocid="siteaccess.visitor.name.input"
                  value={visForm.name}
                  onChange={(e) =>
                    setVisForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Firma</Label>
                <Input
                  data-ocid="siteaccess.visitor.company.input"
                  value={visForm.company}
                  onChange={(e) =>
                    setVisForm((p) => ({ ...p, company: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ziyaret Amacı</Label>
                <Input
                  data-ocid="siteaccess.visitor.purpose.input"
                  value={visForm.purpose}
                  onChange={(e) =>
                    setVisForm((p) => ({ ...p, purpose: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  data-ocid="siteaccess.visitor.phone.input"
                  value={visForm.phone}
                  onChange={(e) =>
                    setVisForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Giriş Saati</Label>
                <Input
                  data-ocid="siteaccess.visitor.entry.input"
                  type="time"
                  value={visForm.entryTime}
                  onChange={(e) =>
                    setVisForm((p) => ({ ...p, entryTime: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Proje</Label>
                <Select
                  value={visForm.projectId}
                  onValueChange={(v) =>
                    setVisForm((p) => ({ ...p, projectId: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="siteaccess.visitor.project.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="">-</SelectItem>
                    {companyProjects.map((pr) => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVisOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="siteaccess.visitor.save_button"
              onClick={saveVisitor}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Dialog */}
      <Dialog open={vehOpen} onOpenChange={setVehOpen}>
        <DialogContent
          data-ocid="siteaccess.vehicle.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Araç Giriş Kaydı</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plaka *</Label>
                <Input
                  data-ocid="siteaccess.vehicle.plate.input"
                  value={vehForm.plate}
                  onChange={(e) =>
                    setVehForm((p) => ({ ...p, plate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                  placeholder="34 ABC 123"
                />
              </div>
              <div>
                <Label>Araç Tipi</Label>
                <Select
                  value={vehForm.vehicleType}
                  onValueChange={(v) =>
                    setVehForm((p) => ({ ...p, vehicleType: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="siteaccess.vehicle.type.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {[
                      "Kamyon",
                      "Kamyonet",
                      "Otomobil",
                      "İş Makinesi",
                      "Minibüs",
                      "Diğer",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sürücü</Label>
                <Input
                  data-ocid="siteaccess.vehicle.driver.input"
                  value={vehForm.driver}
                  onChange={(e) =>
                    setVehForm((p) => ({ ...p, driver: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Giriş Saati</Label>
                <Input
                  data-ocid="siteaccess.vehicle.entry.input"
                  type="time"
                  value={vehForm.entryTime}
                  onChange={(e) =>
                    setVehForm((p) => ({ ...p, entryTime: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div>
              <Label>Amaç</Label>
              <Input
                data-ocid="siteaccess.vehicle.purpose.input"
                value={vehForm.purpose}
                onChange={(e) =>
                  setVehForm((p) => ({ ...p, purpose: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Malzeme teslimatı..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVehOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="siteaccess.vehicle.save_button"
              onClick={saveVehicle}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Training Dialog */}
      <Dialog open={trOpen} onOpenChange={setTrOpen}>
        <DialogContent
          data-ocid="siteaccess.training.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Eğitim Kaydı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kişi Adı *</Label>
              <Input
                data-ocid="siteaccess.training.person.input"
                value={trForm.personName}
                onChange={(e) =>
                  setTrForm((p) => ({ ...p, personName: e.target.value }))
                }
                className="mt-1 bg-card border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Eğitim Türü</Label>
                <Select
                  value={trForm.trainingType}
                  onValueChange={(v) =>
                    setTrForm((p) => ({ ...p, trainingType: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="siteaccess.training.type.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {[
                      "Genel İSG",
                      "Yangın Güvenliği",
                      "İlk Yardım",
                      "Yüksekte Çalışma",
                      "Elektrik Güvenliği",
                      "Diğer",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Eğitim Tarihi</Label>
                <Input
                  data-ocid="siteaccess.training.date.input"
                  type="date"
                  value={trForm.trainingDate}
                  onChange={(e) =>
                    setTrForm((p) => ({ ...p, trainingDate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Onaylayan</Label>
                <Input
                  data-ocid="siteaccess.training.approver.input"
                  value={trForm.approvedBy}
                  onChange={(e) =>
                    setTrForm((p) => ({ ...p, approvedBy: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Geçerlilik Tarihi</Label>
                <Input
                  data-ocid="siteaccess.training.valid.input"
                  type="date"
                  value={trForm.validUntil}
                  onChange={(e) =>
                    setTrForm((p) => ({ ...p, validUntil: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={trForm.status}
                onValueChange={(v: "Geçerli" | "Süresi Doldu" | "Beklemede") =>
                  setTrForm((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger
                  data-ocid="siteaccess.training.status.select"
                  className="mt-1 bg-card border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Beklemede">Beklemede</SelectItem>
                  <SelectItem value="Geçerli">Geçerli</SelectItem>
                  <SelectItem value="Süresi Doldu">Süresi Doldu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="siteaccess.training.save_button"
              onClick={saveTraining}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PPE Dialog */}
      <Dialog open={ppeOpen} onOpenChange={setPpeOpen}>
        <DialogContent
          data-ocid="siteaccess.ppe.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>KKD Teslim Kaydı</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kişi Adı *</Label>
              <Input
                data-ocid="siteaccess.ppe.person.input"
                value={ppeForm.personName}
                onChange={(e) =>
                  setPpeForm((p) => ({ ...p, personName: e.target.value }))
                }
                className="mt-1 bg-card border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>KKD Türü</Label>
                <Select
                  value={ppeForm.ppeType}
                  onValueChange={(v) =>
                    setPpeForm((p) => ({ ...p, ppeType: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="siteaccess.ppe.type.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {[
                      "Baret",
                      "Güvenlik Gözlüğü",
                      "İş Eldiveni",
                      "Güvenlik Ayakkabısı",
                      "Yelek",
                      "Koruyucu Maske",
                      "Emniyet Kemeri",
                      "Diğer",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Teslim Tarihi</Label>
                <Input
                  data-ocid="siteaccess.ppe.delivery.input"
                  type="date"
                  value={ppeForm.deliveryDate}
                  onChange={(e) =>
                    setPpeForm((p) => ({ ...p, deliveryDate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div>
              <Label>Seri No</Label>
              <Input
                data-ocid="siteaccess.ppe.serial.input"
                value={ppeForm.serialNo}
                onChange={(e) =>
                  setPpeForm((p) => ({ ...p, serialNo: e.target.value }))
                }
                className="mt-1 bg-card border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPpeOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="siteaccess.ppe.save_button"
              onClick={savePPE}
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
