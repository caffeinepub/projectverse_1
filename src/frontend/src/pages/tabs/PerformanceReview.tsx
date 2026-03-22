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
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Star,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Personnel {
  id: string;
  name: string;
  role?: string;
  department?: string;
}

interface ReviewCriteria {
  key: string;
  label: string;
  score: number;
}

interface PerformanceReviewRecord {
  id: string;
  personnelId: string;
  personnelName: string;
  period: string;
  year: number;
  criteria: ReviewCriteria[];
  overallNotes: string;
  developmentPlan: string;
  status: "Taslak" | "Tamamlandı";
  createdAt: string;
}

const CRITERIA_LABELS = [
  { key: "quality", label: "İş Kalitesi" },
  { key: "speed", label: "Çalışma Hızı" },
  { key: "teamwork", label: "Takım Çalışması" },
  { key: "communication", label: "İletişim" },
  { key: "safety", label: "Güvenlik Uyumu" },
];

const PERIODS = ["Q1", "Q2", "Q3", "Q4"];

function StarInput({
  score,
  onChange,
}: { score: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`text-lg transition-colors ${
            i <= score
              ? "text-amber-400"
              : "text-muted-foreground/30 hover:text-amber-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PerformanceReview({
  companyId,
  personnel,
}: {
  companyId: string;
  personnel: Personnel[];
}) {
  const storageKey = `pv_${companyId}_performanceReviews`;

  const load = (): PerformanceReviewRecord[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const [reviews, setReviews] = useState<PerformanceReviewRecord[]>(load);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPersonnel, setFilterPersonnel] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  const initCriteria = (): ReviewCriteria[] =>
    CRITERIA_LABELS.map((c) => ({ key: c.key, label: c.label, score: 3 }));

  const [form, setForm] = useState({
    personnelId: "",
    period: "Q1",
    year: new Date().getFullYear(),
    criteria: initCriteria(),
    overallNotes: "",
    developmentPlan: "",
    status: "Taslak" as "Taslak" | "Tamamlandı",
  });

  const save = (data: PerformanceReviewRecord[]) => {
    setReviews(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const handleCreate = () => {
    if (!form.personnelId) {
      toast.error("Personel seçiniz.");
      return;
    }
    const p = personnel.find((x) => x.id === form.personnelId);
    const record: PerformanceReviewRecord = {
      id: `pr_${Date.now()}`,
      personnelId: form.personnelId,
      personnelName: p?.name || "",
      period: form.period,
      year: form.year,
      criteria: form.criteria,
      overallNotes: form.overallNotes,
      developmentPlan: form.developmentPlan,
      status: form.status,
      createdAt: new Date().toISOString(),
    };
    save([record, ...reviews]);
    setForm({
      personnelId: "",
      period: "Q1",
      year: new Date().getFullYear(),
      criteria: initCriteria(),
      overallNotes: "",
      developmentPlan: "",
      status: "Taslak",
    });
    setOpen(false);
    toast.success("Performans değerlendirmesi kaydedildi.");
  };

  const updateCriteria = (key: string, score: number) => {
    setForm((f) => ({
      ...f,
      criteria: f.criteria.map((c) => (c.key === key ? { ...c, score } : c)),
    }));
  };

  const avgScore = (criteria: ReviewCriteria[]) =>
    criteria.length > 0
      ? (criteria.reduce((s, c) => s + c.score, 0) / criteria.length).toFixed(1)
      : "—";

  const personnelAverages = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const r of reviews) {
      if (!map[r.personnelId]) map[r.personnelId] = [];
      const avg =
        r.criteria.reduce((s, c) => s + c.score, 0) / r.criteria.length;
      map[r.personnelId].push(avg);
    }
    return Object.entries(map).map(([pid, scores]) => ({
      id: pid,
      name: reviews.find((r) => r.personnelId === pid)?.personnelName || pid,
      avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    }));
  }, [reviews]);

  const filtered = reviews.filter((r) => {
    if (filterPersonnel !== "all" && r.personnelId !== filterPersonnel)
      return false;
    if (filterPeriod !== "all" && r.period !== filterPeriod) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Performans Değerlendirme
          </h2>
          <p className="text-sm text-muted-foreground">
            Personel bazlı dönemsel değerlendirmeler
          </p>
        </div>
        <Button
          data-ocid="performance.open_modal_button"
          size="sm"
          onClick={() => setOpen(true)}
          className="gradient-bg text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Yeni Değerlendirme
        </Button>
      </div>

      {/* Personnel Averages */}
      {personnelAverages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {personnelAverages.map((p) => (
            <Card key={p.id} className="bg-card border-border">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground truncate">
                  {p.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-bold text-foreground">
                    {p.avg}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 5</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterPersonnel} onValueChange={setFilterPersonnel}>
          <SelectTrigger
            data-ocid="performance.personnel.select"
            className="w-44 bg-card border-border"
          >
            <SelectValue placeholder="Tüm Personel" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tüm Personel</SelectItem>
            {personnel.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger
            data-ocid="performance.period.select"
            className="w-32 bg-card border-border"
          >
            <SelectValue placeholder="Dönem" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tüm Dönemler</SelectItem>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div data-ocid="performance.empty_state" className="text-center py-14">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-amber-500/30" />
          <p className="text-muted-foreground">
            Henüz değerlendirme bulunmuyor.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            İlk değerlendirmeyi eklemek için "Yeni Değerlendirme" butonuna
            tıklayın.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, idx) => (
            <Card
              key={r.id}
              data-ocid={`performance.item.${idx + 1}`}
              className="bg-card border-border"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {r.personnelName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {r.period} {r.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-foreground">
                        {avgScore(r.criteria)}
                      </span>
                    </div>
                    <Badge
                      className={
                        r.status === "Tamamlandı"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30 border text-xs"
                      }
                    >
                      {r.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setExpandedId(expandedId === r.id ? null : r.id)
                      }
                    >
                      {expandedId === r.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedId === r.id && (
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {r.criteria.map((c) => (
                      <div
                        key={c.key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-muted-foreground">
                          {c.label}
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className={`text-sm ${i <= c.score ? "text-amber-400" : "text-muted-foreground/20"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {r.overallNotes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        Genel Notlar
                      </p>
                      <p className="text-sm text-foreground">
                        {r.overallNotes}
                      </p>
                    </div>
                  )}
                  {r.developmentPlan && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        Gelişim Planı
                      </p>
                      <p className="text-sm text-foreground">
                        {r.developmentPlan}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      onClick={() => save(reviews.filter((x) => x.id !== r.id))}
                      data-ocid={`performance.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Sil
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-ocid="performance.dialog"
          className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Yeni Performans Değerlendirmesi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Personel *</Label>
                <Select
                  value={form.personnelId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, personnelId: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="performance.input"
                    className="bg-background border-border mt-1"
                  >
                    <SelectValue placeholder="Personel seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {personnel.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dönem</Label>
                <Select
                  value={form.period}
                  onValueChange={(v) => setForm((f) => ({ ...f, period: v }))}
                >
                  <SelectTrigger className="bg-background border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PERIODS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Yıl</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: Number(e.target.value) }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Değerlendirme Kriterleri
              </Label>
              <div className="space-y-3 mt-2">
                {form.criteria.map((c) => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-foreground">{c.label}</span>
                    <StarInput
                      score={c.score}
                      onChange={(v) => updateCriteria(c.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Genel Notlar</Label>
              <Textarea
                data-ocid="performance.textarea"
                value={form.overallNotes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, overallNotes: e.target.value }))
                }
                placeholder="Değerlendirme notları..."
                rows={2}
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Gelişim Planı</Label>
              <Textarea
                value={form.developmentPlan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, developmentPlan: e.target.value }))
                }
                placeholder="Önerilen gelişim adımları..."
                rows={2}
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={form.status}
                onValueChange={(v: "Taslak" | "Tamamlandı") =>
                  setForm((f) => ({ ...f, status: v }))
                }
              >
                <SelectTrigger
                  data-ocid="performance.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Taslak">Taslak</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="performance.cancel_button"
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="performance.submit_button"
              onClick={handleCreate}
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
