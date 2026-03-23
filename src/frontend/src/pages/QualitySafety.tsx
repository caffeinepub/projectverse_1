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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Edit2,
  FileCheck,
  FileWarning,
  HardHat,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../contexts/AppContext";

type QCStatus = "beklemede" | "gecti" | "kaldi" | "duzeltici-aksiyon";
type Severity = "dusuk" | "orta" | "yuksek" | "kritik";
type IncidentStatus = "acik" | "incelemede" | "kapali";

interface QCInspection {
  id: string;
  title: string;
  projectId: string;
  date: string;
  inspector: string;
  type: "kalite" | "guvenlik";
  status: QCStatus;
  checklist: { item: string; passed: boolean | null }[];
  notes: string;
  correctiveAction?: string;
}

interface Incident {
  id: string;
  title: string;
  projectId: string;
  date: string;
  reporter: string;
  severity: Severity;
  type: "kaza" | "ramak-kala" | "tehlike" | "ppe-ihlal";
  status: IncidentStatus;
  description: string;
  actionTaken?: string;
}

const QUALITY_CHECKLIST_TEMPLATES: Record<string, string[]> = {
  kalite: [
    "Malzeme kalite belgesi kontrol edildi",
    "İşçilik standartlarına uygun",
    "Ölçüm ve toleranslar doğrulandı",
    "Yüzey kalitesi kabul edilebilir",
    "Kayıt ve dokümantasyon tamamlandı",
  ],
  guvenlik: [
    "Kişisel koruyucu ekipman (KKE) kullanımı",
    "Çalışma alanı güvenlik çevrimi kurulu",
    "Elektrik ekipmanları kontrol edildi",
    "Acil çıkış yolları açık",
    "İlk yardım kiti mevcut ve eksiksiz",
    "Tehlikeli madde depolama uygun",
  ],
};

const INITIAL_INSPECTIONS: QCInspection[] = [];

const INITIAL_INCIDENTS: Incident[] = [];

const STATUS_LABELS: Record<QCStatus, string> = {
  beklemede: "Beklemede",
  gecti: "Geçti",
  kaldi: "Kaldı",
  "duzeltici-aksiyon": "Düzeltici Aksiyon",
};

const STATUS_COLORS: Record<QCStatus, string> = {
  beklemede: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  gecti: "bg-green-500/20 text-green-400 border-green-500/30",
  kaldi: "bg-red-500/20 text-red-400 border-red-500/30",
  "duzeltici-aksiyon": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const SEV_LABELS: Record<Severity, string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
  kritik: "Kritik",
};

const SEV_COLORS: Record<Severity, string> = {
  dusuk: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  orta: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  yuksek: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  kritik: "bg-red-500/20 text-red-400 border-red-500/30",
};

const INC_STATUS_LABELS: Record<IncidentStatus, string> = {
  acik: "Açık",
  incelemede: "İncelemede",
  kapali: "Kapalı",
};

const INC_STATUS_COLORS: Record<IncidentStatus, string> = {
  acik: "bg-red-500/20 text-red-400 border-red-500/30",
  incelemede: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  kapali: "bg-green-500/20 text-green-400 border-green-500/30",
};

