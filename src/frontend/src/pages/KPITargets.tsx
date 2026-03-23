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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Target,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

interface KPITarget {
  id: string;
  key: string;
  label: string;
  unit: string;
  target: number;
  actual: number;
  higherIsBetter: boolean;
}

interface ProjectKPISet {
  projectId: string;
  kpis: KPITarget[];
}

interface KPIStore {
  projects: ProjectKPISet[];
  company: KPITarget[];
}

const DEFAULT_KPIs: Omit<KPITarget, "id" | "target" | "actual">[] = [
  {
    key: "budget_variance",
    label: "Bütçe Sapması",
    unit: "%",
    higherIsBetter: false,
  },
  {
    key: "schedule_variance",
    label: "Süre Sapması",
    unit: "%",
    higherIsBetter: false,
  },
  {
    key: "quality_score",
    label: "Kalite Skoru",
    unit: "%",
    higherIsBetter: true,
  },
  {
    key: "safety_incidents",
    label: "Güvenlik Olayları",
    unit: "adet",
    higherIsBetter: false,
  },
];

const COMPANY_DEFAULT_KPIs: Omit<KPITarget, "id" | "target" | "actual">[] = [
  {
    key: "revenue_growth",
    label: "Gelir Büyümesi",
    unit: "%",
    higherIsBetter: true,
  },
  {
    key: "project_ontime",
    label: "Zamanında Teslim",
    unit: "%",
    higherIsBetter: true,
  },
  {
    key: "customer_satisfaction",
    label: "Müşteri Memnuniyeti",
    unit: "puan",
    higherIsBetter: true,
  },
  {
    key: "incident_rate",
    label: "Kaza Sıklığı",
    unit: "adet",
    higherIsBetter: false,
  },
  {
    key: "overhead_ratio",
    label: "Genel Gider Oranı",
    unit: "%",
    higherIsBetter: false,
  },
];

function loadKPIs(companyId: string): KPIStore {
  const raw = localStorage.getItem(`pv_kpi_targets_${companyId}`);
  return raw ? JSON.parse(raw) : { projects: [], company: [] };
}

function saveKPIs(companyId: string, data: KPIStore) {
  localStorage.setItem(`pv_kpi_targets_${companyId}`, JSON.stringify(data));
}

function ragStatus(kpi: KPITarget): "green" | "yellow" | "red" {
  if (kpi.target === 0) return "green";
  const ratio = kpi.actual / kpi.target;
  if (kpi.higherIsBetter) {
    if (ratio >= 0.9) return "green";
    if (ratio >= 0.7) return "yellow";
    return "red";
  }
  if (ratio <= 1.1) return "green";
  if (ratio <= 1.3) return "yellow";
  return "red";
}

const RAG_COLORS = {
  green: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  yellow: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  red: "text-rose-400 bg-rose-500/15 border-rose-500/30",
};

const RAG_ICONS = {
  green: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  yellow: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  red: <TrendingDown className="h-4 w-4 text-rose-400" />,
};

function KPICard({ kpi, onEdit }: { kpi: KPITarget; onEdit: () => void }) {
  const rag = ragStatus(kpi);
  const progressVal =
    kpi.target > 0
      ? kpi.higherIsBetter
        ? Math.min(100, (kpi.actual / kpi.target) * 100)
        : Math.min(
            100,
            100 - Math.max(0, ((kpi.actual - kpi.target) / kpi.target) * 100),
          )
      : 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{kpi.label}</CardTitle>
          <div className="flex items-center gap-2">
            {RAG_ICONS[rag]}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={onEdit}
              data-ocid="kpi.edit_button"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-foreground">
            {kpi.actual}
          </span>
          <span className="text-sm text-muted-foreground mb-0.5">
            {kpi.unit}
          </span>
          <Badge
            variant="outline"
            className={`ml-auto text-xs ${RAG_COLORS[rag]}`}
          >
            Hedef: {kpi.target} {kpi.unit}
          </Badge>
        </div>
        <Progress value={progressVal} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {rag === "green"
            ? "Hedef dahilinde"
            : rag === "yellow"
              ? "Hedeften hafif sapma"
              : "Hedeften önemli sapma"}
        </p>
      </CardContent>
    </Card>
  );
}

