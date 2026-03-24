import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  HardHat,
  Image,
  MapPin,
  Paperclip,
  Plus,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import {
  type FieldInspection,
  type InspectionStatus,
  type TaskPriority,
  type WorkOrder,
  type WorkOrderStatus,
  useApp,
} from "../contexts/AppContext";

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  open: "oklch(0.68 0.18 200)",
  in_progress: "oklch(0.72 0.18 50)",
  completed: "oklch(0.72 0.16 160)",
  cancelled: "oklch(0.58 0.015 264)",
};

const INSPECTION_STATUS_COLORS: Record<InspectionStatus, string> = {
  scheduled: "oklch(0.68 0.18 200)",
  in_progress: "oklch(0.72 0.18 50)",
  completed: "oklch(0.72 0.16 160)",
  failed: "oklch(0.65 0.22 25)",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "oklch(0.58 0.015 264)",
  medium: "oklch(0.72 0.18 50)",
  high: "oklch(0.68 0.22 30)",
  critical: "oklch(0.65 0.22 25)",
};

const INSPECTION_TYPES = [
  "Yangın Güvenliği",
  "Yapısal Güvenlik",
  "Elektrik",
  "Sıhhi Tesisat",
  "Genel",
];

const DEFAULT_CHECKLIST: Record<string, string[]> = {
  "Yangın Güvenliği": [
    "Yangın tüpleri doluluk kontrolü",
    "Acil çıkış yollarının açıklığı",
    "Yangın alarm sistemi testi",
    "Sprinkler sistemi basınç testi",
  ],
  "Yapısal Güvenlik": [
    "Kolon ve kirişlerde çatlak kontrolü",
    "Zemin oturma belirtileri",
    "İskele güvenlik kontrolleri",
    "Taşıyıcı sistem görsel muayene",
  ],
  Elektrik: [
    "Topraklama kontrolü",
    "Kablo yalıtım testi",
    "Pano terminalleri sıkılığı",
    "Aşırı akım koruyucular",
  ],
  "Sıhhi Tesisat": [
    "Boru bağlantı sızdırmazlık testi",
    "Su basıncı ölçümü",
    "Atık su hattı akış kontrolü",
  ],
  Genel: [
    "Genel temizlik ve düzen",
    "Güvenlik ekipman kontrolü",
    "Malzeme depolama uygunluğu",
    "Personel güvenlik tedbiri kontrolü",
  ],
};

interface FieldOpsProps {
  onNavigate?: (page: string) => void;
}

