import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Plus,
  Settings2,
  Truck,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import type {
  Equipment as EquipmentItem,
  EquipmentStatus,
  MaintenanceFault,
} from "../contexts/AppContext";
import { useApp } from "../contexts/AppContext";
import EquipmentFuelCost from "./tabs/EquipmentFuelCost";
import EquipmentQRTab from "./tabs/EquipmentQRTab";

const STATUS_LABELS: Record<EquipmentStatus, { label: string; cls: string }> = {
  active: {
    label: "Aktif",
    cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  maintenance: {
    label: "Bakımda",
    cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  broken: {
    label: "Arızalı",
    cls: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  idle: {
    label: "Atıl",
    cls: "bg-muted/40 text-muted-foreground border-border",
  },
};

export default function Equipment() {
  const {
    equipment,
    setEquipment,
    maintenanceFaults,
    setMaintenanceFaults,
    projects,
    auditLogs,
    addAuditLog,
    user,
    activeCompanyId,
  } = useApp();

  // ─── Equipment Form ───
  const [equipOpen, setEquipOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<EquipmentItem | null>(null);
  const [equipForm, setEquipForm] = useState({
    name: "",
    type: "",
    brand: "",
    model: "",
    serial: "",
    status: "active" as EquipmentStatus,
    projectId: "",
    purchaseDate: "",
    nextMaintenanceDate: "",
  });

  const resetEquipForm = () =>
    setEquipForm({
      name: "",
      type: "",
      brand: "",
      model: "",
      serial: "",
      status: "active",
      projectId: "",
      purchaseDate: "",
      nextMaintenanceDate: "",
    });

  const handleOpenEquip = (e?: EquipmentItem) => {
    if (e) {
      setEditEquip(e);
      setEquipForm({
        name: e.name,
        type: e.type,
        brand: e.brand,
        model: e.model,
        serial: e.serial,
        status: e.status,
        projectId: e.projectId || "",
        purchaseDate: e.purchaseDate || "",
        nextMaintenanceDate: e.nextMaintenanceDate || "",
      });
    } else {
      setEditEquip(null);
      resetEquipForm();
    }
    setEquipOpen(true);
  };

  const handleSaveEquip = () => {
    if (!equipForm.name.trim()) return;
    const who = user?.name || "Sistem";
    if (editEquip) {
      const updated = equipment.map((e) =>
        e.id === editEquip.id
          ? { ...e, ...equipForm, projectId: equipForm.projectId || undefined }
          : e,
      );
      setEquipment(updated);
      addAuditLog({
        module: "equipment",
        action: "Güncellendi",
        description: `Ekipman düzenlendi: ${equipForm.name}`,
        performedBy: who,
      });
    } else {
      const newE: EquipmentItem = {
        id: Date.now().toString(),
        ...equipForm,
        projectId: equipForm.projectId || undefined,
        companyId: activeCompanyId || "",
        createdAt: new Date().toISOString(),
      };
      setEquipment([...equipment, newE]);
      addAuditLog({
        module: "equipment",
        action: "Eklendi",
        description: `Yeni ekipman: ${equipForm.name}`,
        performedBy: who,
      });
    }
    setEquipOpen(false);
    resetEquipForm();
  };

  const handleDeleteEquip = (id: string) => {
    const e = equipment.find((x) => x.id === id);
    setEquipment(equipment.filter((x) => x.id !== id));
    addAuditLog({
      module: "equipment",
      action: "Silindi",
      description: `Ekipman silindi: ${e?.name}`,
      performedBy: user?.name || "Sistem",
    });
  };

  // ─── Maintenance/Fault Form ───
  const [faultOpen, setFaultOpen] = useState(false);
  const [faultForm, setFaultForm] = useState({
    equipmentId: "",
    type: "maintenance" as "maintenance" | "fault",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const handleSaveFault = () => {
    if (!faultForm.equipmentId || !faultForm.description.trim()) return;
    const newF: MaintenanceFault = {
      id: Date.now().toString(),
      ...faultForm,
      status: "open",
      reportedBy: user?.name || "Sistem",
    };
    setMaintenanceFaults([...maintenanceFaults, newF]);
    setFaultOpen(false);
    setFaultForm({
      equipmentId: "",
      type: "maintenance",
      description: "",
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const handleResolveFault = (id: string) => {
    const updated = maintenanceFaults.map((f) =>
      f.id === id
        ? {
            ...f,
            status: "resolved" as const,
            resolvedAt: new Date().toISOString(),
          }
        : f,
    );
    setMaintenanceFaults(updated);
  };

  // ─── Project Assignment ───
  const handleAssignProject = (equipId: string, projectId: string) => {
    const updated = equipment.map((e) =>
      e.id === equipId ? { ...e, projectId: projectId || undefined } : e,
    );
    setEquipment(updated);
  };

  // KPIs
  const total = equipment.length;
  const active = equipment.filter((e) => e.status === "active").length;
  const maintenance = equipment.filter(
    (e) => e.status === "maintenance",
  ).length;
  const broken = equipment.filter((e) => e.status === "broken").length;

  const getProjectName = (id?: string) =>
    projects.find((p) => p.id === id)?.title || "—";

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">
          Araç & Ekipman Yönetimi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ekipman takibi, bakım planlaması ve proje atamaları
        </p>
      </div>

      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger data-ocid="equipment.equipment.tab" value="equipment">
            Ekipmanlar
          </TabsTrigger>
          <TabsTrigger
            data-ocid="equipment.maintenance.tab"
            value="maintenance"
          >
            Bakım & Arıza
          </TabsTrigger>
          <TabsTrigger data-ocid="equipment.assignment.tab" value="assignment">
            Proje Atama
          </TabsTrigger>
          <TabsTrigger data-ocid="equipment.audit.tab" value="audit">
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            data-ocid="equipment.qr.tab"
            value="qr"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            QR & Seri No
          </TabsTrigger>
          <TabsTrigger data-ocid="equipment.fuelcost.tab" value="fuelcost">
            Yakıt & Maliyet
          </TabsTrigger>
          <TabsTrigger data-ocid="equipment.rental.tab" value="rental">
            Kiralama
          </TabsTrigger>
        </TabsList>

        {/* ─── EQUIPMENT TAB ─── */}
        <TabsContent value="equipment" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">
                  Toplam Ekipman
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-foreground">
                  {total}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">
                  Aktif
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-emerald-400">
                  {active}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">
                  Bakımda
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-amber-400">
                  {maintenance}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">
                  Arızalı
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-red-400">{broken}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Dialog open={equipOpen} onOpenChange={setEquipOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="equipment.add_button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleOpenEquip()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Ekipman
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editEquip ? "Ekipmanı Düzenle" : "Yeni Ekipman Ekle"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Ekipman Adı *</Label>
                      <Input
                        data-ocid="equipment.name.input"
                        value={equipForm.name}
                        onChange={(e) =>
                          setEquipForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="örn. Vinç #1"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tür</Label>
                      <Input
                        data-ocid="equipment.type.input"
                        value={equipForm.type}
                        onChange={(e) =>
                          setEquipForm((p) => ({ ...p, type: e.target.value }))
                        }
                        placeholder="Vinç, Ekskavatör..."
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Marka</Label>
                      <Input
                        data-ocid="equipment.brand.input"
                        value={equipForm.brand}
                        onChange={(e) =>
                          setEquipForm((p) => ({ ...p, brand: e.target.value }))
                        }
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Model</Label>
                      <Input
                        data-ocid="equipment.model.input"
                        value={equipForm.model}
                        onChange={(e) =>
                          setEquipForm((p) => ({ ...p, model: e.target.value }))
                        }
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Seri No / Plaka</Label>
                      <Input
                        data-ocid="equipment.serial.input"
                        value={equipForm.serial}
                        onChange={(e) =>
                          setEquipForm((p) => ({
                            ...p,
                            serial: e.target.value,
                          }))
                        }
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Durum</Label>
                      <Select
                        value={equipForm.status}
                        onValueChange={(v) =>
                          setEquipForm((p) => ({
                            ...p,
                            status: v as EquipmentStatus,
                          }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="equipment.status.select"
                          className="bg-background border-border"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="maintenance">Bakımda</SelectItem>
                          <SelectItem value="broken">Arızalı</SelectItem>
                          <SelectItem value="idle">Atıl</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Proje Atama</Label>
                    <Select
                      value={equipForm.projectId}
                      onValueChange={(v) =>
                        setEquipForm((p) => ({
                          ...p,
                          projectId: v === "none" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="equipment.project.select"
                        className="bg-background border-border"
                      >
                        <SelectValue placeholder="Proje seç..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Atanmadı</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Satın Alma Tarihi</Label>
                      <Input
                        data-ocid="equipment.purchaseDate.input"
                        type="date"
                        value={equipForm.purchaseDate}
                        onChange={(e) =>
                          setEquipForm((p) => ({
                            ...p,
                            purchaseDate: e.target.value,
                          }))
                        }
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Sonraki Bakım Tarihi</Label>
                      <Input
                        data-ocid="equipment.maintenanceDate.input"
                        type="date"
                        value={equipForm.nextMaintenanceDate}
                        onChange={(e) =>
                          setEquipForm((p) => ({
                            ...p,
                            nextMaintenanceDate: e.target.value,
                          }))
                        }
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEquipOpen(false)}
                    className="border-border"
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="equipment.save_button"
                    onClick={handleSaveEquip}
                    className="bg-primary text-primary-foreground"
                  >
                    {editEquip ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {equipment.length === 0 ? (
            <div
              data-ocid="equipment.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Truck className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Henüz ekipman kaydı yok.</p>
              <p className="text-muted-foreground/60 text-sm">
                Yeni Ekipman butonuyla ilk kaydı oluşturun.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((e, idx) => {
                const s = STATUS_LABELS[e.status];
                const maintNear =
                  e.nextMaintenanceDate &&
                  e.nextMaintenanceDate >= today &&
                  e.nextMaintenanceDate <= in30;
                const maintOverdue =
                  e.nextMaintenanceDate && e.nextMaintenanceDate < today;
                return (
                  <Card
                    key={e.id}
                    data-ocid={`equipment.item.${idx + 1}`}
                    className="bg-card border-border"
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            {e.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {e.type}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${s.cls}`}
                        >
                          {s.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {e.brand} {e.model}
                        </span>
                        {e.serial && <span className="ml-2">· {e.serial}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Proje:{" "}
                        <span className="text-foreground/80">
                          {getProjectName(e.projectId)}
                        </span>
                      </div>
                      {e.nextMaintenanceDate && (
                        <div
                          className={`text-xs ${maintOverdue ? "text-red-400" : maintNear ? "text-amber-400" : "text-muted-foreground"}`}
                        >
                          Bakım: {e.nextMaintenanceDate}
                          {maintOverdue && " ⚠ Gecikmiş"}
                          {!maintOverdue && maintNear && " ⚠ Yaklaşıyor"}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          data-ocid={`equipment.edit_button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border flex-1"
                          onClick={() => handleOpenEquip(e)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          data-ocid={`equipment.delete_button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteEquip(e.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── MAINTENANCE TAB ─── */}
        <TabsContent value="maintenance" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={faultOpen} onOpenChange={setFaultOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="equipment.fault.add_button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kayıt
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Bakım / Arıza Kaydı</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <Label>Ekipman *</Label>
                    <Select
                      value={faultForm.equipmentId}
                      onValueChange={(v) =>
                        setFaultForm((p) => ({ ...p, equipmentId: v }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="equipment.fault.equipment_select"
                        className="bg-background border-border"
                      >
                        <SelectValue placeholder="Ekipman seç..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {equipment.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tür</Label>
                    <Select
                      value={faultForm.type}
                      onValueChange={(v) =>
                        setFaultForm((p) => ({
                          ...p,
                          type: v as "maintenance" | "fault",
                        }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="equipment.fault.type_select"
                        className="bg-background border-border"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="maintenance">Bakım</SelectItem>
                        <SelectItem value="fault">Arıza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tarih</Label>
                    <Input
                      data-ocid="equipment.fault.date_input"
                      type="date"
                      value={faultForm.date}
                      onChange={(e) =>
                        setFaultForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Açıklama *</Label>
                    <Textarea
                      data-ocid="equipment.fault.description_input"
                      value={faultForm.description}
                      onChange={(e) =>
                        setFaultForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Detayları yazın..."
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setFaultOpen(false)}
                    className="border-border"
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="equipment.fault.save_button"
                    onClick={handleSaveFault}
                    className="bg-primary text-primary-foreground"
                  >
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {maintenanceFaults.length === 0 ? (
            <div
              data-ocid="equipment.maintenance.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Wrench className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Henüz bakım/arıza kaydı yok.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tarih
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Ekipman
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tür
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Açıklama
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Durum
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceFaults.map((f, idx) => {
                    const eq = equipment.find((e) => e.id === f.equipmentId);
                    return (
                      <tr
                        key={f.id}
                        data-ocid={`equipment.fault.item.${idx + 1}`}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {f.date}
                        </td>
                        <td className="px-4 py-3">{eq?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              f.type === "fault"
                                ? "bg-red-500/15 text-red-400 border-red-500/30 text-xs"
                                : "bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs"
                            }
                          >
                            {f.type === "fault" ? "Arıza" : "Bakım"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {f.description}
                        </td>
                        <td className="px-4 py-3">
                          {f.status === "open" ? (
                            <Badge
                              variant="outline"
                              className="bg-red-500/15 text-red-400 border-red-500/30 text-xs"
                            >
                              Açık
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs"
                            >
                              Kapatıldı
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {f.status === "open" && (
                            <Button
                              data-ocid={`equipment.resolve_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => handleResolveFault(f.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Çözüldü
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ─── ASSIGNMENT TAB ─── */}
        <TabsContent value="assignment" className="mt-4 space-y-4">
          {equipment.length === 0 ? (
            <div
              data-ocid="equipment.assignment.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Settings2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Henüz ekipman kaydı yok.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Ekipman
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tür
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Durum
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Proje Ataması
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((e, idx) => (
                    <tr
                      key={e.id}
                      data-ocid={`equipment.assignment.item.${idx + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{e.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.type}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_LABELS[e.status].cls}`}
                        >
                          {STATUS_LABELS[e.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={e.projectId || "none"}
                          onValueChange={(v) =>
                            handleAssignProject(e.id, v === "none" ? "" : v)
                          }
                        >
                          <SelectTrigger
                            data-ocid={`equipment.assignment.select.${idx + 1}`}
                            className="h-8 bg-background border-border text-sm w-48"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="none">Atanmadı</SelectItem>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ─── AUDIT TAB ─── */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          {auditLogs.filter((l) => l.module === "equipment").length === 0 ? (
            <div
              data-ocid="equipment.audit.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Henüz denetim kaydı yok.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tarih
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      İşlem
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Açıklama
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Yapan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter((l) => l.module === "equipment")
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.performedBy}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        {/* ─── FUEL COST TAB ─── */}
        <TabsContent value="fuelcost" className="mt-4">
          <EquipmentFuelCost
            companyId={activeCompanyId || ""}
            equipment={equipment}
          />
        </TabsContent>
        {/* ─── QR & SERİ NO TAB ─── */}
        <TabsContent value="qr" className="mt-4">
          <EquipmentQRTab
            companyId={activeCompanyId || ""}
            equipment={equipment}
          />
        </TabsContent>
        {/* ─── KİRALAMA TAB ─── */}
        <TabsContent value="rental" className="mt-4">
          <EquipmentRentalTab companyId={activeCompanyId || ""} />
        </TabsContent>
      </Tabs>

      {/* Hidden dialog trigger to allow re-opening equip dialog after edit */}
      <AlertCircle className="hidden" />
    </div>
  );
}

function EquipmentRentalTab({ companyId }: { companyId: string }) {
  interface EquipmentRental {
    id: string;
    name: string;
    rentalCompany: string;
    startDate: string;
    endDate: string;
    monthlyRate: number;
    currency: string;
    status: "Aktif" | "Tamamlandı";
  }
  const storageKey = `pv_${companyId}_equipmentRentals`;
  const [rentals, setRentals] = useState<EquipmentRental[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const emptyForm = {
    name: "",
    rentalCompany: "",
    startDate: "",
    endDate: "",
    monthlyRate: "",
    currency: "TRY",
    status: "Aktif" as "Aktif" | "Tamamlandı",
  };
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);

  const save = () => {
    if (!form.name || !form.rentalCompany || !form.startDate) return;
    const entry: EquipmentRental = {
      ...form,
      id: Date.now().toString(),
      monthlyRate: Number(form.monthlyRate) || 0,
    };
    const updated = [entry, ...rentals];
    setRentals(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setForm(emptyForm);
    setOpen(false);
  };

  const active = rentals.filter((r) => r.status === "Aktif");
  const totalMonthly = active.reduce((s, r) => s + r.monthlyRate, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Aktif Kiralama</p>
            <p className="text-2xl font-bold text-amber-400">{active.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">
              Toplam Aylık Kira Gideri
            </p>
            <p className="text-2xl font-bold text-rose-400">
              ₺{totalMonthly.toLocaleString("tr-TR")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          data-ocid="equipment.rental.add_button"
          onClick={() => setOpen(true)}
          className="gradient-bg text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Kiralama Ekle
        </Button>
      </div>

      {rentals.length === 0 ? (
        <div
          data-ocid="equipment.rental.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-muted-foreground">Henüz kiralama kaydı yok</p>
        </div>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead>Ekipman</TableHead>
                  <TableHead>Kiralama Firması</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Aylık Kira</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentals.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    data-ocid={`equipment.rental.row.${idx + 1}`}
                    className="border-slate-700 hover:bg-muted/20"
                  >
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.rentalCompany}</TableCell>
                    <TableCell className="text-sm">{r.startDate}</TableCell>
                    <TableCell className="text-sm">
                      {r.endDate || "-"}
                    </TableCell>
                    <TableCell className="font-semibold text-amber-400">
                      {r.monthlyRate.toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "Aktif"
                            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            : "text-muted-foreground"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-ocid="equipment.rental.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Kiralama Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ekipman Adı *</Label>
              <Input
                data-ocid="equipment.rental.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Örn: Ekskavatör"
              />
            </div>
            <div>
              <Label>Kiralama Firması *</Label>
              <Input
                data-ocid="equipment.rental.company.input"
                value={form.rentalCompany}
                onChange={(e) =>
                  setForm((p) => ({ ...p, rentalCompany: e.target.value }))
                }
                className="mt-1 bg-card border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Başlangıç Tarihi *</Label>
                <Input
                  type="date"
                  data-ocid="equipment.rental.start.input"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  data-ocid="equipment.rental.end.input"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Aylık Kira Bedeli</Label>
                <Input
                  type="number"
                  data-ocid="equipment.rental.rate.input"
                  value={form.monthlyRate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, monthlyRate: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label>Para Birimi</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                >
                  <SelectTrigger
                    data-ocid="equipment.rental.currency.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["TRY", "USD", "EUR"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={form.status}
                onValueChange={(v: "Aktif" | "Tamamlandı") =>
                  setForm((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger
                  data-ocid="equipment.rental.status.select"
                  className="mt-1 bg-card border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="equipment.rental.save_button"
              onClick={save}
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
