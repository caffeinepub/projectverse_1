import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SubcontractorBasic {
  id: string;
  name: string;
}

interface Prequalification {
  id: string;
  subcontractorId: string;
  subcontractorName: string;
  technicalScore: number;
  financialScore: number;
  hseScore: number;
  totalScore: number;
  referenceProjects: string;
  documents: {
    vergiLevhasi: boolean;
    sgkBorcu: boolean;
    imzaSirkuleri: boolean;
    kapasiteRaporu: boolean;
    isgBelgesi: boolean;
  };
  decision: "Beklemede" | "Onaylandı" | "Reddedildi" | "Değerlendiriliyor";
  notes: string;
  date: string;
}

const defaultDocs = {
  vergiLevhasi: false,
  sgkBorcu: false,
  imzaSirkuleri: false,
  kapasiteRaporu: false,
  isgBelgesi: false,
};

const statusColors: Record<string, string> = {
  Onaylandı: "bg-green-500/20 text-green-300 border-green-500/30",
  Reddedildi: "bg-red-500/20 text-red-300 border-red-500/30",
  Değerlendiriliyor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Beklemede: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export default function PrequalificationTab({
  companyId,
  subcontractors,
}: {
  companyId: string;
  subcontractors: SubcontractorBasic[];
}) {
  const storageKey = `prequalifications_${companyId}`;

  const [items, setItems] = useState<Prequalification[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subcontractorId: "",
    technicalScore: 5,
    financialScore: 5,
    hseScore: 5,
    referenceProjects: "",
    documents: { ...defaultDocs },
    decision: "Beklemede" as Prequalification["decision"],
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const totalScore = Math.round(
    (form.technicalScore + form.financialScore + form.hseScore) / 3,
  );

  function handleSubmit() {
    if (!form.subcontractorId) return;
    const sub = subcontractors.find((s) => s.id === form.subcontractorId);
    const newItem: Prequalification = {
      id: crypto.randomUUID(),
      subcontractorId: form.subcontractorId,
      subcontractorName: sub?.name || "",
      technicalScore: form.technicalScore,
      financialScore: form.financialScore,
      hseScore: form.hseScore,
      totalScore,
      referenceProjects: form.referenceProjects,
      documents: { ...form.documents },
      decision: form.decision,
      notes: form.notes,
      date: new Date().toLocaleDateString("tr-TR"),
    };
    setItems((prev) => [newItem, ...prev]);
    setOpen(false);
    setForm({
      subcontractorId: "",
      technicalScore: 5,
      financialScore: 5,
      hseScore: 5,
      referenceProjects: "",
      documents: { ...defaultDocs },
      decision: "Beklemede",
      notes: "",
    });
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Ön Yeterlilik Değerlendirmeleri
          </h3>
          <p className="text-sm text-zinc-400">
            Alt yüklenicilerin teknik, mali ve İSG yeterliliğini değerlendirin
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          data-ocid="subcontractor.prequalification.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ön Yeterlilik Başlat
        </Button>
      </div>

      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-zinc-500"
          data-ocid="subcontractor.prequalification.empty_state"
        >
          <ClipboardCheck className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Henüz ön yeterlilik kaydı yok</p>
          <p className="text-xs mt-1">
            Yeni bir değerlendirme başlatmak için yukarıdaki butonu kullanın
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-700">
          <table
            className="w-full text-sm"
            data-ocid="subcontractor.prequalification.table"
          >
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/60">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                  Firma Adı
                </th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium">
                  Teknik
                </th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium">
                  Mali
                </th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium">
                  İSG
                </th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium">
                  Toplam
                </th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium">
                  Durum
                </th>
                <th className="text-center px-4 py-3 text-zinc-400 font-medium">
                  Tarih
                </th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors"
                  data-ocid={`subcontractor.prequalification.item.${idx + 1}`}
                >
                  <td className="px-4 py-3 text-white font-medium">
                    {item.subcontractorName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        item.technicalScore >= 7
                          ? "text-green-400"
                          : item.technicalScore >= 4
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {item.technicalScore}/10
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        item.financialScore >= 7
                          ? "text-green-400"
                          : item.financialScore >= 4
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {item.financialScore}/10
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        item.hseScore >= 7
                          ? "text-green-400"
                          : item.hseScore >= 4
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {item.hseScore}/10
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-amber-400">
                      {item.totalScore}/10
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className={`text-xs border ${
                        statusColors[item.decision] ?? statusColors.Beklemede
                      }`}
                    >
                      {item.decision}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-400">
                    {item.date}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      data-ocid={`subcontractor.prequalification.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg bg-zinc-900 border-zinc-700 text-white max-h-[90vh] overflow-y-auto"
          data-ocid="subcontractor.prequalification.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              Ön Yeterlilik Değerlendirmesi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Firma */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Firma</Label>
              <Select
                value={form.subcontractorId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, subcontractorId: v }))
                }
              >
                <SelectTrigger
                  className="bg-zinc-800 border-zinc-600 text-white"
                  data-ocid="subcontractor.prequalification.select"
                >
                  <SelectValue placeholder="Taşeron seçin" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {subcontractors.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="text-white hover:bg-zinc-700"
                    >
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">
                  Teknik Kapasite (1-10)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.technicalScore}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      technicalScore: Math.min(
                        10,
                        Math.max(1, Number(e.target.value)),
                      ),
                    }))
                  }
                  className="bg-zinc-800 border-zinc-600 text-white"
                  data-ocid="subcontractor.prequalification.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">
                  Mali Yeterlilik (1-10)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.financialScore}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      financialScore: Math.min(
                        10,
                        Math.max(1, Number(e.target.value)),
                      ),
                    }))
                  }
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">
                  İSG Sicil (1-10)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.hseScore}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hseScore: Math.min(
                        10,
                        Math.max(1, Number(e.target.value)),
                      ),
                    }))
                  }
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>
            </div>

            {/* Auto total */}
            <div className="bg-zinc-800/60 rounded-lg px-4 py-2 flex items-center justify-between">
              <span className="text-zinc-400 text-sm">
                Toplam Skor (Ortalama)
              </span>
              <span className="text-amber-400 font-bold text-lg">
                {totalScore} / 10
              </span>
            </div>

            {/* Reference Projects */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Referans Projeler</Label>
              <Textarea
                value={form.referenceProjects}
                onChange={(e) =>
                  setForm((f) => ({ ...f, referenceProjects: e.target.value }))
                }
                placeholder="Tamamlanan referans projeleri listeleyin..."
                className="bg-zinc-800 border-zinc-600 text-white resize-none"
                rows={2}
                data-ocid="subcontractor.prequalification.textarea"
              />
            </div>

            {/* Documents checklist */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Gerekli Belgeler</Label>
              <div className="space-y-1.5 pl-1">
                {(
                  [
                    ["vergiLevhasi", "Vergi Levhası"],
                    ["sgkBorcu", "SGK Borcu Yoktur Belgesi"],
                    ["imzaSirkuleri", "İmza Sirküleri"],
                    ["kapasiteRaporu", "Kapasite Raporu"],
                    ["isgBelgesi", "İSG Belgesi"],
                  ] as [keyof typeof defaultDocs, string][]
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={form.documents[key]}
                      onCheckedChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          documents: { ...f.documents, [key]: Boolean(v) },
                        }))
                      }
                      className="border-zinc-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      data-ocid="subcontractor.prequalification.checkbox"
                    />
                    <label
                      htmlFor={key}
                      className="text-sm text-zinc-300 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Karar</Label>
              <Select
                value={form.decision}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    decision: v as Prequalification["decision"],
                  }))
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem
                    value="Beklemede"
                    className="text-white hover:bg-zinc-700"
                  >
                    Beklemede
                  </SelectItem>
                  <SelectItem
                    value="Değerlendiriliyor"
                    className="text-white hover:bg-zinc-700"
                  >
                    Değerlendiriliyor
                  </SelectItem>
                  <SelectItem
                    value="Onaylandı"
                    className="text-white hover:bg-zinc-700"
                  >
                    Onaylandı
                  </SelectItem>
                  <SelectItem
                    value="Reddedildi"
                    className="text-white hover:bg-zinc-700"
                  >
                    Reddedildi
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Notlar</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Değerlendirme notları..."
                className="bg-zinc-800 border-zinc-600 text-white resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-600 text-zinc-300"
              data-ocid="subcontractor.prequalification.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.subcontractorId}
              className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
              data-ocid="subcontractor.prequalification.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
