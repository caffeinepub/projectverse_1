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
import { Progress } from "@/components/ui/progress";
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
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Layers,
  Package,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";
import CSVImportModal from "./tabs/CSVImportModal";
import InventoryCount from "./tabs/InventoryCount";
import LocationsTab from "./tabs/LocationsTab";
import WasteTab from "./tabs/WasteTab";

import type { MovementType, StockStatus } from "../contexts/AppContext";

const statusColors: Record<StockStatus, string> = {
  Normal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Kritik: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Tükendi: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const CATEGORIES = ["Malzeme", "Ekipman", "Sarf", "Yapı", "Elektrik", "Diğer"];

function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return "Tükendi";
  if (quantity <= threshold) return "Kritik";
  return "Normal";
}

export default function Inventory() {
  const {
    activeRoleId,
    checkPermission,
    stockItems,
    setStockItems,
    stockMovements,
    setStockMovements,
    projects,
    user,
    activeCompanyId,
  } = useApp();

  // ── Audit Log ─────────────────────────────────────────────────────────────
  interface InvAuditEntry {
    id: string;
    action: string;
    details: string;
    user: string;
    timestamp: string;
  }
  const invCompanyId = activeCompanyId || "default";
  const [_invAuditLog, setInvAuditLog] = useState<InvAuditEntry[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_inv_audit_${invCompanyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      setInvAuditLog(
        JSON.parse(
          localStorage.getItem(`pv_inv_audit_${invCompanyId}`) || "[]",
        ),
      );
    } catch {
      setInvAuditLog([]);
    }
  }, [invCompanyId]);
  const addInvAudit = (action: string, details: string) => {
    const entry: InvAuditEntry = {
      id: `inv_audit_${Date.now()}`,
      action,
      details,
      user: user?.name || "Kullanıcı",
      timestamp: new Date().toISOString(),
    };
    setInvAuditLog((prev) => {
      const updated = [entry, ...prev];
      localStorage.setItem(
        `pv_inv_audit_${invCompanyId}`,
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const canEdit =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "pm" ||
    checkPermission("inventory", "edit");

  const canView =
    canEdit ||
    activeRoleId === "supervisor" ||
    activeRoleId === "staff" ||
    checkPermission("inventory", "view");

  const [projectFilter, setProjectFilter] = useState("Tümü");
  const [search, setSearch] = useState("");

  // Movement filters
  const [movSearch, setMovSearch] = useState("");
  const [movType, setMovType] = useState("Tümü");
  const [movPeriod, setMovPeriod] = useState("Tümü");

  // ── New stock item dialog ─────────────────────────────────────────────────
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Malzeme",
    quantity: "",
    unit: "adet",
    project: "",
    threshold: "",
    value: "",
  });
  const [itemErrors, setItemErrors] = useState<{
    name?: string;
    unit?: string;
  }>({});

  // ── Movement dialog ───────────────────────────────────────────────────────
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementTargetId, setMovementTargetId] = useState<string | null>(null);
  const [newMovement, setNewMovement] = useState({
    type: "Giriş" as MovementType,
    quantity: "",
    project: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [csvInventoryOpen, setCsvInventoryOpen] = useState(false);
  if (!canView) return <AccessDenied />;

  const filteredStock = stockItems.filter((s) => {
    const matchesProject =
      projectFilter === "Tümü" ||
      s.project === projectFilter ||
      s.project === projects.find((p) => p.id === projectFilter)?.title;
    const matchesSearch =
      search === "" || s.name.toLowerCase().includes(search.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const totalValue = stockItems.reduce(
    (sum, s) => sum + s.quantity * s.value,
    0,
  );
  const criticalItems = stockItems.filter(
    (s) => s.status === "Kritik" || s.status === "Tükendi",
  );
  const criticalCount = criticalItems.length;

  // Fix: count movements from current month/year only
  const now = new Date();
  const movThisMonth = stockMovements.filter((m) => {
    if (!m.date) return false;
    const d = new Date(m.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  // ── Filtered movements ──────────────────────────────────────────────────
  const filteredMovements = stockMovements.filter((m) => {
    if (
      movSearch &&
      !m.material.toLowerCase().includes(movSearch.toLowerCase())
    )
      return false;
    if (movType !== "Tümü" && m.type !== movType) return false;
    if (movPeriod !== "Tümü") {
      if (!m.date) return false;
      const d = new Date(m.date);
      if (movPeriod === "Bu Ay") {
        if (
          d.getMonth() !== now.getMonth() ||
          d.getFullYear() !== now.getFullYear()
        )
          return false;
      } else if (movPeriod === "Bu Hafta") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        if (d < startOfWeek) return false;
      }
    }
    return true;
  });

  // ── Project summary ───────────────────────────────────────────────────────
  const projectSummary = projects.map((proj) => {
    const items = stockItems.filter((s) => s.project === proj.title);
    const value = items.reduce((sum, s) => sum + s.quantity * s.value, 0);
    return { project: proj.title, count: items.length, value };
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    const errors: { name?: string; unit?: string } = {};
    if (!newItem.name.trim()) errors.name = "Bu alan zorunludur";
    if (!newItem.unit.trim()) errors.unit = "Bu alan zorunludur";
    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }
    setItemErrors({});
    const qty = Number(newItem.quantity) || 0;
    const threshold = Number(newItem.threshold) || 0;
    const value = Number(newItem.value) || 0;
    const status = getStockStatus(qty, threshold);
    setStockItems([
      ...stockItems,
      {
        id: `si${Date.now()}`,
        name: newItem.name,
        unit: newItem.unit,
        quantity: qty,
        threshold,
        status,
        project: newItem.project,
        value,
      },
    ]);
    addInvAudit("Stok Kalemi Eklendi", `${newItem.name}`);
    setNewItem({
      name: "",
      category: "Malzeme",
      quantity: "",
      unit: "adet",
      project: "",
      threshold: "",
      value: "",
    });
    setNewItemOpen(false);
  };

  const openMovementDialog = (itemId: string) => {
    const item = stockItems.find((s) => s.id === itemId);
    setMovementTargetId(itemId);
    setNewMovement({
      type: "Giriş",
      quantity: "",
      project: item?.project ?? "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setMovementOpen(true);
  };

  const handleAddMovement = () => {
    if (!movementTargetId || !newMovement.quantity) return;
    const item = stockItems.find((s) => s.id === movementTargetId);
    if (!item) return;
    const qty = Number(newMovement.quantity);
    const newQty =
      newMovement.type === "Giriş"
        ? item.quantity + qty
        : Math.max(0, item.quantity - qty);
    const newStatus = getStockStatus(newQty, item.threshold);

    setStockItems(
      stockItems.map((s) =>
        s.id === movementTargetId
          ? { ...s, quantity: newQty, status: newStatus }
          : s,
      ),
    );

    setStockMovements([
      {
        id: `mv${Date.now()}`,
        date: newMovement.date,
        material: item.name,
        type: newMovement.type,
        qty,
        unit: item.unit,
        project: newMovement.project,
        recordedBy: user?.name || "Mevcut Kullanıcı",
      },
      ...stockMovements,
    ]);

    setMovementOpen(false);
    setMovementTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Envanter Yönetimi</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Stok takibi, malzeme hareketleri ve proje bazlı envanter
        </p>
      </div>

      {/* ── Critical Alert Banner ────────────────────────────────────────── */}
      {criticalCount > 0 && (
        <div
          data-ocid="inventory.critical.panel"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                {criticalCount} kritik stok kalemi var
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {criticalItems.map((item) => (
                  <Badge
                    key={item.id}
                    variant="outline"
                    className={`text-xs ${
                      item.status === "Tükendi"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {item.name} — {item.status} ({item.quantity} {item.unit})
                  </Badge>
                ))}
              </div>
              <button
                type="button"
                data-ocid="inventory.create_purchase_request.button"
                onClick={() => {
                  const compId = activeCompanyId || "default";
                  const existing = JSON.parse(
                    localStorage.getItem(`pv_purchase_requests_${compId}`) ||
                      "[]",
                  );
                  const newReqs = criticalItems.map((item) => ({
                    id: `pr-${Date.now()}-${item.id}`,
                    title: `Kritik Stok: ${item.name}`,
                    description: `Kritik seviyeye düşen stok için acil satın alma talebi. Mevcut: ${item.quantity} ${item.unit}`,
                    status: "Beklemede",
                    priority: "Yüksek",
                    requestedBy: user?.name || "Sistem",
                    createdAt: new Date().toISOString().slice(0, 10),
                  }));
                  localStorage.setItem(
                    `pv_purchase_requests_${compId}`,
                    JSON.stringify([...newReqs, ...existing]),
                  );
                }}
                className="mt-3 px-3 py-1.5 text-xs rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                Satın Alma Talebi Oluştur ({criticalCount} kalem)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          data-ocid="inventory.summary.card.1"
          className="bg-card border-border"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Malzeme
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">stok kalemi</p>
          </CardContent>
        </Card>

        <Card
          data-ocid="inventory.summary.card.2"
          className="bg-card border-border"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stok Değeri
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{(totalValue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">toplam değer</p>
          </CardContent>
        </Card>

        <Card
          data-ocid="inventory.summary.card.3"
          className={`bg-card border-border ${
            criticalCount > 0 ? "border-rose-500/40" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kritik Stok
            </CardTitle>
            <AlertTriangle
              className={`w-4 h-4 ${
                criticalCount > 0 ? "text-rose-400" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                criticalCount > 0 ? "text-rose-400" : ""
              }`}
            >
              {criticalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              kalem kritik/tükendi
            </p>
          </CardContent>
        </Card>

        <Card
          data-ocid="inventory.summary.card.4"
          className="bg-card border-border"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hareketler Bu Ay
            </CardTitle>
            <ArrowUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              giriş/çıkış hareketi
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="inventory.stock.tab"
            value="stock"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Stok Kartları
          </TabsTrigger>
          <TabsTrigger
            data-ocid="inventory.movements.tab"
            value="movements"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Hareketler
          </TabsTrigger>
          <TabsTrigger
            data-ocid="inventory.project.tab"
            value="project"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Layers className="w-4 h-4 mr-2" />
            Proje Bazlı
          </TabsTrigger>
          <TabsTrigger
            data-ocid="inventory.audit.tab"
            value="audit"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            data-ocid="inventory.count.tab"
            value="count"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Stok Sayımı
          </TabsTrigger>
          <TabsTrigger
            data-ocid="inventory.locations.tab"
            value="locations"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Depo Lokasyonları
          </TabsTrigger>
          <TabsTrigger
            data-ocid="inventory.critical.tab"
            value="critical"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            ⚠ Kritik Uyarılar {criticalCount > 0 && `(${criticalCount})`}
          </TabsTrigger>
          <TabsTrigger
            data-ocid="inventory.waste.tab"
            value="waste"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Fire & İsraf
          </TabsTrigger>
        </TabsList>

        {/* ── STOCK CARDS TAB ───────────────────────────────────────────── */}
        <TabsContent value="stock" className="mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Stok Kartları
            </h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="inventory.search.search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Malzeme ara..."
                  className="pl-9 bg-card border-border"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger
                  data-ocid="inventory.project.select"
                  className="w-44 bg-card border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["Tümü", ...projects.map((p) => p.title)].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
                    data-ocid="inventory.csv_import.button"
                    onClick={() => setCsvInventoryOpen(true)}
                  >
                    CSV İçeri Aktar
                  </Button>
                  <Button
                    data-ocid="inventory.new_item.primary_button"
                    className="gradient-bg text-white hover:opacity-90"
                    onClick={() => setNewItemOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Stok
                  </Button>
                </div>
              )}
              <CSVImportModal
                open={csvInventoryOpen}
                onClose={() => setCsvInventoryOpen(false)}
                type="inventory"
                companyId={invCompanyId}
                onImport={(rows) => {
                  const newItems = rows.map((r, i) => ({
                    id: `csv-${Date.now()}-${i}`,
                    name: r.ad || "İsimsiz",
                    unit: r.birim || "adet",
                    quantity: Number(r.miktar) || 0,
                    threshold: 0,
                    status: "Normal" as const,
                    project: "",
                    value: Number(r.birimFiyat) || 0,
                  }));
                  setStockItems([...stockItems, ...newItems]);
                }}
              />
            </div>
          </div>

          {filteredStock.length === 0 ? (
            <Card
              data-ocid="inventory.empty_state"
              className="bg-card border-border"
            >
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Package className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Bu kriterlere uygun stok kaydı bulunamadı
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStock.map((item, _idx) => {
                const globalIdx =
                  stockItems.findIndex((s) => s.id === item.id) + 1;
                const fillPct =
                  item.threshold > 0
                    ? Math.min(
                        100,
                        (item.quantity / (item.threshold * 3)) * 100,
                      )
                    : 0;
                return (
                  <Card
                    key={item.id}
                    data-ocid={`inventory.stock.card.${globalIdx}`}
                    className={`bg-card border-border transition-colors ${
                      item.status === "Kritik"
                        ? "border-amber-500/40"
                        : item.status === "Tükendi"
                          ? "border-rose-500/50"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {item.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.project}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs flex-shrink-0 ml-2 ${statusColors[item.status]}`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-bold">
                            {item.quantity}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            {item.unit}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Eşik: {item.threshold} {item.unit}
                        </p>
                      </div>
                      <Progress
                        value={fillPct}
                        className={`h-2 ${
                          item.status === "Tükendi"
                            ? "[&>div]:bg-rose-500"
                            : item.status === "Kritik"
                              ? "[&>div]:bg-amber-500"
                              : "[&>div]:bg-emerald-500"
                        }`}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Birim Değer: ₺{item.value.toLocaleString("tr-TR")}
                        </p>
                        {canEdit && (
                          <Button
                            data-ocid={`inventory.movement.secondary_button.${globalIdx}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-border hover:bg-muted/30"
                            onClick={() => openMovementDialog(item.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Hareket Ekle
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── MOVEMENTS TAB ─────────────────────────────────────────────── */}
        <TabsContent value="movements" className="mt-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-ocid="inventory.movements.search_input"
                value={movSearch}
                onChange={(e) => setMovSearch(e.target.value)}
                placeholder="Malzeme ara..."
                className="pl-9 w-44 bg-card border-border"
              />
            </div>
            <Select value={movType} onValueChange={setMovType}>
              <SelectTrigger
                data-ocid="inventory.movements_type.select"
                className="w-32 bg-card border-border"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="Tümü">Tümü</SelectItem>
                <SelectItem value="Giriş">Giriş</SelectItem>
                <SelectItem value="Çıkış">Çıkış</SelectItem>
              </SelectContent>
            </Select>
            <Select value={movPeriod} onValueChange={setMovPeriod}>
              <SelectTrigger
                data-ocid="inventory.movements_period.select"
                className="w-36 bg-card border-border"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="Tümü">Tümü</SelectItem>
                <SelectItem value="Bu Ay">Bu Ay</SelectItem>
                <SelectItem value="Bu Hafta">Bu Hafta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Tarih
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Malzeme
                    </TableHead>
                    <TableHead className="text-muted-foreground">Tür</TableHead>
                    <TableHead className="text-muted-foreground">
                      Miktar
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Proje
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Kaydeden
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-12"
                        data-ocid="inventory.movements.empty_state"
                      >
                        Henüz hareket kaydı yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((mov, idx) => (
                      <TableRow
                        key={mov.id}
                        data-ocid={`inventory.movement.row.${idx + 1}`}
                        className="border-border hover:bg-muted/20"
                      >
                        <TableCell className="text-muted-foreground text-sm">
                          {mov.date}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mov.material}
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center gap-1.5 text-sm font-medium ${
                              mov.type === "Giriş"
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {mov.type === "Giriş" ? (
                              <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUp className="w-3.5 h-3.5" />
                            )}
                            {mov.type}
                          </div>
                        </TableCell>
                        <TableCell>
                          {mov.qty} {mov.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {mov.project}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {mov.recordedBy}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PROJECT SUMMARY TAB ───────────────────────────────────────── */}
        <TabsContent value="project" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Proje Bazlı Envanter</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Proje
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Stok Kalemi
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Toplam Değer
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Kritik
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectSummary.map((row, idx) => {
                    const criticals = stockItems.filter(
                      (s) =>
                        s.project === row.project &&
                        (s.status === "Kritik" || s.status === "Tükendi"),
                    ).length;
                    return (
                      <TableRow
                        key={row.project}
                        data-ocid={`inventory.project.row.${idx + 1}`}
                        className="border-border hover:bg-muted/20"
                      >
                        <TableCell className="font-medium">
                          {row.project}
                        </TableCell>
                        <TableCell>{row.count} kalem</TableCell>
                        <TableCell>
                          ₺{row.value.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          {criticals > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-rose-500/20 text-rose-400 border-rose-500/30"
                            >
                              {criticals} kritik
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            >
                              Normal
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STOK SAYIMI TAB ─── */}
        <TabsContent value="count" className="mt-6">
          <InventoryCount
            companyId={activeCompanyId || ""}
            stockItems={stockItems}
          />
        </TabsContent>
        <TabsContent value="locations" className="mt-6">
          <LocationsTab
            companyId={activeCompanyId || ""}
            stockItems={stockItems}
          />
        </TabsContent>
        <TabsContent value="critical" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Kritik Stok Uyarıları
            </h2>
            {criticalCount > 0 && (
              <button
                type="button"
                data-ocid="inventory.critical.create_purchase_request.button"
                onClick={() => {
                  const compId = activeCompanyId || "default";
                  const existing = JSON.parse(
                    localStorage.getItem(`pv_purchase_requests_${compId}`) ||
                      "[]",
                  );
                  const newReqs = criticalItems.map((item) => ({
                    id: `pr-${Date.now()}-${item.id}`,
                    title: `Kritik Stok: ${item.name}`,
                    description: `Kritik seviyeye düşen stok. Mevcut: ${item.quantity} ${item.unit}, Eşik: ${item.threshold} ${item.unit}`,
                    status: "Beklemede",
                    priority: "Yüksek",
                    requestedBy: user?.name || "Sistem",
                    createdAt: new Date().toISOString().slice(0, 10),
                  }));
                  localStorage.setItem(
                    `pv_purchase_requests_${compId}`,
                    JSON.stringify([...newReqs, ...existing]),
                  );
                }}
                className="px-3 py-1.5 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Tümü İçin Satın Alma Talebi Oluştur
              </button>
            )}
          </div>
          {criticalCount === 0 ? (
            <div
              data-ocid="inventory.critical.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-emerald-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Kritik Stok Yok
              </h3>
              <p className="text-muted-foreground text-sm">
                Tüm stok kalemleri minimum eşiğin üzerinde
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalItems.map((item, idx) => (
                <div
                  key={item.id}
                  data-ocid={`inventory.critical.item.${idx + 1}`}
                  className={`flex items-center justify-between p-4 rounded-lg border ${item.status === "Tükendi" ? "border-rose-500/40 bg-rose-500/5" : "border-amber-500/40 bg-amber-500/5"}`}
                >
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Mevcut:{" "}
                      <span
                        className={
                          item.status === "Tükendi"
                            ? "text-rose-400 font-semibold"
                            : "text-amber-400 font-semibold"
                        }
                      >
                        {item.quantity} {item.unit}
                      </span>
                      {item.threshold > 0 && (
                        <span>
                          {" "}
                          / Eşik: {item.threshold} {item.unit}
                        </span>
                      )}
                      {item.project && <span> · {item.project}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Tükendi"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }
                    >
                      {item.status}
                    </Badge>
                    <button
                      type="button"
                      data-ocid={`inventory.critical.purchase.button.${idx + 1}`}
                      onClick={() => {
                        const compId = activeCompanyId || "default";
                        const existing = JSON.parse(
                          localStorage.getItem(
                            `pv_purchase_requests_${compId}`,
                          ) || "[]",
                        );
                        const newReq = {
                          id: `pr-${Date.now()}-${item.id}`,
                          title: `Kritik Stok: ${item.name}`,
                          description: `Kritik seviyeye düşen stok. Mevcut: ${item.quantity} ${item.unit}, Eşik: ${item.threshold} ${item.unit}`,
                          status: "Beklemede",
                          priority: "Yüksek",
                          requestedBy: user?.name || "Sistem",
                          createdAt: new Date().toISOString().slice(0, 10),
                        };
                        localStorage.setItem(
                          `pv_purchase_requests_${compId}`,
                          JSON.stringify([newReq, ...existing]),
                        );
                      }}
                      className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors whitespace-nowrap"
                    >
                      Satın Alma Talebi Oluştur
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        {/* ── WASTE TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="waste" className="mt-6">
          <WasteTab companyId={activeCompanyId || ""} />
        </TabsContent>
      </Tabs>

      {/* ── NEW STOCK ITEM DIALOG ─────────────────────────────────────────── */}
      <Dialog
        open={newItemOpen}
        onOpenChange={(o) => {
          setNewItemOpen(o);
          if (!o) setItemErrors({});
        }}
      >
        <DialogContent
          data-ocid="inventory.new_item.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Yeni Stok Kalemi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Malzeme Adı</Label>
              <Input
                data-ocid="inventory.new_item_name.input"
                className={`bg-background border-border mt-1 ${itemErrors.name ? "border-rose-500" : ""}`}
                value={newItem.name}
                onChange={(e) => {
                  setNewItem((p) => ({ ...p, name: e.target.value }));
                  if (e.target.value.trim())
                    setItemErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Malzeme adı"
              />
              {itemErrors.name && (
                <p className="text-rose-500 text-xs mt-1">{itemErrors.name}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(v) =>
                    setNewItem((p) => ({ ...p, category: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="inventory.new_item_category.select"
                    className="bg-background border-border mt-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Birim</Label>
                <Input
                  data-ocid="inventory.new_item_unit.input"
                  className={`bg-background border-border mt-1 ${itemErrors.unit ? "border-rose-500" : ""}`}
                  value={newItem.unit}
                  onChange={(e) => {
                    setNewItem((p) => ({ ...p, unit: e.target.value }));
                    if (e.target.value.trim())
                      setItemErrors((prev) => ({ ...prev, unit: undefined }));
                  }}
                  placeholder="adet, kg, m²..."
                />
                {itemErrors.unit && (
                  <p className="text-rose-500 text-xs mt-1">
                    {itemErrors.unit}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Miktar</Label>
                <Input
                  data-ocid="inventory.new_item_qty.input"
                  type="number"
                  className="bg-background border-border mt-1"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, quantity: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Kritik Eşik</Label>
                <Input
                  data-ocid="inventory.new_item_threshold.input"
                  type="number"
                  className="bg-background border-border mt-1"
                  value={newItem.threshold}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, threshold: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Proje</Label>
                <Select
                  value={newItem.project}
                  onValueChange={(v) =>
                    setNewItem((p) => ({ ...p, project: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="inventory.new_item_project.select"
                    className="bg-background border-border mt-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Birim Değer (₺)</Label>
                <Input
                  data-ocid="inventory.new_item_value.input"
                  type="number"
                  className="bg-background border-border mt-1"
                  value={newItem.value}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, value: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="inventory.new_item.cancel_button"
              variant="outline"
              onClick={() => {
                setNewItemOpen(false);
                setItemErrors({});
              }}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="inventory.new_item.confirm_button"
              onClick={handleAddItem}
              className="gradient-bg text-white"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MOVEMENT DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent
          data-ocid="inventory.movement.dialog"
          className="bg-card border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>
              Hareket Ekle —{" "}
              {stockItems.find((s) => s.id === movementTargetId)?.name ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hareket Türü</Label>
              <Select
                value={newMovement.type}
                onValueChange={(v) =>
                  setNewMovement((p) => ({ ...p, type: v as MovementType }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.movement_type.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Giriş">Giriş</SelectItem>
                  <SelectItem value="Çıkış">Çıkış</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Miktar</Label>
                <Input
                  data-ocid="inventory.movement_qty.input"
                  type="number"
                  className="bg-background border-border mt-1"
                  value={newMovement.quantity}
                  onChange={(e) =>
                    setNewMovement((p) => ({ ...p, quantity: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Tarih</Label>
                <Input
                  data-ocid="inventory.movement_date.input"
                  type="date"
                  className="bg-background border-border mt-1"
                  value={newMovement.date}
                  onChange={(e) =>
                    setNewMovement((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Proje</Label>
              <Select
                value={newMovement.project}
                onValueChange={(v) =>
                  setNewMovement((p) => ({ ...p, project: v }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.movement_project.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.title}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="inventory.movement_desc.textarea"
                className="bg-background border-border mt-1"
                value={newMovement.description}
                onChange={(e) =>
                  setNewMovement((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Hareket açıklaması..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="inventory.movement.cancel_button"
              variant="outline"
              onClick={() => setMovementOpen(false)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="inventory.movement.confirm_button"
              onClick={handleAddMovement}
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
