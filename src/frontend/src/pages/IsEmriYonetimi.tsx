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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Plus,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

type IsEmriTip = "Bakım" | "Onarım" | "Saha Görevi" | "Diğer";
type IsEmriOncelik = "Düşük" | "Orta" | "Yüksek" | "Kritik";
type IsEmriDurum =
  | "Taslak"
  | "Atandı"
  | "Devam Ediyor"
  | "Tamamlandı"
  | "İptal";

interface IsEmri {
  id: string;
  emriNo: string;
  baslik: string;
  aciklama: string;
  tip: IsEmriTip;
  oncelik: IsEmriOncelik;
  durum: IsEmriDurum;
  atanan: string;
  projeId: string;
  projeAdi: string;
  terminTarihi: string;
  notlar: string;
  olusturmaTarihi: string;
}

const TIPLER: IsEmriTip[] = ["Bakım", "Onarım", "Saha Görevi", "Diğer"];
const ONCELIKLER: IsEmriOncelik[] = ["Düşük", "Orta", "Yüksek", "Kritik"];
const DURUMLAR: IsEmriDurum[] = [
  "Taslak",
  "Atandı",
  "Devam Ediyor",
  "Tamamlandı",
  "İptal",
];

const WORKFLOW: IsEmriDurum[] = [
  "Taslak",
  "Atandı",
  "Devam Ediyor",
  "Tamamlandı",
];

