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
  AlertTriangle,
  Building2,
  Check,
  Edit,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import React from "react";
import { useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";
import type { SupplierEvaluation } from "../contexts/AppContext";
import TenderManagement from "./tabs/TenderManagement";

import type {
  Order,
  OrderStatus,
  PurchaseRequest,
  RequestPriority,
  RequestStatus,
  Supplier,
  SupplierCategory,
  SupplierStatus,
} from "../contexts/AppContext";

const categoryColors: Record<SupplierCategory, string> = {
  Malzeme: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ekipman: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Hizmet: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Taşeron: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const priorityColors: Record<RequestPriority, string> = {
  Yüksek: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Orta: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Düşük: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const requestStatusColors: Record<RequestStatus, string> = {
  Bekliyor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Onaylandı: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Reddedildi: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const orderStatusColors: Record<OrderStatus, string> = {
  Taslak: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "Sipariş Verildi": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Teslim Edildi": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  İptal: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate?: (r: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          onClick={() => onRate?.(i)}
          className={`w-3.5 h-3.5 ${
            onRate ? "cursor-pointer hover:scale-110 transition-transform" : ""
          } ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// ── FİYAT KATALOĞU BİLEŞENİ ─────────────────────────────────────────────────
interface PriceCatalogEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  materialName: string;
  unit: string;
  unitPrice: number;
  currency: string;
  validFrom: string;
  validTo: string;
  notes: string;
}

function PriceCatalogTab({
  companyId,
  suppliers,
}: {
  companyId: string;
  suppliers: Array<{ id: string; name: string }>;
}) {
  const storageKey = `pv_price_catalog_${companyId}`;

  const [entries, setEntries] = React.useState<PriceCatalogEntry[]>(() => {
    try {
      const s = localStorage.getItem(`pv_price_catalog_${companyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, storageKey]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    supplierId: "",
    supplierName: "",
    materialName: "",
    unit: "Adet",
    unitPrice: "",
    currency: "TRY",
    validFrom: "",
    validTo: "",
    notes: "",
  });
  const [filterSupplier, setFilterSupplier] = React.useState("all");
  const [searchMaterial, setSearchMaterial] = React.useState("");

  const filteredEntries = entries.filter((e) => {
    if (filterSupplier !== "all" && e.supplierId !== filterSupplier)
      return false;
    if (
      searchMaterial &&
      !e.materialName.toLowerCase().includes(searchMaterial.toLowerCase())
    )
      return false;
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({
      supplierId: "",
      supplierName: "",
      materialName: "",
      unit: "Adet",
      unitPrice: "",
      currency: "TRY",
      validFrom: "",
      validTo: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (e: PriceCatalogEntry) => {
    setEditId(e.id);
    setForm({
      supplierId: e.supplierId,
      supplierName: e.supplierName,
      materialName: e.materialName,
      unit: e.unit,
      unitPrice: String(e.unitPrice),
      currency: e.currency,
      validFrom: e.validFrom,
      validTo: e.validTo,
      notes: e.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.materialName || !form.unitPrice || !form.supplierId) return;
    const entry: PriceCatalogEntry = {
      id: editId || Date.now().toString(),
      supplierId: form.supplierId,
      supplierName: form.supplierName,
      materialName: form.materialName,
      unit: form.unit,
      unitPrice: Number(form.unitPrice),
      currency: form.currency,
      validFrom: form.validFrom,
      validTo: form.validTo,
      notes: form.notes,
    };
    if (editId) {
      setEntries((prev) => prev.map((e) => (e.id === editId ? entry : e)));
    } else {
      setEntries((prev) => [entry, ...prev]);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Tedarikçi Fiyat Kataloğu
        </h2>
        <Button
          data-ocid="purchasing.catalog.add_button"
          onClick={openAdd}
          size="sm"
          className="gradient-bg text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Fiyat Ekle
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="purchasing.catalog.search_input"
            placeholder="Malzeme ara..."
            value={searchMaterial}
            onChange={(e) => setSearchMaterial(e.target.value)}
            className="pl-9 bg-background border-border w-52"
          />
        </div>
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger
            data-ocid="purchasing.catalog.supplier_select"
            className="bg-card border-border w-48"
          >
            <SelectValue placeholder="Tüm Tedarikçiler" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tüm Tedarikçiler</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredEntries.length === 0 ? (
        <div
          data-ocid="purchasing.catalog.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-3">Fiyat kataloğu boş</p>
          <Button
            onClick={openAdd}
            size="sm"
            className="gradient-bg text-white gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> İlk Fiyatı Ekle
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead>Malzeme</TableHead>
                <TableHead>Tedarikçi</TableHead>
                <TableHead>Birim</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>Döviz</TableHead>
                <TableHead>Geçerlilik</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry, idx) => (
                <TableRow
                  key={entry.id}
                  data-ocid={`purchasing.catalog.item.${idx + 1}`}
                  className="border-border hover:bg-muted/20"
                >
                  <TableCell className="font-medium">
                    {entry.materialName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.supplierName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.unit}
                  </TableCell>
                  <TableCell className="font-semibold text-amber-400">
                    {entry.unitPrice.toLocaleString("tr-TR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.currency}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.validFrom && entry.validTo
                      ? `${entry.validFrom} – ${entry.validTo}`
                      : entry.validFrom || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        data-ocid={`purchasing.catalog.edit_button.${idx + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(entry)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`purchasing.catalog.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() =>
                          setEntries((prev) =>
                            prev.filter((e) => e.id !== entry.id),
                          )
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="purchasing.catalog.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>{editId ? "Fiyat Düzenle" : "Fiyat Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tedarikçi *</Label>
              <Select
                value={form.supplierId}
                onValueChange={(v) => {
                  const s = suppliers.find((s) => s.id === v);
                  setForm((prev) => ({
                    ...prev,
                    supplierId: v,
                    supplierName: s?.name || "",
                  }));
                }}
              >
                <SelectTrigger
                  data-ocid="purchasing.catalog.dialog.supplier_select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Malzeme Adı *</Label>
              <Input
                data-ocid="purchasing.catalog.material_input"
                value={form.materialName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, materialName: e.target.value }))
                }
                placeholder="Örn: Çimento 25kg"
                className="bg-background border-border mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Birim</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, unit: v }))
                  }
                >
                  <SelectTrigger className="bg-background border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {[
                      "Adet",
                      "Kg",
                      "Ton",
                      "m²",
                      "m³",
                      "m",
                      "Litre",
                      "Paket",
                    ].map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Birim Fiyat *</Label>
                <Input
                  data-ocid="purchasing.catalog.price_input"
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, unitPrice: e.target.value }))
                  }
                  placeholder="0"
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Döviz</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, currency: v }))
                  }
                >
                  <SelectTrigger className="bg-background border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="TRY">TRY ₺</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="EUR">EUR €</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Geçerlilik Başlangıcı</Label>
                <Input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, validFrom: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Geçerlilik Bitişi</Label>
                <Input
                  type="date"
                  value={form.validTo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, validTo: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="bg-background border-border mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="purchasing.catalog.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="purchasing.catalog.save_button"
              onClick={handleSave}
              disabled={
                !form.materialName || !form.unitPrice || !form.supplierId
              }
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

export default function Purchasing() {
  const {
    activeRoleId,
    checkPermission,
    suppliers,
    setSuppliers,
    purchaseRequests: requests,
    setPurchaseRequests: setRequests,
    expenses,
    setExpenses,
    orders,
    addOrder,
    updateOrder,
    addNotification,
    addAuditLog,
    auditLogs,
    user,
    projects,
    supplierEvaluations,
    setSupplierEvaluations,
    activeCompanyId,
  } = useApp();

  const canEdit =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "pm" ||
    checkPermission("purchasing", "edit");

  // ─── Tedarikçi Performans ───────────────────────────────────────────────────
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalSupplier, setEvalSupplier] = useState({ id: "", name: "" });
  const [newEval, setNewEval] = useState({
    period: new Date().toISOString().slice(0, 7),
    deliveryScore: 3,
    qualityScore: 3,
    priceScore: 3,
    communicationScore: 3,
    notes: "",
  });

  const handleAddEval = () => {
    if (!evalSupplier.id) return;
    const ev: SupplierEvaluation = {
      id: `eval${Date.now()}`,
      companyId: "",
      supplierId: evalSupplier.id,
      supplierName: evalSupplier.name,
      period: newEval.period,
      deliveryScore: newEval.deliveryScore,
      qualityScore: newEval.qualityScore,
      priceScore: newEval.priceScore,
      communicationScore: newEval.communicationScore,
      notes: newEval.notes,
      createdAt: new Date().toISOString(),
    };
    setSupplierEvaluations([ev, ...supplierEvaluations]);
    setEvalOpen(false);
    setNewEval({
      period: new Date().toISOString().slice(0, 7),
      deliveryScore: 3,
      qualityScore: 3,
      priceScore: 3,
      communicationScore: 3,
      notes: "",
    });
  };

  const getSupplierAvgScore = (supplierId: string) => {
    const evals = supplierEvaluations.filter(
      (e) => e.supplierId === supplierId,
    );
    if (evals.length === 0) return null;
    const avg =
      evals.reduce(
        (s, e) =>
          s +
          (e.deliveryScore +
            e.qualityScore +
            e.priceScore +
            e.communicationScore) /
            4,
        0,
      ) / evals.length;
    return avg;
  };

  const renderStars = (score: number) => {
    const stars = [1, 2, 3, 4, 5];
    return stars.map((n) => (
      <span
        key={n}
        className={
          n <= Math.round(score) ? "text-amber-400" : "text-muted-foreground"
        }
      >
        ★
      </span>
    ));
  };

  const canView =
    canEdit ||
    activeRoleId === "supervisor" ||
    activeRoleId === "staff" ||
    checkPermission("purchasing", "view");

  // ── Orders from AppContext ──────────────────────────────────────────────

  // ── New supplier form ─────────────────────────────────────────────────────
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    category: "Malzeme" as SupplierCategory,
    contact: "",
    email: "",
    phone: "",
    address: "",
  });
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  // ── Supplier detail modal ─────────────────────────────────────────────────
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [supplierDetailOpen, setSupplierDetailOpen] = useState(false);

  // ── Supplier search ───────────────────────────────────────────────────────
  const [supplierSearch, setSupplierSearch] = useState("");

  // ── New request form ──────────────────────────────────────────────────────
  const [newRequest, setNewRequest] = useState({
    item: "",
    qty: "",
    unitPrice: "",
    project: "",
    priority: "Orta" as RequestPriority,
    description: "",
  });
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  // ── Order detail modal ────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>("Taslak");
  const [editOrderDelivery, setEditOrderDelivery] = useState("");
  const [editOrderNotes, setEditOrderNotes] = useState("");

  // ── Convert to order confirm ──────────────────────────────────────────────
  const [convertReqId, setConvertReqId] = useState<string | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertSupplier, setConvertSupplier] = useState<string>("");

  if (!canView) return <AccessDenied />;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAddSupplier = () => {
    if (!newSupplier.name) return;
    setSuppliers([
      ...suppliers,
      {
        id: `s${Date.now()}`,
        name: newSupplier.name,
        category: newSupplier.category,
        contact: newSupplier.contact,
        email: newSupplier.email,
        phone: newSupplier.phone,
        rating: 3,
        status: "Aktif" as const,
      },
    ]);
    setNewSupplier({
      name: "",
      category: "Malzeme",
      contact: "",
      email: "",
      phone: "",
      address: "",
    });
    setSupplierDialogOpen(false);
  };

  const handleToggleSupplierStatus = (supplier: Supplier) => {
    const updated = suppliers.map((s) =>
      s.id === supplier.id
        ? {
            ...s,
            status: (s.status === "Aktif"
              ? "Pasif"
              : "Aktif") as SupplierStatus,
          }
        : s,
    );
    setSuppliers(updated);
    setSelectedSupplier((prev) =>
      prev?.id === supplier.id
        ? {
            ...prev,
            status: (prev.status === "Aktif"
              ? "Pasif"
              : "Aktif") as SupplierStatus,
          }
        : prev,
    );
  };

  const handleRateSupplier = (supplier: Supplier, rating: number) => {
    const updated = suppliers.map((s) =>
      s.id === supplier.id ? { ...s, rating } : s,
    );
    setSuppliers(updated);
    setSelectedSupplier((prev) =>
      prev?.id === supplier.id ? { ...prev, rating } : prev,
    );
  };

  const handleAddRequest = () => {
    if (!newRequest.item || !newRequest.project) return;
    setRequests([
      ...requests,
      {
        id: `r${Date.now()}`,
        item: newRequest.item,
        qty: Number(newRequest.qty) || 1,
        unitPrice: Number(newRequest.unitPrice) || 0,
        project: newRequest.project,
        priority: newRequest.priority,
        status: "Bekliyor" as const,
        requestedBy: user?.name || "",
        date: new Date().toISOString().split("T")[0],
        description: newRequest.description,
      },
    ]);
    setNewRequest({
      item: "",
      qty: "",
      unitPrice: "",
      project: "",
      priority: "Orta",
      description: "",
    });
    setRequestDialogOpen(false);
    addAuditLog({
      module: "purchasing",
      action: "Talep Oluşturuldu",
      description: `${newRequest.item} talebi oluşturuldu.`,
      performedBy: user?.name || "",
    });
  };

  const handleRequestAction = (
    id: string,
    action: "Onaylandı" | "Reddedildi",
  ) => {
    const req = requests.find((r) => r.id === id);
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: action } : r)),
    );
    if (req) {
      addNotification({
        type: "order_status",
        title: action === "Onaylandı" ? "Talep Onaylandı" : "Talep Reddedildi",
        message: `${req.item} talebi ${action.toLowerCase()}.`,
      });
      addAuditLog({
        module: "purchasing",
        action: action === "Onaylandı" ? "Talep Onaylandı" : "Talep Reddedildi",
        description: `${req?.item || ""} talebi ${action === "Onaylandı" ? "onaylandı" : "reddedildi"}.`,
        performedBy: user?.name || "",
      });
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setEditOrderStatus(order.status);
    setEditOrderDelivery(order.deliveryDate);
    setEditOrderNotes(order.notes);
    setOrderDetailOpen(true);
  };

  const handleSaveOrder = () => {
    if (!selectedOrder) return;
    const wasDelivered =
      selectedOrder.status !== "Teslim Edildi" &&
      editOrderStatus === "Teslim Edildi";
    // Update order status/fields through context
    const updatedOrder = {
      ...selectedOrder,
      status: editOrderStatus,
      deliveryDate: editOrderDelivery,
      notes: editOrderNotes,
    };
    updateOrder(selectedOrder.id, {
      status: editOrderStatus,
      deliveryDate: editOrderDelivery,
      notes: editOrderNotes,
    });

    // Auto-add expense when order delivered
    if (wasDelivered) {
      const newExpense = {
        id: `exp_ord_${selectedOrder.id}`,
        category: "Satın Alma",
        projectId: selectedOrder.projectId || "",
        amount: selectedOrder.totalAmount,
        date: new Date().toISOString().split("T")[0],
        status: "Onaylandı" as const,
        description: `${selectedOrder.supplier} – ${selectedOrder.item}`,
        createdBy: user?.name || "",
      };
      setExpenses([...expenses, newExpense]);
      addNotification({
        type: "order_status",
        title: "Sipariş Teslim Edildi",
        message: `${updatedOrder.supplier} – ${updatedOrder.item} siparişi teslim edildi.`,
      });
    }
    if (editOrderStatus === "İptal") {
      // Reverse any related expense
      setExpenses(
        expenses.map((e) =>
          e.description?.includes(selectedOrder.id) ||
          e.id === `exp_ord_${selectedOrder.id}`
            ? { ...e, status: "Reddedildi" as const }
            : e,
        ),
      );
      addNotification({
        type: "order_status",
        title: "Sipariş İptal Edildi",
        message: `${selectedOrder.supplier} – ${selectedOrder.item} siparişi iptal edildi.`,
      });
    }

    setOrderDetailOpen(false);
    addAuditLog({
      module: "purchasing",
      action: "Sipariş Güncellendi",
      description: `${selectedOrder?.supplier || ""} – ${selectedOrder?.item || ""} siparişi güncellendi. Durum: ${editOrderStatus}.`,
      performedBy: user?.name || "",
    });
    setSelectedOrder(null);
  };

  const handleConvertToOrder = () => {
    const req = requests.find((r) => r.id === convertReqId);
    if (!req) return;
    const projForOrder =
      projects.find((p) => p.id === req.project) ||
      projects.find((p) => p.title === req.project);
    const newOrder: Order = {
      id: `o${Date.now()}`,
      supplier: convertSupplier || suppliers[0]?.name || "Belirtilmedi",
      item: req.item,
      totalAmount: req.qty * req.unitPrice,
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      status: "Taslak",
      notes: req.description,
      fromRequestId: req.id,
      projectId: projForOrder?.id || "",
    };
    addOrder(newOrder);
    setConvertDialogOpen(false);
    setConvertReqId(null);
    setConvertSupplier("");
  };

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.title || projectId;

  // ── Filtered suppliers ────────────────────────────────────────────────────
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(supplierSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Satın Alma</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tedarikçi yönetimi, satın alma talepleri ve sipariş takibi
          </p>
        </div>
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="purchasing.suppliers.tab"
            value="suppliers"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Tedarikçiler
          </TabsTrigger>
          <TabsTrigger
            data-ocid="purchasing.requests.tab"
            value="requests"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Satın Alma Talepleri
          </TabsTrigger>
          <TabsTrigger
            data-ocid="purchasing.orders.tab"
            value="orders"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Siparişler
          </TabsTrigger>
          <TabsTrigger
            data-ocid="purchasing.performance.tab"
            value="performance"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Tedarikçi Performans
          </TabsTrigger>
          <TabsTrigger
            data-ocid="purchasing.audit.tab"
            value="audit"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            data-ocid="purchasing.catalog.tab"
            value="catalog"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Fiyat Kataloğu
          </TabsTrigger>
          <TabsTrigger
            data-ocid="purchasing.tender.tab"
            value="tender"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            İhale Yönetimi
          </TabsTrigger>
        </TabsList>

        {/* ── SUPPLIERS TAB ─────────────────────────────────────────────── */}
        <TabsContent value="suppliers" className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Tedarikçiler ({filteredSuppliers.length})
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="purchasing.supplier.search_input"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  placeholder="Tedarikçi ara..."
                  className="pl-9 bg-card border-border"
                />
              </div>
              {canEdit && (
                <Dialog
                  open={supplierDialogOpen}
                  onOpenChange={setSupplierDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      data-ocid="purchasing.supplier.primary_button"
                      className="gradient-bg text-white hover:opacity-90 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Tedarikçi
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    data-ocid="purchasing.supplier.dialog"
                    className="bg-card border-border"
                  >
                    <DialogHeader>
                      <DialogTitle>Yeni Tedarikçi Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Şirket Adı</Label>
                        <Input
                          data-ocid="purchasing.supplier_name.input"
                          className="bg-background border-border mt-1"
                          value={newSupplier.name}
                          onChange={(e) =>
                            setNewSupplier((p) => ({
                              ...p,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Tedarikçi adı"
                        />
                      </div>
                      <div>
                        <Label>Kategori</Label>
                        <Select
                          value={newSupplier.category}
                          onValueChange={(v) =>
                            setNewSupplier((p) => ({
                              ...p,
                              category: v as SupplierCategory,
                            }))
                          }
                        >
                          <SelectTrigger
                            data-ocid="purchasing.supplier_category.select"
                            className="bg-background border-border mt-1"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {(
                              [
                                "Malzeme",
                                "Ekipman",
                                "Hizmet",
                                "Taşeron",
                              ] as SupplierCategory[]
                            ).map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Yetkili Kişi</Label>
                        <Input
                          data-ocid="purchasing.supplier_contact.input"
                          className="bg-background border-border mt-1"
                          value={newSupplier.contact}
                          onChange={(e) =>
                            setNewSupplier((p) => ({
                              ...p,
                              contact: e.target.value,
                            }))
                          }
                          placeholder="Yetkili adı"
                        />
                      </div>
                      <div>
                        <Label>E-posta</Label>
                        <Input
                          data-ocid="purchasing.supplier_email.input"
                          className="bg-background border-border mt-1"
                          value={newSupplier.email}
                          onChange={(e) =>
                            setNewSupplier((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                          placeholder="email@sirket.com"
                        />
                      </div>
                      <div>
                        <Label>Telefon</Label>
                        <Input
                          data-ocid="purchasing.supplier_phone.input"
                          className="bg-background border-border mt-1"
                          value={newSupplier.phone}
                          onChange={(e) =>
                            setNewSupplier((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="+90 xxx xxx xxxx"
                        />
                      </div>
                      <div>
                        <Label>Adres</Label>
                        <Input
                          data-ocid="purchasing.supplier_address.input"
                          className="bg-background border-border mt-1"
                          value={newSupplier.address}
                          onChange={(e) =>
                            setNewSupplier((p) => ({
                              ...p,
                              address: e.target.value,
                            }))
                          }
                          placeholder="Şirket adresi"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSupplierDialogOpen(false)}
                        className="border-border"
                        data-ocid="purchasing.supplier.cancel_button"
                      >
                        İptal
                      </Button>
                      <Button
                        data-ocid="purchasing.supplier.confirm_button"
                        onClick={handleAddSupplier}
                        className="gradient-bg text-white"
                      >
                        Ekle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {filteredSuppliers.length === 0 ? (
            <Card
              data-ocid="purchasing.suppliers.empty_state"
              className="bg-card border-border"
            >
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Building2 className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">Tedarikçi bulunamadı</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredSuppliers.map((supplier, idx) => (
                <Card
                  key={supplier.id}
                  data-ocid={`purchasing.supplier.card.${idx + 1}`}
                  className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setSupplierDetailOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">
                        {supplier.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${
                          supplier.status === "Aktif"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {supplier.status}
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs w-fit ${categoryColors[supplier.category]}`}
                    >
                      {supplier.category}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <StarRating rating={supplier.rating} />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      {supplier.contact}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {supplier.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {supplier.phone}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── REQUESTS TAB ──────────────────────────────────────────────── */}
        <TabsContent value="requests" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Satın Alma Talepleri ({requests.length})
            </h2>
            <Dialog
              open={requestDialogOpen}
              onOpenChange={setRequestDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  data-ocid="purchasing.request.primary_button"
                  className="gradient-bg text-white hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Talep
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="purchasing.request.dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>Yeni Satın Alma Talebi</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Malzeme / Hizmet Adı</Label>
                    <Input
                      data-ocid="purchasing.request_item.input"
                      className="bg-background border-border mt-1"
                      value={newRequest.item}
                      onChange={(e) =>
                        setNewRequest((p) => ({ ...p, item: e.target.value }))
                      }
                      placeholder="Talep edilen malzeme veya hizmet"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Miktar</Label>
                      <Input
                        data-ocid="purchasing.request_qty.input"
                        type="number"
                        className="bg-background border-border mt-1"
                        value={newRequest.qty}
                        onChange={(e) =>
                          setNewRequest((p) => ({ ...p, qty: e.target.value }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Birim Fiyat (₺)</Label>
                      <Input
                        data-ocid="purchasing.request_price.input"
                        type="number"
                        className="bg-background border-border mt-1"
                        value={newRequest.unitPrice}
                        onChange={(e) =>
                          setNewRequest((p) => ({
                            ...p,
                            unitPrice: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Proje</Label>
                    <Select
                      value={newRequest.project}
                      onValueChange={(v) =>
                        setNewRequest((p) => ({ ...p, project: v }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="purchasing.request_project.select"
                        className="bg-background border-border mt-1"
                      >
                        <SelectValue placeholder="Proje seçin" />
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
                    <Label>Öncelik</Label>
                    <Select
                      value={newRequest.priority}
                      onValueChange={(v) =>
                        setNewRequest((p) => ({
                          ...p,
                          priority: v as RequestPriority,
                        }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="purchasing.request_priority.select"
                        className="bg-background border-border mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {(["Yüksek", "Orta", "Düşük"] as RequestPriority[]).map(
                          (p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      data-ocid="purchasing.request_desc.textarea"
                      className="bg-background border-border mt-1"
                      value={newRequest.description}
                      onChange={(e) =>
                        setNewRequest((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Talep açıklaması"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRequestDialogOpen(false)}
                    className="border-border"
                    data-ocid="purchasing.request.cancel_button"
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="purchasing.request.confirm_button"
                    onClick={handleAddRequest}
                    className="gradient-bg text-white"
                  >
                    Talep Oluştur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Malzeme / Hizmet
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Miktar
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Tahmini Maliyet
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Proje
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Öncelik
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Durum
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Talep Eden
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Tarih
                    </TableHead>
                    {canEdit && (
                      <TableHead className="text-muted-foreground">
                        İşlem
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req, idx) => (
                    <TableRow
                      key={req.id}
                      data-ocid={`purchasing.request.row.${idx + 1}`}
                      className="border-border hover:bg-muted/20"
                    >
                      <TableCell className="font-medium">{req.item}</TableCell>
                      <TableCell>{req.qty}</TableCell>
                      <TableCell>
                        ₺{(req.qty * req.unitPrice).toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getProjectName(req.project)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${priorityColors[req.priority]}`}
                        >
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${requestStatusColors[req.status]}`}
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {req.requestedBy}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {req.date}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            {req.status === "Bekliyor" && (
                              <>
                                <Button
                                  data-ocid={`purchasing.request.confirm_button.${idx + 1}`}
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  onClick={() =>
                                    handleRequestAction(req.id, "Onaylandı")
                                  }
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  data-ocid={`purchasing.request.delete_button.${idx + 1}`}
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  onClick={() =>
                                    handleRequestAction(req.id, "Reddedildi")
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            {req.status === "Onaylandı" && (
                              <Button
                                data-ocid={`purchasing.request.secondary_button.${idx + 1}`}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                                onClick={() => {
                                  setConvertReqId(req.id);
                                  setConvertDialogOpen(true);
                                }}
                              >
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Siparişe Dönüştür
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ORDERS TAB ────────────────────────────────────────────────── */}
        <TabsContent value="orders" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Siparişler ({orders.length})
            </h2>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Tedarikçi
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Ürün / Hizmet
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Tutar
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Sipariş Tarihi
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Teslimat
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Durum
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, idx) => (
                    <TableRow
                      key={order.id}
                      data-ocid={`purchasing.order.row.${idx + 1}`}
                      className="border-border hover:bg-muted/20 cursor-pointer"
                      onClick={() => openOrderDetail(order)}
                    >
                      <TableCell className="font-medium">
                        {order.supplier}
                      </TableCell>
                      <TableCell>{order.item}</TableCell>
                      <TableCell>
                        ₺{order.totalAmount.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {order.orderDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {order.deliveryDate || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${orderStatusColors[order.status]}`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUPPLIER PERFORMANCE TAB ──────────────────────────────────────────── */}
        <TabsContent value="performance" className="mt-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold">
              Tedarikçi Performans Değerlendirmesi
            </h2>
          </div>

          {/* Supplier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier, idx) => {
              const avg = getSupplierAvgScore(supplier.id);
              const evalCount = supplierEvaluations.filter(
                (e) => e.supplierId === supplier.id,
              ).length;
              const lastEval = supplierEvaluations.filter(
                (e) => e.supplierId === supplier.id,
              )[0];
              return (
                <Card
                  key={supplier.id}
                  data-ocid={`purchasing.performance.item.${idx + 1}`}
                  className="border-border bg-card"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>{supplier.name}</span>
                      {avg !== null && (
                        <span className="flex text-base">
                          {renderStars(avg)}
                        </span>
                      )}
                    </CardTitle>
                    {avg !== null ? (
                      <p className="text-xs text-muted-foreground">
                        Ort: {avg.toFixed(1)}/5 · {evalCount} değerlendirme
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Henüz değerlendirme yok
                      </p>
                    )}
                    {lastEval && (
                      <p className="text-xs text-muted-foreground">
                        Son: {lastEval.period}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {canEdit && (
                      <Button
                        data-ocid={`purchasing.performance.evaluate.${idx + 1}`}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setEvalSupplier({
                            id: supplier.id,
                            name: supplier.name,
                          });
                          setEvalOpen(true);
                        }}
                      >
                        Değerlendir
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {suppliers.length === 0 && (
              <div
                data-ocid="purchasing.performance.empty_state"
                className="col-span-3 py-10 text-center text-muted-foreground"
              >
                <p>Henüz tedarikçi kaydı yok. Önce tedarikçi ekleyin.</p>
              </div>
            )}
          </div>

          {/* Evaluation Table */}
          {supplierEvaluations.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Tedarikçi
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Dönem
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Teslimat
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Kalite
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Fiyat
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      İletişim
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Ort.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supplierEvaluations.map((ev, idx) => {
                    const avg =
                      (ev.deliveryScore +
                        ev.qualityScore +
                        ev.priceScore +
                        ev.communicationScore) /
                      4;
                    return (
                      <tr
                        key={ev.id}
                        data-ocid={`purchasing.performance.row.${idx + 1}`}
                        className="border-t border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {ev.supplierName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ev.period}
                        </td>
                        <td className="px-4 py-3">
                          {renderStars(ev.deliveryScore)}
                        </td>
                        <td className="px-4 py-3">
                          {renderStars(ev.qualityScore)}
                        </td>
                        <td className="px-4 py-3">
                          {renderStars(ev.priceScore)}
                        </td>
                        <td className="px-4 py-3">
                          {renderStars(ev.communicationScore)}
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-400">
                          {avg.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Eval Dialog */}
          <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
            <DialogContent
              data-ocid="purchasing.performance.dialog"
              className="max-w-md"
            >
              <DialogHeader>
                <DialogTitle>{evalSupplier.name} - Değerlendirme</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Dönem</Label>
                  <Input
                    data-ocid="purchasing.performance.period.input"
                    type="month"
                    value={newEval.period}
                    onChange={(e) =>
                      setNewEval({ ...newEval, period: e.target.value })
                    }
                  />
                </div>
                {(
                  [
                    { key: "deliveryScore", label: "Teslimat Puanı" },
                    { key: "qualityScore", label: "Kalite Puanı" },
                    { key: "priceScore", label: "Fiyat/Performans Puanı" },
                    { key: "communicationScore", label: "İletişim Puanı" },
                  ] as { key: keyof typeof newEval; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`text-2xl ${n <= Number(newEval[key]) ? "text-amber-400" : "text-muted-foreground"}`}
                          onClick={() => setNewEval({ ...newEval, [key]: n })}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground self-center">
                        {newEval[key]}/5
                      </span>
                    </div>
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>Notlar</Label>
                  <Textarea
                    data-ocid="purchasing.performance.notes.textarea"
                    value={newEval.notes}
                    onChange={(e) =>
                      setNewEval({ ...newEval, notes: e.target.value })
                    }
                    placeholder="Değerlendirme notları..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  data-ocid="purchasing.performance.cancel_button"
                  variant="outline"
                  onClick={() => setEvalOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  data-ocid="purchasing.performance.submit_button"
                  className="gradient-bg text-white"
                  onClick={handleAddEval}
                >
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
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
                    Kullanıcı
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    İşlem
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Detay
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.filter((l) => l.module === "purchasing").length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Henüz denetim kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  auditLogs
                    .filter((l) => l.module === "purchasing")
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.performedBy}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {log.description}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── SUPPLIER DETAIL MODAL ─────────────────────────────────────────── */}
      <Dialog open={supplierDetailOpen} onOpenChange={setSupplierDetailOpen}>
        <DialogContent
          data-ocid="purchasing.supplier_detail.dialog"
          className="bg-card border-border max-w-lg"
        >
          {selectedSupplier && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-lg">
                      {selectedSupplier.name}
                    </DialogTitle>
                    <Badge
                      variant="outline"
                      className={`text-xs mt-1 ${categoryColors[selectedSupplier.category]}`}
                    >
                      {selectedSupplier.category}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs flex-shrink-0 ${
                      selectedSupplier.status === "Aktif"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                    }`}
                  >
                    {selectedSupplier.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Contact info */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Yetkili:</span>
                    <span>{selectedSupplier.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">E-posta:</span>
                    <span>{selectedSupplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Telefon:</span>
                    <span>{selectedSupplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Adres:</span>
                    <span>
                      {(selectedSupplier as Supplier & { address?: string })
                        .address || "Belirtilmedi"}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Performans Puanı
                  </p>
                  <StarRating
                    rating={selectedSupplier.rating}
                    onRate={(r) => handleRateSupplier(selectedSupplier, r)}
                  />
                </div>

                {/* Past orders */}
                <div>
                  <p className="text-sm font-medium mb-2">Geçmiş Siparişler</p>
                  {orders.filter((o) => o.supplier === selectedSupplier.name)
                    .length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Bu tedarikçiye ait sipariş bulunamadı.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {orders
                        .filter((o) => o.supplier === selectedSupplier.name)
                        .map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between text-xs bg-background rounded px-3 py-2"
                          >
                            <span className="text-muted-foreground">
                              {o.item}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>
                                ₺{o.totalAmount.toLocaleString("tr-TR")}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${orderStatusColors[o.status]}`}
                              >
                                {o.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                {canEdit && (
                  <Button
                    data-ocid="purchasing.supplier_detail.toggle"
                    variant="outline"
                    className={`border-border ${
                      selectedSupplier.status === "Aktif"
                        ? "text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
                        : "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                    }`}
                    onClick={() => handleToggleSupplierStatus(selectedSupplier)}
                  >
                    {selectedSupplier.status === "Aktif"
                      ? "Pasife Al"
                      : "Aktife Al"}
                  </Button>
                )}
                <Button
                  data-ocid="purchasing.supplier_detail.close_button"
                  onClick={() => setSupplierDetailOpen(false)}
                  className="gradient-bg text-white"
                >
                  Kapat
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ORDER DETAIL MODAL ────────────────────────────────────────────── */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent
          data-ocid="purchasing.order_detail.dialog"
          className="bg-card border-border max-w-lg"
        >
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedOrder.item}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.supplier} — ₺
                  {selectedOrder.totalAmount.toLocaleString("tr-TR")}
                </p>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Sipariş Durumu</Label>
                  <Select
                    value={editOrderStatus}
                    onValueChange={(v) => setEditOrderStatus(v as OrderStatus)}
                  >
                    <SelectTrigger
                      data-ocid="purchasing.order_status.select"
                      className="bg-background border-border mt-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {(
                        [
                          "Taslak",
                          "Sipariş Verildi",
                          "Teslim Edildi",
                          "İptal",
                        ] as OrderStatus[]
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editOrderStatus === "Teslim Edildi" &&
                    selectedOrder.status !== "Teslim Edildi" && (
                      <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Bu sipariş tutarı Finans modülüne otomatik gider olarak
                        eklenecek.
                      </p>
                    )}
                </div>

                <div>
                  <Label>Teslimat Tarihi</Label>
                  <Input
                    data-ocid="purchasing.order_delivery.input"
                    type="date"
                    className="bg-background border-border mt-1"
                    value={editOrderDelivery}
                    onChange={(e) => setEditOrderDelivery(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Notlar</Label>
                  <Textarea
                    data-ocid="purchasing.order_notes.textarea"
                    className="bg-background border-border mt-1"
                    value={editOrderNotes}
                    onChange={(e) => setEditOrderNotes(e.target.value)}
                    placeholder="Sipariş notları..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  data-ocid="purchasing.order_detail.cancel_button"
                  variant="outline"
                  onClick={() => setOrderDetailOpen(false)}
                  className="border-border"
                >
                  Vazgeç
                </Button>
                <Button
                  data-ocid="purchasing.order_detail.save_button"
                  onClick={handleSaveOrder}
                  className="gradient-bg text-white"
                >
                  Kaydet
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── CONVERT TO ORDER CONFIRM ──────────────────────────────────────── */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent
          data-ocid="purchasing.convert.dialog"
          className="bg-card border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Siparişe Dönüştür</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu onaylı talep için yeni bir sipariş kaydı oluşturulacak. Devam
            etmek istiyor musunuz?
          </p>
          <div>
            <Label>Tedarikçi</Label>
            <Select value={convertSupplier} onValueChange={setConvertSupplier}>
              <SelectTrigger
                data-ocid="purchasing.convert.supplier_select"
                className="bg-background border-border mt-1"
              >
                <SelectValue placeholder="Tedarikçi seçin" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              data-ocid="purchasing.convert.cancel_button"
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="purchasing.convert.confirm_button"
              onClick={handleConvertToOrder}
              className="gradient-bg text-white"
            >
              Sipariş Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FİYAT KATALOĞU TAB ─────────────────────────────────────────── */}
      <TabsContent value="catalog" className="mt-6">
        <PriceCatalogTab
          companyId={activeCompanyId || ""}
          suppliers={suppliers}
        />
      </TabsContent>

      {/* ── İHALE YÖNETİMİ TAB ─────────────────────────────────────── */}
      <TabsContent value="tender" className="mt-6">
        <TenderManagement
          companyId={activeCompanyId || ""}
          suppliers={suppliers}
          projects={projects}
        />
      </TabsContent>
    </div>
  );
}
