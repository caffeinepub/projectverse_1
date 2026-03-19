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
  Plus,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

type RiskLevel = "Düşük" | "Orta" | "Yüksek" | "Kritik";
type RiskStatus = "Açık" | "Azaltıldı" | "Kabul Edildi" | "Kapalı";

interface Risk {
  id: string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  score: number;
  level: RiskLevel;
  owner: string;
  status: RiskStatus;
  reviewDate: string;
  mitigationPlan: string;
  createdAt: string;
}

const CATEGORIES = [
  "Teknik",
  "Finansal",
  "Takvim",
  "İş Güvenliği",
  "Çevresel",
  "Taşeron",
  "Diğer",
];
const STATUSES: RiskStatus[] = ["Açık", "Azaltıldı", "Kabul Edildi", "Kapalı"];

const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 15) return "Kritik";
  if (score >= 10) return "Yüksek";
  if (score >= 5) return "Orta";
  return "Düşük";
};

const LEVEL_COLORS: Record<RiskLevel, string> = {
  Düşük: "bg-green-500/20 text-green-400 border-green-500/30",
  Orta: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Yüksek: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Kritik: "bg-red-500/20 text-red-400 border-red-500/30",
};

const _STATUS_COLORS: Record<RiskStatus, string> = {
  Açık: "bg-red-500/20 text-red-400",
  Azaltıldı: "bg-blue-500/20 text-blue-400",
  "Kabul Edildi": "bg-yellow-500/20 text-yellow-400",
  Kapalı: "bg-green-500/20 text-green-400",
};

const CAT_COLORS: Record<string, string> = {
  Teknik: "bg-blue-500/20 text-blue-400",
  Finansal: "bg-green-500/20 text-green-400",
  Takvim: "bg-amber-500/20 text-amber-400",
  "İş Güvenliği": "bg-red-500/20 text-red-400",
  Çevresel: "bg-emerald-500/20 text-emerald-400",
  Taşeron: "bg-purple-500/20 text-purple-400",
  Diğer: "bg-muted text-muted-foreground",
};

// 5x5 matrix cell color based on score
const getMatrixColor = (p: number, i: number) => {
  const score = p * i;
  if (score >= 15) return "bg-red-600";
  if (score >= 10) return "bg-orange-500";
  if (score >= 5) return "bg-yellow-500";
  return "bg-green-600";
};