function InspectionTestsTab({ companyId }: { companyId: string }) {
  const storageKey = `pv_inspection_tests_${companyId}`;
  type TestResult = "Geçti" | "Kaldı" | "Bekliyor";
  interface InspectionTest {
    id: string;
    testNo: string;
    project: string;
    testType: string;
    date: string;
    result: TestResult;
    standard: string;
    certNo: string;
    description: string;
  }
  const [tests, setTests] = useState<InspectionTest[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const EMPTY = {
    project: "",
    testType: "",
    date: "",
    result: "Bekliyor" as TestResult,
    standard: "",
    certNo: "",
    description: "",
  };
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tests));
  }, [tests, storageKey]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (t: InspectionTest) => {
    setEditId(t.id);
    setForm({
      project: t.project,
      testType: t.testType,
      date: t.date,
      result: t.result,
      standard: t.standard,
      certNo: t.certNo,
      description: t.description,
    });
    setDialogOpen(true);
  };
  const handleSave = () => {
    if (!form.testType || !form.date) return;
    if (editId) {
      setTests((p) => p.map((x) => (x.id === editId ? { ...x, ...form } : x)));
    } else {
      const testNo = `TST-${String(tests.length + 1).padStart(4, "0")}`;
      setTests((p) => [...p, { id: crypto.randomUUID(), testNo, ...form }]);
    }
    setDialogOpen(false);
  };

  const RESULT_STYLES: Record<TestResult, string> = {
    Geçti: "bg-green-500/15 text-green-400 border-green-500/30",
    Kaldı: "bg-red-500/15 text-red-400 border-red-500/30",
    Bekliyor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  const TEST_TYPES = [
    "Beton Basınç Testi",
    "Zemin Etüdü",
    "Kaynak Muayenesi",
    "Elektrik Testi",
    "Su Yalıtım Testi",
    "Yangın Testi",
    "Yük Testi",
    "Ultrasonik Test",
    "Radyografik Test",
    "Diğer",
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          data-ocid="quality.inspection_test.open_modal_button"
          onClick={openAdd}
          className="gradient-bg text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Test Kaydı Ekle
        </Button>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {tests.length === 0 ? (
            <div
              data-ocid="quality.inspection_test.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Henüz test kaydı yok
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    Test No
                  </TableHead>
                  <TableHead className="text-muted-foreground">Proje</TableHead>
                  <TableHead className="text-muted-foreground">
                    Test Türü
                  </TableHead>
                  <TableHead className="text-muted-foreground">Tarih</TableHead>
                  <TableHead className="text-muted-foreground">Sonuç</TableHead>
                  <TableHead className="text-muted-foreground">
                    Standart
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Sertifika No
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((t, idx) => (
                  <TableRow
                    key={t.id}
                    data-ocid={`quality.inspection_test.item.${idx + 1}`}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="font-mono text-xs text-amber-400">
                      {t.testNo}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.project || "-"}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {t.testType}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${RESULT_STYLES[t.result]}`}
                      >
                        {t.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.standard || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.certNo || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          data-ocid={`quality.inspection_test.edit_button.${idx + 1}`}
                          onClick={() => openEdit(t)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          data-ocid={`quality.inspection_test.delete_button.${idx + 1}`}
                          onClick={() =>
                            setTests((p) => p.filter((x) => x.id !== t.id))
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="quality.inspection_test.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editId ? "Test Kaydını Düzenle" : "Yeni Test Kaydı"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Proje</Label>
              <Input
                className="border-border bg-background"
                placeholder="Proje adı"
                value={form.project}
                onChange={(e) =>
                  setForm((p) => ({ ...p, project: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Test Türü *</Label>
              <Select
                value={form.testType}
                onValueChange={(v) => setForm((p) => ({ ...p, testType: v }))}
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="quality.inspection_test.select"
                >
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Tarih *</Label>
              <Input
                data-ocid="quality.inspection_test.input"
                type="date"
                className="border-border bg-background"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Sonuç</Label>
              <Select
                value={form.result}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, result: v as TestResult }))
                }
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="quality.inspection_test.result.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                  <SelectItem value="Geçti">Geçti</SelectItem>
                  <SelectItem value="Kaldı">Kaldı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Standart</Label>
              <Input
                className="border-border bg-background"
                placeholder="TS EN 12350-2"
                value={form.standard}
                onChange={(e) =>
                  setForm((p) => ({ ...p, standard: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Sertifika No</Label>
              <Input
                className="border-border bg-background"
                placeholder="SRT-001"
                value={form.certNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, certNo: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Açıklama</Label>
              <Textarea
                className="border-border bg-background resize-none"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="quality.inspection_test.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="quality.inspection_test.submit_button"
              className="gradient-bg text-white"
              onClick={handleSave}
              disabled={!form.testType || !form.date}
            >
              {editId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function QualitySafety() {
  const {
    activeCompanyId,
    projects,
    hrPersonnel: personnel,
    activeRoleId,
    checkPermission,
    qualityChecklists,
    setQualityChecklists,
    ncrRecords,
    setNcrRecords,
    currentCompany,
    user,
    addAuditLog,
  } = useApp();

  const storageKey = `pv_qs_${activeCompanyId}`;
  const storageKeyInc = `pv_inc_${activeCompanyId}`;

  // ── Audit Log ─────────────────────────────────────────────────────────────
  interface QsAuditEntry {
    id: string;
    action: string;
    details: string;
    user: string;
    timestamp: string;
  }
  const qsAuditKey = `pv_qs_audit_${activeCompanyId || "default"}`;
  const [qsAuditLog, setQsAuditLog] = useState<QsAuditEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(qsAuditKey) || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      setQsAuditLog(
        JSON.parse(
          localStorage.getItem(`pv_qs_audit_${activeCompanyId || "default"}`) ||
            "[]",
        ),
      );
    } catch {
      setQsAuditLog([]);
    }
  }, [activeCompanyId]);
  const addQsAudit = (action: string, details: string) => {
    const entry: QsAuditEntry = {
      id: `qs_audit_${Date.now()}`,
      action,
      details,
      user: "Kullanıcı",
      timestamp: new Date().toISOString(),
    };
    setQsAuditLog((prev) => {
      const updated = [entry, ...prev];
      localStorage.setItem(
        `pv_qs_audit_${activeCompanyId || "default"}`,
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const [inspections, setInspections] = useState<QCInspection[]>(() => {
    if (!activeCompanyId) return INITIAL_INSPECTIONS;
    const s = localStorage.getItem(storageKey);
    return s ? JSON.parse(s) : INITIAL_INSPECTIONS;
  });

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    if (!activeCompanyId) return INITIAL_INCIDENTS;
    const s = localStorage.getItem(storageKeyInc);
    return s ? JSON.parse(s) : INITIAL_INCIDENTS;
  });

  // Reload data when company changes
  useEffect(() => {
    if (!activeCompanyId) return;
    const si = localStorage.getItem(`pv_qs_${activeCompanyId}`);
    setInspections(si ? JSON.parse(si) : []);
    const sinc = localStorage.getItem(`pv_inc_${activeCompanyId}`);
    setIncidents(sinc ? JSON.parse(sinc) : []);
  }, [activeCompanyId]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(storageKey, JSON.stringify(inspections));
    }
  }, [inspections, activeCompanyId, storageKey]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(storageKeyInc, JSON.stringify(incidents));
    }
  }, [incidents, activeCompanyId, storageKeyInc]);

  const canEdit =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    checkPermission("qualitySafety", "edit");

  // KPIs
  const kpis = useMemo(() => {
    const total = inspections.length;
    const passed = inspections.filter((i) => i.status === "gecti").length;
    const openIncidents = incidents.filter((i) => i.status !== "kapali").length;
    const criticalIncidents = incidents.filter(
      (i) => i.severity === "kritik" && i.status !== "kapali",
    ).length;
    return { total, passed, openIncidents, criticalIncidents };
  }, [inspections, incidents]);

  // New Inspection
  const [newInspOpen, setNewInspOpen] = useState(false);
  const [newInsp, setNewInsp] = useState({
    title: "",
    projectId: "",
    type: "kalite" as "kalite" | "guvenlik",
    inspector: "",
    notes: "",
  });

  const handleAddInspection = () => {
    if (!newInsp.title || !newInsp.inspector) return;
    const checklist = QUALITY_CHECKLIST_TEMPLATES[newInsp.type].map((item) => ({
      item,
      passed: null,
    }));
    const insp: QCInspection = {
      id: `qi-${Date.now()}`,
      title: newInsp.title,
      projectId: newInsp.projectId,
      date: new Date().toISOString().split("T")[0],
      inspector: newInsp.inspector,
      type: newInsp.type,
      status: "beklemede",
      checklist,
      notes: newInsp.notes,
    };
    setInspections((prev) => [insp, ...prev]);
    setNewInsp({
      title: "",
      projectId: "",
      type: "kalite",
      inspector: "",
      notes: "",
    });
    addQsAudit("Denetim Eklendi", `${newInsp.title}`);
    setNewInspOpen(false);
  };

  // New Incident
  const [newIncOpen, setNewIncOpen] = useState(false);
  const [newInc, setNewInc] = useState({
    title: "",
    projectId: "",
    type: "tehlike" as Incident["type"],
    severity: "orta" as Severity,
    reporter: "",
    description: "",
  });

  const handleAddIncident = () => {
    if (!newInc.title || !newInc.reporter || !newInc.description) return;
    const inc: Incident = {
      id: `inc-${Date.now()}`,
      title: newInc.title,
      projectId: newInc.projectId,
      date: new Date().toISOString().split("T")[0],
      reporter: newInc.reporter,
      severity: newInc.severity,
      type: newInc.type,
      status: "acik",
      description: newInc.description,
    };
    setIncidents((prev) => [inc, ...prev]);
    setNewInc({
      title: "",
      projectId: "",
      type: "tehlike",
      severity: "orta",
      reporter: "",
      description: "",
    });
    addQsAudit("Olay Bildirildi", `${newInc.title}`);
    setNewIncOpen(false);
  };

  // Detail modal
  const [selectedInsp, setSelectedInsp] = useState<QCInspection | null>(null);
  const [_selectedInc, setSelectedInc] = useState<Incident | null>(null);

  const _toggleChecklistItem = (inspId: string, idx: number) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== inspId) return i;
        const newChecklist = i.checklist.map((c, ci) =>
          ci === idx
            ? {
                ...c,
                passed:
                  c.passed === true ? false : c.passed === false ? null : true,
              }
            : c,
        );
        const allDone = newChecklist.every((c) => c.passed !== null);
        const allPassed = newChecklist.every((c) => c.passed === true);
        const anyFailed = newChecklist.some((c) => c.passed === false);
        const status: QCStatus = !allDone
          ? "beklemede"
          : allPassed
            ? "gecti"
            : anyFailed
              ? "duzeltici-aksiyon"
              : "beklemede";
        return { ...i, checklist: newChecklist, status };
      }),
    );
    if (selectedInsp?.id === inspId) {
      setSelectedInsp((prev) => {
        if (!prev) return prev;
        const newChecklist = prev.checklist.map((c, ci) =>
          ci === idx
            ? {
                ...c,
                passed:
                  c.passed === true ? false : c.passed === false ? null : true,
              }
            : c,
        );
        return { ...prev, checklist: newChecklist };
      });
    }
  };

  const _updateIncidentStatus = (
    id: string,
    status: IncidentStatus,
    actionTaken?: string,
  ) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status, ...(actionTaken ? { actionTaken } : {}) }
          : i,
      ),
    );
    setSelectedInc((prev) =>
      prev?.id === id
        ? { ...prev, status, ...(actionTaken ? { actionTaken } : {}) }
        : prev,
    );
  };

  const [_incidentActionText, _setIncidentActionText] = useState("");

  return (
    <div
      data-ocid="quality_safety.page"
      className="p-6 space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Kalite & Güvenlik
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Kalite kontrol denetimleri ve İSG yönetimi
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <ClipboardList className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Denetim</p>
                <p className="text-xl font-bold">{kpis.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Geçen Denetim</p>
                <p className="text-xl font-bold">{kpis.passed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Açık Olay</p>
                <p className="text-xl font-bold">{kpis.openIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kritik Olay</p>
                <p className="text-xl font-bold">{kpis.criticalIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inspections" data-ocid="quality_safety.tab">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="inspections"
            data-ocid="quality_safety.inspections_tab"
          >
            <ClipboardList className="w-4 h-4 mr-1.5" />
            Denetimler
          </TabsTrigger>
          <TabsTrigger
            value="incidents"
            data-ocid="quality_safety.incidents_tab"
          >
            <ShieldAlert className="w-4 h-4 mr-1.5" />
            Olaylar & Riskler
          </TabsTrigger>
          <TabsTrigger value="audit" data-ocid="quality_safety.audit_tab">
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            value="checklists"
            data-ocid="quality_safety.checklists_tab"
          >
            <FileCheck className="w-4 h-4 mr-1.5" />
            Kontrol Listeleri
          </TabsTrigger>
          <TabsTrigger value="ncr" data-ocid="quality_safety.ncr_tab">
            <AlertOctagon className="w-4 h-4 mr-1.5" />
            NCR Kayıtları
          </TabsTrigger>
          <TabsTrigger
            value="inspectiontests"
            data-ocid="quality_safety.inspectiontests_tab"
          >
            Muayene & Testler
          </TabsTrigger>
        </TabsList>

        {/* INSPECTIONS TAB */}
        <TabsContent value="inspections" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Kalite & Güvenlik Denetimleri</h2>
            {canEdit && (
              <Dialog open={newInspOpen} onOpenChange={setNewInspOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="quality_safety.add_inspection_button"
                    size="sm"
                    className="gradient-bg"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Yeni Denetim
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Yeni Denetim Oluştur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Denetim Başlığı</Label>
                      <Input
                        data-ocid="quality_safety.inspection_title_input"
                        value={newInsp.title}
                        onChange={(e) =>
                          setNewInsp((p) => ({ ...p, title: e.target.value }))
                        }
                        placeholder="Denetim başlığı..."
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label>Tür</Label>
                      <Select
                        value={newInsp.type}
                        onValueChange={(v) =>
                          setNewInsp((p) => ({
                            ...p,
                            type: v as "kalite" | "guvenlik",
                          }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="quality_safety.inspection_type_select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="kalite">
                            Kalite Kontrolü
                          </SelectItem>
                          <SelectItem value="guvenlik">
                            Güvenlik Denetimi
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Proje</Label>
                      <Select
                        value={newInsp.projectId}
                        onValueChange={(v) =>
                          setNewInsp((p) => ({ ...p, projectId: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="quality_safety.inspection_project_select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Proje seçin (opsiyonel)" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {projects.map((proj) => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Denetçi</Label>
                      <Select
                        value={newInsp.inspector}
                        onValueChange={(v) =>
                          setNewInsp((p) => ({ ...p, inspector: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="quality_safety.inspection_inspector_select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Denetçi seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {personnel.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notlar</Label>
                      <Textarea
                        data-ocid="quality_safety.inspection_notes_input"
                        value={newInsp.notes}
                        onChange={(e) =>
                          setNewInsp((p) => ({ ...p, notes: e.target.value }))
                        }
                        placeholder="Denetim notları..."
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="quality_safety.inspection_cancel_button"
                      variant="outline"
                      onClick={() => setNewInspOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="quality_safety.inspection_submit_button"
                      className="gradient-bg"
                      onClick={handleAddInspection}
                    >
                      Oluştur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-3">
            {inspections.length === 0 && (
              <div
                data-ocid="quality_safety.inspections_empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Henüz denetim kaydı yok</p>
              </div>
            )}
            {inspections.map((insp, idx) => (
              <button
                type="button"
                key={insp.id}
                data-ocid={`quality_safety.inspection_item.${idx + 1}`}
                className="card-dark rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-colors w-full text-left"
                onClick={() => setSelectedInsp(insp)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {insp.type === "kalite" ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    ) : (
                      <HardHat className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{insp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {insp.inspector} · {insp.date}
                        {insp.projectId && (
                          <>
                            {" "}
                            ·{" "}
                            {projects.find((p) => p.id === insp.projectId)
                              ?.title ?? insp.projectId}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      className={`text-xs border ${STATUS_COLORS[insp.status]}`}
                    >
                      {STATUS_LABELS[insp.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insp.type === "kalite" ? "Kalite" : "Güvenlik"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {insp.checklist.slice(0, 3).map((c) => (
                    <span
                      key={c.item}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        c.passed === true
                          ? "bg-green-500/20 text-green-400"
                          : c.passed === false
                            ? "bg-red-500/20 text-red-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.passed === true ? "✓" : c.passed === false ? "✗" : "·"}{" "}
                      {c.item.slice(0, 20)}...
                    </span>
                  ))}
                  {insp.checklist.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{insp.checklist.length - 3} daha
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* INCIDENTS TAB */}
        <TabsContent value="incidents" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Olay & Risk Kayıtları</h2>
            {canEdit && (
              <Dialog open={newIncOpen} onOpenChange={setNewIncOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="quality_safety.add_incident_button"
                    size="sm"
                    className="gradient-bg"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Yeni Olay Bildir
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Yeni Olay / Tehlike Bildirimi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Başlık</Label>
                      <Input
                        data-ocid="quality_safety.incident_title_input"
                        value={newInc.title}
                        onChange={(e) =>
                          setNewInc((p) => ({ ...p, title: e.target.value }))
                        }
                        placeholder="Olay başlığı..."
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tür</Label>
                        <Select
                          value={newInc.type}
                          onValueChange={(v) =>
                            setNewInc((p) => ({
                              ...p,
                              type: v as Incident["type"],
                            }))
                          }
                        >
                          <SelectTrigger
                            data-ocid="quality_safety.incident_type_select"
                            className="mt-1 bg-background border-border"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="kaza">Kaza</SelectItem>
                            <SelectItem value="ramak-kala">
                              Ramak Kala
                            </SelectItem>
                            <SelectItem value="tehlike">
                              Tehlike Bildirimi
                            </SelectItem>
                            <SelectItem value="ppe-ihlal">
                              KKE İhlali
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Şiddet</Label>
                        <Select
                          value={newInc.severity}
                          onValueChange={(v) =>
                            setNewInc((p) => ({
                              ...p,
                              severity: v as Severity,
                            }))
                          }
                        >
                          <SelectTrigger
                            data-ocid="quality_safety.incident_severity_select"
                            className="mt-1 bg-background border-border"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="dusuk">Düşük</SelectItem>
                            <SelectItem value="orta">Orta</SelectItem>
                            <SelectItem value="yuksek">Yüksek</SelectItem>
                            <SelectItem value="kritik">Kritik</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Bildiren</Label>
                      <Select
                        value={newInc.reporter}
                        onValueChange={(v) =>
                          setNewInc((p) => ({ ...p, reporter: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="quality_safety.incident_reporter_select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {personnel.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Açıklama</Label>
                      <Textarea
                        data-ocid="quality_safety.incident_description_input"
                        value={newInc.description}
                        onChange={(e) =>
                          setNewInc((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Olay detayları..."
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="quality_safety.incident_cancel_button"
                      variant="outline"
                      onClick={() => setNewIncOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="quality_safety.incident_submit_button"
                      className="gradient-bg"
                      onClick={handleAddIncident}
                    >
                      Bildir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-3">
            {incidents.length === 0 && (
              <div
                data-ocid="quality_safety.incidents_empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Henüz olay kaydı yok</p>
              </div>
            )}
            {incidents.map((inc, idx) => (
              <button
                type="button"
                key={inc.id}
                data-ocid={`quality_safety.incident_item.${idx + 1}`}
                className="card-dark rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-colors w-full text-left"
                onClick={() => setSelectedInc(inc)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{inc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {inc.reporter} · {inc.date}
                        {inc.projectId && (
                          <>
                            {" "}
                            ·{" "}
                            {projects.find((p) => p.id === inc.projectId)
                              ?.title ?? inc.projectId}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      className={`text-xs border ${SEV_COLORS[inc.severity]}`}
                    >
                      {SEV_LABELS[inc.severity]}
                    </Badge>
                    <Badge
                      className={`text-xs border ${INC_STATUS_COLORS[inc.status]}`}
                    >
                      {INC_STATUS_LABELS[inc.status]}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                  {inc.description}
                </p>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-4">
          {qsAuditLog.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-medium">Henüz denetim kaydı bulunmuyor.</p>
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
                      Zaman
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Kullanıcı
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      İşlem
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Detay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {qsAuditLog.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(entry.timestamp).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {entry.user}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {entry.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* CHECKLISTS TAB */}
        <TabsContent value="checklists" className="mt-4 space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <ChecklistDialog
                projects={projects}
                currentCompany={currentCompany}
                qualityChecklists={qualityChecklists}
                setQualityChecklists={setQualityChecklists}
                user={user}
                addAuditLog={addAuditLog}
              />
            </div>
          )}
          <ChecklistList
            qualityChecklists={qualityChecklists.filter(
              (c) => c.companyId === currentCompany?.id,
            )}
            setQualityChecklists={setQualityChecklists}
            canEdit={canEdit}
          />
        </TabsContent>

        {/* NCR TAB */}
        <TabsContent value="ncr" className="mt-4 space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <NCRDialog
                projects={projects}
                currentCompany={currentCompany}
                ncrRecords={ncrRecords}
                setNcrRecords={setNcrRecords}
                user={user}
                addAuditLog={addAuditLog}
              />
            </div>
          )}
          <NCRList
            ncrRecords={ncrRecords.filter(
              (n) => n.companyId === currentCompany?.id,
            )}
            setNcrRecords={setNcrRecords}
            canEdit={canEdit}
          />
        </TabsContent>
        <TabsContent value="inspectiontests" className="mt-4">
          <InspectionTestsTab companyId={currentCompany?.id || "default"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Checklist Dialog Component ───────────────────────────────────────────────
function ChecklistDialog({
  projects,
  currentCompany,
  qualityChecklists,
  setQualityChecklists,
  user,
  addAuditLog,
}: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    projectId: "",
    workPackage: "",
    items: [{ description: "", responsible: "" }] as {
      description: string;
      responsible: string;
    }[],
  });

  const handleAdd = () => {
    if (!form.title) return;
    const checklist = {
      id: `cl${Date.now()}`,
      companyId: currentCompany?.id || "",
      projectId: form.projectId,
      title: form.title,
      workPackage: form.workPackage,
      items: form.items
        .filter((i: any) => i.description)
        .map((i: any, idx: number) => ({
          id: `cli${Date.now()}${idx}`,
          description: i.description,
          status: "Beklemede" as const,
          responsible: i.responsible,
          date: "",
        })),
      status: "Açık" as const,
      createdAt: new Date().toISOString(),
    };
    setQualityChecklists([checklist, ...qualityChecklists]);
    addAuditLog?.({
      module: "qualitySafety",
      action: "Kontrol Listesi Eklendi",
      description: form.title,
      performedBy: user?.name || "",
    });
    setForm({
      title: "",
      projectId: "",
      workPackage: "",
      items: [{ description: "", responsible: "" }],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="quality_safety.checklist.primary_button"
          className="gradient-bg text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kontrol Listesi
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="quality_safety.checklist.dialog"
        className="bg-card border-border max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Yeni Kontrol Listesi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Başlık *</Label>
            <Input
              data-ocid="quality_safety.checklist.title.input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-background border-border mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Proje</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v })}
              >
                <SelectTrigger
                  data-ocid="quality_safety.checklist.project.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>İş Paketi</Label>
              <Input
                data-ocid="quality_safety.checklist.package.input"
                value={form.workPackage}
                onChange={(e) =>
                  setForm({ ...form, workPackage: e.target.value })
                }
                className="bg-background border-border mt-1"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Kontrol Maddeleri</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-amber-400"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [
                      ...form.items,
                      { description: "", responsible: "" },
                    ],
                  })
                }
              >
                <Plus className="w-3 h-3 mr-1" />
                Madde Ekle
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {form.items.map((item: any, idx: number) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[idx].description = e.target.value;
                      setForm({ ...form, items });
                    }}
                    placeholder="Madde açıklaması"
                    className="bg-background border-border flex-1"
                  />
                  <Input
                    value={item.responsible}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[idx].responsible = e.target.value;
                      setForm({ ...form, items });
                    }}
                    placeholder="Sorumlu"
                    className="bg-background border-border w-28"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button
            data-ocid="quality_safety.checklist.submit_button"
            className="gradient-bg text-white"
            onClick={handleAdd}
          >
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Checklist List Component ─────────────────────────────────────────────────
function ChecklistList({
  qualityChecklists,
  setQualityChecklists,
  canEdit,
}: any) {
  if (qualityChecklists.length === 0) {
    return (
      <Card
        data-ocid="quality_safety.checklists.empty_state"
        className="bg-card border-border"
      >
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <FileCheck className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Henüz kontrol listesi oluşturulmadı
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleItem = (
    checklistId: string,
    itemId: string,
    status: "Geçti" | "Başarısız",
  ) => {
    setQualityChecklists(
      qualityChecklists.map((cl: any) => {
        if (cl.id !== checklistId) return cl;
        const items = cl.items.map((i: any) =>
          i.id === itemId
            ? { ...i, status, date: new Date().toISOString().split("T")[0] }
            : i,
        );
        const allDone = items.every((i: any) => i.status !== "Beklemede");
        return { ...cl, items, status: allDone ? "Tamamlandı" : "Açık" };
      }),
    );
  };

  return (
    <div className="space-y-3">
      {qualityChecklists.map((cl: any, idx: number) => (
        <Card
          key={cl.id}
          data-ocid={`quality_safety.checklist.item.${idx + 1}`}
          className="bg-card border-border"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{cl.title}</CardTitle>
                {cl.workPackage && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cl.workPackage}
                  </p>
                )}
              </div>
              <Badge
                className={
                  cl.status === "Tamamlandı"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-amber-500/20 text-amber-400"
                }
              >
                {cl.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {cl.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${item.status === "Geçti" ? "bg-green-400" : item.status === "Başarısız" ? "bg-red-400" : "bg-amber-400"}`}
                    />
                    <span className="text-sm text-foreground">
                      {item.description}
                    </span>
                    {item.responsible && (
                      <span className="text-xs text-muted-foreground">
                        ({item.responsible})
                      </span>
                    )}
                  </div>
                  {canEdit && item.status === "Beklemede" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs text-green-400"
                        onClick={() => toggleItem(cl.id, item.id, "Geçti")}
                      >
                        Geçti
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs text-red-400"
                        onClick={() => toggleItem(cl.id, item.id, "Başarısız")}
                      >
                        Başarısız
                      </Button>
                    </div>
                  )}
                  {item.status !== "Beklemede" && (
                    <Badge
                      className={
                        item.status === "Geçti"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }
                    >
                      {item.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── NCR Dialog Component ─────────────────────────────────────────────────────
function NCRDialog({
  projects,
  currentCompany,
  ncrRecords,
  setNcrRecords,
  user,
  addAuditLog,
}: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    description: "",
    affectedArea: "",
    responsible: "",
    correctiveAction: "",
    dueDate: "",
    severity: "Orta" as const,
  });

  const handleAdd = () => {
    if (!form.description) return;
    const ncr = {
      id: `ncr${Date.now()}`,
      companyId: currentCompany?.id || "",
      projectId: form.projectId,
      ncrNo: `NCR-${Date.now().toString().slice(-5)}`,
      description: form.description,
      affectedArea: form.affectedArea,
      responsible: form.responsible,
      correctiveAction: form.correctiveAction,
      dueDate: form.dueDate,
      closureDate: "",
      status: "Açık" as const,
      severity: form.severity,
      createdAt: new Date().toISOString(),
    };
    setNcrRecords([ncr, ...ncrRecords]);
    addAuditLog?.({
      module: "qualitySafety",
      action: "NCR Eklendi",
      description: ncr.ncrNo,
      performedBy: user?.name || "",
    });
    setForm({
      projectId: "",
      description: "",
      affectedArea: "",
      responsible: "",
      correctiveAction: "",
      dueDate: "",
      severity: "Orta",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="quality_safety.ncr.primary_button"
          className="gradient-bg text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni NCR
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="quality_safety.ncr.dialog"
        className="bg-card border-border max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Yeni Uygunsuzluk Raporu (NCR)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Proje</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v })}
              >
                <SelectTrigger
                  data-ocid="quality_safety.ncr.project.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Önem Derecesi</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => setForm({ ...form, severity: v as any })}
              >
                <SelectTrigger
                  data-ocid="quality_safety.ncr.severity.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["Düşük", "Orta", "Yüksek"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Uygunsuzluk Açıklaması *</Label>
            <Textarea
              data-ocid="quality_safety.ncr.description.textarea"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="bg-background border-border mt-1"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Etkilenen Alan</Label>
              <Input
                data-ocid="quality_safety.ncr.area.input"
                value={form.affectedArea}
                onChange={(e) =>
                  setForm({ ...form, affectedArea: e.target.value })
                }
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Sorumlu</Label>
              <Input
                data-ocid="quality_safety.ncr.responsible.input"
                value={form.responsible}
                onChange={(e) =>
                  setForm({ ...form, responsible: e.target.value })
                }
                className="bg-background border-border mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Düzeltici Faaliyet</Label>
            <Textarea
              data-ocid="quality_safety.ncr.corrective.textarea"
              value={form.correctiveAction}
              onChange={(e) =>
                setForm({ ...form, correctiveAction: e.target.value })
              }
              className="bg-background border-border mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label>Son Tarih</Label>
            <Input
              data-ocid="quality_safety.ncr.due_date.input"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="bg-background border-border mt-1"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button
            data-ocid="quality_safety.ncr.submit_button"
            className="gradient-bg text-white"
            onClick={handleAdd}
          >
            NCR Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── NCR List Component ───────────────────────────────────────────────────────
function NCRList({ ncrRecords, setNcrRecords, canEdit }: any) {
  const SEVERITY_STYLES: Record<string, string> = {
    Düşük: "bg-green-500/20 text-green-400",
    Orta: "bg-amber-500/20 text-amber-400",
    Yüksek: "bg-red-500/20 text-red-400",
  };

  if (ncrRecords.length === 0) {
    return (
      <Card
        data-ocid="quality_safety.ncr.empty_state"
        className="bg-card border-border"
      >
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertOctagon className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">NCR kaydı bulunmuyor</p>
        </CardContent>
      </Card>
    );
  }

  const handleClose = (id: string) => {
    setNcrRecords(
      ncrRecords.map((n: any) =>
        n.id === id
          ? {
              ...n,
              status: "Kapatıldı",
              closureDate: new Date().toISOString().split("T")[0],
            }
          : n,
      ),
    );
  };

  return (
    <div className="space-y-3">
      {ncrRecords.map((ncr: any, idx: number) => (
        <Card
          key={ncr.id}
          data-ocid={`quality_safety.ncr.item.${idx + 1}`}
          className="bg-card border-border"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">
                    {ncr.ncrNo}
                  </span>
                  <Badge className={SEVERITY_STYLES[ncr.severity]}>
                    {ncr.severity}
                  </Badge>
                  <Badge
                    className={
                      ncr.status === "Kapatıldı"
                        ? "bg-muted text-muted-foreground"
                        : ncr.status === "Devam Ediyor"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400"
                    }
                  >
                    {ncr.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {ncr.description}
                </p>
              </div>
              {canEdit && ncr.status !== "Kapatıldı" && (
                <Button
                  data-ocid={`quality_safety.ncr.close.button.${idx + 1}`}
                  size="sm"
                  variant="outline"
                  className="border-green-500/30 text-green-400 flex-shrink-0"
                  onClick={() => handleClose(ncr.id)}
                >
                  Kapat
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
              {ncr.affectedArea && <span>Alan: {ncr.affectedArea}</span>}
              {ncr.responsible && <span>Sorumlu: {ncr.responsible}</span>}
              {ncr.dueDate && <span>Son: {ncr.dueDate}</span>}
              {ncr.closureDate && <span>Kapanış: {ncr.closureDate}</span>}
            </div>
            {ncr.correctiveAction && (
              <p className="text-xs text-muted-foreground mt-2">
                Düzeltici: {ncr.correctiveAction}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
