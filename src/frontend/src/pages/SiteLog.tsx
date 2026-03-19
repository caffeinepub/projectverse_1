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
import { CalendarDays, ClipboardList, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

interface SiteLogEntry {
  id: string;
  projectId: string;
  date: string;
  weather: string;
  personnelCount: number;
  workSummary: string;
  issues: string;
  visitors: string;
  createdAt: string;
}

const WEATHER_OPTIONS = [
  { value: "Güneşli", label: "Güneşli ☀️" },
  { value: "Bulutlu", label: "Bulutlu ⛅" },
  { value: "Yağmurlu", label: "Yağmurlu 🌧️" },
  { value: "Karlı", label: "Karlı 🌨️" },
  { value: "Rüzgarlı", label: "Rüzgarlı 💨" },
];

const WEATHER_ICONS: Record<string, string> = {
  Güneşli: "☀️",
  Bulutlu: "⛅",
  Yağmurlu: "🌧️",
  Karlı: "🌨️",
  Rüzgarlı: "💨",
};

export default function SiteLog() {
  const { projects, currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "default";
  const storageKey = `pv_site_logs_${companyId}`;

  const [logs, setLogs] = useState<SiteLogEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const [filterProject, setFilterProject] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    date: new Date().toISOString().split("T")[0],
    weather: "Güneşli",
    personnelCount: 0,
    workSummary: "",
    issues: "",
    visitors: "",
  });

  const saveLogs = (updated: SiteLogEntry[]) => {
    setLogs(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.projectId || !form.date) {
      toast.error("Proje ve tarih zorunludur");
      return;
    }
    const entry: SiteLogEntry = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    };
    saveLogs([entry, ...logs]);
    toast.success("Günlük log eklendi");
    setOpen(false);
    setForm({
      projectId: "",
      date: new Date().toISOString().split("T")[0],
      weather: "Güneşli",
      personnelCount: 0,
      workSummary: "",
      issues: "",
      visitors: "",
    });
  };

  const now = new Date();
  const thisMonth = logs.filter((l) => {
    const d = new Date(l.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const openIssuesCount = logs.filter((l) => l.issues.trim().length > 0).length;
  const avgPersonnel = thisMonth.length
    ? Math.round(
        thisMonth.reduce((a, b) => a + b.personnelCount, 0) / thisMonth.length,
      )
    : 0;

  const filtered = logs.filter((l) => {
    if (filterProject !== "all" && l.projectId !== filterProject) return false;
    if (filterDateFrom && l.date < filterDateFrom) return false;
    if (filterDateTo && l.date > filterDateTo) return false;
    return true;
  });

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.title ?? id;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Şantiye Logu</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Günlük saha kayıtları ve durum takibi
          </p>
        </div>
        <Button
          data-ocid="sitelog.open_modal_button"
          onClick={() => setOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Günlük Log
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <ClipboardList className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bu Ay Log</p>
              <p className="text-2xl font-bold text-foreground">
                {thisMonth.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <CalendarDays className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Açık Sorun</p>
              <p className="text-2xl font-bold text-foreground">
                {openIssuesCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ort. Personel/Gün</p>
              <p className="text-2xl font-bold text-foreground">
                {avgPersonnel}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48" data-ocid="sitelog.select">
            <SelectValue placeholder="Tüm Projeler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Projeler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="w-40"
          placeholder="Başlangıç"
        />
        <Input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="w-40"
          placeholder="Bitiş"
        />
      </div>

      {/* Table or Empty State */}
      {filtered.length === 0 ? (
        <div
          data-ocid="sitelog.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="text-6xl mb-4 animate-bounce">📋</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Henüz log kaydı yok
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            İlk günlük şantiye logunu ekleyin
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Log Ekle
          </Button>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Tarih</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Hava</TableHead>
                <TableHead>Personel</TableHead>
                <TableHead>İş Özeti</TableHead>
                <TableHead>Sorun</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log, i) => (
                <TableRow
                  key={log.id}
                  className="border-border hover:bg-muted/30"
                  data-ocid={`sitelog.item.${i + 1}`}
                >
                  <TableCell className="text-sm text-foreground">
                    {log.date}
                  </TableCell>
                  <TableCell className="text-sm text-amber-400 font-medium">
                    {getProjectName(log.projectId)}
                  </TableCell>
                  <TableCell className="text-lg">
                    {WEATHER_ICONS[log.weather] ?? log.weather}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {log.personnelCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.workSummary}
                  </TableCell>
                  <TableCell>
                    {log.issues.trim().length > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        Sorun var
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Sorunsuz
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="sitelog.dialog"
        >
          <DialogHeader>
            <DialogTitle>Yeni Günlük Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Proje *</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
              >
                <SelectTrigger data-ocid="sitelog.select">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tarih *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="sitelog.input"
                />
              </div>
              <div>
                <Label>Hava Durumu</Label>
                <Select
                  value={form.weather}
                  onValueChange={(v) => setForm((f) => ({ ...f, weather: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Personel Sayısı</Label>
              <Input
                type="number"
                min={0}
                value={form.personnelCount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    personnelCount: Number(e.target.value),
                  }))
                }
                data-ocid="sitelog.input"
              />
            </div>
            <div>
              <Label>İş Özeti</Label>
              <Textarea
                rows={3}
                value={form.workSummary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, workSummary: e.target.value }))
                }
                placeholder="Bugün yapılan işler..."
                data-ocid="sitelog.textarea"
              />
            </div>
            <div>
              <Label>Sorunlar / Notlar</Label>
              <Textarea
                rows={2}
                value={form.issues}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issues: e.target.value }))
                }
                placeholder="Varsa sorunları belirtin..."
                data-ocid="sitelog.textarea"
              />
            </div>
            <div>
              <Label>Ziyaretçiler</Label>
              <Input
                value={form.visitors}
                onChange={(e) =>
                  setForm((f) => ({ ...f, visitors: e.target.value }))
                }
                placeholder="Ziyaretçi adları"
                data-ocid="sitelog.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              data-ocid="sitelog.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="sitelog.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
