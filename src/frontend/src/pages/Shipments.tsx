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
  CheckCircle2,
  Clock,
  Package,
  PackageCheck,
  Plus,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

type ShipmentStatus =
  | "Beklemede"
  | "Yolda"
  | "Teslim Edildi"
  | "Kısmi"
  | "İptal";

interface Shipment {
  id: string;
  shipmentNo: string;
  supplier: string;
  projectId: string;
  plannedDate: string;
  actualDate: string;
  status: ShipmentStatus;
  invoiceNo: string;
  notes: string;
}

interface ShipmentLine {
  id: string;
  shipmentId: string;
  materialName: string;
  expectedQty: number;
  deliveredQty: number;
  unit: string;
}

interface VehicleTracking {
  id: string;
  shipmentId: string;
  plate: string;
  driver: string;
  phone: string;
  locationNote: string;
  estimatedArrival: string;
}

interface AuditEntry {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
}

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  Beklemede: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Yolda: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Teslim Edildi": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Kısmi: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  İptal: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function Shipments() {
  const {
    activeCompanyId,
    projects,
    user,
    stockItems,
    setStockItems,
    stockMovements,
    setStockMovements,
  } = useApp();
  const companyId = activeCompanyId || "default";
  const storageKey = `pv_shipments_${companyId}`;

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [lines, setLines] = useState<ShipmentLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}_lines`) || "[]");
    } catch {
      return [];
    }
  });
  const [vehicles, setVehicles] = useState<VehicleTracking[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}_vehicles`) || "[]");
    } catch {
      return [];
    }
  });
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}_audit`) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(shipments));
  }, [shipments, storageKey]);
  useEffect(() => {
    localStorage.setItem(`${storageKey}_lines`, JSON.stringify(lines));
  }, [lines, storageKey]);
  useEffect(() => {
    localStorage.setItem(`${storageKey}_vehicles`, JSON.stringify(vehicles));
  }, [vehicles, storageKey]);
  useEffect(() => {
    localStorage.setItem(`${storageKey}_audit`, JSON.stringify(auditLog));
  }, [auditLog, storageKey]);

  const addAudit = (action: string, details: string) => {
    const entry: AuditEntry = {
      id: Date.now().toString(),
      action,
      details,
      user: user?.name || "Kullanıcı",
      timestamp: new Date().toLocaleString("tr-TR"),
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );
  const today = new Date().toISOString().slice(0, 7);

  // KPIs
  const pending = shipments.filter((s) => s.status === "Beklemede").length;
  const inTransit = shipments.filter((s) => s.status === "Yolda").length;
  const deliveredThisMonth = shipments.filter(
    (s) => s.status === "Teslim Edildi" && s.actualDate?.startsWith(today),
  ).length;
  const partial = shipments.filter((s) => s.status === "Kısmi").length;

  // ─── Shipment Dialog ─────────────────────────────────────────────────────
  const emptyShip = {
    shipmentNo: "",
    supplier: "",
    projectId: "",
    plannedDate: "",
    actualDate: "",
    status: "Beklemede" as ShipmentStatus,
    invoiceNo: "",
    notes: "",
  };
  const [shipOpen, setShipOpen] = useState(false);
  const [editShipId, setEditShipId] = useState<string | null>(null);
  const [shipForm, setShipForm] = useState(emptyShip);

  const openNewShip = () => {
    setEditShipId(null);
    setShipForm(emptyShip);
    setShipOpen(true);
  };
  const openEditShip = (s: Shipment) => {
    setEditShipId(s.id);
    setShipForm({
      shipmentNo: s.shipmentNo,
      supplier: s.supplier,
      projectId: s.projectId,
      plannedDate: s.plannedDate,
      actualDate: s.actualDate,
      status: s.status,
      invoiceNo: s.invoiceNo,
      notes: s.notes,
    });
    setShipOpen(true);
  };
  const saveShip = () => {
    if (!shipForm.shipmentNo.trim()) return;
    if (editShipId) {
      setShipments((prev) =>
        prev.map((s) => (s.id === editShipId ? { ...s, ...shipForm } : s)),
      );
      addAudit("Sevkiyat güncellendi", shipForm.shipmentNo);
    } else {
      setShipments((prev) => [
        ...prev,
        { id: Date.now().toString(), ...shipForm },
      ]);
      addAudit("Sevkiyat eklendi", shipForm.shipmentNo);
    }
    setShipOpen(false);
  };

  // ─── Delivery Tab ─────────────────────────────────────────────────────────
  const [selectedShipId, setSelectedShipId] = useState("");
  const selectedLines = lines.filter((l) => l.shipmentId === selectedShipId);

  const emptyLine = {
    materialName: "",
    expectedQty: "",
    deliveredQty: "",
    unit: "Adet",
  };
  const [lineForm, setLineForm] = useState(emptyLine);
  const [lineOpen, setLineOpen] = useState(false);

  const saveLine = () => {
    if (!lineForm.materialName.trim() || !selectedShipId) return;
    const newLine: ShipmentLine = {
      id: Date.now().toString(),
      shipmentId: selectedShipId,
      materialName: lineForm.materialName,
      expectedQty: Number(lineForm.expectedQty) || 0,
      deliveredQty: Number(lineForm.deliveredQty) || 0,
      unit: lineForm.unit,
    };
    setLines((prev) => [...prev, newLine]);
    setLineForm(emptyLine);
    setLineOpen(false);
  };

  const handleReceive = (line: ShipmentLine) => {
    const ship = shipments.find((s) => s.id === line.shipmentId);
    const proj = companyProjects.find((p) => p.id === ship?.projectId);
    const existingItem = stockItems.find((s) => s.name === line.materialName);
    if (existingItem) {
      setStockItems(
        stockItems.map((s) =>
          s.id === existingItem.id
            ? { ...s, quantity: s.quantity + line.deliveredQty }
            : s,
        ),
      );
    }
    setStockMovements([
      ...stockMovements,
      {
        id: Date.now().toString(),
        date: new Date().toISOString().slice(0, 10),
        material: line.materialName,
        type: "Giriş" as const,
        qty: line.deliveredQty,
        unit: line.unit,
        project: proj?.title || "-",
        recordedBy: user?.name || "Kullanıcı",
      },
    ]);
    addAudit(
      "Malzeme teslim alındı",
      `${line.materialName} - ${line.deliveredQty} ${line.unit}`,
    );
  };

  // ─── Vehicle Dialog ───────────────────────────────────────────────────────
  const emptyVeh = {
    shipmentId: "",
    plate: "",
    driver: "",
    phone: "",
    locationNote: "",
    estimatedArrival: "",
  };
  const [vehOpen, setVehOpen] = useState(false);
  const [vehForm, setVehForm] = useState(emptyVeh);

  const saveVehicle = () => {
    if (!vehForm.plate.trim()) return;
    setVehicles((prev) => [...prev, { id: Date.now().toString(), ...vehForm }]);
    setVehForm(emptyVeh);
    setVehOpen(false);
  };

  const getProjectName = (id: string) =>
    companyProjects.find((p) => p.id === id)?.title || "-";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">
          Sevkiyat & Teslimat Takibi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tedarikçi sevkiyatları ve teslimat yönetimi
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Bekleyen Sevkiyat",
            value: pending,
            icon: Clock,
            color: "text-amber-400",
          },
          {
            label: "Yolda Olan",
            value: inTransit,
            icon: Truck,
            color: "text-blue-400",
          },
          {
            label: "Bu Ay Teslim",
            value: deliveredThisMonth,
            icon: PackageCheck,
            color: "text-emerald-400",
          },
          {
            label: "Kısmi Teslimat",
            value: partial,
            icon: Package,
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

      <Tabs defaultValue="shipments">
        <TabsList className="bg-card border border-border flex flex-wrap h-auto gap-1">
          <TabsTrigger
            data-ocid="shipments.list.tab"
            value="shipments"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Truck className="w-4 h-4 mr-2" /> Sevkiyatlar
          </TabsTrigger>
          <TabsTrigger
            data-ocid="shipments.delivery.tab"
            value="delivery"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Package className="w-4 h-4 mr-2" /> Teslimat Detayları
          </TabsTrigger>
          <TabsTrigger
            data-ocid="shipments.vehicles.tab"
            value="vehicles"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Araç Takibi
          </TabsTrigger>
          <TabsTrigger
            data-ocid="shipments.audit.tab"
            value="audit"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Denetim Logu
          </TabsTrigger>
        </TabsList>

        {/* SEVKİYATLAR */}
        <TabsContent value="shipments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Sevkiyat Listesi</h2>
            <Button
              data-ocid="shipments.add.button"
              onClick={openNewShip}
              className="gradient-bg text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Sevkiyat Ekle
            </Button>
          </div>
          {shipments.length === 0 ? (
            <div
              data-ocid="shipments.list.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Truck className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Henüz sevkiyat kaydı yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Sevkiyat No</TableHead>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead>Proje</TableHead>
                      <TableHead>Plan Tarihi</TableHead>
                      <TableHead>Gerçekleşen</TableHead>
                      <TableHead>İrsaliye No</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((s, idx) => (
                      <TableRow
                        key={s.id}
                        data-ocid={`shipments.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-mono font-semibold">
                          {s.shipmentNo}
                        </TableCell>
                        <TableCell>{s.supplier}</TableCell>
                        <TableCell>{getProjectName(s.projectId)}</TableCell>
                        <TableCell>{s.plannedDate}</TableCell>
                        <TableCell>{s.actualDate || "-"}</TableCell>
                        <TableCell className="font-mono">
                          {s.invoiceNo || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STATUS_COLORS[s.status]}
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => openEditShip(s)}
                          >
                            Düzenle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TESLİMAT DETAYLARI */}
        <TabsContent value="delivery" className="mt-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="font-semibold">Teslimat Detayları</h2>
            <div className="flex gap-2">
              <Select value={selectedShipId} onValueChange={setSelectedShipId}>
                <SelectTrigger
                  data-ocid="shipments.delivery.select"
                  className="w-48 bg-card border-border"
                >
                  <SelectValue placeholder="Sevkiyat seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {shipments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shipmentNo} - {s.supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedShipId && (
                <Button
                  data-ocid="shipments.add_line.button"
                  onClick={() => setLineOpen(true)}
                  className="gradient-bg text-white gap-2"
                >
                  <Plus className="w-4 h-4" /> Kalem Ekle
                </Button>
              )}
            </div>
          </div>
          {selectedShipId && selectedLines.length === 0 ? (
            <div
              data-ocid="shipments.delivery.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Bu sevkiyata ait kalem yok
              </p>
            </div>
          ) : !selectedShipId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">Sevkiyat seçin</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Malzeme</TableHead>
                      <TableHead>Beklenen Miktar</TableHead>
                      <TableHead>Teslim Edilen</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Fark</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLines.map((l, idx) => (
                      <TableRow
                        key={l.id}
                        data-ocid={`shipments.line.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-medium">
                          {l.materialName}
                        </TableCell>
                        <TableCell>{l.expectedQty}</TableCell>
                        <TableCell>{l.deliveredQty}</TableCell>
                        <TableCell>{l.unit}</TableCell>
                        <TableCell
                          className={
                            l.deliveredQty < l.expectedQty
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }
                        >
                          {l.deliveredQty - l.expectedQty}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-emerald-400"
                            onClick={() => handleReceive(l)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Teslim Al
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ARAÇ TAKİBİ */}
        <TabsContent value="vehicles" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Araç Takibi</h2>
            <Button
              data-ocid="shipments.add_vehicle.button"
              onClick={() => setVehOpen(true)}
              className="gradient-bg text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Araç Ekle
            </Button>
          </div>
          {vehicles.length === 0 ? (
            <div
              data-ocid="shipments.vehicles.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Truck className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Henüz araç takip kaydı yok
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v, idx) => (
                <Card
                  key={v.id}
                  data-ocid={`shipments.vehicle.card.${idx + 1}`}
                  className="bg-slate-800/50 border-slate-700"
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-semibold">{v.plate}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Sürücü:{" "}
                        <span className="text-foreground">{v.driver}</span>
                      </div>
                      <div>
                        Tel: <span className="text-foreground">{v.phone}</span>
                      </div>
                      <div>
                        Konum:{" "}
                        <span className="text-foreground">
                          {v.locationNote || "-"}
                        </span>
                      </div>
                      <div>
                        Tahmini Varış:{" "}
                        <span className="text-foreground">
                          {v.estimatedArrival || "-"}
                        </span>
                      </div>
                      {v.shipmentId && (
                        <div>
                          Sevkiyat:{" "}
                          <span className="text-amber-400">
                            {shipments.find((s) => s.id === v.shipmentId)
                              ?.shipmentNo || "-"}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* DENETİM LOGU */}
        <TabsContent value="audit" className="mt-6">
          <h2 className="font-semibold mb-4">Denetim Logu</h2>
          {auditLog.length === 0 ? (
            <div
              data-ocid="shipments.audit.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <p className="text-muted-foreground">Henüz kayıt yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Zaman</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>Detay</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((e, idx) => (
                      <TableRow
                        key={e.id}
                        data-ocid={`shipments.audit.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {e.timestamp}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {e.action}
                        </TableCell>
                        <TableCell className="text-sm">{e.details}</TableCell>
                        <TableCell className="text-sm">{e.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Shipment Dialog */}
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent
          data-ocid="shipments.ship.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>
              {editShipId ? "Sevkiyatı Düzenle" : "Yeni Sevkiyat"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sevkiyat No *</Label>
                <Input
                  data-ocid="shipments.ship.no.input"
                  value={shipForm.shipmentNo}
                  onChange={(e) =>
                    setShipForm((p) => ({ ...p, shipmentNo: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                  placeholder="SVK-001"
                />
              </div>
              <div>
                <Label>Tedarikçi</Label>
                <Input
                  data-ocid="shipments.ship.supplier.input"
                  value={shipForm.supplier}
                  onChange={(e) =>
                    setShipForm((p) => ({ ...p, supplier: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Proje</Label>
                <Select
                  value={shipForm.projectId}
                  onValueChange={(v) =>
                    setShipForm((p) => ({ ...p, projectId: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="shipments.ship.project.select"
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
              <div>
                <Label>Durum</Label>
                <Select
                  value={shipForm.status}
                  onValueChange={(v: ShipmentStatus) =>
                    setShipForm((p) => ({ ...p, status: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="shipments.ship.status.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(
                      [
                        "Beklemede",
                        "Yolda",
                        "Teslim Edildi",
                        "Kısmi",
                        "İptal",
                      ] as ShipmentStatus[]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan Tarihi</Label>
                <Input
                  data-ocid="shipments.ship.planned.input"
                  type="date"
                  value={shipForm.plannedDate}
                  onChange={(e) =>
                    setShipForm((p) => ({ ...p, plannedDate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Gerçekleşen Tarih</Label>
                <Input
                  data-ocid="shipments.ship.actual.input"
                  type="date"
                  value={shipForm.actualDate}
                  onChange={(e) =>
                    setShipForm((p) => ({ ...p, actualDate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div>
              <Label>İrsaliye No</Label>
              <Input
                data-ocid="shipments.ship.invoice.input"
                value={shipForm.invoiceNo}
                onChange={(e) =>
                  setShipForm((p) => ({ ...p, invoiceNo: e.target.value }))
                }
                className="mt-1 bg-card border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShipOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="shipments.ship.save_button"
              onClick={saveShip}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Line Dialog */}
      <Dialog open={lineOpen} onOpenChange={setLineOpen}>
        <DialogContent
          data-ocid="shipments.line.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Kalem Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Malzeme Adı *</Label>
              <Input
                data-ocid="shipments.line.name.input"
                value={lineForm.materialName}
                onChange={(e) =>
                  setLineForm((p) => ({ ...p, materialName: e.target.value }))
                }
                className="mt-1 bg-card border-border"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Beklenen Miktar</Label>
                <Input
                  data-ocid="shipments.line.expected.input"
                  type="number"
                  value={lineForm.expectedQty}
                  onChange={(e) =>
                    setLineForm((p) => ({ ...p, expectedQty: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Teslim Edilen</Label>
                <Input
                  data-ocid="shipments.line.delivered.input"
                  type="number"
                  value={lineForm.deliveredQty}
                  onChange={(e) =>
                    setLineForm((p) => ({ ...p, deliveredQty: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Birim</Label>
                <Input
                  data-ocid="shipments.line.unit.input"
                  value={lineForm.unit}
                  onChange={(e) =>
                    setLineForm((p) => ({ ...p, unit: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLineOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="shipments.line.save_button"
              onClick={saveLine}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Tracking Dialog */}
      <Dialog open={vehOpen} onOpenChange={setVehOpen}>
        <DialogContent
          data-ocid="shipments.veh.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Araç Takip Kaydı</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sevkiyat</Label>
              <Select
                value={vehForm.shipmentId}
                onValueChange={(v) =>
                  setVehForm((p) => ({ ...p, shipmentId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="shipments.veh.ship.select"
                  className="mt-1 bg-card border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">-</SelectItem>
                  {shipments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shipmentNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plaka *</Label>
                <Input
                  data-ocid="shipments.veh.plate.input"
                  value={vehForm.plate}
                  onChange={(e) =>
                    setVehForm((p) => ({ ...p, plate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Sürücü</Label>
                <Input
                  data-ocid="shipments.veh.driver.input"
                  value={vehForm.driver}
                  onChange={(e) =>
                    setVehForm((p) => ({ ...p, driver: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefon</Label>
                <Input
                  data-ocid="shipments.veh.phone.input"
                  value={vehForm.phone}
                  onChange={(e) =>
                    setVehForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Tahmini Varış</Label>
                <Input
                  data-ocid="shipments.veh.eta.input"
                  type="datetime-local"
                  value={vehForm.estimatedArrival}
                  onChange={(e) =>
                    setVehForm((p) => ({
                      ...p,
                      estimatedArrival: e.target.value,
                    }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div>
              <Label>Konum Notu</Label>
              <Input
                data-ocid="shipments.veh.location.input"
                value={vehForm.locationNote}
                onChange={(e) =>
                  setVehForm((p) => ({ ...p, locationNote: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Ör: E-5 üzerinde, İstanbul yakını"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVehOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="shipments.veh.save_button"
              onClick={saveVehicle}
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
