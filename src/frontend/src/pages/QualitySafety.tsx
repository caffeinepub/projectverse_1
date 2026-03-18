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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  HardHat,
  Plus,
  Shield,
  ShieldAlert,
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

export default function QualitySafety() {
  const {
    activeCompanyId,
    projects,
    hrPersonnel: personnel,
    activeRoleId,
    checkPermission,
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
      </Tabs>
    </div>
  );
}
