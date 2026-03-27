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
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  PackageSearch,
  Pencil,
  PlusCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../contexts/AppContext";

type Status = "Planlandı" | "Sipariş Verildi" | "Teslim Alındı" | "İptal";
type Priority = "Düşük" | "Orta" | "Yüksek" | "Kritik";

interface ProcurementItem {
  id: string;
  ad: string;
  proje: string;
  planlananSiparisTarihi: string;
  planlananTeslimTarihi: string;
  tedarikci: string;
  miktar: number;
  birim: string;
  tahminiMaliyet: number;
  durum: Status;
  oncelik: Priority;
  notlar: string;
}

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; icon: React.ReactNode }
> = {
  Planlandı: {
    label: "Planlandı",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <ClipboardList className="w-3 h-3" />,
  },
  "Sipariş Verildi": {
    label: "Sipariş Verildi",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: <CalendarClock className="w-3 h-3" />,
  },
  "Teslim Alındı": {
    label: "Teslim Alındı",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  İptal: {
    label: "İptal",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const PRIORITY_CONFIG: Record<Priority, { color: string }> = {
  Düşük: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  Orta: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  Yüksek: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  Kritik: { color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const STORAGE_KEY = "procurementSchedule";

function useStorage(companyId: string | undefined) {
  const key = `${STORAGE_KEY}_${companyId}`;
  const load = (): ProcurementItem[] => {
    if (!companyId) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };
  const save = (items: ProcurementItem[]) => {
    if (!companyId) return;
    localStorage.setItem(key, JSON.stringify(items));
  };
  return { load, save };
}

const EMPTY_FORM: Omit<ProcurementItem, "id"> = {
  ad: "",
  proje: "",
  planlananSiparisTarihi: "",
  planlananTeslimTarihi: "",
  tedarikci: "",
  miktar: 1,
  birim: "Adet",
  tahminiMaliyet: 0,
  durum: "Planlandı",
  oncelik: "Orta",
  notlar: "",
};

export default function ProcurementSchedule() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id;
  const { load, save } = useStorage(companyId);

  const [items, setItems] = useState<ProcurementItem[]>(load);
  const [filterProje, setFilterProje] = useState("all");
  const [filterDurum, setFilterDurum] = useState<"all" | Status>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProcurementItem | null>(null);
  const [form, setForm] = useState<Omit<ProcurementItem, "id">>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const projects = useMemo(() => {
    const companyProjects: Array<{ id: string; name: string }> = [];
    try {
      const stored = localStorage.getItem(`pv_projects_${companyId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const p of parsed as Array<{ id: string; name: string }>) {
          companyProjects.push(p);
        }
      }
    } catch {
      // ignore
    }
    return companyProjects;
  }, [companyId]);

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterProje !== "all" && item.proje !== filterProje) return false;
      if (filterDurum !== "all" && item.durum !== filterDurum) return false;
      return true;
    });
  }, [items, filterProje, filterDurum]);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) => i.durum === "Planlandı").length;
    const overdue = items.filter(
      (i) =>
        i.durum !== "Teslim Alındı" &&
        i.durum !== "İptal" &&
        i.planlananTeslimTarihi < today,
    ).length;
    const ordered = items.filter((i) => i.durum === "Sipariş Verildi").length;
    return { total, pending, overdue, ordered };
  }, [items, today]);

  const saveItems = (updated: ProcurementItem[]) => {
    setItems(updated);
    save(updated);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: ProcurementItem) => {
    setEditItem(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.ad.trim() || !form.proje.trim()) return;
    if (editItem) {
      saveItems(
        items.map((i) =>
          i.id === editItem.id ? { ...form, id: editItem.id } : i,
        ),
      );
    } else {
      saveItems([...items, { ...form, id: crypto.randomUUID() }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    saveItems(items.filter((i) => i.id !== id));
    setDeleteConfirm(null);
  };

  const isOverdue = (item: ProcurementItem) =>
    item.durum !== "Teslim Alındı" &&
    item.durum !== "İptal" &&
    item.planlananTeslimTarihi < today;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PackageSearch className="w-7 h-7 text-amber-400" />
            Tedarik Planı
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Proje bazlı malzeme ve hizmet tedarik takvimi
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          data-ocid="procurement.primary_button"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Yeni Kalem Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-400 text-xs mb-1">Toplam Kalem</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-400 text-xs mb-1">Planlandı</p>
            <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-400 text-xs mb-1">Sipariş Verildi</p>
            <p className="text-2xl font-bold text-amber-400">{stats.ordered}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <p className="text-gray-400 text-xs mb-1">Geciken Teslimat</p>
            <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-gray-400 text-xs mb-1 block">
                Proje Filtresi
              </Label>
              <Select value={filterProje} onValueChange={setFilterProje}>
                <SelectTrigger
                  className="bg-gray-700 border-gray-600 text-white"
                  data-ocid="procurement.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Tüm Projeler</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label className="text-gray-400 text-xs mb-1 block">
                Durum Filtresi
              </Label>
              <Select
                value={filterDurum}
                onValueChange={(v) => setFilterDurum(v as "all" | Status)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="Planlandı">Planlandı</SelectItem>
                  <SelectItem value="Sipariş Verildi">
                    Sipariş Verildi
                  </SelectItem>
                  <SelectItem value="Teslim Alındı">Teslim Alındı</SelectItem>
                  <SelectItem value="İptal">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">
            Tedarik Kalemleri ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-gray-500"
              data-ocid="procurement.empty_state"
            >
              <PackageSearch className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Henüz tedarik kalemi eklenmemiş</p>
              <p className="text-xs mt-1">
                Yeni kalem eklemek için butona tıklayın
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="procurement.table">
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-400">
                      Malzeme / Hizmet
                    </TableHead>
                    <TableHead className="text-gray-400">Proje</TableHead>
                    <TableHead className="text-gray-400">
                      Sipariş Tarihi
                    </TableHead>
                    <TableHead className="text-gray-400">
                      Teslim Tarihi
                    </TableHead>
                    <TableHead className="text-gray-400">Tedarikçi</TableHead>
                    <TableHead className="text-gray-400">Miktar</TableHead>
                    <TableHead className="text-gray-400">
                      Tahmini Maliyet
                    </TableHead>
                    <TableHead className="text-gray-400">Öncelik</TableHead>
                    <TableHead className="text-gray-400">Durum</TableHead>
                    <TableHead className="text-gray-400 w-20">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className={`border-gray-700 ${
                        isOverdue(item)
                          ? "bg-red-950/20"
                          : "hover:bg-gray-700/50"
                      }`}
                      data-ocid={`procurement.item.${idx + 1}`}
                    >
                      <TableCell className="text-white font-medium">
                        <div className="flex items-center gap-1">
                          {isOverdue(item) && (
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                          )}
                          {item.ad}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {item.proje}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {item.planlananSiparisTarihi || "-"}
                      </TableCell>
                      <TableCell
                        className={`text-sm ${
                          isOverdue(item)
                            ? "text-red-400 font-medium"
                            : "text-gray-300"
                        }`}
                      >
                        {item.planlananTeslimTarihi || "-"}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {item.tedarikci || "-"}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {item.miktar} {item.birim}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {item.tahminiMaliyet > 0
                          ? `${item.tahminiMaliyet.toLocaleString("tr-TR")} ₺`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${PRIORITY_CONFIG[item.oncelik].color}`}
                        >
                          {item.oncelik}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs flex items-center gap-1 w-fit ${STATUS_CONFIG[item.durum].color}`}
                        >
                          {STATUS_CONFIG[item.durum].icon}
                          {item.durum}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-amber-400"
                            onClick={() => openEdit(item)}
                            data-ocid={`procurement.edit_button.${idx + 1}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-400"
                            onClick={() => setDeleteConfirm(item.id)}
                            data-ocid={`procurement.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="bg-gray-900 border-gray-700 text-white max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="procurement.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editItem ? "Kalemi Düzenle" : "Yeni Tedarik Kalemi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-gray-300">Malzeme / Hizmet Adı *</Label>
              <Input
                value={form.ad}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white mt-1"
                placeholder="Malzeme veya hizmet adı"
                data-ocid="procurement.input"
              />
            </div>
            <div>
              <Label className="text-gray-300">Proje *</Label>
              <Select
                value={form.proje}
                onValueChange={(v) => setForm({ ...form, proje: v })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {projects.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Proje bulunamadı
                    </SelectItem>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Proje adını manuel girin:
                </p>
              )}
              {projects.length === 0 && (
                <Input
                  value={form.proje}
                  onChange={(e) => setForm({ ...form, proje: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="Proje adı"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">
                  Planlanan Sipariş Tarihi
                </Label>
                <Input
                  type="date"
                  value={form.planlananSiparisTarihi}
                  onChange={(e) =>
                    setForm({ ...form, planlananSiparisTarihi: e.target.value })
                  }
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Planlanan Teslim Tarihi</Label>
                <Input
                  type="date"
                  value={form.planlananTeslimTarihi}
                  onChange={(e) =>
                    setForm({ ...form, planlananTeslimTarihi: e.target.value })
                  }
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Tedarikçi</Label>
              <Input
                value={form.tedarikci}
                onChange={(e) =>
                  setForm({ ...form, tedarikci: e.target.value })
                }
                className="bg-gray-800 border-gray-600 text-white mt-1"
                placeholder="Tedarikçi adı"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Miktar</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.miktar}
                  onChange={(e) =>
                    setForm({ ...form, miktar: Number(e.target.value) })
                  }
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Birim</Label>
                <Select
                  value={form.birim}
                  onValueChange={(v) => setForm({ ...form, birim: v })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {[
                      "Adet",
                      "m²",
                      "m³",
                      "kg",
                      "ton",
                      "litre",
                      "paket",
                      "takım",
                      "metre",
                    ].map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Tahmini Maliyet (₺)</Label>
              <Input
                type="number"
                min="0"
                value={form.tahminiMaliyet}
                onChange={(e) =>
                  setForm({ ...form, tahminiMaliyet: Number(e.target.value) })
                }
                className="bg-gray-800 border-gray-600 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Öncelik</Label>
                <Select
                  value={form.oncelik}
                  onValueChange={(v) =>
                    setForm({ ...form, oncelik: v as Priority })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Düşük">Düşük</SelectItem>
                    <SelectItem value="Orta">Orta</SelectItem>
                    <SelectItem value="Yüksek">Yüksek</SelectItem>
                    <SelectItem value="Kritik">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Durum</Label>
                <Select
                  value={form.durum}
                  onValueChange={(v) =>
                    setForm({ ...form, durum: v as Status })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Planlandı">Planlandı</SelectItem>
                    <SelectItem value="Sipariş Verildi">
                      Sipariş Verildi
                    </SelectItem>
                    <SelectItem value="Teslim Alındı">Teslim Alındı</SelectItem>
                    <SelectItem value="İptal">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Notlar</Label>
              <Textarea
                value={form.notlar}
                onChange={(e) => setForm({ ...form, notlar: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white mt-1"
                rows={2}
                placeholder="Ek notlar..."
                data-ocid="procurement.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-gray-600 text-gray-300"
              data-ocid="procurement.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              disabled={!form.ad.trim() || !form.proje.trim()}
              data-ocid="procurement.submit_button"
            >
              {editItem ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent
          className="bg-gray-900 border-gray-700 text-white max-w-sm"
          data-ocid="procurement.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-red-400">Kalemi Sil</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300 text-sm">
            Bu tedarik kalemi silinecek. Devam etmek istiyor musunuz?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-gray-600 text-gray-300"
              data-ocid="procurement.cancel_button"
            >
              Vazgeç
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-ocid="procurement.confirm_button"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