export default function KPITargets() {
  const { activeCompanyId, activeRoleId, checkPermission, projects } = useApp();
  const canView =
    checkPermission("reporting", "view") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";
  const canEdit = activeRoleId === "owner" || activeRoleId === "manager";

  const [store, setStore] = useState<KPIStore>(() =>
    loadKPIs(activeCompanyId || ""),
  );
  const [selectedProjectId, setSelectedProjectId] = useState(
    (projects || [])[0]?.id || "",
  );
  const [editingKPI, setEditingKPI] = useState<{
    kpi: KPITarget;
    scope: "project" | "company";
  } | null>(null);
  const [editForm, setEditForm] = useState({ target: 0, actual: 0 });

  if (!canView) return <AccessDenied />;

  const persist = (updated: KPIStore) => {
    setStore(updated);
    saveKPIs(activeCompanyId || "", updated);
  };

  const getProjectKPIs = (projectId: string): KPITarget[] => {
    const set = store.projects.find((p) => p.projectId === projectId);
    if (set) return set.kpis;
    return DEFAULT_KPIs.map((k, i) => ({
      ...k,
      id: `kpi_${projectId}_${i}`,
      target: 0,
      actual: 0,
    }));
  };

  const getCompanyKPIs = (): KPITarget[] => {
    if (store.company.length > 0) return store.company;
    return COMPANY_DEFAULT_KPIs.map((k, i) => ({
      ...k,
      id: `kpi_company_${i}`,
      target: 0,
      actual: 0,
    }));
  };

  const handleEdit = (kpi: KPITarget, scope: "project" | "company") => {
    setEditingKPI({ kpi, scope });
    setEditForm({ target: kpi.target, actual: kpi.actual });
  };

  const handleSave = () => {
    if (!editingKPI) return;
    const { kpi, scope } = editingKPI;
    const updatedKPI = {
      ...kpi,
      target: editForm.target,
      actual: editForm.actual,
    };

    if (scope === "company") {
      const companyKPIs = getCompanyKPIs();
      const updated = companyKPIs.map((k) =>
        k.id === kpi.id ? updatedKPI : k,
      );
      persist({ ...store, company: updated });
    } else {
      const projectKPIs = getProjectKPIs(selectedProjectId);
      const updatedSet: ProjectKPISet = {
        projectId: selectedProjectId,
        kpis: projectKPIs.map((k) => (k.id === kpi.id ? updatedKPI : k)),
      };
      const updatedProjects = store.projects.filter(
        (p) => p.projectId !== selectedProjectId,
      );
      persist({ ...store, projects: [...updatedProjects, updatedSet] });
    }
    setEditingKPI(null);
    toast.success("KPI hedefi güncellendi.");
  };

  const projectKPIs = selectedProjectId
    ? getProjectKPIs(selectedProjectId)
    : [];
  const companyKPIs = getCompanyKPIs();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">KPI Hedefleri</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Proje ve şirket bazlı performans hedeflerini takip edin
        </p>
      </div>

      <Tabs defaultValue="project" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="kpi.project.tab"
            value="project"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Target className="h-4 w-4 mr-2" />
            Proje KPI'ları
          </TabsTrigger>
          <TabsTrigger
            data-ocid="kpi.company.tab"
            value="company"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Şirket KPI'ları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger
                data-ocid="kpi.project.select"
                className="w-64 bg-card border-border"
              >
                <SelectValue placeholder="Proje seçin" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(projects || []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedProjectId ? (
            <div
              data-ocid="kpi.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Target className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Proje seçin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {projectKPIs.map((kpi) => (
                <KPICard
                  key={kpi.id}
                  kpi={kpi}
                  onEdit={() => canEdit && handleEdit(kpi, "project")}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyKPIs.map((kpi) => (
              <KPICard
                key={kpi.id}
                kpi={kpi}
                onEdit={() => canEdit && handleEdit(kpi, "company")}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingKPI}
        onOpenChange={(o) => !o && setEditingKPI(null)}
      >
        <DialogContent data-ocid="kpi.dialog" className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Hedef Belirle – {editingKPI?.kpi.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hedef Değer ({editingKPI?.kpi.unit})</Label>
              <Input
                data-ocid="kpi.target.input"
                type="number"
                value={editForm.target}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    target: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1 bg-background border-border"
                min={0}
              />
            </div>
            <div>
              <Label>Gerçekleşen Değer ({editingKPI?.kpi.unit})</Label>
              <Input
                data-ocid="kpi.actual.input"
                type="number"
                value={editForm.actual}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    actual: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1 bg-background border-border"
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="kpi.cancel_button"
              variant="outline"
              onClick={() => setEditingKPI(null)}
            >
              İptal
            </Button>
            <Button
              data-ocid="kpi.save_button"
              className="gradient-bg text-white"
              onClick={handleSave}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