export default function RiskRegister() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "default";
  const storageKey = `pv_risks_${companyId}`;

  const [risks, setRisks] = useState<Risk[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Teknik",
    probability: 1,
    impact: 1,
    owner: "",
    status: "Açık" as RiskStatus,
    reviewDate: "",
    mitigationPlan: "",
  });

  const save = (updated: Risk[]) => {
    setRisks(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.title) {
      toast.error("Risk başlığı zorunludur");
      return;
    }
    const score = form.probability * form.impact;
    const risk: Risk = {
      id: Date.now().toString(),
      ...form,
      score,
      level: getRiskLevel(score),
      createdAt: new Date().toISOString(),
    };
    save([risk, ...risks]);
    toast.success("Risk eklendi");
    setOpenNew(false);
    setForm({
      title: "",
      category: "Teknik",
      probability: 1,
      impact: 1,
      owner: "",
      status: "Açık",
      reviewDate: "",
      mitigationPlan: "",
    });
  };

  const updateStatus = (id: string, status: RiskStatus) => {
    save(risks.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const kpis = {
    total: risks.length,
    open: risks.filter((r) => r.status === "Açık").length,
    high: risks.filter((r) => r.score >= 12).length,
    mitigated: risks.filter(
      (r) => r.status === "Azaltıldı" || r.status === "Kapalı",
    ).length,
  };

  const score = form.probability * form.impact;
  const previewLevel = getRiskLevel(score);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Kaydı</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proje risk yönetimi ve takibi
          </p>
        </div>
        <Button
          data-ocid="riskregister.open_modal_button"
          onClick={() => setOpenNew(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Risk
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Risk",
            value: kpis.total,
            icon: <AlertTriangle className="w-5 h-5" />,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Açık Risk",
            value: kpis.open,
            icon: <TrendingUp className="w-5 h-5" />,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
          {
            label: "Yüksek Risk",
            value: kpis.high,
            icon: <AlertTriangle className="w-5 h-5" />,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
          },
          {
            label: "Azaltıldı",
            value: kpis.mitigated,
            icon: <TrendingDown className="w-5 h-5" />,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
        ].map((k) => (
          <Card key={k.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg} ${k.color}`}>
                {k.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Matrix */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Risk Matrisi (Olasılık × Etki)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5" />
              {[5, 4, 3, 2, 1].map((p) => (
                <div
                  key={p}
                  className="h-8 flex items-center text-xs text-muted-foreground pr-1 font-medium"
                >
                  {p}
                </div>
              ))}
              <div className="text-xs text-muted-foreground mt-1 -rotate-0">
                Olasılık
              </div>
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-5 flex items-center justify-center text-xs text-muted-foreground font-medium"
                  >
                    {i}
                  </div>
                ))}
              </div>
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="flex gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const cellRisks = risks.filter(
                      (r) => r.probability === p && r.impact === impact,
                    );
                    return (
                      <div
                        key={impact}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs text-white font-bold ${getMatrixColor(p, impact)} opacity-80`}
                        title={`P:${p} × E:${impact} = ${p * impact}`}
                      >
                        {cellRisks.length > 0 ? cellRisks.length : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="text-xs text-muted-foreground mt-1 text-center">
                Etki
              </div>
            </div>
            <div className="ml-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-600" />
                <span className="text-xs text-muted-foreground">
                  Kritik (≥15)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-xs text-muted-foreground">
                  Yüksek (10-14)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span className="text-xs text-muted-foreground">
                  Orta (5-9)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-600" />
                <span className="text-xs text-muted-foreground">
                  Düşük (1-4)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {risks.length === 0 ? (
        <div
          data-ocid="riskregister.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="text-6xl mb-4">🛡️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Risk kaydı boş
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Projeyi etkileyen riskleri kaydedin ve takip edin
          </p>
          <Button
            onClick={() => setOpenNew(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Risk Ekle
          </Button>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Başlık</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">E</TableHead>
                <TableHead className="text-center">Skor</TableHead>
                <TableHead>Seviye</TableHead>
                <TableHead>Sorumlu</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map((r, i) => (
                <TableRow
                  key={r.id}
                  className="border-border hover:bg-muted/30"
                  data-ocid={`riskregister.item.${i + 1}`}
                >
                  <TableCell className="text-sm text-foreground font-medium">
                    {r.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border-0 ${CAT_COLORS[r.category] ?? "bg-muted"}`}
                    >
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {r.probability}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {r.impact}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-amber-400">{r.score}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${LEVEL_COLORS[r.level]}`}
                    >
                      {r.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.owner}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.reviewDate}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) => updateStatus(r.id, v as RiskStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="riskregister.dialog"
        >
          <DialogHeader>
            <DialogTitle>Yeni Risk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            <div>
              <Label>Başlık *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Risk başlığı"
                data-ocid="riskregister.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durum</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as RiskStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Olasılık (1-5)</Label>
                <Select
                  value={String(form.probability)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, probability: Number(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Etki (1-5)</Label>
                <Select
                  value={String(form.impact)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, impact: Number(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded border border-border bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Skor: <strong className="text-amber-400">{score}</strong>
              </span>
              <Badge className={`text-xs border ${LEVEL_COLORS[previewLevel]}`}>
                {previewLevel}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sorumlu</Label>
                <Input
                  value={form.owner}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner: e.target.value }))
                  }
                  data-ocid="riskregister.input"
                />
              </div>
              <div>
                <Label>İnceleme Tarihi</Label>
                <Input
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reviewDate: e.target.value }))
                  }
                  data-ocid="riskregister.input"
                />
              </div>
            </div>
            <div>
              <Label>Azaltma Planı</Label>
              <Textarea
                rows={3}
                value={form.mitigationPlan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mitigationPlan: e.target.value }))
                }
                placeholder="Riskin azaltılması için alınacak aksiyonlar"
                data-ocid="riskregister.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenNew(false)}
              data-ocid="riskregister.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="riskregister.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