const ONCELIK_COLORS: Record<IsEmriOncelik, string> = {
  Kritik: "bg-red-500/20 text-red-400 border-red-500/30",
  Yüksek: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Orta: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Düşük: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const DURUM_COLORS: Record<IsEmriDurum, string> = {
  Taslak: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Atandı: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Devam Ediyor": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Tamamlandı: "bg-green-500/20 text-green-400 border-green-500/30",
  İptal: "bg-red-500/20 text-red-300 border-red-500/30",
};

const TIP_COLORS: Record<IsEmriTip, string> = {
  Bakım: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Onarım: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Saha Görevi": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Diğer: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function generateEmriNo(existing: IsEmri[]): string {
  const year = new Date().getFullYear();
  const next = existing.length + 1;
  return `IE-${year}-${String(next).padStart(4, "0")}`;
}

function getNextDurum(current: IsEmriDurum): IsEmriDurum | null {
  const idx = WORKFLOW.indexOf(current);
  if (idx === -1 || idx >= WORKFLOW.length - 1) return null;
  return WORKFLOW[idx + 1];
}

export default function IsEmriYonetimi() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "";
  const storageKey = `projectverse_isemri_${companyId}`;

  const [emirler, setEmirler] = useState<IsEmri[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });

  const save = (updated: IsEmri[]) => {
    setEmirler(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Proje listesi
  const projeler = useMemo(() => {
    try {
      const all = JSON.parse(
        localStorage.getItem(`pv_projects_${companyId}`) ?? "[]",
      ) as { id: string; name: string }[];
      return all;
    } catch {
      return [];
    }
  }, [companyId]);

  // Filtreler
  const [filterTip, setFilterTip] = useState<string>("all");
  const [filterOncelik, setFilterOncelik] = useState<string>("all");
  const [filterDurum, setFilterDurum] = useState<string>("all");

  const filtered = useMemo(() => {
    return emirler.filter((e) => {
      if (filterTip !== "all" && e.tip !== filterTip) return false;
      if (filterOncelik !== "all" && e.oncelik !== filterOncelik) return false;
      if (filterDurum !== "all" && e.durum !== filterDurum) return false;
      return true;
    });
  }, [emirler, filterTip, filterOncelik, filterDurum]);

  // KPI
  const stats = useMemo(() => {
    return {
      toplam: emirler.length,
      tamamlanan: emirler.filter((e) => e.durum === "Tamamlandı").length,
      devamEden: emirler.filter((e) => e.durum === "Devam Ediyor").length,
      kritik: emirler.filter((e) => e.oncelik === "Kritik").length,
    };
  }, [emirler]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IsEmri | null>(null);
  const [form, setForm] = useState<Partial<IsEmri>>({
    tip: "Bakım",
    oncelik: "Orta",
    durum: "Taslak",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ tip: "Bakım", oncelik: "Orta", durum: "Taslak" });
    setModalOpen(true);
  };

  const openEdit = (e: IsEmri) => {
    setEditing(e);
    setForm({ ...e });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.baslik?.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }
    const proje = projeler.find((p) => p.id === form.projeId);
    if (editing) {
      const updated = emirler.map((e) =>
        e.id === editing.id
          ? {
              ...editing,
              ...form,
              projeAdi: proje?.name ?? form.projeAdi ?? "",
            }
          : e,
      ) as IsEmri[];
      save(updated);
      toast.success("İş emri güncellendi");
    } else {
      const newEmri: IsEmri = {
        id: crypto.randomUUID(),
        emriNo: generateEmriNo(emirler),
        baslik: form.baslik ?? "",
        aciklama: form.aciklama ?? "",
        tip: (form.tip as IsEmriTip) ?? "Bakım",
        oncelik: (form.oncelik as IsEmriOncelik) ?? "Orta",
        durum: (form.durum as IsEmriDurum) ?? "Taslak",
        atanan: form.atanan ?? "",
        projeId: form.projeId ?? "",
        projeAdi: proje?.name ?? "",
        terminTarihi: form.terminTarihi ?? "",
        notlar: form.notlar ?? "",
        olusturmaTarihi: new Date().toISOString().slice(0, 10),
      };
      save([...emirler, newEmri]);
      toast.success("İş emri oluşturuldu");
    }
    setModalOpen(false);
  };

  const handleIlerlet = (e: IsEmri) => {
    const next = getNextDurum(e.durum);
    if (!next) return;
    const updated = emirler.map((em) =>
      em.id === e.id ? { ...em, durum: next } : em,
    );
    save(updated);
    toast.success(`Durum güncellendi: ${next}`);
  };

  const handleDelete = (id: string) => {
    save(emirler.filter((e) => e.id !== id));
    toast.success("İş emri silindi");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-400" />
            İş Emri Yönetimi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Bakım, onarım ve saha görevlerini yönetin
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          data-ocid="isemri.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni İş Emri
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <ClipboardList className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Toplam</p>
                <p className="text-white text-xl font-bold">{stats.toplam}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Tamamlanan</p>
                <p className="text-white text-xl font-bold">
                  {stats.tamamlanan}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Loader2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Devam Eden</p>
                <p className="text-white text-xl font-bold">
                  {stats.devamEden}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Kritik</p>
                <p className="text-white text-xl font-bold">{stats.kritik}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterTip} onValueChange={setFilterTip}>
          <SelectTrigger
            className="w-40 bg-slate-800 border-slate-600 text-slate-200"
            data-ocid="isemri.select"
          >
            <SelectValue placeholder="Tip" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Tüm Tipler</SelectItem>
            {TIPLER.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterOncelik} onValueChange={setFilterOncelik}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-200">
            <SelectValue placeholder="Öncelik" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            {ONCELIKLER.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDurum} onValueChange={setFilterDurum}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-200">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {DURUMLAR.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="isemri.empty_state"
            >
              <Wrench className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 font-medium">İş emri bulunamadı</p>
              <p className="text-slate-500 text-sm mt-1">
                Yeni bir iş emri oluşturmak için butona tıklayın
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="isemri.table">
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">No</TableHead>
                    <TableHead className="text-slate-400">Başlık</TableHead>
                    <TableHead className="text-slate-400">Tip</TableHead>
                    <TableHead className="text-slate-400">Öncelik</TableHead>
                    <TableHead className="text-slate-400">Durum</TableHead>
                    <TableHead className="text-slate-400">Atanan</TableHead>
                    <TableHead className="text-slate-400">Proje</TableHead>
                    <TableHead className="text-slate-400">Termin</TableHead>
                    <TableHead className="text-slate-400">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e, idx) => (
                    <TableRow
                      key={e.id}
                      className="border-slate-700 hover:bg-slate-700/30"
                      data-ocid={`isemri.item.${idx + 1}`}
                    >
                      <TableCell className="text-amber-400 font-mono text-xs">
                        {e.emriNo}
                      </TableCell>
                      <TableCell className="text-white font-medium max-w-48 truncate">
                        {e.baslik}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${TIP_COLORS[e.tip]}`}
                        >
                          {e.tip}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${ONCELIK_COLORS[e.oncelik]}`}
                        >
                          {e.oncelik}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${DURUM_COLORS[e.durum]}`}
                        >
                          {e.durum}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {e.atanan || "—"}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm max-w-32 truncate">
                        {e.projeAdi || "—"}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {e.terminTarihi ? (
                          <span
                            className={`flex items-center gap-1 ${
                              e.terminTarihi <
                                new Date().toISOString().slice(0, 10) &&
                              e.durum !== "Tamamlandı"
                                ? "text-red-400"
                                : ""
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {e.terminTarihi}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {getNextDurum(e.durum) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 h-7 text-xs"
                              onClick={() => handleIlerlet(e)}
                              data-ocid={`isemri.secondary_button.${idx + 1}`}
                            >
                              {getNextDurum(e.durum)}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white h-7 text-xs"
                            onClick={() => openEdit(e)}
                            data-ocid={`isemri.edit_button.${idx + 1}`}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 h-7 text-xs"
                            onClick={() => handleDelete(e.id)}
                            data-ocid={`isemri.delete_button.${idx + 1}`}
                          >
                            Sil
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

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white max-w-2xl"
          data-ocid="isemri.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editing ? "İş Emri Düzenle" : "Yeni İş Emri"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2">
              <Label className="text-slate-300">Başlık *</Label>
              <Input
                value={form.baslik ?? ""}
                onChange={(ev) =>
                  setForm((p) => ({ ...p, baslik: ev.target.value }))
                }
                className="bg-slate-800 border-slate-600 text-white mt-1"
                placeholder="İş emri başlığı"
                data-ocid="isemri.input"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-slate-300">Açıklama</Label>
              <Textarea
                value={form.aciklama ?? ""}
                onChange={(ev) =>
                  setForm((p) => ({ ...p, aciklama: ev.target.value }))
                }
                className="bg-slate-800 border-slate-600 text-white mt-1 resize-none"
                rows={2}
                placeholder="Kısa açıklama..."
                data-ocid="isemri.textarea"
              />
            </div>
            <div>
              <Label className="text-slate-300">Tip</Label>
              <Select
                value={form.tip}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, tip: v as IsEmriTip }))
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {TIPLER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Öncelik</Label>
              <Select
                value={form.oncelik}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, oncelik: v as IsEmriOncelik }))
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {ONCELIKLER.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Durum</Label>
              <Select
                value={form.durum}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, durum: v as IsEmriDurum }))
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {DURUMLAR.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Atanan Kişi / Taşeron</Label>
              <Input
                value={form.atanan ?? ""}
                onChange={(ev) =>
                  setForm((p) => ({ ...p, atanan: ev.target.value }))
                }
                className="bg-slate-800 border-slate-600 text-white mt-1"
                placeholder="Ad veya şirket adı"
              />
            </div>
            <div>
              <Label className="text-slate-300">Proje</Label>
              <Select
                value={form.projeId ?? "none"}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, projeId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="none">— Proje Yok —</SelectItem>
                  {projeler.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Termin Tarihi</Label>
              <Input
                type="date"
                value={form.terminTarihi ?? ""}
                onChange={(ev) =>
                  setForm((p) => ({ ...p, terminTarihi: ev.target.value }))
                }
                className="bg-slate-800 border-slate-600 text-white mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-slate-300">Notlar</Label>
              <Textarea
                value={form.notlar ?? ""}
                onChange={(ev) =>
                  setForm((p) => ({ ...p, notlar: ev.target.value }))
                }
                className="bg-slate-800 border-slate-600 text-white mt-1 resize-none"
                rows={2}
                placeholder="Ek notlar..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white"
              onClick={() => setModalOpen(false)}
              data-ocid="isemri.cancel_button"
            >
              İptal
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={handleSave}
              data-ocid="isemri.submit_button"
            >
              {editing ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
