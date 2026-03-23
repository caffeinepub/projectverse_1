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
import { AlertTriangle, Bell, GitBranch, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

interface ApprovalStep {
  id: string;
  role: string;
  label: string;
  amountLimit?: number;
}

interface ApprovalWorkflow {
  id: string;
  module: string;
  name: string;
  steps: ApprovalStep[];
  createdAt: string;
}

const MODULE_OPTIONS = [
  { value: "finance_invoice", label: "Finans – Fatura Onayı" },
  { value: "finance_expense", label: "Finans – Gider Onayı" },
  { value: "finance_advance", label: "Finans – Avans Onayı" },
  { value: "purchasing_order", label: "Satın Alma – Sipariş Onayı" },
  { value: "hr_leave", label: "İK – İzin Onayı" },
  { value: "hr_timesheet", label: "İK – Puantaj Onayı" },
  { value: "subcontractor_payment", label: "Taşeron – Ödeme Onayı" },
];

const ROLE_OPTIONS = [
  { value: "supervisor", label: "Şef" },
  { value: "manager", label: "Müdür" },
  { value: "owner", label: "Şirket Sahibi" },
  { value: "finance_manager", label: "Finans Yöneticisi" },
  { value: "hr_manager", label: "İK Yöneticisi" },
];

function loadWorkflows(companyId: string): ApprovalWorkflow[] {
  const raw = localStorage.getItem(`pv_approval_workflows_${companyId}`);
  return raw ? JSON.parse(raw) : [];
}

function saveWorkflows(companyId: string, data: ApprovalWorkflow[]) {
  localStorage.setItem(
    `pv_approval_workflows_${companyId}`,
    JSON.stringify(data),
  );
}

interface EscalationRule {
  id: string;
  name: string;
  trigger: string;
  pendingDays: number;
  notifyRole: string;
}

const TRIGGER_OPTIONS = [
  { value: "finance", label: "Finans" },
  { value: "purchasing", label: "Satın Alma" },
  { value: "hr_leave", label: "İzin" },
  { value: "general", label: "Genel" },
];

function loadEscalationRules(companyId: string): EscalationRule[] {
  const raw = localStorage.getItem(`escalationRules_${companyId}`);
  return raw ? JSON.parse(raw) : [];
}

function saveEscalationRules(companyId: string, data: EscalationRule[]) {
  localStorage.setItem(`escalationRules_${companyId}`, JSON.stringify(data));
}

const MODULE_COLORS: Record<string, string> = {
  finance_invoice: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  finance_expense: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  finance_advance: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  purchasing_order: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  hr_leave: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  hr_timesheet: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  subcontractor_payment:
    "text-purple-400 bg-purple-500/15 border-purple-500/30",
};

export default function ApprovalWorkflows() {
  const { activeCompanyId, activeRoleId, checkPermission } = useApp();
  const canView =
    checkPermission("finance", "view") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";
  const canEdit = activeRoleId === "owner" || activeRoleId === "manager";

  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(() =>
    loadWorkflows(activeCompanyId || ""),
  );
  const [activeSubTab, setActiveSubTab] = useState<"workflows" | "escalation">(
    "workflows",
  );
  const [open, setOpen] = useState(false);
  const [escRules, setEscRules] = useState<EscalationRule[]>(() =>
    loadEscalationRules(activeCompanyId || ""),
  );
  const [escOpen, setEscOpen] = useState(false);
  const [escForm, setEscForm] = useState({
    name: "",
    trigger: "",
    pendingDays: "3",
    notifyRole: "",
  });
  const [form, setForm] = useState({ module: "", name: "" });
  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [newStep, setNewStep] = useState({
    role: "",
    label: "",
    amountLimit: "",
  });

  if (!canView) return <AccessDenied />;

  const persistEsc = (updated: EscalationRule[]) => {
    setEscRules(updated);
    saveEscalationRules(activeCompanyId || "", updated);
  };

  const handleCreateEsc = () => {
    if (
      !escForm.name.trim() ||
      !escForm.trigger ||
      !escForm.notifyRole.trim()
    ) {
      toast.error("Tüm alanlar zorunludur.");
      return;
    }
    const rule: EscalationRule = {
      id: `esc_${Date.now()}`,
      name: escForm.name.trim(),
      trigger: escForm.trigger,
      pendingDays: Number(escForm.pendingDays) || 3,
      notifyRole: escForm.notifyRole.trim(),
    };
    persistEsc([...escRules, rule]);
    setEscOpen(false);
    setEscForm({ name: "", trigger: "", pendingDays: "3", notifyRole: "" });
    toast.success("Eskalasyon kuralı oluşturuldu.");
  };

  const handleDeleteEsc = (id: string) => {
    persistEsc(escRules.filter((r) => r.id !== id));
    toast.success("Kural silindi.");
  };

  const persist = (updated: ApprovalWorkflow[]) => {
    setWorkflows(updated);
    saveWorkflows(activeCompanyId || "", updated);
  };

  const handleCreate = () => {
    if (!form.module || !form.name.trim()) {
      toast.error("Modül ve isim alanları zorunludur.");
      return;
    }
    if (steps.length === 0) {
      toast.error("En az bir onay adımı ekleyin.");
      return;
    }
    const wf: ApprovalWorkflow = {
      id: `wf_${Date.now()}`,
      module: form.module,
      name: form.name.trim(),
      steps,
      createdAt: new Date().toISOString(),
    };
    persist([...workflows, wf]);
    setOpen(false);
    setForm({ module: "", name: "" });
    setSteps([]);
    toast.success("İş akışı oluşturuldu.");
  };

  const handleDelete = (id: string) => {
    persist(workflows.filter((w) => w.id !== id));
    toast.success("İş akışı silindi.");
  };

  const handleAddStep = () => {
    if (!newStep.role) {
      toast.error("Rol seçin.");
      return;
    }
    const roleLabel =
      ROLE_OPTIONS.find((r) => r.value === newStep.role)?.label || newStep.role;
    setSteps((prev) => [
      ...prev,
      {
        id: `step_${Date.now()}`,
        role: newStep.role,
        label: newStep.label.trim() || roleLabel,
        amountLimit: newStep.amountLimit
          ? Number.parseFloat(newStep.amountLimit)
          : undefined,
      },
    ]);
    setNewStep({ role: "", label: "", amountLimit: "" });
  };

  const moduleLabel = (key: string) =>
    MODULE_OPTIONS.find((m) => m.value === key)?.label || key;

  const triggerLabel = (v: string) =>
    TRIGGER_OPTIONS.find((o) => o.value === v)?.label || v;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Onay Akışları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Modül bazlı onay hiyerarşisini yapılandırın
          </p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-2">
        <button
          type="button"
          data-ocid="workflows.workflows.tab"
          onClick={() => setActiveSubTab("workflows")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === "workflows" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
        >
          <GitBranch className="w-4 h-4 inline mr-1" />
          İş Akışları
        </button>
        <button
          type="button"
          data-ocid="workflows.escalation.tab"
          onClick={() => setActiveSubTab("escalation")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === "escalation" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
        >
          <Bell className="w-4 h-4 inline mr-1" />
          Eskalasyon Kuralları
        </button>
      </div>

      {activeSubTab === "escalation" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Eskalasyon Kuralları
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Onay bekleyen işlemler belirtilen süreyi aşınca bildirim gönder
              </p>
            </div>
            {canEdit && (
              <Dialog open={escOpen} onOpenChange={setEscOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="escalation.primary_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kural
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="escalation.dialog"
                  className="bg-card border-border max-w-md"
                >
                  <DialogHeader>
                    <DialogTitle>Eskalasyon Kuralı Oluştur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Kural Adı *</Label>
                      <Input
                        className="mt-1 bg-background border-border"
                        value={escForm.name}
                        onChange={(e) =>
                          setEscForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="ör. Finans Fatura Eskalasyonu"
                      />
                    </div>
                    <div>
                      <Label>Tetikleyici *</Label>
                      <Select
                        value={escForm.trigger}
                        onValueChange={(v) =>
                          setEscForm((f) => ({ ...f, trigger: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="escalation.trigger.select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Modül seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {TRIGGER_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bekleme Süresi (gün) *</Label>
                      <Input
                        className="mt-1 bg-background border-border"
                        type="number"
                        min="1"
                        value={escForm.pendingDays}
                        onChange={(e) =>
                          setEscForm((f) => ({
                            ...f,
                            pendingDays: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Bildirim Rolü / Kişi *</Label>
                      <Input
                        className="mt-1 bg-background border-border"
                        value={escForm.notifyRole}
                        onChange={(e) =>
                          setEscForm((f) => ({
                            ...f,
                            notifyRole: e.target.value,
                          }))
                        }
                        placeholder="ör. Müdür, CFO"
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      data-ocid="escalation.cancel_button"
                      variant="outline"
                      onClick={() => setEscOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="escalation.confirm_button"
                      className="gradient-bg text-white"
                      onClick={handleCreateEsc}
                    >
                      Kaydet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {escRules.length === 0 ? (
            <div
              data-ocid="escalation.empty_state"
              className="text-center py-16 glass-card rounded-xl"
            >
              <Bell className="w-12 h-12 mx-auto mb-3 text-amber-500/30" />
              <p className="text-foreground font-medium mb-1">
                Henüz eskalasyon kuralı yok
              </p>
              <p className="text-sm text-muted-foreground">
                Onay bekleyen işlemler için otomatik uyarı kuralları oluşturun.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tanımlı Kurallar
              </h3>
              {escRules.map((rule, idx) => (
                <Card
                  key={rule.id}
                  data-ocid={`escalation.item.${idx + 1}`}
                  className="bg-card border-border"
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {rule.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {triggerLabel(rule.trigger)} · {rule.pendingDays} günden
                        fazla bekleyince ·{" "}
                        <span className="text-amber-400">
                          {rule.notifyRole}
                        </span>
                      </p>
                    </div>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        data-ocid={`escalation.delete_button.${idx + 1}`}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                        onClick={() => handleDeleteEsc(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div />
            {canEdit && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="workflows.primary_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni İş Akışı
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="workflows.dialog"
                  className="bg-card border-border max-w-lg"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Onay İş Akışı</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Modül *</Label>
                      <Select
                        value={form.module}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, module: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="workflows.module.select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Modül seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {MODULE_OPTIONS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>İş Akışı Adı *</Label>
                      <Input
                        data-ocid="workflows.name.input"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="mt-1 bg-background border-border"
                        placeholder="örn: Standart Fatura Onayı"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">
                        Onay Adımları
                      </p>
                      <div className="space-y-2">
                        {steps.map((step, i) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2"
                          >
                            <span className="text-xs text-muted-foreground font-mono w-5">
                              {i + 1}.
                            </span>
                            <span className="flex-1 text-sm">{step.label}</span>
                            {step.amountLimit !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                Limit:{" "}
                                {step.amountLimit.toLocaleString("tr-TR")} ₺
                              </Badge>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-rose-400"
                              onClick={() =>
                                setSteps((prev) =>
                                  prev.filter((s) => s.id !== step.id),
                                )
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="space-y-2 border border-dashed border-border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">
                            Yeni Adım
                          </p>
                          <Select
                            value={newStep.role}
                            onValueChange={(v) =>
                              setNewStep((p) => ({ ...p, role: v }))
                            }
                          >
                            <SelectTrigger className="bg-background border-border text-sm h-8">
                              <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {ROLE_OPTIONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Input
                              value={newStep.label}
                              onChange={(e) =>
                                setNewStep((p) => ({
                                  ...p,
                                  label: e.target.value,
                                }))
                              }
                              className="bg-background border-border text-sm h-8"
                              placeholder="Adım adı (opsiyonel)"
                            />
                            <Input
                              type="number"
                              value={newStep.amountLimit}
                              onChange={(e) =>
                                setNewStep((p) => ({
                                  ...p,
                                  amountLimit: e.target.value,
                                }))
                              }
                              className="bg-background border-border text-sm h-8 w-32"
                              placeholder="Tutar limiti"
                              min={0}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAddStep}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="workflows.cancel_button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="workflows.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleCreate}
                    >
                      Oluştur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {workflows.length === 0 ? (
            <div
              data-ocid="workflows.empty_state"
              className="text-center py-24 space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto opacity-60">
                <GitBranch className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-lg">
                  Henüz iş akışı yok
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Onay süreçlerini yapılandırarak şeffaf ve izlenebilir bir akış
                  oluşturun.
                </p>
              </div>
              {canEdit && (
                <Button
                  className="gradient-bg text-white"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İlk İş Akışını Oluştur
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((wf, idx) => (
                <Card
                  key={wf.id}
                  data-ocid={`workflows.item.${idx + 1}`}
                  className="bg-card border-border hover:border-primary/40 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge
                          variant="outline"
                          className={`text-xs mb-2 ${MODULE_COLORS[wf.module] || ""}`}
                        >
                          {moduleLabel(wf.module)}
                        </Badge>
                        <CardTitle className="text-sm font-semibold">
                          {wf.name}
                        </CardTitle>
                      </div>
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          data-ocid={`workflows.delete_button.${idx + 1}`}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-400 flex-shrink-0"
                          onClick={() => handleDelete(wf.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {wf.steps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-white font-bold">
                              {i + 1}
                            </span>
                          </div>
                          <span className="text-sm flex-1">{step.label}</span>
                          {step.amountLimit !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              ≤ {step.amountLimit.toLocaleString("tr-TR")} ₺
                            </span>
                          )}
                          {i < wf.steps.length - 1 && (
                            <div className="absolute left-3 top-6 w-px h-4 bg-border" />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Oluşturuldu:{" "}
                      {new Date(wf.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
