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
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

type DenetimDurum = "Taslak" | "Tamamlandı" | "Onaylandı";
type OnemDurum = "Kritik" | "Orta" | "Düşük";
type BulgDurum = "Açık" | "Kapalı";
type DenetimTur = "Genel Saha" | "İSG" | "Kalite" | "Çevre";

interface Bulgu {
  id: string;
  bulguNo: string;
  kategori: string;
  aciklama: string;
  onem: OnemDurum;
  durum: BulgDurum;
}

interface DenetimForm {
  id: string;
  formNo: string;
  proje: string;
  denetimTarihi: string;
  denetci: string;
  konum: string;
  denetimTuru: DenetimTur;
  durum: DenetimDurum;
  bulgular: Bulgu[];
  olusturmaTarihi: string;
}

const STORAGE_KEY = "sahaDenetimFormlari";

function useStorage(companyId: string | undefined) {
  const key = `${STORAGE_KEY}_${companyId}`;

  const load = (): DenetimForm[] => {
    if (!companyId) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const save = (forms: DenetimForm[]) => {
    if (!companyId) return;
    localStorage.setItem(key, JSON.stringify(forms));
  };

  return { load, save };
}

function generateId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function durumBadge(durum: DenetimDurum) {
  const map: Record<DenetimDurum, string> = {
    Taslak: "bg-zinc-700 text-zinc-300",
    Tamamlandı: "bg-amber-900/60 text-amber-300",
    Onaylandı: "bg-green-900/60 text-green-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[durum]}`}
    >
      {durum}
    </span>
  );
}

function onemBadge(onem: OnemDurum) {
  const map: Record<OnemDurum, string> = {
    Kritik: "bg-red-900/60 text-red-300",
    Orta: "bg-amber-900/60 text-amber-300",
    Düşük: "bg-blue-900/60 text-blue-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[onem]}`}
    >
      {onem}
    </span>
  );
}

export default function SahaDenetimFormu() {
  const { currentCompany } = useApp();
  const { load, save } = useStorage(currentCompany?.id);
  const [forms, setForms] = useState<DenetimForm[]>(load);
  const [selected, setSelected] = useState<DenetimForm | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showBulguForm, setShowBulguForm] = useState(false);

  const [newForm, setNewForm] = useState({
    proje: "",
    denetimTarihi: new Date().toISOString().slice(0, 10),
    denetci: "",
    konum: "",
    denetimTuru: "Genel Saha" as DenetimTur,
  });

  const [newBulgu, setNewBulgu] = useState({
    kategori: "",
    aciklama: "",
    onem: "Orta" as OnemDurum,
  });

  const update = (updated: DenetimForm[]) => {
    setForms(updated);
    save(updated);
  };

  const createForm = () => {
    if (!newForm.proje || !newForm.denetci || !newForm.konum) return;
    const count = forms.length + 1;
    const form: DenetimForm = {
      id: generateId(),
      formNo: `SDF-${String(count).padStart(4, "0")}`,
      proje: newForm.proje,
      denetimTarihi: newForm.denetimTarihi,
      denetci: newForm.denetci,
      konum: newForm.konum,
      denetimTuru: newForm.denetimTuru,
      durum: "Taslak",
      bulgular: [],
      olusturmaTarihi: new Date().toISOString(),
    };
    update([...forms, form]);
    setNewForm({
      proje: "",
      denetimTarihi: new Date().toISOString().slice(0, 10),
      denetci: "",
      konum: "",
      denetimTuru: "Genel Saha",
    });
    setShowNewForm(false);
  };

  const addBulgu = () => {
    if (!selected || !newBulgu.kategori || !newBulgu.aciklama) return;
    const bulguCount = selected.bulgular.length + 1;
    const bulgu: Bulgu = {
      id: generateId(),
      bulguNo: `B-${String(bulguCount).padStart(3, "0")}`,
      kategori: newBulgu.kategori,
      aciklama: newBulgu.aciklama,
      onem: newBulgu.onem,
      durum: "Açık",
    };
    const updatedForm = {
      ...selected,
      bulgular: [...selected.bulgular, bulgu],
    };
    const updatedForms = forms.map((f) =>
      f.id === selected.id ? updatedForm : f,
    );
    update(updatedForms);
    setSelected(updatedForm);
    setNewBulgu({ kategori: "", aciklama: "", onem: "Orta" });
    setShowBulguForm(false);
  };

  const toggleBulguDurum = (bulguId: string) => {
    if (!selected) return;
    const updatedBulgular = selected.bulgular.map((b) =>
      b.id === bulguId
        ? {
            ...b,
            durum:
              b.durum === "Açık"
                ? ("Kapalı" as BulgDurum)
                : ("Açık" as BulgDurum),
          }
        : b,
    );
    const updatedForm = { ...selected, bulgular: updatedBulgular };
    const updatedForms = forms.map((f) =>
      f.id === selected.id ? updatedForm : f,
    );
    update(updatedForms);
    setSelected(updatedForm);
  };

  const deleteBulgu = (bulguId: string) => {
    if (!selected) return;
    const updatedBulgular = selected.bulgular.filter((b) => b.id !== bulguId);
    const updatedForm = { ...selected, bulgular: updatedBulgular };
    const updatedForms = forms.map((f) =>
      f.id === selected.id ? updatedForm : f,
    );
    update(updatedForms);
    setSelected(updatedForm);
  };

  const changeFormDurum = (formId: string, durum: DenetimDurum) => {
    const updatedForms = forms.map((f) =>
      f.id === formId ? { ...f, durum } : f,
    );
    update(updatedForms);
    if (selected?.id === formId) setSelected({ ...selected, durum });
  };

  const deleteForm = (formId: string) => {
    const updatedForms = forms.filter((f) => f.id !== formId);
    update(updatedForms);
    if (selected?.id === formId) setSelected(null);
  };

  if (selected) {
    return (
      <div className="p-6 space-y-6" data-ocid="saha_denetim.panel">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(null)}
            className="text-zinc-400 hover:text-amber-400"
            data-ocid="saha_denetim.close_button"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Geri
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              {selected.formNo} — {selected.proje}
            </h1>
            <p className="text-zinc-400 text-sm">
              {selected.denetimTuru} · {selected.konum} ·{" "}
              {selected.denetimTarihi} · Denetçi: {selected.denetci}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {durumBadge(selected.durum)}
            {selected.durum === "Taslak" && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => changeFormDurum(selected.id, "Tamamlandı")}
                data-ocid="saha_denetim.primary_button"
              >
                Tamamla
              </Button>
            )}
            {selected.durum === "Tamamlandı" && (
              <Button
                size="sm"
                className="bg-green-700 hover:bg-green-800 text-white"
                onClick={() => changeFormDurum(selected.id, "Onaylandı")}
                data-ocid="saha_denetim.confirm_button"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Onayla
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-xs">Toplam Bulgu</p>
              <p className="text-2xl font-bold text-amber-400">
                {selected.bulgular.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-xs">Açık Bulgular</p>
              <p className="text-2xl font-bold text-red-400">
                {selected.bulgular.filter((b) => b.durum === "Açık").length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-xs">Kritik Bulgular</p>
              <p className="text-2xl font-bold text-orange-400">
                {selected.bulgular.filter((b) => b.onem === "Kritik").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bulgular */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-amber-400 text-base">
                Bulgular
              </CardTitle>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => setShowBulguForm(true)}
                data-ocid="saha_denetim.open_modal_button"
              >
                <PlusCircle className="w-4 h-4 mr-1" /> Bulgu Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selected.bulgular.length === 0 ? (
              <div
                className="text-center py-10 text-zinc-500"
                data-ocid="saha_denetim.empty_state"
              >
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz bulgu eklenmedi</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Bulgu No</TableHead>
                    <TableHead className="text-zinc-400">Kategori</TableHead>
                    <TableHead className="text-zinc-400">Açıklama</TableHead>
                    <TableHead className="text-zinc-400">Önem</TableHead>
                    <TableHead className="text-zinc-400">Durum</TableHead>
                    <TableHead className="text-zinc-400">Fotoğraf</TableHead>
                    <TableHead className="text-zinc-400" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.bulgular.map((b, idx) => (
                    <TableRow
                      key={b.id}
                      className="border-zinc-800"
                      data-ocid={`saha_denetim.item.${idx + 1}`}
                    >
                      <TableCell className="text-zinc-300 font-mono text-xs">
                        {b.bulguNo}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {b.kategori}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm max-w-xs">
                        {b.aciklama}
                      </TableCell>
                      <TableCell>{onemBadge(b.onem)}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleBulguDurum(b.id)}
                          className={`text-xs px-2 py-0.5 rounded cursor-pointer ${
                            b.durum === "Açık"
                              ? "bg-red-900/40 text-red-300 hover:bg-red-900/70"
                              : "bg-green-900/40 text-green-300 hover:bg-green-900/70"
                          }`}
                        >
                          {b.durum}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-zinc-500 hover:text-amber-400 transition-colors"
                          title="Fotoğraf ekle"
                          data-ocid={"saha_denetim.upload_button"}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => deleteBulgu(b.id)}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                          data-ocid={`saha_denetim.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Bulgu Dialog */}
        <Dialog open={showBulguForm} onOpenChange={setShowBulguForm}>
          <DialogContent
            className="bg-zinc-900 border-zinc-700 text-white"
            data-ocid="saha_denetim.dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-amber-400">Bulgu Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Kategori</Label>
                <Input
                  value={newBulgu.kategori}
                  onChange={(e) =>
                    setNewBulgu((p) => ({ ...p, kategori: e.target.value }))
                  }
                  placeholder="Örn: Güvenlik, Temizlik, Yapısal..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-ocid="saha_denetim.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Açıklama</Label>
                <Textarea
                  value={newBulgu.aciklama}
                  onChange={(e) =>
                    setNewBulgu((p) => ({ ...p, aciklama: e.target.value }))
                  }
                  placeholder="Bulgu açıklaması..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={3}
                  data-ocid="saha_denetim.textarea"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Önem Derecesi</Label>
                <Select
                  value={newBulgu.onem}
                  onValueChange={(v) =>
                    setNewBulgu((p) => ({ ...p, onem: v as OnemDurum }))
                  }
                >
                  <SelectTrigger
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-ocid="saha_denetim.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="Kritik">Kritik</SelectItem>
                    <SelectItem value="Orta">Orta</SelectItem>
                    <SelectItem value="Düşük">Düşük</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowBulguForm(false)}
                className="text-zinc-400"
                data-ocid="saha_denetim.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={addBulgu}
                disabled={!newBulgu.kategori || !newBulgu.aciklama}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                data-ocid="saha_denetim.submit_button"
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-ocid="saha_denetim.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            Saha Denetim Formları
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Fotoğraflı saha denetim ve bulgu takibi
          </p>
        </div>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => setShowNewForm(true)}
          data-ocid="saha_denetim.open_modal_button"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Yeni Form Oluştur
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            {
              label: "Toplam Form",
              value: forms.length,
              color: "text-amber-400",
            },
            {
              label: "Taslak",
              value: forms.filter((f) => f.durum === "Taslak").length,
              color: "text-zinc-400",
            },
            {
              label: "Tamamlandı",
              value: forms.filter((f) => f.durum === "Tamamlandı").length,
              color: "text-amber-300",
            },
            {
              label: "Onaylandı",
              value: forms.filter((f) => f.durum === "Onaylandı").length,
              color: "text-green-400",
            },
          ] as const
        ).map((s) => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-xs">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forms table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-400 text-base">
            Denetim Formları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div
              className="text-center py-16 text-zinc-500"
              data-ocid="saha_denetim.empty_state"
            >
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Henüz denetim formu oluşturulmadı</p>
              <p className="text-xs text-zinc-600 mt-1">
                Yeni form oluşturun ve bulguları kaydedin
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Form No</TableHead>
                  <TableHead className="text-zinc-400">Proje</TableHead>
                  <TableHead className="text-zinc-400">
                    Denetim Tarihi
                  </TableHead>
                  <TableHead className="text-zinc-400">Denetçi</TableHead>
                  <TableHead className="text-zinc-400">Konum</TableHead>
                  <TableHead className="text-zinc-400">Tür</TableHead>
                  <TableHead className="text-zinc-400">Durum</TableHead>
                  <TableHead className="text-zinc-400">Bulgular</TableHead>
                  <TableHead className="text-zinc-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((f, idx) => (
                  <TableRow
                    key={f.id}
                    className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
                    onClick={() => setSelected(f)}
                    data-ocid={`saha_denetim.item.${idx + 1}`}
                  >
                    <TableCell className="text-amber-400 font-mono text-sm">
                      {f.formNo}
                    </TableCell>
                    <TableCell className="text-zinc-200">{f.proje}</TableCell>
                    <TableCell className="text-zinc-300">
                      {f.denetimTarihi}
                    </TableCell>
                    <TableCell className="text-zinc-300">{f.denetci}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {f.konum}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {f.denetimTuru}
                    </TableCell>
                    <TableCell>{durumBadge(f.durum)}</TableCell>
                    <TableCell>
                      <span className="text-zinc-300 font-medium">
                        {f.bulgular.length}
                      </span>
                      {f.bulgular.filter(
                        (b) => b.onem === "Kritik" && b.durum === "Açık",
                      ).length > 0 && (
                        <span className="ml-2 text-xs text-red-400">
                          {
                            f.bulgular.filter(
                              (b) => b.onem === "Kritik" && b.durum === "Açık",
                            ).length
                          }{" "}
                          kritik
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteForm(f.id);
                        }}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        data-ocid={`saha_denetim.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Form Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent
          className="bg-zinc-900 border-zinc-700 text-white"
          data-ocid="saha_denetim.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              Yeni Denetim Formu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Proje</Label>
              <Input
                value={newForm.proje}
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, proje: e.target.value }))
                }
                placeholder="Proje adı"
                className="bg-zinc-800 border-zinc-700 text-white"
                data-ocid="saha_denetim.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Denetim Tarihi</Label>
                <Input
                  type="date"
                  value={newForm.denetimTarihi}
                  onChange={(e) =>
                    setNewForm((p) => ({ ...p, denetimTarihi: e.target.value }))
                  }
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Denetim Türü</Label>
                <Select
                  value={newForm.denetimTuru}
                  onValueChange={(v) =>
                    setNewForm((p) => ({ ...p, denetimTuru: v as DenetimTur }))
                  }
                >
                  <SelectTrigger
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-ocid="saha_denetim.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="Genel Saha">Genel Saha</SelectItem>
                    <SelectItem value="İSG">İSG</SelectItem>
                    <SelectItem value="Kalite">Kalite</SelectItem>
                    <SelectItem value="Çevre">Çevre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Denetçi Adı</Label>
              <Input
                value={newForm.denetci}
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, denetci: e.target.value }))
                }
                placeholder="Denetçinin adı soyadı"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Konum / Alan</Label>
              <Input
                value={newForm.konum}
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, konum: e.target.value }))
                }
                placeholder="Şantiye konumu veya alanı"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowNewForm(false)}
              className="text-zinc-400"
              data-ocid="saha_denetim.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={createForm}
              disabled={!newForm.proje || !newForm.denetci || !newForm.konum}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-ocid="saha_denetim.submit_button"
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