export default function FieldOps({ onNavigate }: FieldOpsProps = {}) {
  const {
    checkPermission,
    activeCompanyId,
    t,
    projects,
    workOrders,
    fieldInspections,
    addWorkOrder,
    updateWorkOrder,
    updateWorkOrderStatus,
    addFieldInspection,
    updateInspectionItem,
    completeInspection,
    failInspection,
    stockItems,
    deductStock,
    user,
    addAuditLog,
    auditLogs,
    setFieldInspections,
    hrPersonnel,
  } = useApp();

  const [woFilter, setWoFilter] = useState({
    search: "",
    status: "all",
    priority: "all",
    project: "all",
    assignedTo: "all",
  });
  const [woErrors, setWoErrors] = useState<{
    title?: string;
    assignedTo?: string;
  }>({});
  const [inspFilter, setInspFilter] = useState({
    search: "",
    type: "all",
    status: "all",
  });
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [selectedInspection, setSelectedInspection] =
    useState<FieldInspection | null>(null);
  const [showNewWO, setShowNewWO] = useState(false);
  const [showNewInspection, setShowNewInspection] = useState(false);
  const [markingFailed, setMarkingFailed] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [deductDialogOpen, setDeductDialogOpen] = useState(false);
  const [pendingCompleteWO, setPendingCompleteWO] = useState<WorkOrder | null>(
    null,
  );
  const [deductMaterial, setDeductMaterial] = useState("");
  const [deductQty, setDeductQty] = useState("");

  const woFileRef = useRef<HTMLInputElement>(null);
  const inspFileRef = useRef<HTMLInputElement>(null);

  const [newWO, setNewWO] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    priority: "medium" as TaskPriority,
    location: "",
    dueDate: "",
    status: "open" as WorkOrderStatus,
  });
  const [newInsp, setNewInsp] = useState({
    title: "",
    inspectionType: "Genel",
    projectId: "",
    assignedTo: "",
    scheduledDate: "",
    notes: "",
    status: "scheduled" as InspectionStatus,
    items: [] as {
      id: string;
      label: string;
      checked: boolean;
      note: string;
    }[],
    completedAt: undefined as string | undefined,
  });

  const stats = useMemo(() => {
    const activeWO = workOrders.filter(
      (w) => w.status === "open" || w.status === "in_progress",
    ).length;
    const openInsp = fieldInspections.filter(
      (f) => f.status === "scheduled" || f.status === "in_progress",
    ).length;
    const completedWO = workOrders.filter(
      (w) => w.status === "completed",
    ).length;
    return { activeWO, openInsp, completedWO, totalWO: workOrders.length };
  }, [workOrders, fieldInspections]);

  const filteredWO = useMemo(() => {
    return workOrders.filter((w) => {
      if (
        woFilter.search &&
        !w.title.toLowerCase().includes(woFilter.search.toLowerCase())
      )
        return false;
      if (woFilter.status !== "all" && w.status !== woFilter.status)
        return false;
      if (woFilter.priority !== "all" && w.priority !== woFilter.priority)
        return false;
      if (woFilter.project !== "all" && w.projectId !== woFilter.project)
        return false;
      if (woFilter.assignedTo !== "all" && w.assignedTo !== woFilter.assignedTo)
        return false;
      return true;
    });
  }, [workOrders, woFilter]);

  const filteredInspections = useMemo(() => {
    return fieldInspections.filter((f) => {
      if (
        inspFilter.search &&
        !f.title.toLowerCase().includes(inspFilter.search.toLowerCase())
      )
        return false;
      if (inspFilter.type !== "all" && f.inspectionType !== inspFilter.type)
        return false;
      if (inspFilter.status !== "all" && f.status !== inspFilter.status)
        return false;
      return true;
    });
  }, [fieldInspections, inspFilter]);

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.title || id;

  const getWOStatusLabel = (s: WorkOrderStatus) => {
    const map: Record<WorkOrderStatus, string> = {
      open: t.workOrderOpen,
      in_progress: t.workOrderInProgress,
      completed: t.workOrderCompleted,
      cancelled: t.workOrderCancelled,
    };
    return map[s];
  };
  const getInspStatusLabel = (s: InspectionStatus) => {
    const map: Record<InspectionStatus, string> = {
      scheduled: t.inspectionScheduled,
      in_progress: t.inspectionInProgress,
      completed: t.inspectionCompleted,
      failed: t.inspectionFailed,
    };
    return map[s];
  };
  const getPriorityLabel = (p: TaskPriority) => {
    const map: Record<TaskPriority, string> = {
      low: t.low,
      medium: t.medium,
      high: t.high,
      critical: t.critical,
    };
    return map[p];
  };

  const handleCreateWO = () => {
    const errors: { title?: string; assignedTo?: string } = {};
    if (!newWO.title.trim()) errors.title = "Bu alan zorunludur";
    if (!newWO.assignedTo.trim()) errors.assignedTo = "Bu alan zorunludur";
    if (Object.keys(errors).length > 0) {
      setWoErrors(errors);
      return;
    }
    if (!newWO.projectId) return;
    setWoErrors({});
    addWorkOrder(newWO);
    addAuditLog({
      module: "fieldops",
      action: "İş Emri Oluşturuldu",
      description: `${newWO.title} iş emri oluşturuldu.`,
      performedBy: user?.name || "",
    });
    setShowNewWO(false);
    setNewWO({
      title: "",
      description: "",
      projectId: "",
      assignedTo: "",
      priority: "medium",
      location: "",
      dueDate: "",
      status: "open",
    });
  };

  const handleCreateInspection = () => {
    if (!newInsp.title || !newInsp.projectId) return;
    const items = (DEFAULT_CHECKLIST[newInsp.inspectionType] || []).map(
      (label, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        label,
        checked: false,
        note: "",
      }),
    );
    addFieldInspection({ ...newInsp, items, completedAt: undefined });
    addAuditLog({
      module: "fieldops",
      action: "Denetim Oluşturuldu",
      description: `${newInsp.title} denetimi oluşturuldu.`,
      performedBy: user?.name || "",
    });
    setShowNewInspection(false);
    setNewInsp({
      title: "",
      inspectionType: "Genel",
      projectId: "",
      assignedTo: "",
      scheduledDate: "",
      notes: "",
      status: "scheduled",
      items: [],
      completedAt: undefined,
    });
  };

  const handleCompleteInspection = () => {
    if (!selectedInspection) return;
    completeInspection(selectedInspection.id, selectedInspection.notes);
    addAuditLog({
      module: "fieldops",
      action: "Denetim Tamamlandı",
      description: `${selectedInspection?.title || ""} denetimi tamamlandı.`,
      performedBy: user?.name || "",
    });
    setSelectedInspection(null);
  };

  const handleFailInspection = () => {
    if (!selectedInspection || !failureReason.trim()) return;
    failInspection(
      selectedInspection.id,
      failureReason,
      selectedInspection.notes,
    );
    setSelectedInspection(null);
    addAuditLog({
      module: "fieldops",
      action: "Denetim Başarısız",
      description: `${selectedInspection?.title || ""} denetimi başarısız: ${failureReason}.`,
      performedBy: user?.name || "",
    });
    setMarkingFailed(false);
    setFailureReason("");
  };

  const handleWOFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedWO || !e.target.files) return;
    const files = Array.from(e.target.files);
    const newAttachments = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    const existingAtts = selectedWO.attachments || [];
    // Map to WorkOrderAttachment shape for display
    const merged = [
      ...existingAtts,
      ...newAttachments.map((a) => ({
        id: `att_${Date.now()}_${Math.random()}`,
        name: a.name,
        type: (a.type.startsWith("image") ? "image" : "pdf") as "image" | "pdf",
        url: "",
        uploadedAt: new Date().toISOString().split("T")[0],
      })),
    ];
    updateWorkOrder(selectedWO.id, { attachments: merged });
    setSelectedWO({ ...selectedWO, attachments: merged });
    e.target.value = "";
  };

  const handleInspFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedInspection || !e.target.files) return;
    const files = Array.from(e.target.files);
    const newAtts = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    const existing = selectedInspection.attachments || [];
    const merged = [...existing, ...newAtts];
    const updatedInsp = { ...selectedInspection, attachments: merged };
    setSelectedInspection(updatedInsp);
    // Persist to context
    setFieldInspections(
      fieldInspections.map((f) =>
        f.id === selectedInspection.id ? updatedInsp : f,
      ),
    );
    e.target.value = "";
  };

  const StatusBadge = ({ color, label }: { color: string; label: string }) => (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );

  if (!checkPermission("fieldOps", "view")) return <AccessDenied />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HardHat
            className="w-6 h-6"
            style={{ color: "oklch(0.72 0.18 50)" }}
          />
          {t.fieldOps}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Saha operasyonlarınızı yönetin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t.activeWorkOrders,
            value: stats.activeWO,
            icon: <Wrench className="w-5 h-5" />,
            color: "oklch(0.62 0.22 280)",
          },
          {
            label: t.openInspections,
            value: stats.openInsp,
            icon: <ClipboardList className="w-5 h-5" />,
            color: "oklch(0.72 0.18 50)",
          },
          {
            label: t.workOrderCompleted,
            value: stats.completedWO,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: "oklch(0.72 0.16 160)",
          },
          {
            label: t.allWorkOrders,
            value: stats.totalWO,
            icon: <HardHat className="w-5 h-5" />,
            color: "oklch(0.68 0.18 200)",
          },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {s.value}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${s.color}22`,
                    border: `1px solid ${s.color}44`,
                  }}
                >
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="workorders">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="workorders"
            data-ocid="fieldops.workorders_tab"
            className="data-[state=active]:bg-primary/20"
          >
            <Wrench className="w-4 h-4 mr-2" />
            {t.workOrders}
          </TabsTrigger>
          <TabsTrigger
            value="inspections"
            data-ocid="fieldops.inspections_tab"
            className="data-[state=active]:bg-primary/20"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            {t.inspections}
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            data-ocid="fieldops.audit.tab"
            className="data-[state=active]:bg-primary/20"
          >
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            value="shiftplan"
            data-ocid="fieldops.shiftplan.tab"
            className="data-[state=active]:bg-primary/20"
          >
            Vardiya Planı
          </TabsTrigger>
        </TabsList>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Input
                data-ocid="fieldops.workorder_search_input"
                placeholder={t.search}
                value={woFilter.search}
                onChange={(e) =>
                  setWoFilter((f) => ({ ...f, search: e.target.value }))
                }
                className="w-48 bg-card border-border"
              />
              <Select
                value={woFilter.status}
                onValueChange={(v) => setWoFilter((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger
                  data-ocid="fieldops.workorder_status_select"
                  className="w-36 bg-card border-border"
                >
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="open">{t.workOrderOpen}</SelectItem>
                  <SelectItem value="in_progress">
                    {t.workOrderInProgress}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t.workOrderCompleted}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t.workOrderCancelled}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={woFilter.priority}
                onValueChange={(v) =>
                  setWoFilter((f) => ({ ...f, priority: v }))
                }
              >
                <SelectTrigger
                  data-ocid="fieldops.workorder_priority_select"
                  className="w-36 bg-card border-border"
                >
                  <SelectValue placeholder="Öncelik" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Tüm Öncelikler</SelectItem>
                  <SelectItem value="critical">{t.critical}</SelectItem>
                  <SelectItem value="high">{t.high}</SelectItem>
                  <SelectItem value="medium">{t.medium}</SelectItem>
                  <SelectItem value="low">{t.low}</SelectItem>
                </SelectContent>
              </Select>
              {hrPersonnel && hrPersonnel.length > 0 && (
                <Select
                  value={woFilter.assignedTo}
                  onValueChange={(v) =>
                    setWoFilter((f) => ({ ...f, assignedTo: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="fieldops.workorder_personnel_select"
                    className="w-40 bg-card border-border"
                  >
                    <SelectValue placeholder="Personel" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Tüm Personel</SelectItem>
                    {hrPersonnel.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              data-ocid="fieldops.new_workorder_button"
              onClick={() => setShowNewWO(true)}
              className="gradient-bg text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.newWorkOrder}
            </Button>
          </div>

          {filteredWO.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="fieldops.workorders.empty_state"
            >
              {t.noWorkOrders}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredWO.map((wo, idx) => (
                <Card
                  key={wo.id}
                  data-ocid={`fieldops.workorder.item.${idx + 1}`}
                  className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedWO(wo)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-foreground text-sm leading-snug flex-1">
                        {wo.title}
                      </h3>
                      <StatusBadge
                        color={STATUS_COLORS[wo.status]}
                        label={getWOStatusLabel(wo.status)}
                      />
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <FolderIcon className="w-3.5 h-3.5" />
                        <span className="truncate">
                          {getProjectName(wo.projectId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>{wo.assignedTo || "-"}</span>
                      </div>
                      {wo.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{wo.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{wo.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <StatusBadge
                        color={PRIORITY_COLORS[wo.priority]}
                        label={getPriorityLabel(wo.priority)}
                      />
                      {(wo.attachments?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Paperclip className="w-3 h-3" />
                          {wo.attachments.length}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="mt-4 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Input
                data-ocid="fieldops.inspection_search_input"
                placeholder={t.search}
                value={inspFilter.search}
                onChange={(e) =>
                  setInspFilter((f) => ({ ...f, search: e.target.value }))
                }
                className="w-48 bg-card border-border"
              />
              <Select
                value={inspFilter.type}
                onValueChange={(v) => setInspFilter((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger
                  data-ocid="fieldops.inspection_type_select"
                  className="w-40 bg-card border-border"
                >
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  {INSPECTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={inspFilter.status}
                onValueChange={(v) =>
                  setInspFilter((f) => ({ ...f, status: v }))
                }
              >
                <SelectTrigger
                  data-ocid="fieldops.inspection_status_select"
                  className="w-36 bg-card border-border"
                >
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="scheduled">
                    {t.inspectionScheduled}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {t.inspectionInProgress}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t.inspectionCompleted}
                  </SelectItem>
                  <SelectItem value="failed">{t.inspectionFailed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              data-ocid="fieldops.new_inspection_button"
              onClick={() => setShowNewInspection(true)}
              className="gradient-bg text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.newInspection}
            </Button>
          </div>

          {filteredInspections.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="fieldops.inspections.empty_state"
            >
              {t.noInspections}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredInspections.map((insp, idx) => {
                const checkedCount = insp.items.filter((i) => i.checked).length;
                return (
                  <Card
                    key={insp.id}
                    data-ocid={`fieldops.inspection.item.${idx + 1}`}
                    className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => {
                      setSelectedInspection(insp);
                      setMarkingFailed(false);
                      setFailureReason("");
                    }}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-foreground text-sm leading-snug flex-1">
                          {insp.title}
                        </h3>
                        <StatusBadge
                          color={INSPECTION_STATUS_COLORS[insp.status]}
                          label={getInspStatusLabel(insp.status)}
                        />
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>{insp.inspectionType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FolderIcon className="w-3.5 h-3.5" />
                          <span className="truncate">
                            {getProjectName(insp.projectId)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{insp.assignedTo || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{insp.scheduledDate}</span>
                        </div>
                      </div>
                      {insp.items.length > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{t.checklist}</span>
                            <span>
                              {checkedCount}/{insp.items.length}
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: "oklch(0.26 0.01 264)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${
                                  insp.items.length > 0
                                    ? (checkedCount / insp.items.length) * 100
                                    : 0
                                }%`,
                                background: "oklch(0.72 0.16 160)",
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {insp.failureReason && (
                        <div
                          className="mt-2 p-2 rounded text-xs"
                          style={{
                            background: "oklch(0.65 0.22 25 / 0.1)",
                            color: "oklch(0.65 0.22 25)",
                          }}
                        >
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          {insp.failureReason}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
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
                {auditLogs.filter((l) => l.module === "fieldops").length ===
                0 ? (
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
                    .filter((l) => l.module === "fieldops")
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.performedBy}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {log.description}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="shiftplan" className="mt-4">
          <ShiftPlanTab companyId={activeCompanyId || ""} />
        </TabsContent>
      </Tabs>

      {/* Work Order Detail Dialog */}
      <Dialog
        open={!!selectedWO}
        onOpenChange={(open) => !open && setSelectedWO(null)}
      >
        <DialogContent
          data-ocid="workorder_detail.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench
                className="w-5 h-5"
                style={{ color: "oklch(0.62 0.22 280)" }}
              />
              {selectedWO?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedWO && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <StatusBadge
                  color={STATUS_COLORS[selectedWO.status]}
                  label={getWOStatusLabel(selectedWO.status)}
                />
                <StatusBadge
                  color={PRIORITY_COLORS[selectedWO.priority]}
                  label={getPriorityLabel(selectedWO.priority)}
                />
              </div>
              {selectedWO.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedWO.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FolderIcon className="w-4 h-4" />
                  <span>{getProjectName(selectedWO.projectId)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{selectedWO.assignedTo || "-"}</span>
                </div>
                {selectedWO.location && (
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedWO.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedWO.dueDate}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Durum Güncelle
                </Label>
                <Select
                  value={selectedWO.status}
                  onValueChange={(v) => {
                    const newStatus = v as WorkOrderStatus;
                    updateWorkOrderStatus(selectedWO.id, newStatus);
                    addAuditLog({
                      module: "fieldops",
                      action: "İş Emri Durumu Güncellendi",
                      description: `${selectedWO.title} iş emri durumu güncellendi: ${newStatus}.`,
                      performedBy: user?.name || "",
                    });
                    setSelectedWO({ ...selectedWO, status: newStatus });
                    if (newStatus === "completed") {
                      setPendingCompleteWO({
                        ...selectedWO,
                        status: newStatus,
                      });
                      setDeductDialogOpen(true);
                    }
                  }}
                >
                  <SelectTrigger
                    data-ocid="workorder_detail.status_select"
                    className="bg-background border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="open">{t.workOrderOpen}</SelectItem>
                    <SelectItem value="in_progress">
                      {t.workOrderInProgress}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t.workOrderCompleted}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t.workOrderCancelled}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cost section */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Maliyet Bilgileri
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Tahmini Maliyet (₺)
                    </Label>
                    <Input
                      data-ocid="workorder_detail.input"
                      type="number"
                      placeholder="0"
                      defaultValue={selectedWO.estimatedCost ?? ""}
                      onBlur={(e) => {
                        const val = e.target.value
                          ? Number(e.target.value)
                          : undefined;
                        updateWorkOrder(selectedWO.id, {
                          estimatedCost: val,
                        });
                        setSelectedWO({ ...selectedWO, estimatedCost: val });
                      }}
                      className="bg-background border-border mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Gerçekleşen Maliyet (₺)
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      defaultValue={selectedWO.actualCost ?? ""}
                      onBlur={(e) => {
                        const val = e.target.value
                          ? Number(e.target.value)
                          : undefined;
                        updateWorkOrder(selectedWO.id, { actualCost: val });
                        setSelectedWO({ ...selectedWO, actualCost: val });
                      }}
                      className="bg-background border-border mt-1 h-8 text-sm"
                    />
                  </div>
                </div>
                {onNavigate && (
                  <Button
                    data-ocid="workorder_detail.secondary_button"
                    variant="outline"
                    size="sm"
                    className="border-border text-xs w-full mt-1"
                    onClick={() => {
                      setSelectedWO(null);
                      onNavigate("finance");
                    }}
                  >
                    Finans Modülünde Gider Oluştur →
                  </Button>
                )}
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">
                    {t.attachments} ({selectedWO.attachments?.length ?? 0})
                  </Label>
                  <Button
                    data-ocid="workorder_detail.upload_button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-border"
                    onClick={() => woFileRef.current?.click()}
                  >
                    <Paperclip className="w-3 h-3 mr-1" />
                    {t.uploadFile}
                  </Button>
                  <input
                    ref={woFileRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleWOFileUpload}
                  />
                </div>
                {(selectedWO.attachments?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">Henüz ek yok.</p>
                ) : (
                  <div className="space-y-1">
                    {selectedWO.attachments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 text-xs p-2 rounded-lg"
                        style={{ background: "oklch(0.22 0.01 264)" }}
                      >
                        {a.type === "image" ? (
                          <Image className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                        )}
                        <span className="text-foreground">{a.name}</span>
                        <span className="text-muted-foreground ml-auto">
                          {a.uploadedAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  data-ocid="workorder_detail.close_button"
                  variant="outline"
                  onClick={() => setSelectedWO(null)}
                  className="border-border"
                >
                  {t.close}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inspection Form Dialog */}
      <Dialog
        open={!!selectedInspection}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInspection(null);
            setMarkingFailed(false);
            setFailureReason("");
          }
        }}
      >
        <DialogContent
          data-ocid="inspection_form.dialog"
          className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.18 50)" }}
              />
              {selectedInspection?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <StatusBadge
                  color={INSPECTION_STATUS_COLORS[selectedInspection.status]}
                  label={getInspStatusLabel(selectedInspection.status)}
                />
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.22 0.01 264)",
                    color: "oklch(0.7 0.015 264)",
                  }}
                >
                  {selectedInspection.inspectionType}
                </span>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  {t.checklist}
                </Label>
                <div className="space-y-2">
                  {selectedInspection.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: "oklch(0.22 0.01 264)" }}
                    >
                      <Checkbox
                        data-ocid={`inspection_form.checkbox.${idx + 1}`}
                        checked={item.checked}
                        disabled={
                          selectedInspection.status === "completed" ||
                          selectedInspection.status === "failed"
                        }
                        onCheckedChange={(checked) => {
                          updateInspectionItem(
                            selectedInspection.id,
                            item.id,
                            !!checked,
                            item.note,
                          );
                          setSelectedInspection({
                            ...selectedInspection,
                            items: selectedInspection.items.map((i) =>
                              i.id === item.id
                                ? { ...i, checked: !!checked }
                                : i,
                            ),
                          });
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm ${
                            item.checked
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </p>
                        {item.checked && (
                          <Input
                            placeholder="Not ekle..."
                            value={item.note}
                            onChange={(e) => {
                              updateInspectionItem(
                                selectedInspection.id,
                                item.id,
                                item.checked,
                                e.target.value,
                              );
                              setSelectedInspection({
                                ...selectedInspection,
                                items: selectedInspection.items.map((i) =>
                                  i.id === item.id
                                    ? { ...i, note: e.target.value }
                                    : i,
                                ),
                              });
                            }}
                            className="mt-1 h-7 text-xs bg-background border-border"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspection attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">
                    Ekler ({selectedInspection.attachments?.length ?? 0})
                  </Label>
                  {selectedInspection.status !== "completed" &&
                    selectedInspection.status !== "failed" && (
                      <Button
                        data-ocid="inspection_form.upload_button"
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-border"
                        onClick={() => inspFileRef.current?.click()}
                      >
                        <Paperclip className="w-3 h-3 mr-1" />
                        Dosya Ekle
                      </Button>
                    )}
                  <input
                    ref={inspFileRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleInspFileUpload}
                  />
                </div>
                {(selectedInspection.attachments?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    {selectedInspection.attachments!.map((a, i) => (
                      <div
                        key={`${a.name}-${i}`}
                        className="flex items-center gap-2 text-xs p-2 rounded-lg"
                        style={{ background: "oklch(0.22 0.01 264)" }}
                      >
                        {a.type.startsWith("image") ? (
                          <Image className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                        )}
                        <span className="text-foreground truncate">
                          {a.name}
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          {(a.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Genel Notlar
                </Label>
                <Textarea
                  value={selectedInspection.notes}
                  disabled={
                    selectedInspection.status === "completed" ||
                    selectedInspection.status === "failed"
                  }
                  onChange={(e) =>
                    setSelectedInspection({
                      ...selectedInspection,
                      notes: e.target.value,
                    })
                  }
                  className="bg-background border-border text-sm"
                  rows={2}
                />
              </div>

              {/* Failure reason section */}
              {markingFailed && (
                <div
                  className="p-3 rounded-xl space-y-2"
                  style={{
                    background: "oklch(0.65 0.22 25 / 0.08)",
                    border: "1px solid oklch(0.65 0.22 25 / 0.3)",
                  }}
                >
                  <Label
                    className="text-xs font-medium"
                    style={{ color: "oklch(0.65 0.22 25)" }}
                  >
                    <XCircle className="w-3.5 h-3.5 inline mr-1" />
                    Başarısızlık Nedeni *
                  </Label>
                  <Textarea
                    data-ocid="inspection_form.textarea"
                    placeholder="Denetimin neden başarısız olduğunu açıklayın..."
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="bg-background border-border text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      data-ocid="inspection_form.confirm_button"
                      size="sm"
                      className="flex-1 text-white"
                      style={{
                        background: "oklch(0.55 0.22 25)",
                      }}
                      onClick={handleFailInspection}
                      disabled={!failureReason.trim()}
                    >
                      Başarısız Olarak İşaretle
                    </Button>
                    <Button
                      data-ocid="inspection_form.cancel_button"
                      size="sm"
                      variant="outline"
                      className="border-border"
                      onClick={() => {
                        setMarkingFailed(false);
                        setFailureReason("");
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  data-ocid="inspection_form.close_button"
                  variant="outline"
                  onClick={() => setSelectedInspection(null)}
                  className="border-border"
                >
                  {t.close}
                </Button>
                {selectedInspection.status !== "completed" &&
                  selectedInspection.status !== "failed" && (
                    <div className="flex gap-2">
                      {!markingFailed && (
                        <Button
                          data-ocid="inspection_form.delete_button"
                          variant="outline"
                          onClick={() => setMarkingFailed(true)}
                          className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Başarısız İşaretle
                        </Button>
                      )}
                      <Button
                        data-ocid="inspection_form.complete_button"
                        onClick={handleCompleteInspection}
                        className="gradient-bg text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t.completeInspection}
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inventory Deduction Dialog */}
      <Dialog open={deductDialogOpen} onOpenChange={setDeductDialogOpen}>
        <DialogContent
          data-ocid="fieldops.deduct.dialog"
          className="bg-card border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="text-base">Stok Düş</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bu iş emri için envanterden stok düşmek ister misiniz?
            </p>
            <div>
              <Label className="text-xs text-muted-foreground">Malzeme</Label>
              <Select value={deductMaterial} onValueChange={setDeductMaterial}>
                <SelectTrigger
                  data-ocid="fieldops.deduct.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Malzeme seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {stockItems
                    .filter((s) => {
                      if (!pendingCompleteWO) return true;
                      const proj = projects.find(
                        (p) => p.id === pendingCompleteWO.projectId,
                      );
                      return (
                        !proj || s.project === proj.title || s.quantity > 0
                      );
                    })
                    .map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name} ({s.quantity} {s.unit} mevcut)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Miktar</Label>
              <Input
                data-ocid="fieldops.deduct.input"
                type="number"
                min="0"
                placeholder="0"
                value={deductQty}
                onChange={(e) => setDeductQty(e.target.value)}
                className="bg-background border-border mt-1"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                data-ocid="fieldops.deduct.confirm_button"
                className="flex-1 gradient-bg text-white"
                disabled={
                  !deductMaterial || !deductQty || Number(deductQty) <= 0
                }
                onClick={() => {
                  if (deductMaterial && deductQty && pendingCompleteWO) {
                    const proj = projects.find(
                      (p) => p.id === pendingCompleteWO.projectId,
                    );
                    const stock = stockItems.find(
                      (s) => s.name === deductMaterial,
                    );
                    deductStock(
                      deductMaterial,
                      Number(deductQty),
                      stock?.project || proj?.title || "",
                      user?.name || "Saha",
                    );
                  }
                  setDeductDialogOpen(false);
                  setPendingCompleteWO(null);
                }}
              >
                Evet, Düş
              </Button>
              <Button
                data-ocid="fieldops.deduct.cancel_button"
                variant="outline"
                className="flex-1 border-border"
                onClick={() => {
                  setDeductDialogOpen(false);
                  setPendingCompleteWO(null);
                }}
              >
                Hayır
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Work Order Dialog */}
      <Dialog
        open={showNewWO}
        onOpenChange={(o) => {
          setShowNewWO(o);
          if (!o) setWoErrors({});
        }}
      >
        <DialogContent
          data-ocid="new_workorder.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>{t.newWorkOrder}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Başlık *</Label>
              <Input
                value={newWO.title}
                onChange={(e) => {
                  setNewWO((p) => ({ ...p, title: e.target.value }));
                  if (e.target.value.trim())
                    setWoErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className={`bg-background border-border mt-1 ${woErrors.title ? "border-rose-500" : ""}`}
              />
              {woErrors.title && (
                <p className="text-rose-500 text-xs mt-1">{woErrors.title}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t.description}
              </Label>
              <Textarea
                value={newWO.description}
                onChange={(e) =>
                  setNewWO((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-background border-border mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Proje *</Label>
              <Select
                value={newWO.projectId}
                onValueChange={(v) => setNewWO((p) => ({ ...p, projectId: v }))}
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
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
                <Label className="text-xs text-muted-foreground">
                  {t.assignedTo}
                </Label>
                {hrPersonnel && hrPersonnel.length > 0 ? (
                  <Select
                    value={newWO.assignedTo}
                    onValueChange={(v) => {
                      setNewWO((p) => ({ ...p, assignedTo: v }));
                      if (v)
                        setWoErrors((prev) => ({
                          ...prev,
                          assignedTo: undefined,
                        }));
                    }}
                  >
                    <SelectTrigger
                      className={`bg-background border-border mt-1 ${woErrors.assignedTo ? "border-rose-500" : ""}`}
                    >
                      <SelectValue placeholder="Personel seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {hrPersonnel.map((p) => (
                        <SelectItem key={p.id} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={newWO.assignedTo}
                    onChange={(e) => {
                      setNewWO((p) => ({ ...p, assignedTo: e.target.value }));
                      if (e.target.value.trim())
                        setWoErrors((prev) => ({
                          ...prev,
                          assignedTo: undefined,
                        }));
                    }}
                    className={`bg-background border-border mt-1 ${woErrors.assignedTo ? "border-rose-500" : ""}`}
                  />
                )}
                {woErrors.assignedTo && (
                  <p className="text-rose-500 text-xs mt-1">
                    {woErrors.assignedTo}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t.priority}
                </Label>
                <Select
                  value={newWO.priority}
                  onValueChange={(v) =>
                    setNewWO((p) => ({ ...p, priority: v as TaskPriority }))
                  }
                >
                  <SelectTrigger className="bg-background border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="critical">{t.critical}</SelectItem>
                    <SelectItem value="high">{t.high}</SelectItem>
                    <SelectItem value="medium">{t.medium}</SelectItem>
                    <SelectItem value="low">{t.low}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t.location}
              </Label>
              <Input
                value={newWO.location}
                onChange={(e) =>
                  setNewWO((p) => ({ ...p, location: e.target.value }))
                }
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t.dueDate}
              </Label>
              <Input
                type="date"
                value={newWO.dueDate}
                onChange={(e) =>
                  setNewWO((p) => ({ ...p, dueDate: e.target.value }))
                }
                className="bg-background border-border mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                data-ocid="new_workorder.cancel_button"
                variant="outline"
                onClick={() => setShowNewWO(false)}
                className="border-border"
              >
                {t.cancel}
              </Button>
              <Button
                data-ocid="new_workorder.submit_button"
                onClick={handleCreateWO}
                className="gradient-bg text-white"
              >
                {t.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Inspection Dialog */}
      <Dialog open={showNewInspection} onOpenChange={setShowNewInspection}>
        <DialogContent
          data-ocid="new_inspection.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>{t.newInspection}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Başlık *</Label>
              <Input
                value={newInsp.title}
                onChange={(e) =>
                  setNewInsp((p) => ({ ...p, title: e.target.value }))
                }
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t.inspectionType}
              </Label>
              <Select
                value={newInsp.inspectionType}
                onValueChange={(v) =>
                  setNewInsp((p) => ({ ...p, inspectionType: v }))
                }
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {INSPECTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Proje *</Label>
              <Select
                value={newInsp.projectId}
                onValueChange={(v) =>
                  setNewInsp((p) => ({ ...p, projectId: v }))
                }
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
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
                <Label className="text-xs text-muted-foreground">
                  {t.assignedTo}
                </Label>
                <Input
                  value={newInsp.assignedTo}
                  onChange={(e) =>
                    setNewInsp((p) => ({ ...p, assignedTo: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t.scheduledDate}
                </Label>
                <Input
                  type="date"
                  value={newInsp.scheduledDate}
                  onChange={(e) =>
                    setNewInsp((p) => ({ ...p, scheduledDate: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                data-ocid="new_inspection.cancel_button"
                variant="outline"
                onClick={() => setShowNewInspection(false)}
                className="border-border"
              >
                {t.cancel}
              </Button>
              <Button
                data-ocid="new_inspection.submit_button"
                onClick={handleCreateInspection}
                className="gradient-bg text-white"
              >
                {t.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

const DAYS_TR = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const SHIFT_OPTIONS = ["-", "Sabah", "Öğleden Sonra", "Gece", "İzin"];
const SHIFT_COLORS: Record<string, string> = {
  Sabah: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Öğleden Sonra": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Gece: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  İzin: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "-": "bg-muted/20 text-muted-foreground",
};

function ShiftPlanTab({ companyId }: { companyId: string }) {
  const employees: { id: string; name: string }[] = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_${companyId}_employees`) || "[]",
      );
    } catch {
      return [];
    }
  })();

  type ShiftMap = Record<string, Record<string, string>>;
  const storageKey = `pv_${companyId}_shiftSchedule`;
  const [shifts, setShifts] = useState<ShiftMap>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  });

  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    const mondayDiff = (day === 0 ? -6 : 1 - day) + offset * 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + mondayDiff + i);
      return d.toISOString().slice(0, 10);
    });
  };

  const weekDates = getWeekDates(weekOffset);

  const updateShift = (empId: string, date: string, shift: string) => {
    const updated = {
      ...shifts,
      [empId]: { ...(shifts[empId] || {}), [date]: shift },
    };
    setShifts(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const getShift = (empId: string, date: string) =>
    shifts[empId]?.[date] || "-";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          Haftalık Vardiya Planı
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="fieldops.shiftplan.prev_button"
            onClick={() => setWeekOffset((p) => p - 1)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-sm hover:bg-accent transition-colors"
          >
            ← Önceki
          </button>
          <button
            type="button"
            data-ocid="fieldops.shiftplan.next_button"
            onClick={() => setWeekOffset((p) => p + 1)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-sm hover:bg-accent transition-colors"
          >
            Sonraki →
          </button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div
          data-ocid="fieldops.shiftplan.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-muted-foreground">
            Personel bulunamadı. Önce İK modülünden personel ekleyin.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b border-border"
                style={{ background: "oklch(0.15 0.018 245)" }}
              >
                <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[140px]">
                  Personel
                </th>
                {weekDates.map((date, i) => (
                  <th
                    key={date}
                    className="text-center px-2 py-3 font-medium text-muted-foreground min-w-[110px]"
                  >
                    <div>{DAYS_TR[i]}</div>
                    <div className="text-xs font-normal">{date.slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-foreground">
                    {emp.name}
                  </td>
                  {weekDates.map((date) => {
                    const current = getShift(emp.id, date);
                    const nextIndex =
                      (SHIFT_OPTIONS.indexOf(current) + 1) %
                      SHIFT_OPTIONS.length;
                    return (
                      <td key={date} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            updateShift(emp.id, date, SHIFT_OPTIONS[nextIndex])
                          }
                          className={`w-full px-1 py-1 rounded border text-xs font-medium transition-colors ${SHIFT_COLORS[current] || SHIFT_COLORS["-"]}`}
                        >
                          {current}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {SHIFT_OPTIONS.filter((s) => s !== "-").map((s) => (
          <span
            key={s}
            className={`px-2 py-0.5 rounded border text-xs font-medium ${SHIFT_COLORS[s]}`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
