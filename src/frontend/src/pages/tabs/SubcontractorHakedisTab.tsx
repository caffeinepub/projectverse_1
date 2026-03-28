import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Plus,
  ReceiptText,
} from "lucide-react";
import { useMemo, useState } from "react";

interface Subcontractor {
  id: string;
  name: string;
}

interface SubHakedis {
  id: string;
  subcontractorId: string;
  subcontractorName: string;
  proje: string;
  donem: string; // "YYYY-MM"
  sozlesmeBedeli: number;
  imalatYuzdesi: number;
  brutHakedis: number;
  avansKesinti: number;
  teminatKesinti: number;
  vergiKesinti: number;
  netOdenecek: number;
  durum: "Taslak" | "İncelemede" | "Onaylandı" | "Ödendi";
  notlar: string;
  olusturmaTarihi: string;
}

const DURUM_COLORS: Record<string, string> = {
  Taslak: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  İncelemede: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Onaylandı: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Ödendi: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const DURUM_NEXT: Record<string, SubHakedis["durum"] | null> = {
  Taslak: "İncelemede",
  İncelemede: "Onaylandı",
  Onaylandı: "Ödendi",
  Ödendi: null,
};

const DURUM_NEXT_LABEL: Record<string, string> = {
  Taslak: "İnceleye Al",
  İncelemede: "Onayla",
  Onaylandı: "Ödenmiş İşaretle",
};

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

interface Props {
  companyId: string;
  subcontractors: Subcontractor[];
}

export default function SubcontractorHakedisTab({
  companyId,
  subcontractors,
}: Props) {
  const storageKey = `pv_sub_hakedis_${companyId}`;

  const [hakedisler, setHakedisler] = useState<SubHakedis[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const save = (data: SubHakedis[]) => {
    setHakedisler(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const [filterDurum, setFilterDurum] = useState("Tümü");
  const [filterSub, setFilterSub] = useState("Tümü");
  const [open, setOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

  const [form, setForm] = useState({
    subcontractorId: "",
    proje: "",
    donemYil: String(currentYear),
    donemAy: currentMonth,
    sozlesmeBedeli: "",
    imalatYuzdesi: "",
    brutHakedis: "",
    avansKesinti: "",
    teminatKesinti: "",
    vergiKesinti: "",
    notlar: "",
  });

  const netOdenecek = useMemo(() => {
    const brut = Number.parseFloat(form.brutHakedis) || 0;
    const avans = Number.parseFloat(form.avansKesinti) || 0;
    const teminat = Number.parseFloat(form.teminatKesinti) || 0;
    const vergi = Number.parseFloat(form.vergiKesinti) || 0;
    return brut - avans - teminat - vergi;
  }, [
    form.brutHakedis,
    form.avansKesinti,
    form.teminatKesinti,
    form.vergiKesinti,
  ]);

  const handleSubmit = () => {
    if (!form.subcontractorId || !form.proje || !form.brutHakedis) return;
    const sub = subcontractors.find((s) => s.id === form.subcontractorId);
    const hakedis: SubHakedis = {
      id: `hkd_${Date.now()}`,
      subcontractorId: form.subcontractorId,
      subcontractorName: sub?.name || "",
      proje: form.proje,
      donem: `${form.donemYil}-${form.donemAy}`,
      sozlesmeBedeli: Number.parseFloat(form.sozlesmeBedeli) || 0,
      imalatYuzdesi: Number.parseFloat(form.imalatYuzdesi) || 0,
      brutHakedis: Number.parseFloat(form.brutHakedis) || 0,
      avansKesinti: Number.parseFloat(form.avansKesinti) || 0,
      teminatKesinti: Number.parseFloat(form.teminatKesinti) || 0,
      vergiKesinti: Number.parseFloat(form.vergiKesinti) || 0,
      netOdenecek,
      durum: "Taslak",
      notlar: form.notlar,
      olusturmaTarihi: new Date().toISOString(),
    };
    save([hakedis, ...hakedisler]);
    setOpen(false);
    setForm({
      subcontractorId: "",
      proje: "",
      donemYil: String(currentYear),
      donemAy: currentMonth,
      sozlesmeBedeli: "",
      imalatYuzdesi: "",
      brutHakedis: "",
      avansKesinti: "",
      teminatKesinti: "",
      vergiKesinti: "",
      notlar: "",
    });
  };

  const advanceDurum = (id: string) => {
    const updated = hakedisler.map((h) => {
      if (h.id !== id) return h;
      const next = DURUM_NEXT[h.durum];
      if (!next) return h;
      return { ...h, durum: next };
    });
    save(updated);
  };

  const filtered = useMemo(() => {
    return hakedisler.filter((h) => {
      if (filterDurum !== "Tümü" && h.durum !== filterDurum) return false;
      if (filterSub !== "Tümü" && h.subcontractorId !== filterSub) return false;
      return true;
    });
  }, [hakedisler, filterDurum, filterSub]);

  const stats = useMemo(() => {
    const toplam = hakedisler.length;
    const odendi = hakedisler.filter((h) => h.durum === "Ödendi");
    const toplamOdenen = odendi.reduce((s, h) => s + h.netOdenecek, 0);
    const bekleyen = hakedisler.filter(
      (h) => h.durum === "İncelemede" || h.durum === "Onaylandı",
    ).length;
    return { toplam, toplamOdenen, bekleyen };
  }, [hakedisler]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  const donemLabel = (donem: string) => {
    const [y, m] = donem.split("-");
    return `${MONTHS[Number.parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15">
              <ReceiptText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Toplam Hakediş</p>
              <p className="text-xl font-bold text-amber-400">{stats.toplam}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Toplam Ödenen</p>
              <p className="text-xl font-bold text-emerald-400">
                {fmt(stats.toplamOdenen)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/15">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Onay Bekleyen</p>
              <p className="text-xl font-bold text-blue-400">
                {stats.bekleyen}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterDurum} onValueChange={setFilterDurum}>
          <SelectTrigger
            className="w-40"
            data-ocid="subcontractor.hakedis.durum.select"
          >
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            {["Tümü", "Taslak", "İncelemede", "Onaylandı", "Ödendi"].map(
              (d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <Select value={filterSub} onValueChange={setFilterSub}>
          <SelectTrigger
            className="w-48"
            data-ocid="subcontractor.hakedis.sub.select"
          >
            <SelectValue placeholder="Taşeron" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tümü">Tüm Taşeronlar</SelectItem>
            {subcontractors.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                data-ocid="subcontractor.hakedis.open_modal_button"
                disabled={subcontractors.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Hakediş
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Taşeron Hakedişi</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="sm:col-span-2">
                  <Label>Taşeron *</Label>
                  <Select
                    value={form.subcontractorId}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, subcontractorId: v }))
                    }
                  >
                    <SelectTrigger data-ocid="subcontractor.hakedis.sub_select">
                      <SelectValue placeholder="Taşeron seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcontractors.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Proje *</Label>
                  <Input
                    placeholder="Proje adı"
                    value={form.proje}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, proje: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.proje.input"
                  />
                </div>
                <div>
                  <Label>Hakediş Yılı</Label>
                  <Input
                    type="number"
                    placeholder="2025"
                    value={form.donemYil}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, donemYil: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.yil.input"
                  />
                </div>
                <div>
                  <Label>Hakediş Ayı</Label>
                  <Select
                    value={form.donemAy}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, donemAy: v }))
                    }
                  >
                    <SelectTrigger data-ocid="subcontractor.hakedis.ay.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem
                          key={m}
                          value={String(i + 1).padStart(2, "0")}
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sözleşme Bedeli (₺)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.sozlesmeBedeli}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sozlesmeBedeli: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.sozlesme.input"
                  />
                </div>
                <div>
                  <Label>İmalat Tamamlanma (%)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={form.imalatYuzdesi}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, imalatYuzdesi: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.yuzde.input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Brüt Hakediş Tutarı (₺) *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.brutHakedis}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, brutHakedis: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.brut.input"
                  />
                </div>
                <div>
                  <Label>Avans Kesintisi (₺)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.avansKesinti}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, avansKesinti: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.avans.input"
                  />
                </div>
                <div>
                  <Label>Teminat Kesintisi (₺)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.teminatKesinti}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, teminatKesinti: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.teminat.input"
                  />
                </div>
                <div>
                  <Label>Vergi Kesintisi (₺)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.vergiKesinti}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, vergiKesinti: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.vergi.input"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Net Ödenecek Tutar
                    </p>
                    <p className="text-lg font-bold text-amber-400">
                      {fmt(netOdenecek)}
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>Notlar</Label>
                  <Input
                    placeholder="Opsiyonel notlar..."
                    value={form.notlar}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notlar: e.target.value }))
                    }
                    data-ocid="subcontractor.hakedis.notlar.input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  data-ocid="subcontractor.hakedis.cancel_button"
                >
                  İptal
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  onClick={handleSubmit}
                  disabled={
                    !form.subcontractorId || !form.proje || !form.brutHakedis
                  }
                  data-ocid="subcontractor.hakedis.submit_button"
                >
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center space-y-3"
          data-ocid="subcontractor.hakedis.empty_state"
        >
          <div className="p-4 rounded-full bg-amber-500/10">
            <ReceiptText className="w-10 h-10 text-amber-400/60" />
          </div>
          <p className="text-lg font-semibold text-foreground/60">
            {hakedisler.length === 0
              ? "Henüz hakediş kaydı yok"
              : "Filtre sonucu bulunamadı"}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {hakedisler.length === 0
              ? "Taşeronlara ait hakediş kayıtlarını buraya ekleyin. Brüt tutar, kesintiler ve net ödeme otomatik hesaplanır."
              : "Farklı filtre seçenekleri deneyin."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h, idx) => (
            <Card
              key={h.id}
              className="bg-card border-border"
              data-ocid={`subcontractor.hakedis.item.${idx + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {h.subcontractorName}
                      </span>
                      <Badge
                        variant="outline"
                        className={DURUM_COLORS[h.durum]}
                      >
                        {h.durum}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {donemLabel(h.donem)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{h.proje}</p>
                    {h.notlar && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {h.notlar}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Brüt Hakediş
                      </p>
                      <p className="font-semibold text-sm">
                        {fmt(h.brutHakedis)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Toplam Kesinti
                      </p>
                      <p className="font-semibold text-sm text-rose-400">
                        -
                        {fmt(
                          h.avansKesinti + h.teminatKesinti + h.vergiKesinti,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Net Ödenecek
                      </p>
                      <p className="font-bold text-amber-400">
                        {fmt(h.netOdenecek)}
                      </p>
                    </div>
                  </div>

                  {DURUM_NEXT[h.durum] && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 shrink-0"
                      onClick={() => advanceDurum(h.id)}
                      data-ocid={`subcontractor.hakedis.advance_button.${idx + 1}`}
                    >
                      {DURUM_NEXT_LABEL[h.durum]}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>

                {/* Kesinti breakdown */}
                {(h.avansKesinti > 0 ||
                  h.teminatKesinti > 0 ||
                  h.vergiKesinti > 0) && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {h.avansKesinti > 0 && (
                      <span>
                        Avans Kesintisi:{" "}
                        <span className="text-foreground/70">
                          {fmt(h.avansKesinti)}
                        </span>
                      </span>
                    )}
                    {h.teminatKesinti > 0 && (
                      <span>
                        Teminat Kesintisi:{" "}
                        <span className="text-foreground/70">
                          {fmt(h.teminatKesinti)}
                        </span>
                      </span>
                    )}
                    {h.vergiKesinti > 0 && (
                      <span>
                        Vergi Kesintisi:{" "}
                        <span className="text-foreground/70">
                          {fmt(h.vergiKesinti)}
                        </span>
                      </span>
                    )}
                    {h.imalatYuzdesi > 0 && (
                      <span>
                        İmalat:{" "}
                        <span className="text-foreground/70">
                          %{h.imalatYuzdesi}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
