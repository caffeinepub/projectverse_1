import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
  UploadCloud,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  OvertimeRecord,
  Personnel,
  ShiftAssignment,
} from "../contexts/AppContext";
import type {
  AuditLog,
  Certificate,
  PayrollRecord,
  TrainingRecord,
} from "../contexts/AppContext";
import { useApp } from "../contexts/AppContext";
import PerformanceReview from "./tabs/PerformanceReview";
import RecruitmentTab from "./tabs/RecruitmentTab";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SHIFT_KEYS = ["sabah", "ogleden", "gece", "izin", ""] as const;
type ShiftKey = (typeof SHIFT_KEYS)[number];

const SHIFT_LABELS: Record<
  string,
  { label: string; time: string; color: string }
> = {
  sabah: {
    label: "Sabah",
    time: "08:00-16:00",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  ogleden: {
    label: "Öğleden",
    time: "16:00-00:00",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  gece: {
    label: "Gece",
    time: "00:00-08:00",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  izin: {
    label: "İzin",
    time: "",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  "": {
    label: "-",
    time: "",
    color: "bg-muted/30 text-muted-foreground border-border",
  },
};

const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  Bekliyor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Onaylandı: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Reddedildi: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const DEPT_COLORS: Record<string, string> = {
  Teknik: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  İdari: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Saha: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Muhasebe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Proje: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] || "bg-muted/20 text-muted-foreground border-border";
}

interface PersonnelDoc {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

const DOCS_STORAGE_KEY = (companyId: string | null) =>
  `${companyId}_hr_personnel_docs`;

function loadPersonnelDocs(
  companyId: string | null,
): Record<string, PersonnelDoc[]> {
  try {
    const raw = localStorage.getItem(DOCS_STORAGE_KEY(companyId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersonnelDocs(
  companyId: string | null,
  docs: Record<string, PersonnelDoc[]>,
) {
  localStorage.setItem(DOCS_STORAGE_KEY(companyId), JSON.stringify(docs));
}

// Build shift lookup: shiftMap[personnelName][day] = shiftKey
function buildShiftMap(
  shifts: ShiftAssignment[],
): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};
  for (const s of shifts) {
    for (const person of s.personnel) {
      if (!map[person]) map[person] = {};
      map[person][s.day] = s.shift;
    }
  }
  return map;
}

function setShiftInArray(
  shifts: ShiftAssignment[],
  day: string,
  shiftKey: string,
  personnelName: string,
): ShiftAssignment[] {
  // Remove person from any shift on this day
  let updated = shifts.map((s) => {
    if (s.day === day) {
      return {
        ...s,
        personnel: s.personnel.filter((p) => p !== personnelName),
      };
    }
    return s;
  });
  // Remove empty assignments
  updated = updated.filter((s) => s.personnel.length > 0);
  // Add to new shift if not empty
  if (shiftKey) {
    const existing = updated.find((s) => s.day === day && s.shift === shiftKey);
    if (existing) {
      updated = updated.map((s) =>
        s.day === day && s.shift === shiftKey
          ? { ...s, personnel: [...s.personnel, personnelName] }
          : s,
      );
    } else {
      updated.push({ day, shift: shiftKey, personnel: [personnelName] });
    }
  }
  return updated;
}

// Calendar helpers
const TR_MONTHS = [
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
const CAL_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getCalendarDays(year: number, month: number) {
  // month is 0-based
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function TrainingCertificateTab() {
  const {
    certificates,
    setCertificates,
    trainingRecords,
    setTrainingRecords,
    hrPersonnel,
    user,
    activeCompanyId,
  } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [certOpen, setCertOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    personnelId: "",
    name: "",
    issuingBody: "",
    issueDate: "",
    expiryDate: "",
  });

  const handleSaveCert = () => {
    if (!certForm.personnelId || !certForm.name.trim()) return;
    const p = hrPersonnel.find((x) => x.id === certForm.personnelId);
    const newC: Certificate = {
      id: Date.now().toString(),
      ...certForm,
      personnelName: p?.name || "",
      companyId: activeCompanyId || "",
    };
    setCertificates([...certificates, newC]);
    setCertOpen(false);
    setCertForm({
      personnelId: "",
      name: "",
      issuingBody: "",
      issueDate: "",
      expiryDate: "",
    });
  };

  const [trainOpen, setTrainOpen] = useState(false);
  const [trainForm, setTrainForm] = useState({
    personnelId: "",
    title: "",
    date: "",
    duration: "",
    description: "",
  });

  const handleSaveTrain = () => {
    if (!trainForm.personnelId || !trainForm.title.trim()) return;
    const p = hrPersonnel.find((x) => x.id === trainForm.personnelId);
    const newT: TrainingRecord = {
      id: Date.now().toString(),
      personnelId: trainForm.personnelId,
      personnelName: p?.name || "",
      title: trainForm.title,
      date: trainForm.date,
      duration: Number(trainForm.duration) || 0,
      description: trainForm.description,
      companyId: activeCompanyId || "",
    };
    setTrainingRecords([...trainingRecords, newT]);
    setTrainOpen(false);
    setTrainForm({
      personnelId: "",
      title: "",
      date: "",
      duration: "",
      description: "",
    });
  };

  void user;

  return (
    <div className="space-y-8">
      {/* Certificates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Sertifikalar</h3>
          <Dialog open={certOpen} onOpenChange={setCertOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="hr.cert.add_button"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Yeni Sertifika
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Sertifika Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label>Personel *</Label>
                  <Select
                    value={certForm.personnelId}
                    onValueChange={(v) =>
                      setCertForm((p) => ({ ...p, personnelId: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="hr.cert.personnel_select"
                      className="bg-background border-border"
                    >
                      <SelectValue placeholder="Personel seç..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {hrPersonnel.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Belge Adı *</Label>
                  <Input
                    data-ocid="hr.cert.name_input"
                    value={certForm.name}
                    onChange={(e) =>
                      setCertForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="örn. İş Güvenliği Sertifikası"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Veren Kurum</Label>
                  <Input
                    data-ocid="hr.cert.issuer_input"
                    value={certForm.issuingBody}
                    onChange={(e) =>
                      setCertForm((p) => ({
                        ...p,
                        issuingBody: e.target.value,
                      }))
                    }
                    className="bg-background border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Alınış Tarihi</Label>
                    <Input
                      data-ocid="hr.cert.issueDate_input"
                      type="date"
                      value={certForm.issueDate}
                      onChange={(e) =>
                        setCertForm((p) => ({
                          ...p,
                          issueDate: e.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Son Kullanma</Label>
                    <Input
                      data-ocid="hr.cert.expiryDate_input"
                      type="date"
                      value={certForm.expiryDate}
                      onChange={(e) =>
                        setCertForm((p) => ({
                          ...p,
                          expiryDate: e.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCertOpen(false)}
                  className="border-border"
                >
                  İptal
                </Button>
                <Button
                  data-ocid="hr.cert.save_button"
                  onClick={handleSaveCert}
                  className="bg-primary text-primary-foreground"
                >
                  Ekle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {certificates.length === 0 ? (
          <div
            data-ocid="hr.certificates.empty_state"
            className="flex flex-col items-center justify-center py-10 text-center border border-border rounded-xl"
          >
            <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">
              Henüz sertifika kaydı yok.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {certificates.map((c, idx) => {
              const expired = c.expiryDate && c.expiryDate < today;
              const nearExpiry =
                !expired && c.expiryDate && c.expiryDate <= in30;
              return (
                <div
                  key={c.id}
                  data-ocid={`hr.cert.item.${idx + 1}`}
                  className="rounded-xl border border-border bg-card p-4 space-y-1.5"
                >
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.personnelName}
                  </div>
                  {c.issuingBody && (
                    <div className="text-xs text-muted-foreground">
                      {c.issuingBody}
                    </div>
                  )}
                  {c.expiryDate && (
                    <div
                      className={`text-xs font-medium ${expired ? "text-red-400" : nearExpiry ? "text-amber-400" : "text-muted-foreground"}`}
                    >
                      Son: {c.expiryDate}
                      {expired && " ⚠ Süresi Dolmuş"}
                      {!expired && nearExpiry && " ⚠ Yakında Dolacak"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Training Records */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Eğitim Geçmişi</h3>
          <Dialog open={trainOpen} onOpenChange={setTrainOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="hr.training.add_button"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Yeni Eğitim
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Eğitim Kaydı Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label>Personel *</Label>
                  <Select
                    value={trainForm.personnelId}
                    onValueChange={(v) =>
                      setTrainForm((p) => ({ ...p, personnelId: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="hr.training.personnel_select"
                      className="bg-background border-border"
                    >
                      <SelectValue placeholder="Personel seç..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {hrPersonnel.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Başlık *</Label>
                  <Input
                    data-ocid="hr.training.title_input"
                    value={trainForm.title}
                    onChange={(e) =>
                      setTrainForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Eğitim adı"
                    className="bg-background border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Tarih</Label>
                    <Input
                      data-ocid="hr.training.date_input"
                      type="date"
                      value={trainForm.date}
                      onChange={(e) =>
                        setTrainForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Süre (saat)</Label>
                    <Input
                      data-ocid="hr.training.duration_input"
                      type="number"
                      value={trainForm.duration}
                      onChange={(e) =>
                        setTrainForm((p) => ({
                          ...p,
                          duration: e.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Açıklama</Label>
                  <Textarea
                    data-ocid="hr.training.description_input"
                    value={trainForm.description}
                    onChange={(e) =>
                      setTrainForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setTrainOpen(false)}
                  className="border-border"
                >
                  İptal
                </Button>
                <Button
                  data-ocid="hr.training.save_button"
                  onClick={handleSaveTrain}
                  className="bg-primary text-primary-foreground"
                >
                  Ekle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {trainingRecords.length === 0 ? (
          <div
            data-ocid="hr.training.empty_state"
            className="flex flex-col items-center justify-center py-10 text-center border border-border rounded-xl"
          >
            <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">
              Henüz eğitim kaydı yok.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-border"
                  style={{ background: "oklch(0.15 0.018 245)" }}
                >
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Personel
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Eğitim
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Tarih
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Süre
                  </th>
                </tr>
              </thead>
              <tbody>
                {trainingRecords.map((t, idx) => (
                  <tr
                    key={t.id}
                    data-ocid={`hr.training.item.${idx + 1}`}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-3">{t.personnelName}</td>
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.date}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.duration}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PayrollTab() {
  const {
    payrollRecords,
    setPayrollRecords,
    hrPersonnel,
    user,
    activeCompanyId,
  } = useApp();
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    personnelId: "",
    grossSalary: "",
    deductions: "",
  });

  const handleSave = () => {
    if (!form.personnelId || !form.grossSalary) return;
    const p = hrPersonnel.find((x) => x.id === form.personnelId);
    const gross = Number(form.grossSalary);
    const ded = Number(form.deductions) || 0;
    const newR: PayrollRecord = {
      id: Date.now().toString(),
      personnelId: form.personnelId,
      personnelName: p?.name || "",
      month,
      grossSalary: gross,
      deductions: ded,
      netSalary: gross - ded,
      status: "pending",
      companyId: activeCompanyId || "",
    };
    setPayrollRecords([...payrollRecords, newR]);
    setAddOpen(false);
    setForm({ personnelId: "", grossSalary: "", deductions: "" });
  };

  const handleApprove = (id: string) => {
    setPayrollRecords(
      payrollRecords.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r,
      ),
    );
  };
  const handlePaid = (id: string) => {
    setPayrollRecords(
      payrollRecords.map((r) =>
        r.id === id
          ? { ...r, status: "paid" as const, paidAt: new Date().toISOString() }
          : r,
      ),
    );
  };

  const filtered = payrollRecords.filter((r) => r.month === month);
  const totalNet = filtered.reduce((s, r) => s + r.netSalary, 0);
  const paidNet = filtered
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.netSalary, 0);
  const pendingNet = filtered
    .filter((r) => r.status !== "paid")
    .reduce((s, r) => s + r.netSalary, 0);

  void user;

  const fmt = (n: number) =>
    `${n.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} ₺`;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">
            Toplam Aylık Bordro
          </div>
          <div className="text-xl font-bold text-foreground">
            {fmt(totalNet)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Ödenen</div>
          <div className="text-xl font-bold text-emerald-400">
            {fmt(paidNet)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Bekleyen</div>
          <div className="text-xl font-bold text-amber-400">
            {fmt(pendingNet)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Dönem:</Label>
          <Input
            data-ocid="hr.payroll.month_input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 w-40 bg-card border-border text-sm"
          />
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="hr.payroll.add_button"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Yeni Bordro Kaydı
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Bordro Kaydı Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Personel *</Label>
                <Select
                  value={form.personnelId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, personnelId: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="hr.payroll.personnel_select"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Personel seç..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {hrPersonnel.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Brüt Maaş (₺) *</Label>
                  <Input
                    data-ocid="hr.payroll.gross_input"
                    type="number"
                    value={form.grossSalary}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, grossSalary: e.target.value }))
                    }
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Kesintiler (₺)</Label>
                  <Input
                    data-ocid="hr.payroll.deductions_input"
                    type="number"
                    value={form.deductions}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, deductions: e.target.value }))
                    }
                    className="bg-background border-border"
                  />
                </div>
              </div>
              {form.grossSalary && (
                <div className="rounded-lg bg-muted/20 border border-border px-4 py-2 text-sm">
                  Net Maaş:{" "}
                  <span className="font-bold text-emerald-400">
                    {fmt(
                      (Number(form.grossSalary) || 0) -
                        (Number(form.deductions) || 0),
                    )}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="border-border"
              >
                İptal
              </Button>
              <Button
                data-ocid="hr.payroll.save_button"
                onClick={handleSave}
                className="bg-primary text-primary-foreground"
              >
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div
          data-ocid="hr.payroll.empty_state"
          className="flex flex-col items-center justify-center py-10 text-center border border-border rounded-xl"
        >
          <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground text-sm">
            Bu dönem için bordro kaydı yok.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b border-border"
                style={{ background: "oklch(0.15 0.018 245)" }}
              >
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Personel
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Dönem
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Brüt
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Kesinti
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Net
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Durum
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr
                  key={r.id}
                  data-ocid={`hr.payroll.item.${idx + 1}`}
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{r.personnelName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.month}</td>
                  <td className="px-4 py-3 text-right">{fmt(r.grossSalary)}</td>
                  <td className="px-4 py-3 text-right text-red-400">
                    -{fmt(r.deductions)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                    {fmt(r.netSalary)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "paid"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs"
                          : r.status === "approved"
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs"
                      }
                    >
                      {r.status === "paid"
                        ? "Ödendi"
                        : r.status === "approved"
                          ? "Onaylandı"
                          : "Bekliyor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {r.status === "pending" && (
                        <Button
                          data-ocid={`hr.payroll.approve_button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => handleApprove(r.id)}
                        >
                          Onayla
                        </Button>
                      )}
                      {r.status === "approved" && (
                        <Button
                          data-ocid={`hr.payroll.paid_button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handlePaid(r.id)}
                        >
                          Ödendi
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OvertimeTab() {
  const {
    overtimeRecords,
    addOvertimeRecord,
    updateOvertimeRecord,
    hrPersonnel,
    user,
    activeRoleId,
  } = useApp();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    personnelId: "",
    date: "",
    hours: "",
    type: "weekday" as OvertimeRecord["type"],
    description: "",
  });

  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const handleAdd = () => {
    if (!form.personnelId || !form.date || !form.hours) return;
    const personnel = hrPersonnel.find((p) => p.id === form.personnelId);
    if (!personnel) return;
    const record: OvertimeRecord = {
      id: `ot${Date.now()}`,
      personnelId: form.personnelId,
      personnelName: personnel.name,
      date: form.date,
      hours: Number(form.hours),
      type: form.type,
      description: form.description,
      status: "pending",
      createdBy: user?.name || "Sistem",
    };
    addOvertimeRecord(record);
    setForm({
      personnelId: "",
      date: "",
      hours: "",
      type: "weekday",
      description: "",
    });
    setAddOpen(false);
  };

  const canApprove = activeRoleId === "owner" || activeRoleId === "manager";

  // Monthly summary: approved records this month per person
  const monthlySummary = hrPersonnel
    .map((p) => {
      const approved = overtimeRecords.filter(
        (r) =>
          r.personnelId === p.id &&
          r.status === "approved" &&
          r.date.startsWith(thisMonth),
      );
      return {
        id: p.id,
        name: p.name,
        initials: p.initials,
        color: p.color,
        hours: approved.reduce((s, r) => s + r.hours, 0),
      };
    })
    .filter((p) => p.hours > 0);

  const typeLabels: Record<OvertimeRecord["type"], string> = {
    weekday: "Hafta İçi",
    weekend: "Hafta Sonu",
    holiday: "Tatil",
  };
  const statusLabels: Record<
    OvertimeRecord["status"],
    { label: string; color: string }
  > = {
    pending: {
      label: "Bekliyor",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    approved: {
      label: "Onaylandı",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    rejected: {
      label: "Reddedildi",
      color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Mesai Takibi</h2>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="hr.overtime.open_modal_button"
              size="sm"
              className="gradient-bg text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Mesai Ekle
            </Button>
          </DialogTrigger>
          <DialogContent
            data-ocid="hr.overtime.dialog"
            className="bg-card border-border"
          >
            <DialogHeader>
              <DialogTitle>Mesai Kaydı Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Personel</Label>
                <Select
                  value={form.personnelId}
                  onValueChange={(v) => setForm({ ...form, personnelId: v })}
                >
                  <SelectTrigger
                    data-ocid="hr.overtime.personnel_select"
                    className="mt-1"
                  >
                    <SelectValue placeholder="Personel seçin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {hrPersonnel.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tarih</Label>
                  <Input
                    data-ocid="hr.overtime.date_input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Saat</Label>
                  <Input
                    data-ocid="hr.overtime.hours_input"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={form.hours}
                    onChange={(e) =>
                      setForm({ ...form, hours: e.target.value })
                    }
                    placeholder="Ör: 3"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Tür</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as OvertimeRecord["type"] })
                  }
                >
                  <SelectTrigger
                    data-ocid="hr.overtime.type_select"
                    className="mt-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="weekday">Hafta İçi</SelectItem>
                    <SelectItem value="weekend">Hafta Sonu</SelectItem>
                    <SelectItem value="holiday">Tatil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Açıklama</Label>
                <Input
                  data-ocid="hr.overtime.desc_input"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Mesai açıklaması..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="hr.overtime.cancel_button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="border-border"
              >
                İptal
              </Button>
              <Button
                data-ocid="hr.overtime.submit_button"
                onClick={handleAdd}
                disabled={!form.personnelId || !form.date || !form.hours}
                className="gradient-bg text-white"
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Summary */}
      {monthlySummary.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Bu Ay Onaylanan Mesailer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {monthlySummary.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${p.color}22`, color: p.color }}
                  >
                    {p.initials}
                  </div>
                  <span className="text-sm font-medium">{p.name}</span>
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  >
                    {p.hours} saat
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      {overtimeRecords.length === 0 ? (
        <div
          data-ocid="hr.overtime.empty_state"
          className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl"
        >
          <Timer className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Henüz mesai kaydı bulunmuyor.</p>
          <p className="text-xs mt-1">
            Yeni mesai eklemek için yukarıdaki butonu kullanın.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {overtimeRecords.map((record, idx) => {
            const st = statusLabels[record.status];
            return (
              <div
                key={record.id}
                data-ocid={`hr.overtime.item.${idx + 1}`}
                className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {record.personnelName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[record.type]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{record.date}</span>
                    <span className="font-semibold text-foreground">
                      {record.hours} saat
                    </span>
                    {record.description && (
                      <span className="truncate">{record.description}</span>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs flex-shrink-0 ${st.color}`}
                >
                  {st.label}
                </Badge>
                {canApprove && record.status === "pending" && (
                  <div className="flex gap-1">
                    <Button
                      data-ocid={`hr.overtime.approve_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() =>
                        updateOvertimeRecord(record.id, { status: "approved" })
                      }
                    >
                      Onayla
                    </Button>
                    <Button
                      data-ocid={`hr.overtime.reject_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                      onClick={() =>
                        updateOvertimeRecord(record.id, { status: "rejected" })
                      }
                    >
                      Reddet
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HumanResources() {
  const {
    activeRoleId,
    activeCompanyId,
    checkPermission,
    hrPersonnel: personnel,
    setHrPersonnel: setPersonnel,
    hrLeaves: leaves,
    setHrLeaves: setLeaves,
    hrShifts: shifts,
    setHrShifts: setShifts,
    user,
    addNotification,
    addAuditLog,
    auditLogs,
    attendanceRecords,
    setAttendanceRecords,
  } = useApp();

  // ─── Puantaj State ───────────────────────────────────────────────────────────
  const [attendanceFilter, setAttendanceFilter] = useState({
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    personnelId: "all",
  });
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    personnelId: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "08:00",
    checkOut: "17:00",
    breakMinutes: 60,
    status: "Normal" as
      | "Normal"
      | "Eksik"
      | "Fazla Mesai"
      | "İzinli"
      | "Devamsız",
    notes: "",
  });

  const handleAddAttendance = () => {
    if (!newAttendance.personnelId) return;
    const p = personnel.find((p) => p.id === newAttendance.personnelId);
    const record = {
      id: `att${Date.now()}`,
      companyId: "",
      personnelId: newAttendance.personnelId,
      personnelName: p?.name || "",
      date: newAttendance.date,
      checkIn: newAttendance.checkIn,
      checkOut: newAttendance.checkOut,
      breakMinutes: Number(newAttendance.breakMinutes),
      status: newAttendance.status,
      approvedBy: "",
      notes: newAttendance.notes,
    };
    setAttendanceRecords([record, ...attendanceRecords]);
    setAttendanceDialogOpen(false);
    setNewAttendance({
      personnelId: "",
      date: new Date().toISOString().split("T")[0],
      checkIn: "08:00",
      checkOut: "17:00",
      breakMinutes: 60,
      status: "Normal",
      notes: "",
    });
  };

  const isManager =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "pm" ||
    activeRoleId === "supervisor" ||
    checkPermission("hr", "edit");

  // Personnel state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Tümü");
  const [addPersonnelOpen, setAddPersonnelOpen] = useState(false);
  const [newPersonnel, setNewPersonnel] = useState({
    name: "",
    role: "",
    department: "Teknik",
    phone: "",
    email: "",
    annualLeaveBalance: "20",
  });
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(
    null,
  );

  // Personnel docs
  const [personnelDocs, setPersonnelDocs] = useState<
    Record<string, PersonnelDoc[]>
  >(() => loadPersonnelDocs(activeCompanyId));

  // Reload personnel docs when company changes
  useEffect(() => {
    if (activeCompanyId) setPersonnelDocs(loadPersonnelDocs(activeCompanyId));
  }, [activeCompanyId]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Leave state
  const [addLeaveOpen, setAddLeaveOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    type: "Yıllık" as LeaveType,
    startDate: "",
    endDate: "",
    note: "",
  });

  // Shift state
  const [shiftEditModal, setShiftEditModal] = useState<{
    personnelName: string;
    day: string;
    currentShift: string;
  } | null>(null);
  const [pendingShift, setPendingShift] = useState<ShiftKey>("");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const pendingCount = leaves.filter((l) => l.status === "Bekliyor").length;

  const filteredPersonnel = personnel.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "Tümü" || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  const departments = Array.from(new Set(personnel.map((p) => p.department)));

  const handleApprove = (id: string) => {
    const leave = leaves.find((l) => l.id === id);
    setLeaves(
      leaves.map((l) =>
        l.id === id ? { ...l, status: "Onaylandı" as LeaveStatus } : l,
      ),
    );
    if (leave) {
      addNotification({
        type: "leave_approved",
        title: "İzin Onaylandı",
        message: `${leave.name} adlı personelin izin talebi onaylandı.`,
      });
      addAuditLog({
        module: "hr",
        action: "İzin Onaylandı",
        description: `${leave.name} - ${leave.type}`,
        performedBy: user?.name || "Yönetici",
      });
    }
  };

  const handleReject = (id: string) => {
    const leave = leaves.find((l) => l.id === id);
    setLeaves(
      leaves.map((l) =>
        l.id === id ? { ...l, status: "Reddedildi" as LeaveStatus } : l,
      ),
    );
    if (leave) {
      addNotification({
        type: "leave_rejected",
        title: "İzin Reddedildi",
        message: `${leave.name} adlı personelin izin talebi reddedildi.`,
      });
      addAuditLog({
        module: "hr",
        action: "İzin Reddedildi",
        description: `${leave.name} - ${leave.type}`,
        performedBy: user?.name || "Yönetici",
      });
    }
  };

  const handleAddPersonnel = () => {
    if (!newPersonnel.name.trim() || !newPersonnel.role.trim()) return;
    const initials = newPersonnel.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colors = [
      "#7c3aed",
      "#0891b2",
      "#059669",
      "#d97706",
      "#dc2626",
      "#be185d",
    ];
    const color = colors[personnel.length % colors.length];
    const newPerson: Personnel = {
      id: String(Date.now()),
      name: newPersonnel.name.trim(),
      role: newPersonnel.role.trim(),
      department: newPersonnel.department,
      phone: newPersonnel.phone.trim(),
      email: newPersonnel.email.trim(),
      status: "Aktif",
      initials,
      color,
      annualLeaveBalance: Number(newPersonnel.annualLeaveBalance) || 20,
    };
    setPersonnel([...personnel, newPerson]);
    setNewPersonnel({
      name: "",
      role: "",
      department: "Teknik",
      phone: "",
      email: "",
      annualLeaveBalance: "20",
    });
    setAddPersonnelOpen(false);
  };

  const handleAddLeave = () => {
    if (!newLeave.startDate || !newLeave.endDate) return;
    const senderName = user?.name || selectedPersonnel?.name || "Ben";
    const newReq: LeaveRequest = {
      id: String(Date.now()),
      name: senderName,
      personnelId: selectedPersonnel?.id,
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      status: "Bekliyor",
      note: newLeave.note,
    };
    setLeaves([...leaves, newReq]);
    setNewLeave({ type: "Yıllık", startDate: "", endDate: "", note: "" });
    setAddLeaveOpen(false);
  };

  const handleShiftSave = () => {
    if (!shiftEditModal) return;
    const updated = setShiftInArray(
      shifts,
      shiftEditModal.day,
      pendingShift,
      shiftEditModal.personnelName,
    );
    setShifts(updated);
    setShiftEditModal(null);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPersonnel) return;
    setIsUploadingDoc(true);
    setDocUploadProgress(0);
    const reader = new FileReader();
    reader.onload = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          clearInterval(interval);
          const newDoc: PersonnelDoc = {
            id: String(Date.now()),
            name: file.name,
            type: file.name.split(".").pop()?.toUpperCase() || "DOC",
            date: new Date().toISOString().split("T")[0],
            size: `${(file.size / 1024).toFixed(1)} KB`,
          };
          const updated = {
            ...personnelDocs,
            [selectedPersonnel.id]: [
              ...(personnelDocs[selectedPersonnel.id] || []),
              newDoc,
            ],
          };
          setPersonnelDocs(updated);
          savePersonnelDocs(activeCompanyId, updated);
          setIsUploadingDoc(false);
          setDocUploadProgress(0);
        } else {
          setDocUploadProgress(Math.min(progress, 99));
        }
      }, 100);
    };
    reader.readAsDataURL(file);
    if (docFileInputRef.current) docFileInputRef.current.value = "";
  };

  const handleDeleteDoc = (personnelId: string, docId: string) => {
    const updated = {
      ...personnelDocs,
      [personnelId]: (personnelDocs[personnelId] || []).filter(
        (d) => d.id !== docId,
      ),
    };
    setPersonnelDocs(updated);
    savePersonnelDocs(activeCompanyId, updated);
  };

  const shiftMap = buildShiftMap(shifts);

  // Calendar: leaves for current month
  const calCells = getCalendarDays(calYear, calMonth);
  const monthLeaves = leaves.filter((l) => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    const monthStart = new Date(calYear, calMonth, 1);
    const monthEnd = new Date(calYear, calMonth + 1, 0);
    return start <= monthEnd && end >= monthStart;
  });

  function getLeavesForDay(day: number) {
    const ds = dateStr(calYear, calMonth, day);
    return monthLeaves.filter((l) => l.startDate <= ds && l.endDate >= ds);
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold gradient-text">İnsan Kaynakları</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personel yönetimi, izinler ve vardiya planlaması
        </p>
      </div>

      <Tabs defaultValue="personnel" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger data-ocid="hr.personnel.tab" value="personnel">
            Personel
          </TabsTrigger>
          <TabsTrigger data-ocid="hr.leaves.tab" value="leaves">
            İzin Yönetimi
            {pendingCount > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-xs bg-amber-500 text-white">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger data-ocid="hr.shifts.tab" value="shifts">
            Vardiya Planı
          </TabsTrigger>
          <TabsTrigger data-ocid="hr.calendar.tab" value="calendar">
            İzin Takvimi
          </TabsTrigger>
          <TabsTrigger data-ocid="hr.overtime.tab" value="overtime">
            Mesai Takibi
          </TabsTrigger>
          <TabsTrigger
            data-ocid="hr.audit.tab"
            value="audit"
            className="text-xs md:text-sm"
          >
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            data-ocid="hr.training.tab"
            value="training"
            className="text-xs md:text-sm"
          >
            Eğitim & Sertifika
          </TabsTrigger>
          <TabsTrigger
            data-ocid="hr.payroll.tab"
            value="payroll"
            className="text-xs md:text-sm"
          >
            Bordro
          </TabsTrigger>
          <TabsTrigger
            data-ocid="hr.attendance.tab"
            value="attendance"
            className="text-xs md:text-sm"
          >
            Puantaj
          </TabsTrigger>
          <TabsTrigger
            data-ocid="hr.performance.tab"
            value="performance"
            className="text-xs md:text-sm"
          >
            Performans
          </TabsTrigger>
          <TabsTrigger
            data-ocid="hr.recruitment.tab"
            value="recruitment"
            className="text-xs md:text-sm"
          >
            İşe Alım
          </TabsTrigger>
          <TabsTrigger
            data-ocid="hr.capacity.tab"
            value="capacity"
            className="text-xs md:text-sm"
          >
            Kapasite Planı
          </TabsTrigger>
        </TabsList>

        {/* ─── PERSONNEL TAB ─── */}
        <TabsContent value="personnel" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-ocid="hr.personnel.search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara..."
                  className="pl-8 h-8 bg-card border-border text-sm w-48"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger
                  data-ocid="hr.department.select"
                  className="h-8 w-36 bg-card border-border text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Tümü">Tüm Departmanlar</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isManager && (
              <Dialog
                open={addPersonnelOpen}
                onOpenChange={setAddPersonnelOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    data-ocid="hr.add_personnel_button"
                    className="gradient-bg text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Personel Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="hr.add_personnel.dialog"
                  className="bg-card border-border"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Personel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Ad Soyad</Label>
                      <Input
                        data-ocid="hr.personnel_name.input"
                        value={newPersonnel.name}
                        onChange={(e) =>
                          setNewPersonnel((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                        placeholder="Örn: Ahmet Yılmaz"
                      />
                    </div>
                    <div>
                      <Label>Unvan / Rol</Label>
                      <Input
                        data-ocid="hr.personnel_role.input"
                        value={newPersonnel.role}
                        onChange={(e) =>
                          setNewPersonnel((p) => ({
                            ...p,
                            role: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                        placeholder="Örn: Saha Mühendisi"
                      />
                    </div>
                    <div>
                      <Label>Departman</Label>
                      <Select
                        value={newPersonnel.department}
                        onValueChange={(v) =>
                          setNewPersonnel((p) => ({ ...p, department: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="hr.personnel_dept.select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="Teknik">Teknik</SelectItem>
                          <SelectItem value="İdari">İdari</SelectItem>
                          <SelectItem value="Saha">Saha</SelectItem>
                          <SelectItem value="Muhasebe">Muhasebe</SelectItem>
                          <SelectItem value="Proje">Proje</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Telefon</Label>
                        <Input
                          data-ocid="hr.personnel_phone.input"
                          value={newPersonnel.phone}
                          onChange={(e) =>
                            setNewPersonnel((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          className="mt-1 bg-background border-border"
                          placeholder="0532 000 0000"
                        />
                      </div>
                      <div>
                        <Label>E-posta</Label>
                        <Input
                          data-ocid="hr.personnel_email.input"
                          value={newPersonnel.email}
                          onChange={(e) =>
                            setNewPersonnel((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                          className="mt-1 bg-background border-border"
                          placeholder="ornek@sirket.com"
                        />
                      </div>
                      <div>
                        <Label>Yıllık İzin (Gün)</Label>
                        <Input
                          data-ocid="hr.personnel.leave_balance.input"
                          type="number"
                          value={newPersonnel.annualLeaveBalance}
                          onChange={(e) =>
                            setNewPersonnel((p) => ({
                              ...p,
                              annualLeaveBalance: e.target.value,
                            }))
                          }
                          className="mt-1 bg-background border-border"
                          placeholder="20"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      data-ocid="hr.add_personnel.cancel_button"
                      onClick={() => setAddPersonnelOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="hr.add_personnel.confirm_button"
                      className="gradient-bg text-white"
                      onClick={handleAddPersonnel}
                      disabled={
                        !newPersonnel.name.trim() || !newPersonnel.role.trim()
                      }
                    >
                      Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {filteredPersonnel.length === 0 ? (
            <div
              data-ocid="hr.personnel.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Personel bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPersonnel.map((person, idx) => (
                <Card
                  key={person.id}
                  data-ocid={`hr.personnel.item.${idx + 1}`}
                  className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedPersonnel(person)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          style={{
                            backgroundColor: `${person.color}22`,
                            color: person.color,
                          }}
                          className="text-sm font-bold"
                        >
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm font-semibold">
                            {person.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              person.status === "Aktif"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-muted/20 text-muted-foreground border-border"
                            }`}
                          >
                            {person.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {person.role}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getDeptColor(person.department)}`}
                    >
                      {person.department}
                    </Badge>
                    {person.phone && (
                      <p className="text-xs text-muted-foreground">
                        {person.phone}
                      </p>
                    )}
                    {person.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {person.email}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      <span>
                        {(personnelDocs[person.id] || []).length} belge
                      </span>
                    </div>
                    {(() => {
                      const usedLeaveDays = leaves
                        .filter(
                          (l) =>
                            (l.personnelId
                              ? l.personnelId === person.id
                              : l.name === person.name) &&
                            l.status === "Onaylandı",
                        )
                        .reduce((sum, l) => {
                          if (!l.startDate || !l.endDate) return sum + 1;
                          const s = new Date(l.startDate);
                          const e = new Date(l.endDate);
                          return (
                            sum +
                            Math.max(
                              1,
                              Math.ceil(
                                (e.getTime() - s.getTime()) / 86400000,
                              ) + 1,
                            )
                          );
                        }, 0);
                      const remainingLeave = Math.max(
                        0,
                        (person.annualLeaveBalance ?? 20) - usedLeaveDays,
                      );
                      return (
                        <span className="text-xs text-muted-foreground">
                          İzin: {remainingLeave} gün kaldı
                        </span>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── LEAVES TAB ─── */}
        <TabsContent value="leaves" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">İzin Talepleri</h2>
            <Dialog open={addLeaveOpen} onOpenChange={setAddLeaveOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="hr.add_leave_button"
                  className="gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İzin Talebi Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="hr.add_leave.dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>İzin Talebi</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>İzin Türü</Label>
                    <Select
                      value={newLeave.type}
                      onValueChange={(v) =>
                        setNewLeave((l) => ({ ...l, type: v as LeaveType }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="hr.leave_type.select"
                        className="mt-1 bg-background border-border"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Yıllık">Yıllık İzin</SelectItem>
                        <SelectItem value="Hastalık">Hastalık İzni</SelectItem>
                        <SelectItem value="Mazeret">Mazeret İzni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Başlangıç</Label>
                      <Input
                        data-ocid="hr.leave_start.input"
                        type="date"
                        value={newLeave.startDate}
                        onChange={(e) =>
                          setNewLeave((l) => ({
                            ...l,
                            startDate: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label>Bitiş</Label>
                      <Input
                        data-ocid="hr.leave_end.input"
                        type="date"
                        value={newLeave.endDate}
                        onChange={(e) =>
                          setNewLeave((l) => ({
                            ...l,
                            endDate: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      data-ocid="hr.leave_note.textarea"
                      value={newLeave.note}
                      onChange={(e) =>
                        setNewLeave((l) => ({ ...l, note: e.target.value }))
                      }
                      className="mt-1 bg-background border-border resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="hr.add_leave.cancel_button"
                    onClick={() => setAddLeaveOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="hr.add_leave.confirm_button"
                    className="gradient-bg text-white"
                    onClick={handleAddLeave}
                    disabled={!newLeave.startDate || !newLeave.endDate}
                  >
                    Gönder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {leaves.length === 0 ? (
            <div
              data-ocid="hr.leaves.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Henüz izin talebi yok.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaves.map((leave, idx) => (
                <div
                  key={leave.id}
                  data-ocid={`hr.leave.item.${idx + 1}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {leave.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {leave.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {leave.startDate} — {leave.endDate}
                      </p>
                      {leave.note && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {leave.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${LEAVE_STATUS_COLORS[leave.status]}`}
                    >
                      {leave.status}
                    </Badge>
                    {isManager && leave.status === "Bekliyor" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`hr.leave.approve_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleApprove(leave.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`hr.leave.reject_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                          onClick={() => handleReject(leave.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── SHIFT TAB ─── */}
        <TabsContent value="shifts" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Haftalık Vardiya Planı
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(SHIFT_LABELS)
                  .filter(([k]) => k !== "")
                  .map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-sm border ${val.color}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {val.label}
                        {val.time ? ` (${val.time})` : ""}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div
              data-ocid="hr.shifts.panel"
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium w-40">
                        Personel
                      </th>
                      {DAYS.map((d) => (
                        <th
                          key={d}
                          className="text-center px-2 py-3 text-muted-foreground font-medium min-w-[90px]"
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {personnel.map((person, pIdx) => (
                      <tr
                        key={person.id}
                        data-ocid={`hr.shift.row.${pIdx + 1}`}
                        className="border-b border-border/50 hover:bg-white/3"
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback
                                style={{
                                  backgroundColor: `${person.color}22`,
                                  color: person.color,
                                }}
                                className="text-xs font-bold"
                              >
                                {person.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium truncate max-w-[90px]">
                              {person.name.split(" ")[0]}
                            </span>
                          </div>
                        </td>
                        {DAYS.map((day) => {
                          const shiftKey = shiftMap[person.name]?.[day] || "";
                          const shiftInfo =
                            SHIFT_LABELS[shiftKey] || SHIFT_LABELS[""];
                          return (
                            <td key={day} className="px-1 py-2 text-center">
                              <button
                                type="button"
                                data-ocid={`hr.shift.cell.${pIdx + 1}`}
                                onClick={() => {
                                  setShiftEditModal({
                                    personnelName: person.name,
                                    day,
                                    currentShift: shiftKey,
                                  });
                                  setPendingShift(shiftKey as ShiftKey);
                                }}
                                className={`w-full px-2 py-1 rounded border text-xs transition-all hover:opacity-80 ${shiftInfo.color}`}
                              >
                                {shiftInfo.label}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {personnel.length === 0 && (
                  <div
                    data-ocid="hr.shifts.empty_state"
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    Personel eklendikten sonra vardiya planlayabilirsiniz.
                  </div>
                )}
              </div>
            </div>

            {/* Shift Edit Modal */}
            <Dialog
              open={!!shiftEditModal}
              onOpenChange={(open) => !open && setShiftEditModal(null)}
            >
              <DialogContent
                data-ocid="hr.shift_edit.dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>
                    Vardiya Düzenle:{" "}
                    <span className="text-primary">
                      {shiftEditModal?.personnelName}
                    </span>{" "}
                    — {shiftEditModal?.day}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  {(["sabah", "ogleden", "gece", "izin", ""] as ShiftKey[]).map(
                    (key) => {
                      const info = SHIFT_LABELS[key];
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setPendingShift(key)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            pendingShift === key
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-white/5"
                          }`}
                        >
                          <p className="text-sm font-medium">{info.label}</p>
                          {info.time && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {info.time}
                            </p>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="hr.shift_edit.cancel_button"
                    onClick={() => setShiftEditModal(null)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="hr.shift_edit.save_button"
                    className="gradient-bg text-white"
                    onClick={handleShiftSave}
                  >
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* ─── CALENDAR TAB ─── */}
        <TabsContent value="calendar" className="mt-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">İzin Takvimi</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
                    <span className="text-xs text-muted-foreground">
                      Onaylandı
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/50" />
                    <span className="text-xs text-muted-foreground">
                      Bekliyor
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-rose-500/30 border border-rose-500/50" />
                    <span className="text-xs text-muted-foreground">
                      Reddedildi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    data-ocid="hr.calendar.pagination_prev"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear((y) => y - 1);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-32 text-center">
                    {TR_MONTHS[calMonth]} {calYear}
                  </span>
                  <Button
                    data-ocid="hr.calendar.pagination_next"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear((y) => y + 1);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              data-ocid="hr.calendar.panel"
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {CAL_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center py-2 text-xs font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calCells.map((day, i) => {
                  const cellKey =
                    day !== null
                      ? `day-${calYear}-${calMonth}-${day}`
                      : `null-${calYear}-${calMonth}-slot${i}`;
                  if (day === null) {
                    return (
                      <div
                        key={cellKey}
                        className="h-20 border-b border-r border-border/30"
                      />
                    );
                  }
                  const dayLeaves = getLeavesForDay(day);
                  const isToday =
                    calYear === today.getFullYear() &&
                    calMonth === today.getMonth() &&
                    day === today.getDate();
                  return (
                    <div
                      key={cellKey}
                      className={`h-20 border-b border-r border-border/30 p-1 ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-primary text-white"
                            : "text-foreground/70"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayLeaves.slice(0, 2).map((leave) => (
                          <div
                            key={leave.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate border ${
                              leave.status === "Onaylandı"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : leave.status === "Bekliyor"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {leave.name.split(" ")[0]}
                          </div>
                        ))}
                        {dayLeaves.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">
                            +{dayLeaves.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── OVERTIME TAB ─── */}
        <TabsContent value="overtime" className="mt-4 space-y-4">
          <OvertimeTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-border"
                  style={{ background: "oklch(0.15 0.018 245)" }}
                >
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Tarih
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    İşlem
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Açıklama
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Yapan
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.filter((l) => l.module === "hr").length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Henüz denetim kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  auditLogs
                    .filter((l) => l.module === "hr")
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.performedBy}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ─── TRAINING & CERTIFICATE TAB ─── */}
        <TabsContent value="training" className="mt-4 space-y-6">
          <TrainingCertificateTab />
        </TabsContent>

        {/* ─── PAYROLL TAB ─── */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <PayrollTab />
        </TabsContent>
        {/* ─── PUANTAJ TAB ─── */}
        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={attendanceFilter.year}
                onValueChange={(v) =>
                  setAttendanceFilter({ ...attendanceFilter, year: v })
                }
              >
                <SelectTrigger
                  data-ocid="hr.attendance.year.select"
                  className="w-24"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={attendanceFilter.month}
                onValueChange={(v) =>
                  setAttendanceFilter({ ...attendanceFilter, month: v })
                }
              >
                <SelectTrigger
                  data-ocid="hr.attendance.month.select"
                  className="w-28"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "01",
                    "02",
                    "03",
                    "04",
                    "05",
                    "06",
                    "07",
                    "08",
                    "09",
                    "10",
                    "11",
                    "12",
                  ].map((m, i) => (
                    <SelectItem key={m} value={m}>
                      {
                        [
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
                        ][i]
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={attendanceFilter.personnelId}
                onValueChange={(v) =>
                  setAttendanceFilter({ ...attendanceFilter, personnelId: v })
                }
              >
                <SelectTrigger
                  data-ocid="hr.attendance.personnel.select"
                  className="w-40"
                >
                  <SelectValue placeholder="Tüm Personel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Personel</SelectItem>
                  {personnel.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isManager && (
              <Dialog
                open={attendanceDialogOpen}
                onOpenChange={setAttendanceDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    data-ocid="hr.attendance.open_modal_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Giriş/Çıkış Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="hr.attendance.dialog"
                  className="max-w-md"
                >
                  <DialogHeader>
                    <DialogTitle>Devam Kaydı Ekle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Personel</Label>
                      <Select
                        value={newAttendance.personnelId}
                        onValueChange={(v) =>
                          setNewAttendance({ ...newAttendance, personnelId: v })
                        }
                      >
                        <SelectTrigger data-ocid="hr.attendance.personnel2.select">
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {personnel.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Tarih</Label>
                      <Input
                        data-ocid="hr.attendance.date.input"
                        type="date"
                        value={newAttendance.date}
                        onChange={(e) =>
                          setNewAttendance({
                            ...newAttendance,
                            date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Giriş Saati</Label>
                        <Input
                          data-ocid="hr.attendance.checkin.input"
                          type="time"
                          value={newAttendance.checkIn}
                          onChange={(e) =>
                            setNewAttendance({
                              ...newAttendance,
                              checkIn: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Çıkış Saati</Label>
                        <Input
                          data-ocid="hr.attendance.checkout.input"
                          type="time"
                          value={newAttendance.checkOut}
                          onChange={(e) =>
                            setNewAttendance({
                              ...newAttendance,
                              checkOut: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Mola (dk)</Label>
                        <Input
                          data-ocid="hr.attendance.break.input"
                          type="number"
                          value={newAttendance.breakMinutes}
                          onChange={(e) =>
                            setNewAttendance({
                              ...newAttendance,
                              breakMinutes: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Durum</Label>
                        <Select
                          value={newAttendance.status}
                          onValueChange={(v) =>
                            setNewAttendance({
                              ...newAttendance,
                              status: v as typeof newAttendance.status,
                            })
                          }
                        >
                          <SelectTrigger data-ocid="hr.attendance.status.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Fazla Mesai">
                              Fazla Mesai
                            </SelectItem>
                            <SelectItem value="Eksik">Eksik</SelectItem>
                            <SelectItem value="İzinli">İzinli</SelectItem>
                            <SelectItem value="Devamsız">Devamsız</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Notlar</Label>
                      <Input
                        data-ocid="hr.attendance.notes.input"
                        value={newAttendance.notes}
                        onChange={(e) =>
                          setNewAttendance({
                            ...newAttendance,
                            notes: e.target.value,
                          })
                        }
                        placeholder="İsteğe bağlı not"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="hr.attendance.cancel_button"
                      variant="outline"
                      onClick={() => setAttendanceDialogOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="hr.attendance.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddAttendance}
                    >
                      Kaydet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Attendance Table */}
          {(() => {
            const periodStr = `${attendanceFilter.year}-${attendanceFilter.month}`;
            const filtered = attendanceRecords.filter((r) => {
              const matchPeriod = r.date.startsWith(periodStr);
              const matchPerson =
                attendanceFilter.personnelId === "all" ||
                r.personnelId === attendanceFilter.personnelId;
              return matchPeriod && matchPerson;
            });
            const grouped: Record<string, typeof filtered> = {};
            for (const r of filtered) {
              if (!grouped[r.personnelName]) grouped[r.personnelName] = [];
              grouped[r.personnelName].push(r);
            }
            const days = Array.from({ length: 31 }, (_, i) =>
              String(i + 1).padStart(2, "0"),
            );

            return filtered.length === 0 ? (
              <div
                data-ocid="hr.attendance.empty_state"
                className="py-10 text-center text-muted-foreground"
              >
                <p>Bu dönem için devam kaydı yok.</p>
                <p className="text-xs mt-1">
                  Giriş/çıkış kaydı ekleyerek başlayın.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="text-xs min-w-max">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium sticky left-0 bg-muted/30 min-w-36">
                        Personel
                      </th>
                      {days.map((d) => (
                        <th
                          key={d}
                          className="px-1 py-2 font-medium text-center w-10"
                        >
                          {Number(d)}
                        </th>
                      ))}
                      <th className="px-2 py-2 font-medium text-right">
                        Toplam
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(grouped).map(([name, records], idx) => {
                      const dayMap: Record<string, (typeof records)[0]> = {};
                      for (const r of records) {
                        const day = r.date.split("-")[2];
                        dayMap[day] = r;
                      }
                      const workDays = records.filter(
                        (r) => r.status !== "Devamsız" && r.status !== "İzinli",
                      ).length;
                      return (
                        <tr
                          key={name}
                          data-ocid={`hr.attendance.row.${idx + 1}`}
                          className="border-t border-border"
                        >
                          <td className="px-3 py-2 font-medium sticky left-0 bg-card">
                            {name}
                          </td>
                          {days.map((d) => {
                            const r = dayMap[d];
                            if (!r)
                              return (
                                <td
                                  key={d}
                                  className="px-1 py-2 text-center text-muted-foreground/30"
                                >
                                  -
                                </td>
                              );
                            const label =
                              r.status === "İzinli"
                                ? "İ"
                                : r.status === "Devamsız"
                                  ? "D"
                                  : r.status === "Fazla Mesai"
                                    ? "M"
                                    : `${r.checkIn?.slice(0, 5) || ""}`;
                            const color =
                              r.status === "Devamsız"
                                ? "text-red-400"
                                : r.status === "İzinli"
                                  ? "text-blue-400"
                                  : r.status === "Fazla Mesai"
                                    ? "text-amber-400"
                                    : "text-green-400";
                            return (
                              <td
                                key={d}
                                className={`px-1 py-2 text-center ${color} font-medium`}
                              >
                                {label}
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-right font-medium">
                            {workDays}g
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </TabsContent>

        {/* ─── PERFORMANCE TAB ─── */}
        <TabsContent value="performance" className="mt-4">
          <PerformanceReview
            companyId={activeCompanyId || ""}
            personnel={personnel}
          />
        </TabsContent>
        <TabsContent value="recruitment" className="mt-4 space-y-6">
          <RecruitmentTab companyId={activeCompanyId || ""} />
        </TabsContent>
        <TabsContent value="capacity" className="mt-4">
          <CapacityPlanTab companyId={activeCompanyId || ""} />
        </TabsContent>
      </Tabs>

      {/* ─── Personnel Detail Sheet ─── */}
      <Sheet
        open={!!selectedPersonnel}
        onOpenChange={(open) => !open && setSelectedPersonnel(null)}
      >
        <SheetContent
          data-ocid="hr.personnel.sheet"
          className="bg-card border-border w-[420px] sm:max-w-[420px]"
        >
          {selectedPersonnel && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      style={{
                        backgroundColor: `${selectedPersonnel.color}22`,
                        color: selectedPersonnel.color,
                      }}
                      className="text-lg font-bold"
                    >
                      {selectedPersonnel.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selectedPersonnel.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedPersonnel.role}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Departman</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getDeptColor(selectedPersonnel.department)}`}
                    >
                      {selectedPersonnel.department}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Durum</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        selectedPersonnel.status === "Aktif"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      {selectedPersonnel.status}
                    </Badge>
                  </div>
                  {selectedPersonnel.phone && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Telefon</span>
                      <span>{selectedPersonnel.phone}</span>
                    </div>
                  )}
                  {selectedPersonnel.email && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">E-posta</span>
                      <span className="truncate max-w-[200px]">
                        {selectedPersonnel.email}
                      </span>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Belgeler
                    </h3>
                    <div>
                      <input
                        ref={docFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        className="hidden"
                        onChange={handleDocUpload}
                      />
                      <Button
                        data-ocid="hr.personnel_doc.upload_button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-border"
                        onClick={() => docFileInputRef.current?.click()}
                        disabled={isUploadingDoc}
                      >
                        <UploadCloud className="h-3 w-3 mr-1" />
                        Belge Ekle
                      </Button>
                    </div>
                  </div>

                  {isUploadingDoc && (
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Yükleniyor...</span>
                        <span>{Math.round(docUploadProgress)}%</span>
                      </div>
                      <Progress value={docUploadProgress} className="h-1.5" />
                    </div>
                  )}

                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-2">
                      {(personnelDocs[selectedPersonnel.id] || []).length ===
                      0 ? (
                        <div
                          data-ocid="hr.personnel_docs.empty_state"
                          className="text-center py-6 text-muted-foreground"
                        >
                          <Paperclip className="h-6 w-6 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">Henüz belge eklenmemiş.</p>
                        </div>
                      ) : (
                        (personnelDocs[selectedPersonnel.id] || []).map(
                          (doc, dIdx) => (
                            <div
                              key={doc.id}
                              data-ocid={`hr.personnel_doc.item.${dIdx + 1}`}
                              className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2"
                            >
                              <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.date} • {doc.size}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-ocid={`hr.personnel_doc.delete_button.${dIdx + 1}`}
                                className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                                onClick={() =>
                                  handleDeleteDoc(selectedPersonnel.id, doc.id)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ),
                        )
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Personnel Leave History */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    İzin Geçmişi
                  </h3>
                  <div className="space-y-2">
                    {leaves
                      .filter((l) =>
                        l.personnelId
                          ? l.personnelId === selectedPersonnel.id
                          : l.name === selectedPersonnel.name,
                      )
                      .slice(0, 5)
                      .map((leave, lIdx) => (
                        <div
                          key={leave.id}
                          data-ocid={`hr.leave_history.item.${lIdx + 1}`}
                          className="flex items-center justify-between text-xs bg-background/50 border border-border rounded-lg px-3 py-2"
                        >
                          <div>
                            <span className="font-medium">{leave.type}</span>
                            <span className="text-muted-foreground ml-2">
                              {leave.startDate} – {leave.endDate}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              LEAVE_STATUS_COLORS[leave.status]
                            }`}
                          >
                            {leave.status}
                          </Badge>
                        </div>
                      ))}
                    {leaves.filter((l) =>
                      l.personnelId
                        ? l.personnelId === selectedPersonnel.id
                        : l.name === selectedPersonnel.name,
                    ).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        İzin geçmişi bulunmuyor.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <Button
                    data-ocid="hr.personnel.close_button"
                    variant="outline"
                    className="w-full border-border"
                    onClick={() => setSelectedPersonnel(null)}
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CapacityPlanTab({ companyId }: { companyId: string }) {
  const storageKey = `pv_capacity_plan_${companyId}`;
  const MONTHS = [
    "Öca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Éki",
    "Kas",
    "Ara",
  ];

  interface CapacityEntry {
    id: string;
    personnelName: string;
    assignments: string[]; // 12 months
  }

  const [entries, setEntries] = useState<CapacityEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    personnelName: "",
    assignments: Array(12).fill("Müsait"),
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, storageKey]);

  const handleSave = () => {
    if (!form.personnelName) return;
    setEntries((p) => [
      ...p,
      { id: crypto.randomUUID(), ...form, assignments: [...form.assignments] },
    ]);
    setForm({ personnelName: "", assignments: Array(12).fill("Müsait") });
    setDialogOpen(false);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button
          data-ocid="hr.capacity.open_modal_button"
          onClick={() => setDialogOpen(true)}
          className="gradient-bg text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Personel Ekle
        </Button>
      </div>
      <Card className="bg-card border-border overflow-x-auto">
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div
              data-ocid="hr.capacity.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <CalendarRange className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Henüz kapasite planı yok
              </p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Personel ekleyerek aylara göre proje ataması yapın
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium w-40 min-w-40">
                      Personel
                    </th>
                    {MONTHS.map((m) => (
                      <th
                        key={m}
                        className="py-3 px-2 text-center text-muted-foreground font-medium min-w-20"
                      >
                        {m}
                      </th>
                    ))}
                    <th className="py-3 px-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => (
                    <tr
                      key={e.id}
                      data-ocid={`hr.capacity.item.${idx + 1}`}
                      className="border-b border-border hover:bg-muted/20"
                    >
                      <td className="py-2 px-4 font-medium text-foreground">
                        {e.personnelName}
                      </td>
                      {e.assignments.map((a, mi) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: month index is stable
                        <td key={mi} className="py-2 px-1">
                          <input
                            type="text"
                            className="w-full bg-transparent border border-transparent hover:border-border focus:border-amber-500 rounded px-1 py-0.5 text-center text-xs outline-none"
                            value={a}
                            onChange={(ev) => {
                              const newAssign = [...e.assignments];
                              newAssign[mi] = ev.target.value;
                              setEntries((p) =>
                                p.map((x) =>
                                  x.id === e.id
                                    ? { ...x, assignments: newAssign }
                                    : x,
                                ),
                              );
                            }}
                          />
                        </td>
                      ))}
                      <td className="py-2 px-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          data-ocid={`hr.capacity.delete_button.${idx + 1}`}
                          onClick={() =>
                            setEntries((p) => p.filter((x) => x.id !== e.id))
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="hr.capacity.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">Personel Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Personel Adı *</Label>
              <Input
                data-ocid="hr.capacity.input"
                className="border-border bg-background"
                placeholder="Ad Soyad"
                value={form.personnelName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, personnelName: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="hr.capacity.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="hr.capacity.submit_button"
              className="gradient-bg text-white"
              onClick={handleSave}
              disabled={!form.personnelName}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
