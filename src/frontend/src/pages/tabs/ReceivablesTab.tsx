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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Banknote,
  Clock,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Receivable {
  id: string;
  musteriAdi: string;
  faturaNo: string;
  proje?: string;
  tutar: number;
  vadeTarihi: string;
  durum: "Bekliyor" | "Kısmi Tahsilat" | "Tahsil Edildi" | "Gecikmiş";
  notlar?: string;
  createdAt: string;
}

interface Collection {
  id: string;
  alacakId: string;
  tahsilatTarihi: string;
  tahsilatTutari: number;
  odemeyontemi: "Banka Havalesi" | "Çek" | "Nakit" | "Kredi Kartı";
  referansNo?: string;
  notlar?: string;
  createdAt: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function getAgingBucket(
  vadeTarihi: string,
): "0-30" | "31-60" | "61-90" | "90+" {
  const today = new Date();
  const due = new Date(vadeTarihi);
  const diff = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "0-30";
  if (diff <= 30) return "0-30";
  if (diff <= 60) return "31-60";
  if (diff <= 90) return "61-90";
  return "90+";
}

function isOverdue(vadeTarihi: string): boolean {
  return new Date(vadeTarihi) < new Date();
}

function statusBadge(durum: Receivable["durum"]) {
  const map: Record<Receivable["durum"], { label: string; className: string }> =
    {
      Bekliyor: {
        label: "Bekliyor",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      },
      "Kısmi Tahsilat": {
        label: "Kısmi Tahsilat",
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
      "Tahsil Edildi": {
        label: "Tahsil Edildi",
        className: "bg-green-500/20 text-green-400 border-green-500/30",
      },
      Gecikmiş: {
        label: "Gecikmiş",
        className: "bg-red-500/20 text-red-400 border-red-500/30",
      },
    };
  const s = map[durum];
  return <Badge className={`${s.className} border text-xs`}>{s.label}</Badge>;
}

const emptyReceivable = {
  musteriAdi: "",
  faturaNo: "",
  proje: "",
  tutar: "",
  vadeTarihi: "",
  durum: "Bekliyor" as Receivable["durum"],
  notlar: "",
};

const emptyCollection = {
  alacakId: "",
  tahsilatTarihi: "",
  tahsilatTutari: "",
  odemeyontemi: "Banka Havalesi" as Collection["odemeyontemi"],
  referansNo: "",
  notlar: "",
};

export default function ReceivablesTab({ companyId }: { companyId: string }) {
  const [view, setView] = useState<"alacaklar" | "tahsilatlar">("alacaklar");
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [rForm, setRForm] = useState({ ...emptyReceivable });
  const [cForm, setCForm] = useState({ ...emptyCollection });
  const [rOpen, setROpen] = useState(false);
  const [cOpen, setCOpen] = useState(false);

  const rKey = `receivables_${companyId}`;
  const cKey = `collections_${companyId}`;

  useEffect(() => {
    const r = localStorage.getItem(rKey);
    const c = localStorage.getItem(cKey);
    if (r) setReceivables(JSON.parse(r));
    if (c) setCollections(JSON.parse(c));
  }, [rKey, cKey]);

  function saveReceivables(data: Receivable[]) {
    setReceivables(data);
    localStorage.setItem(rKey, JSON.stringify(data));
  }

  function saveCollections(data: Collection[]) {
    setCollections(data);
    localStorage.setItem(cKey, JSON.stringify(data));
  }

  // Auto-mark overdue
  const processedReceivables = receivables.map((r) => {
    if (
      r.durum !== "Tahsil Edildi" &&
      isOverdue(r.vadeTarihi) &&
      r.durum !== "Kısmi Tahsilat"
    ) {
      return { ...r, durum: "Gecikmiş" as const };
    }
    return r;
  });

  // Aging analysis
  const pending = processedReceivables.filter(
    (r) => r.durum !== "Tahsil Edildi",
  );
  const totalAlacak = pending.reduce((s, r) => s + r.tutar, 0);
  const aging030 = pending
    .filter((r) => getAgingBucket(r.vadeTarihi) === "0-30")
    .reduce((s, r) => s + r.tutar, 0);
  const aging3160 = pending
    .filter((r) => getAgingBucket(r.vadeTarihi) === "31-60")
    .reduce((s, r) => s + r.tutar, 0);
  const aging6190 = pending
    .filter((r) => getAgingBucket(r.vadeTarihi) === "61-90")
    .reduce((s, r) => s + r.tutar, 0);
  const aging90plus = pending
    .filter((r) => getAgingBucket(r.vadeTarihi) === "90+")
    .reduce((s, r) => s + r.tutar, 0);

  function addReceivable() {
    if (
      !rForm.musteriAdi ||
      !rForm.faturaNo ||
      !rForm.tutar ||
      !rForm.vadeTarihi
    )
      return;
    const newR: Receivable = {
      id: Date.now().toString(),
      musteriAdi: rForm.musteriAdi,
      faturaNo: rForm.faturaNo,
      proje: rForm.proje || undefined,
      tutar: Number(rForm.tutar),
      vadeTarihi: rForm.vadeTarihi,
      durum: rForm.durum,
      notlar: rForm.notlar || undefined,
      createdAt: new Date().toISOString(),
    };
    saveReceivables([...receivables, newR]);
    setRForm({ ...emptyReceivable });
    setROpen(false);
  }

  function addCollection() {
    if (!cForm.alacakId || !cForm.tahsilatTarihi || !cForm.tahsilatTutari)
      return;
    const newC: Collection = {
      id: Date.now().toString(),
      alacakId: cForm.alacakId,
      tahsilatTarihi: cForm.tahsilatTarihi,
      tahsilatTutari: Number(cForm.tahsilatTutari),
      odemeyontemi: cForm.odemeyontemi,
      referansNo: cForm.referansNo || undefined,
      notlar: cForm.notlar || undefined,
      createdAt: new Date().toISOString(),
    };
    saveCollections([...collections, newC]);
    // Update receivable status
    const alacak = receivables.find((r) => r.id === cForm.alacakId);
    if (alacak) {
      const totalCollected =
        collections
          .filter((c) => c.alacakId === cForm.alacakId)
          .reduce((s, c) => s + c.tahsilatTutari, 0) +
        Number(cForm.tahsilatTutari);
      const newStatus: Receivable["durum"] =
        totalCollected >= alacak.tutar ? "Tahsil Edildi" : "Kısmi Tahsilat";
      saveReceivables(
        receivables.map((r) =>
          r.id === cForm.alacakId ? { ...r, durum: newStatus } : r,
        ),
      );
    }
    setCForm({ ...emptyCollection });
    setCOpen(false);
  }

  function deleteReceivable(id: string) {
    saveReceivables(receivables.filter((r) => r.id !== id));
    saveCollections(collections.filter((c) => c.alacakId !== id));
  }

  function deleteCollection(id: string) {
    saveCollections(collections.filter((c) => c.id !== id));
  }

  const alacakMap = Object.fromEntries(receivables.map((r) => [r.id, r]));

  return (
    <div className="space-y-5">
      {/* Aging KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-slate-400">Toplam Alacak</span>
            </div>
            <p className="text-lg font-bold text-amber-400">
              {fmt(totalAlacak)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-400">0-30 Gün</span>
            </div>
            <p className="text-lg font-bold text-green-400">{fmt(aging030)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-slate-400">31-60 Gün</span>
            </div>
            <p className="text-lg font-bold text-yellow-400">
              {fmt(aging3160)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-slate-400">61-90 Gün</span>
            </div>
            <p className="text-lg font-bold text-orange-400">
              {fmt(aging6190)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-slate-400">90+ Gün</span>
            </div>
            <p className="text-lg font-bold text-red-400">{fmt(aging90plus)}</p>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          data-ocid="receivables.alacaklar.tab"
          variant={view === "alacaklar" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("alacaklar")}
          className={
            view === "alacaklar"
              ? "gradient-bg text-white"
              : "border-slate-700 text-slate-300"
          }
        >
          <Receipt className="h-4 w-4 mr-1" />
          Alacaklar ({processedReceivables.length})
        </Button>
        <Button
          data-ocid="receivables.tahsilatlar.tab"
          variant={view === "tahsilatlar" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("tahsilatlar")}
          className={
            view === "tahsilatlar"
              ? "gradient-bg text-white"
              : "border-slate-700 text-slate-300"
          }
        >
          <Banknote className="h-4 w-4 mr-1" />
          Tahsilat Kayıtları ({collections.length})
        </Button>
      </div>

      {/* ALACAKLAR VIEW */}
      {view === "alacaklar" && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-base">
              Alacak Listesi
            </CardTitle>
            <Dialog open={rOpen} onOpenChange={setROpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="receivables.alacak.open_modal_button"
                  size="sm"
                  className="gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-1" /> Alacak Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Yeni Alacak Kaydı</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Müşteri / Borçlu *
                      </Label>
                      <Input
                        data-ocid="receivables.musteri.input"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={rForm.musteriAdi}
                        onChange={(e) =>
                          setRForm((f) => ({
                            ...f,
                            musteriAdi: e.target.value,
                          }))
                        }
                        placeholder="Müşteri adı"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Fatura No *
                      </Label>
                      <Input
                        data-ocid="receivables.faturano.input"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={rForm.faturaNo}
                        onChange={(e) =>
                          setRForm((f) => ({ ...f, faturaNo: e.target.value }))
                        }
                        placeholder="FTR-001"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs">Proje</Label>
                      <Input
                        data-ocid="receivables.proje.input"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={rForm.proje}
                        onChange={(e) =>
                          setRForm((f) => ({ ...f, proje: e.target.value }))
                        }
                        placeholder="Proje adı (opsiyonel)"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Tutar (TL) *
                      </Label>
                      <Input
                        data-ocid="receivables.tutar.input"
                        type="number"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={rForm.tutar}
                        onChange={(e) =>
                          setRForm((f) => ({ ...f, tutar: e.target.value }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Vade Tarihi *
                      </Label>
                      <Input
                        data-ocid="receivables.vade.input"
                        type="date"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={rForm.vadeTarihi}
                        onChange={(e) =>
                          setRForm((f) => ({
                            ...f,
                            vadeTarihi: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Durum</Label>
                      <Select
                        value={rForm.durum}
                        onValueChange={(v) =>
                          setRForm((f) => ({
                            ...f,
                            durum: v as Receivable["durum"],
                          }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="receivables.durum.select"
                          className="bg-slate-800 border-slate-600 text-white mt-1"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                          <SelectItem value="Kısmi Tahsilat">
                            Kısmi Tahsilat
                          </SelectItem>
                          <SelectItem value="Tahsil Edildi">
                            Tahsil Edildi
                          </SelectItem>
                          <SelectItem value="Gecikmiş">Gecikmiş</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Notlar</Label>
                    <Textarea
                      data-ocid="receivables.notlar.textarea"
                      className="bg-slate-800 border-slate-600 text-white mt-1 resize-none"
                      rows={2}
                      value={rForm.notlar}
                      onChange={(e) =>
                        setRForm((f) => ({ ...f, notlar: e.target.value }))
                      }
                      placeholder="Opsiyonel not"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => setROpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="receivables.alacak.submit_button"
                    className="gradient-bg text-white"
                    onClick={addReceivable}
                  >
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {processedReceivables.length === 0 ? (
              <div
                data-ocid="receivables.alacaklar.empty_state"
                className="text-center py-10 text-slate-500"
              >
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Henüz alacak kaydı yok</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Müşteri</TableHead>
                    <TableHead className="text-slate-400">Fatura No</TableHead>
                    <TableHead className="text-slate-400">Proje</TableHead>
                    <TableHead className="text-slate-400 text-right">
                      Tutar
                    </TableHead>
                    <TableHead className="text-slate-400">Vade</TableHead>
                    <TableHead className="text-slate-400">Durum</TableHead>
                    <TableHead className="text-slate-400" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedReceivables.map((r, i) => (
                    <TableRow
                      key={r.id}
                      data-ocid={`receivables.alacak.item.${i + 1}`}
                      className="border-slate-700 hover:bg-slate-700/30"
                    >
                      <TableCell className="text-white font-medium">
                        {r.musteriAdi}
                      </TableCell>
                      <TableCell className="text-slate-300 font-mono text-xs">
                        {r.faturaNo}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {r.proje || "-"}
                      </TableCell>
                      <TableCell className="text-amber-400 font-semibold text-right">
                        {fmt(r.tutar)}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {new Date(r.vadeTarihi).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>{statusBadge(r.durum)}</TableCell>
                      <TableCell>
                        <Button
                          data-ocid={`receivables.alacak.delete_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-red-400"
                          onClick={() => deleteReceivable(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAHSILATLAR VIEW */}
      {view === "tahsilatlar" && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-base">
              Tahsilat Kayıtları
            </CardTitle>
            <Dialog open={cOpen} onOpenChange={setCOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="receivables.tahsilat.open_modal_button"
                  size="sm"
                  className="gradient-bg text-white"
                  disabled={receivables.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" /> Tahsilat Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Tahsilat Kaydı</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-xs">
                      İlgili Alacak *
                    </Label>
                    <Select
                      value={cForm.alacakId}
                      onValueChange={(v) =>
                        setCForm((f) => ({ ...f, alacakId: v }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="receivables.ilgili_alacak.select"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                      >
                        <SelectValue placeholder="Alacak seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {receivables
                          .filter((r) => r.durum !== "Tahsil Edildi")
                          .map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.musteriAdi} - {r.faturaNo} ({fmt(r.tutar)})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Tahsilat Tarihi *
                      </Label>
                      <Input
                        data-ocid="receivables.tahsilat_tarihi.input"
                        type="date"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={cForm.tahsilatTarihi}
                        onChange={(e) =>
                          setCForm((f) => ({
                            ...f,
                            tahsilatTarihi: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Tutar (TL) *
                      </Label>
                      <Input
                        data-ocid="receivables.tahsilat_tutar.input"
                        type="number"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={cForm.tahsilatTutari}
                        onChange={(e) =>
                          setCForm((f) => ({
                            ...f,
                            tahsilatTutari: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Ödeme Yöntemi
                      </Label>
                      <Select
                        value={cForm.odemeyontemi}
                        onValueChange={(v) =>
                          setCForm((f) => ({
                            ...f,
                            odemeyontemi: v as Collection["odemeyontemi"],
                          }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="receivables.odeme_yontemi.select"
                          className="bg-slate-800 border-slate-600 text-white mt-1"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="Banka Havalesi">
                            Banka Havalesi
                          </SelectItem>
                          <SelectItem value="Çek">Çek</SelectItem>
                          <SelectItem value="Nakit">Nakit</SelectItem>
                          <SelectItem value="Kredi Kartı">
                            Kredi Kartı
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Referans No
                      </Label>
                      <Input
                        data-ocid="receivables.referans.input"
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                        value={cForm.referansNo}
                        onChange={(e) =>
                          setCForm((f) => ({
                            ...f,
                            referansNo: e.target.value,
                          }))
                        }
                        placeholder="TRF-001"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Notlar</Label>
                    <Textarea
                      data-ocid="receivables.tahsilat_notlar.textarea"
                      className="bg-slate-800 border-slate-600 text-white mt-1 resize-none"
                      rows={2}
                      value={cForm.notlar}
                      onChange={(e) =>
                        setCForm((f) => ({ ...f, notlar: e.target.value }))
                      }
                      placeholder="Opsiyonel not"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => setCOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="receivables.tahsilat.submit_button"
                    className="gradient-bg text-white"
                    onClick={addCollection}
                  >
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {collections.length === 0 ? (
              <div
                data-ocid="receivables.tahsilatlar.empty_state"
                className="text-center py-10 text-slate-500"
              >
                <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Henüz tahsilat kaydı yok</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Alacak</TableHead>
                    <TableHead className="text-slate-400">Tarih</TableHead>
                    <TableHead className="text-slate-400 text-right">
                      Tutar
                    </TableHead>
                    <TableHead className="text-slate-400">Yöntem</TableHead>
                    <TableHead className="text-slate-400">Referans</TableHead>
                    <TableHead className="text-slate-400" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((c, i) => {
                    const alacak = alacakMap[c.alacakId];
                    return (
                      <TableRow
                        key={c.id}
                        data-ocid={`receivables.tahsilat.item.${i + 1}`}
                        className="border-slate-700 hover:bg-slate-700/30"
                      >
                        <TableCell className="text-white text-sm">
                          {alacak
                            ? `${alacak.musteriAdi} / ${alacak.faturaNo}`
                            : "Silinmiş alacak"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {new Date(c.tahsilatTarihi).toLocaleDateString(
                            "tr-TR",
                          )}
                        </TableCell>
                        <TableCell className="text-green-400 font-semibold text-right">
                          {fmt(c.tahsilatTutari)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                            {c.odemeyontemi}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs font-mono">
                          {c.referansNo || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            data-ocid={`receivables.tahsilat.delete_button.${i + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-red-400"
                            onClick={() => deleteCollection(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
