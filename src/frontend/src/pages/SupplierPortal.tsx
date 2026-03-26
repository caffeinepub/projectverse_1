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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Copy,
  Eye,
  PackageSearch,
  PlusCircle,
  Star,
  Store,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

interface SupplierPortalAccess {
  id: string;
  supplierId: string;
  supplierName: string;
  contactEmail: string;
  token: string;
  createdAt: string;
  active: boolean;
  viewCount: number;
}

const STORAGE_KEY = "supplierPortal";

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export default function SupplierPortal() {
  const { currentCompany, suppliers, purchaseRequests } = useApp();

  const companyId = currentCompany?.id ?? "";
  const storageKey = `${STORAGE_KEY}_${companyId}`;

  const companySuppliers = suppliers.filter(
    (s) => (s as any).companyId === companyId || true,
  );

  const [accesses, setAccesses] = useState<SupplierPortalAccess[]>(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  });

  const save = (data: SupplierPortalAccess[]) => {
    setAccesses(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [previewAccess, setPreviewAccess] =
    useState<SupplierPortalAccess | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ supplierId: "", contactEmail: "" });

  const handleCreate = () => {
    if (!form.supplierId) return;
    const supplier = companySuppliers.find((s) => s.id === form.supplierId);
    if (!supplier) return;
    const newAccess: SupplierPortalAccess = {
      id: Date.now().toString(),
      supplierId: form.supplierId,
      supplierName: supplier.name,
      contactEmail: form.contactEmail || supplier.email,
      token: generateToken(),
      createdAt: new Date().toISOString().split("T")[0],
      active: true,
      viewCount: 0,
    };
    save([...accesses, newAccess]);
    setCreateOpen(false);
    setForm({ supplierId: "", contactEmail: "" });
  };

  const handleToggle = (id: string) => {
    save(accesses.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  const handleDelete = (id: string) => {
    save(accesses.filter((a) => a.id !== id));
  };

  const handleCopy = (token: string) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/supplier-portal?t=${token}`)
      .catch(() => {});
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const getSupplier = (id: string) => companySuppliers.find((s) => s.id === id);

  const activeCount = accesses.filter((a) => a.active).length;

  const previewSupplier = previewAccess
    ? getSupplier(previewAccess.supplierId)
    : null;

  const previewOrders = previewAccess
    ? (purchaseRequests || []).slice(0, 4)
    : [];

  const statusColor: Record<string, string> = {
    Bekliyor: "bg-yellow-500/20 text-yellow-400",
    Onaylandı: "bg-green-500/20 text-green-400",
    Reddedildi: "bg-red-500/20 text-red-400",
    Teslim: "bg-blue-500/20 text-blue-400",
    Tamamlandı: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Tedarikçi Portalı
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tedarikçilere sipariş, teslimat ve performans bilgilerine kısıtlı
            erişim sağlayın
          </p>
        </div>
        <Button
          data-ocid="supplier_portal.open_modal_button"
          className="gradient-bg text-white"
          onClick={() => setCreateOpen(true)}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Portal Erişimi Oluştur
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Toplam Erişim
            </p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {accesses.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
            </p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {activeCount}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <PackageSearch className="w-3.5 h-3.5" /> Tedarikçi Sayısı
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {new Set(accesses.map((a) => a.supplierId)).size}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Toplam Görüntüleme
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {accesses.reduce((s, a) => s + a.viewCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            Portal Erişim Listesi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accesses.length === 0 ? (
            <div
              data-ocid="supplier_portal.empty_state"
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <Store className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Henüz tedarikçi portal erişimi oluşturulmadı
              </p>
              <Button
                variant="outline"
                className="border-amber-500/30 text-amber-400"
                onClick={() => setCreateOpen(true)}
              >
                <PlusCircle className="w-4 h-4 mr-2" /> İlk Erişimi Oluştur
              </Button>
            </div>
          ) : (
            <Table data-ocid="supplier_portal.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    Tedarikçi
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    İletişim
                  </TableHead>
                  <TableHead className="text-muted-foreground">Token</TableHead>
                  <TableHead className="text-muted-foreground">Durum</TableHead>
                  <TableHead className="text-muted-foreground">
                    Oluşturulma
                  </TableHead>
                  <TableHead className="text-muted-foreground text-center">
                    Görüntüleme
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    İşlemler
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accesses.map((a, idx) => (
                  <TableRow
                    key={a.id}
                    data-ocid={`supplier_portal.row.${idx + 1}`}
                    className="border-border"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {a.supplierName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getSupplier(a.supplierId)?.category || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.contactEmail || "—"}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-background px-2 py-0.5 rounded font-mono text-amber-400">
                        {a.token}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          a.active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {a.active ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.createdAt}
                    </TableCell>
                    <TableCell className="text-center text-foreground">
                      {a.viewCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300"
                          onClick={() => handleCopy(a.token)}
                          title="Linki kopyala"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        {copied === a.token && (
                          <span className="text-xs text-green-400">
                            Kopyalandı!
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300"
                          onClick={() => setPreviewAccess(a)}
                          title="Önizleme"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`supplier_portal.toggle.${idx + 1}`}
                          className={`h-7 w-7 p-0 ${
                            a.active
                              ? "text-green-400 hover:text-green-300"
                              : "text-muted-foreground hover:text-green-400"
                          }`}
                          onClick={() => handleToggle(a.id)}
                          title={a.active ? "Erişimi kapat" : "Erişimi aç"}
                        >
                          {a.active ? (
                            <ToggleRight className="w-3.5 h-3.5" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`supplier_portal.delete_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                          onClick={() => handleDelete(a.id)}
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          data-ocid="supplier_portal.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Tedarikçi Portal Erişimi Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tedarikçi *</Label>
              <select
                data-ocid="supplier_portal.select"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={form.supplierId}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
              >
                <option value="">Tedarikçi seçin...</option>
                {companySuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>İletişim E-postası</Label>
              <Input
                data-ocid="supplier_portal.input"
                className="bg-background border-border"
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                placeholder="tedarikci@firma.com"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              8 karakterlik benzersiz bir erişim kodu otomatik oluşturulacak.
            </p>
          </div>
          <DialogFooter className="mt-2">
            <Button
              data-ocid="supplier_portal.cancel_button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="supplier_portal.submit_button"
              className="gradient-bg text-white"
              onClick={handleCreate}
              disabled={!form.supplierId}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewAccess}
        onOpenChange={() => setPreviewAccess(null)}
      >
        <DialogContent
          data-ocid="supplier_portal.preview.dialog"
          className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Portal Önizleme — {previewAccess?.supplierName}
            </DialogTitle>
          </DialogHeader>
          {previewSupplier && previewAccess && (
            <div className="space-y-5">
              {/* Supplier info header */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {previewSupplier.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {previewSupplier.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(previewSupplier.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-muted-foreground">
                    İletişim:{" "}
                    <span className="text-foreground">
                      {previewSupplier.contact || "—"}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Durum:{" "}
                    <Badge className="text-xs bg-amber-500/20 text-amber-400">
                      {previewSupplier.status}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Performans skoru */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Performans Skoru
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-background border border-border text-center">
                    <p className="text-xs text-muted-foreground">Genel Puan</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      {previewSupplier.rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">/ 5.0</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      Aktif Siparişler
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {
                        previewOrders.filter((o) => o.status === "Bekliyor")
                          .length
                      }
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border text-center">
                    <p className="text-xs text-muted-foreground">Tamamlanan</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      {
                        previewOrders.filter((o) => o.status === "Onaylandı")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Aktif siparişler */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Aktif Satın Alma Siparişleri
                </p>
                {previewOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    Aktif sipariş bulunmuyor
                  </p>
                ) : (
                  <div className="space-y-2">
                    {previewOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {order.item}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Miktar: {order.qty} · Proje: {order.project}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            ₺
                            {(order.qty * order.unitPrice).toLocaleString(
                              "tr-TR",
                            )}
                          </span>
                          <Badge
                            className={
                              statusColor[order.status] ||
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teslimat geçmişi placeholder */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Teslimat Geçmişi
                </p>
                <div className="p-4 rounded-lg bg-background border border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Teslimat kayıtları Sevkiyat & Teslimat modülünden senkronize
                    edilir
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400"
              onClick={() => handleCopy(previewAccess?.token || "")}
            >
              <Copy className="w-3.5 h-3.5 mr-2" />
              Erişim Linkini Kopyala
            </Button>
            <Button
              data-ocid="supplier_portal.preview.close_button"
              variant="ghost"
              onClick={() => setPreviewAccess(null)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
