import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  BarChart3,
  CheckSquare,
  Clock,
  DollarSign,
  Download,
  FolderKanban,
  Layers,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

const PERIODS = ["Bu Ay", "Son 3 Ay", "Son 6 Ay", "Bu Yıl"];

const PROJECT_GRADIENTS = [
  {
    gradient: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    accent: "text-violet-400",
    bar: "oklch(0.55 0.18 290)",
  },
  {
    gradient: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
    accent: "text-blue-400",
    bar: "oklch(0.55 0.18 230)",
  },
  {
    gradient: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    accent: "text-emerald-400",
    bar: "oklch(0.6 0.18 160)",
  },
  {
    gradient: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
    accent: "text-amber-400",
    bar: "oklch(0.7 0.18 60)",
  },
  {
    gradient: "from-rose-500/20 to-pink-500/10 border-rose-500/30",
    accent: "text-rose-400",
    bar: "oklch(0.6 0.2 10)",
  },
  {
    gradient: "from-cyan-500/20 to-sky-500/10 border-cyan-500/30",
    accent: "text-cyan-400",
    bar: "oklch(0.65 0.18 200)",
  },
];

const PIE_COLORS = [
  "oklch(0.55 0.18 264)",
  "oklch(0.6 0.18 160)",
  "oklch(0.7 0.15 60)",
  "oklch(0.6 0.18 300)",
];

// ── KAPANIŞ RAPORU BİLEŞENİ ─────────────────────────────────────────────────
interface ClosureProject {
  id: string;
  title: string;
  budget?: number;
  companyId: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

function ClosureReportsTab({
  projects,
  tasks,
  expenses,
  companyId,
}: {
  projects: ClosureProject[];
  tasks: Array<{ projectId: string; status: string }>;
  expenses: Array<{ projectId?: string; amount: number; status?: string }>;
  companyId: string;
}) {
  const completedProjects = projects.filter(
    (p) => p.companyId === companyId && p.status === "Tamamlandı",
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const getProjectStats = (p: ClosureProject) => {
    const projTasks = tasks.filter((t) => t.projectId === p.id);
    const doneTasks = projTasks.filter((t) => t.status === "done").length;
    const projExpenses = expenses
      .filter((e) => e.projectId === p.id)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const budgetVariance = (p.budget || 0) - projExpenses;
    const completionRate =
      projTasks.length > 0
        ? Math.round((doneTasks / projTasks.length) * 100)
        : 0;

    let durationDays: number | null = null;
    if (p.startDate && p.endDate) {
      durationDays = Math.ceil(
        (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    return {
      projTasks,
      doneTasks,
      projExpenses,
      budgetVariance,
      completionRate,
      durationDays,
    };
  };

  if (completedProjects.length === 0) {
    return (
      <div
        data-ocid="reporting.closure.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <FolderKanban className="w-14 h-14 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Tamamlanan Proje Yok
        </h3>
        <p className="text-muted-foreground text-sm">
          Durumu "Tamamlandı" olan projeler burada görünecek
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-foreground">
        Proje Kapanış Raporları
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedProjects.map((project, idx) => {
          const stats = getProjectStats(project);
          return (
            <Card
              key={project.id}
              data-ocid={`reporting.closure.item.${idx + 1}`}
              className="bg-card border-border hover:border-amber-500/50 transition-colors cursor-pointer"
              onClick={() =>
                setSelectedId(selectedId === project.id ? null : project.id)
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground leading-tight">
                    {project.title}
                  </CardTitle>
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/30 border text-xs flex-shrink-0">
                    Tamamlandı
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Bütçe</p>
                    <p className="text-sm font-semibold text-foreground">
                      {(project.budget || 0).toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gerçekleşen</p>
                    <p className="text-sm font-semibold text-foreground">
                      {stats.projExpenses.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bütçe Farkı</p>
                    <p
                      className={`text-sm font-semibold ${stats.budgetVariance >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {stats.budgetVariance >= 0 ? "+" : ""}
                      {stats.budgetVariance.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Görev Tamamlama
                    </p>
                    <p className="text-sm font-semibold text-amber-400">
                      %{stats.completionRate}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Görevler: {stats.doneTasks}/{stats.projTasks.length}
                    </span>
                    {stats.durationDays !== null && (
                      <span>Süre: {stats.durationDays} gün</span>
                    )}
                  </div>
                </div>
                {selectedId === project.id && (
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                      Kapanış Özeti
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Başlangıç:
                        </span>
                        <span className="text-foreground">
                          {project.startDate || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bitiş:</span>
                        <span className="text-foreground">
                          {project.endDate || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Bütçe Kullanımı:
                        </span>
                        <span
                          className={
                            (project.budget ?? 0) > 0
                              ? stats.projExpenses / (project.budget ?? 1) > 1
                                ? "text-red-400"
                                : "text-green-400"
                              : "text-foreground"
                          }
                        >
                          {(project.budget ?? 0) > 0
                            ? `%${Math.round((stats.projExpenses / (project.budget ?? 1)) * 100)}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <Button
                      data-ocid={`reporting.closure.print_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      className="w-full border-border text-xs mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.print();
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Yazdır / Dışa Aktar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function Reporting() {
  const {
    activeRoleId,
    activeCompanyId,
    checkPermission,
    projects,
    tasks,
    expenses,
    invoices,
    hrPersonnel,
    workOrders,
    overtimeRecords,
    milestones,
    equipment,
    maintenanceFaults,
    payrollRecords,
    quotes,
    contracts,
    materialRequests,
    rfis,
    isgIncidents,
    riskItems,
    ncrRecords,
    qualityChecklists,
    hakedisItems,
  } = useApp();

  const canView =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "pm" ||
    activeRoleId === "supervisor" ||
    checkPermission("reporting", "view");

  const [period, setPeriod] = useState("Son 6 Ay");
  const [activeTab, setActiveTab] = useState("genel");

  const filterByPeriod = (date: string): boolean => {
    if (!date) return true;
    const d = new Date(date);
    const now = new Date();
    if (period === "Bu Ay") {
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    }
    if (period === "Son 3 Ay") {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return d >= cutoff;
    }
    if (period === "Son 6 Ay") {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return d >= cutoff;
    }
    if (period === "Bu Yıl") {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Reactive CRM data from localStorage with company-scoped reload
  const [crmContacts, setCrmContacts] = useState<Array<{ type: string }>>(
    () => {
      if (!activeCompanyId) return [];
      try {
        const s = localStorage.getItem(`pv_crm_contacts_${activeCompanyId}`);
        return s ? JSON.parse(s) : [];
      } catch {
        return [];
      }
    },
  );
  const [crmLeads, setCrmLeads] = useState<
    Array<{ status: string; value?: number }>
  >(() => {
    if (!activeCompanyId) return [];
    try {
      const s = localStorage.getItem(`pv_crm_leads_${activeCompanyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [qsInspections, setQsInspections] = useState<Array<{ status: string }>>(
    () => {
      if (!activeCompanyId) return [];
      try {
        const s = localStorage.getItem(`pv_qs_${activeCompanyId}`);
        return s ? JSON.parse(s) : [];
      } catch {
        return [];
      }
    },
  );
  const [qsIncidents, setQsIncidents] = useState<Array<object>>(() => {
    if (!activeCompanyId) return [];
    try {
      const s = localStorage.getItem(`pv_inc_${activeCompanyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!activeCompanyId) return;
    try {
      const sc = localStorage.getItem(`pv_crm_contacts_${activeCompanyId}`);
      setCrmContacts(sc ? JSON.parse(sc) : []);
      const sl = localStorage.getItem(`pv_crm_leads_${activeCompanyId}`);
      setCrmLeads(sl ? JSON.parse(sl) : []);
      const si = localStorage.getItem(`pv_qs_${activeCompanyId}`);
      setQsInspections(si ? JSON.parse(si) : []);
      const sinc = localStorage.getItem(`pv_inc_${activeCompanyId}`);
      setQsIncidents(sinc ? JSON.parse(sinc) : []);
    } catch {
      // ignore parse errors
    }
  }, [activeCompanyId]);

  // v49 Module Data from localStorage
  const loadLS = <T,>(key: string, fallback: T): T => {
    try {
      const s = localStorage.getItem(key);
      return s ? (JSON.parse(s) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  type Job = { status: string; department?: string };
  type Candidate = { stage: string; jobId?: string };
  type Onboarding = { completed: boolean };
  type Advance = {
    status: string;
    amount?: number;
    category?: string;
    date?: string;
  };
  type Complaint = { status: string; category?: string };
  type Location = { name: string; capacity?: number; currentStock?: number };
  type SubWorkOrder = {
    status: string;
    subcontractorId?: string;
    plannedEnd?: string;
  };

  const recruitmentJobs = loadLS<Job[]>(
    `pv_recruitment_jobs_${activeCompanyId}`,
    [],
  );
  const recruitmentCandidates = loadLS<Candidate[]>(
    `pv_recruitment_candidates_${activeCompanyId}`,
    [],
  );
  const recruitmentOnboarding = loadLS<Onboarding[]>(
    `pv_recruitment_onboarding_${activeCompanyId}`,
    [],
  );
  const advances = loadLS<Advance[]>(`pv_advances_${activeCompanyId}`, []);
  const complaints = loadLS<Complaint[]>(
    `pv_complaints_${activeCompanyId}`,
    [],
  );
  const warehouseLocations = loadLS<Location[]>(
    `pv_locations_${activeCompanyId}`,
    [],
  );
  const subWorkOrders = loadLS<SubWorkOrder[]>(
    `pv_sub_workorders_${activeCompanyId}`,
    [],
  );

  const totalCustomers = crmContacts.length;
  const openOpportunities = crmLeads.filter(
    (l) => l.status !== "kazanildi" && l.status !== "kaybedildi",
  ).length;
  const pipelineValue = crmLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const totalQsInspections = qsInspections.length;
  const incidentCount = qsIncidents.length;
  const openFindings = qsInspections.filter(
    (i: { status: string }) => i.status === "Düzeltici Aksiyon Gerekiyor",
  ).length;

  // Equipment analytics
  const companyEquipment = equipment.filter(
    (e) => e.companyId === activeCompanyId,
  );
  const companyFaults = maintenanceFaults.filter((f) => {
    const eq = equipment.find((e) => e.id === f.equipmentId);
    return eq?.companyId === activeCompanyId;
  });
  const openFaults = companyFaults.filter(
    (f) => (f as { status: string }).status === "open",
  );

  // Payroll analytics
  const companyPayroll = payrollRecords.filter(
    (r) => (r as { companyId: string }).companyId === activeCompanyId,
  );

  // Quote analytics
  const companyQuotes = quotes.filter(
    (q) => (q as { companyId: string }).companyId === activeCompanyId,
  );

  if (!canView) return <AccessDenied />;

  // KPI computations
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "planning",
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed",
  ).length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const avgCompletion =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalBudget = projects.reduce(
    (sum, p) => sum + ((p as { budget?: number }).budget || 0),
    0,
  );
  const filteredExpenses = expenses.filter((e) => filterByPeriod(e.date));
  const totalSpent = filteredExpenses.reduce(
    (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
    0,
  );
  const budgetUsage =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const totalPersonnel = hrPersonnel.length;
  const activePersonnel = hrPersonnel.filter(
    (p) => p.status === "Aktif",
  ).length;
  const pendingWorkOrders = workOrders.filter(
    (w) => w.status === "open",
  ).length;

  // Budget chart: top 5 projects
  const budgetData = projects.slice(0, 5).map((p) => {
    const projectExpenses = filteredExpenses
      .filter((e) => e.projectId === p.id)
      .reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : 0), 0);
    return {
      project: p.title.length > 12 ? `${p.title.slice(0, 12)}…` : p.title,
      Planlanan: (p as { budget?: number }).budget || 0,
      Gerçekleşen: projectExpenses || 0,
    };
  });

  // Monthly expense trend: last 6 months
  const now = new Date();
  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("tr-TR", { month: "short" }).replace(".", ""),
    };
  });
  const expenseTrend = monthLabels.map(({ key, label }) => ({
    ay: label,
    toplam: filteredExpenses
      .filter((e) => (e.date || "").startsWith(key))
      .reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : 0), 0),
  }));

  // Project status pie chart
  const statusMap: Record<string, string> = {
    planning: "Planlama",
    active: "Aktif",
    on_hold: "Beklemede",
    completed: "Tamamlandı",
  };
  const statusCounts: Record<string, number> = {};
  for (const p of projects) {
    const label = statusMap[p.status] || p.status;
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  }
  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Personnel department distribution
  const deptCounts: Record<string, number> = {};
  for (const p of hrPersonnel) {
    deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
  }
  const deptPieData = Object.entries(deptCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Project progress cards
  const projectCards = projects.slice(0, 6).map((p, i) => {
    const projTasks = tasks.filter((t) => t.projectId === p.id);
    const doneTasks = projTasks.filter((t) => t.status === "done").length;
    const progress =
      projTasks.length > 0
        ? Math.round((doneTasks / projTasks.length) * 100)
        : (p.progress ?? 0);
    const g = PROJECT_GRADIENTS[i % PROJECT_GRADIENTS.length];
    return {
      name: p.title,
      status: statusMap[p.status] || p.status,
      progress,
      tasksDone: doneTasks,
      tasksTotal: projTasks.length,
      gradient: g.gradient,
      accent: g.accent,
    };
  });

  const kpis = [
    {
      label: "Toplam Proje",
      value: String(totalProjects),
      sub: `${activeProjects} aktif, ${completedProjects} tamamlandı`,
      icon: <FolderKanban className="w-5 h-5" />,
      color: "text-violet-400",
      bg: "from-violet-500/10 to-purple-500/5 border-violet-500/20",
    },
    {
      label: "Görev Durumu",
      value: `${completedTasks}/${totalTasks}`,
      sub: `${inProgressTasks} devam ediyor`,
      icon: <CheckSquare className="w-5 h-5" />,
      color: "text-blue-400",
      bg: "from-blue-500/10 to-cyan-500/5 border-blue-500/20",
    },
    {
      label: "Ort. Tamamlanma",
      value: `${avgCompletion}%`,
      sub: "proje bazında ortalama",
      icon: <Activity className="w-5 h-5" />,
      color: "text-cyan-400",
      bg: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
    },
    {
      label: "Bütçe Kullanımı",
      value: `${budgetUsage}%`,
      sub: `₺${totalSpent.toLocaleString("tr-TR")} harcandı`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
    },
    {
      label: "Personel",
      value: String(totalPersonnel),
      sub: `${activePersonnel} aktif çalışan`,
      icon: <Users className="w-5 h-5" />,
      color: "text-amber-400",
      bg: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
    },
    {
      label: "Bekleyen İş Emirleri",
      value: String(pendingWorkOrders),
      sub: "onay bekliyor",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-rose-400",
      bg: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
    },
    {
      label: "CRM Müşteriler",
      value: String(totalCustomers),
      sub: `${openOpportunities} açık fırsat`,
      icon: <Users className="w-5 h-5" />,
      color: "text-violet-400",
      bg: "from-violet-500/10 to-purple-500/5 border-violet-500/20",
    },
    {
      label: "Pipeline Değeri",
      value: `₺${pipelineValue.toLocaleString("tr-TR")}`,
      sub: `${openOpportunities} aktif fırsat`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-amber-400",
      bg: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
    },
    {
      label: "Kalite Denetimleri",
      value: String(totalQsInspections),
      sub: `${openFindings} açık bulgu`,
      icon: <CheckSquare className="w-5 h-5" />,
      color: "text-cyan-400",
      bg: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
    },
    {
      label: "İSG Olayları",
      value: String(incidentCount),
      sub: "olay & kaza kaydı",
      icon: <Activity className="w-5 h-5" />,
      color: "text-rose-400",
      bg: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
    },
    {
      label: "Faturalar",
      value: String(invoices.length),
      sub: `₺${invoices.reduce((s, i) => s + i.amount, 0).toLocaleString("tr-TR")} toplam`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
    },
    {
      label: "Bu Ay Mesai",
      value: `${(() => {
        const m = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        return overtimeRecords
          .filter((r) => r.status === "approved" && r.date.startsWith(m))
          .reduce((s, r) => s + r.hours, 0);
      })()}s`,
      sub: "onaylanan mesai saati",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-cyan-400",
      bg: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
    },
    {
      label: "Kilometre Taşları",
      value: `${milestones.filter((m) => m.completed).length}/${milestones.length}`,
      sub:
        milestones.length > 0
          ? `${Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)}% tamamlandı`
          : "taş tanımlanmamış",
      icon: <CheckSquare className="w-5 h-5" />,
      color: "text-violet-400",
      bg: "from-violet-500/10 to-purple-500/5 border-violet-500/20",
    },
  ];

  const chartTooltipStyle = {
    backgroundColor: "oklch(0.16 0.01 264)",
    border: "1px solid oklch(0.26 0.01 264)",
    borderRadius: "8px",
    color: "oklch(0.92 0.01 264)",
  };

  const exportCSV = () => {
    const headers = [
      "Proje",
      "Bütçe",
      "Harcanan",
      "Görev Sayısı",
      "Tamamlanma %",
    ];
    const rows = projects.map((p) => {
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const doneTasks = projTasks.filter((t) => t.status === "done").length;
      const spent = expenses
        .filter((e) => e.projectId === p.id)
        .reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : 0), 0);
      return [
        p.title,
        (p as { budget?: number }).budget || 0,
        spent,
        projTasks.length,
        projTasks.length ? Math.round((doneTasks / projTasks.length) * 100) : 0,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rapor.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Overtime summary (approved only, top 8 by hours)
  const overtimeSummary = (() => {
    const map: Record<string, number> = {};
    for (const r of (overtimeRecords || []).filter(
      (r: { status: string }) => r.status === "approved",
    )) {
      const rec = r as { personnelName?: string; hours?: number };
      const name = rec.personnelName || "Bilinmiyor";
      map[name] = (map[name] || 0) + (rec.hours || 0);
    }
    return Object.entries(map)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);
  })();

  // Milestone summary per project
  const milestoneSummary = (() => {
    const map: Record<string, { total: number; completed: number }> = {};
    for (const m of milestones || []) {
      const ms = m as { projectId?: string; completed?: boolean };
      const pid = ms.projectId || "";
      if (!map[pid]) map[pid] = { total: 0, completed: 0 };
      map[pid].total++;
      if (ms.completed) map[pid].completed++;
    }
    return Object.entries(map)
      .map(([pid, counts]) => {
        const proj = projects.find((p) => p.id === pid);
        return { name: proj ? proj.title : pid, ...counts };
      })
      .filter((r) => r.name);
  })();

  // CRM funnel by stage
  const CRM_STAGES = ["yeni", "iletisim", "teklif", "muzakere", "kazanildi"];
  const crmFunnelData = CRM_STAGES.map((stage) => ({
    stage,
    count: crmLeads.filter((l) => l.status === stage).length,
  }));

  // Budget P&L
  const budgetPL = projects.map((p) => {
    const budget = (p as { budget?: number }).budget || 0;
    const spent = expenses
      .filter(
        (e: { projectId?: string; status?: string }) =>
          e.projectId === p.id && e.status === "Onaylandı",
      )
      .reduce(
        (sum: number, e: { amount?: number }) => sum + (e.amount || 0),
        0,
      );
    return { name: p.title, budget, spent, diff: budget - spent };
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Raporlama</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proje ilerleme, bütçe ve KPI analizleri
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="reporting.export.button"
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="gap-2 border-border text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4" />
            Excel'e Aktar
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger
              data-ocid="reporting.period.select"
              className="w-40 bg-card border-border"
            >
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
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 flex-wrap">
        {[
          { id: "genel", label: "Genel Bakış" },
          { id: "sozlesme", label: "Sözleşme & Hakediş" },
          { id: "risk", label: "Risk & Kalite" },
          { id: "isg", label: "İSG & Saha" },
          { id: "kapanış", label: "Kapanış Raporları" },
          { id: "segri", label: "S-Eğrisi" },
          { id: "iseAlim", label: "İşe Alım & Onboarding" },
          { id: "avans", label: "Avans & Harcama" },
          { id: "sikayet", label: "Şikayet & Talepler" },
          { id: "depo", label: "Depo & Lokasyon" },
          { id: "taseronIs", label: "Taşeron İş Emirleri" },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`reporting.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "genel" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((kpi, idx) => (
              <Card
                key={kpi.label}
                data-ocid={`reporting.kpi.card.${idx + 1}`}
                className={`bg-gradient-to-br border ${kpi.bg}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                  <span className={kpi.color}>{kpi.icon}</span>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className={`text-2xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpi.sub}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card
              data-ocid="reporting.budget.chart"
              className="bg-card border-border xl:col-span-2"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  Proje Bazında Bütçe Karşılaştırması
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetData.length === 0 ? (
                  <div
                    data-ocid="reporting.budget.empty_state"
                    className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                  >
                    Henüz proje verisi yok.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={budgetData}
                      margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.26 0.01 264)"
                      />
                      <XAxis
                        dataKey="project"
                        tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                        axisLine={{ stroke: "oklch(0.26 0.01 264)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) =>
                          `${(v / 1000000).toFixed(1)}M`
                        }
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number) =>
                          `₺${value.toLocaleString("tr-TR")}`
                        }
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: 12,
                          color: "oklch(0.6 0.02 264)",
                        }}
                      />
                      <Bar
                        dataKey="Planlanan"
                        fill="oklch(0.55 0.18 264)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Gerçekleşen"
                        fill="oklch(0.55 0.22 300)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card
              data-ocid="reporting.project_status.chart"
              className="bg-card border-border"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="w-4 h-4 text-muted-foreground" />
                  Proje Durum Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusPieData.length === 0 ? (
                  <div
                    data-ocid="reporting.status.empty_state"
                    className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                  >
                    Henüz proje yok.
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {statusPieData.map((entry, index) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            <span className="text-muted-foreground">
                              {entry.name}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {entry.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card
              data-ocid="reporting.expense.chart"
              className="bg-card border-border xl:col-span-2"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  Aylık Gider Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={expenseTrend}
                    margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.26 0.01 264)"
                    />
                    <XAxis
                      dataKey="ay"
                      tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                      axisLine={{ stroke: "oklch(0.26 0.01 264)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number) =>
                        `₺${value.toLocaleString("tr-TR")}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="toplam"
                      stroke="oklch(0.7 0.18 200)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.7 0.18 200)", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Toplam Gider"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card
              data-ocid="reporting.personnel_dept.chart"
              className="bg-card border-border"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Personel Departman Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deptPieData.length === 0 ? (
                  <div
                    data-ocid="reporting.dept.empty_state"
                    className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                  >
                    Henüz personel yok.
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={deptPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {deptPieData.map((entry, index) => (
                            <Cell
                              key={`cell-dept-${entry.name}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {deptPieData.map((entry, index) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            <span className="text-muted-foreground">
                              {entry.name}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {entry.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Progress Cards */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Proje İlerleme Durumu
            </h2>
            {projectCards.length === 0 ? (
              <div
                data-ocid="reporting.projects.empty_state"
                className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl"
              >
                <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Henüz proje bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projectCards.map((proj, idx) => (
                  <Card
                    key={proj.name}
                    data-ocid={`reporting.project.card.${idx + 1}`}
                    className={`bg-gradient-to-br border ${proj.gradient}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{proj.name}</CardTitle>
                        <span className={`text-2xl font-bold ${proj.accent}`}>
                          {proj.progress}%
                        </span>
                      </div>
                      <Badge variant="outline" className="w-fit text-xs">
                        {proj.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={proj.progress} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Görevler
                          </p>
                          <p className="font-medium">
                            {proj.tasksDone}/{proj.tasksTotal}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Tamamlanma
                          </p>
                          <p className={`font-medium ${proj.accent}`}>
                            {proj.progress}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Extended Analytics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* A. Overtime Summary */}
              <Card
                data-ocid="reporting.overtime.card"
                className="bg-[oklch(0.18_0.02_264)] border border-border"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-amber-400" />
                    Personel Mesai Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overtimeSummary.length === 0 ? (
                    <div
                      data-ocid="reporting.overtime.empty_state"
                      className="text-center py-10 text-muted-foreground"
                    >
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Onaylı mesai kaydı bulunmuyor.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={overtimeSummary}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.3 0.01 264)"
                        />
                        <XAxis
                          type="number"
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 11 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 11 }}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(0.18 0.02 264)",
                            border: "1px solid oklch(0.3 0.02 264)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "oklch(0.9 0.02 264)" }}
                        />
                        <Bar
                          dataKey="hours"
                          fill="oklch(0.7 0.18 60)"
                          radius={[0, 4, 4, 0]}
                          name="Mesai (saat)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* B. Milestone Progress */}
              <Card
                data-ocid="reporting.milestones.card"
                className="bg-[oklch(0.18_0.02_264)] border border-border"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    Kilometre Taşı İlerlemesi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {milestoneSummary.length === 0 ? (
                    <div
                      data-ocid="reporting.milestones.empty_state"
                      className="text-center py-10 text-muted-foreground"
                    >
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">
                        Henüz kilometre taşı bulunmuyor.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={milestoneSummary}
                        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.3 0.01 264)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 10 }}
                        />
                        <YAxis
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(0.18 0.02 264)",
                            border: "1px solid oklch(0.3 0.02 264)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "oklch(0.9 0.02 264)" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar
                          dataKey="total"
                          fill="oklch(0.45 0.02 264)"
                          name="Toplam"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="completed"
                          fill="oklch(0.6 0.18 160)"
                          name="Tamamlanan"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* C. CRM Sales Funnel */}
              <Card
                data-ocid="reporting.crm_funnel.card"
                className="bg-[oklch(0.18_0.02_264)] border border-border"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-violet-400" />
                    CRM Satış Hunisi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {crmFunnelData.length === 0 ||
                  crmFunnelData.every((d) => d.count === 0) ? (
                    <div
                      data-ocid="reporting.crm_funnel.empty_state"
                      className="text-center py-10 text-muted-foreground"
                    >
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Henüz CRM kaydı bulunmuyor.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={crmFunnelData}
                        margin={{ top: 4, right: 16, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.3 0.01 264)"
                        />
                        <XAxis
                          dataKey="stage"
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 10 }}
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(0.18 0.02 264)",
                            border: "1px solid oklch(0.3 0.02 264)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "oklch(0.9 0.02 264)" }}
                        />
                        <Bar
                          dataKey="count"
                          fill="oklch(0.55 0.18 290)"
                          radius={[4, 4, 0, 0]}
                          name="Lead Sayısı"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* D. Budget P&L Table */}
              <Card
                data-ocid="reporting.budget_table.card"
                className="bg-[oklch(0.18_0.02_264)] border border-border"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4 text-amber-400" />
                    Proje Bütçe Kar/Zarar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {budgetPL.length === 0 ? (
                    <div
                      data-ocid="reporting.budget_table.empty_state"
                      className="text-center py-10 text-muted-foreground"
                    >
                      <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Henüz proje bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                              Proje
                            </th>
                            <th className="text-right py-2 pr-3 text-muted-foreground font-medium">
                              Planlanan
                            </th>
                            <th className="text-right py-2 pr-3 text-muted-foreground font-medium">
                              Gerçekleşen
                            </th>
                            <th className="text-right py-2 text-muted-foreground font-medium">
                              Fark
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgetPL.map((row) => (
                            <tr
                              key={row.name}
                              className="border-b border-border/40 hover:bg-white/5 transition-colors"
                            >
                              <td className="py-2 pr-3 font-medium truncate max-w-[120px]">
                                {row.name}
                              </td>
                              <td className="py-2 pr-3 text-right text-muted-foreground">
                                ₺{row.budget.toLocaleString("tr-TR")}
                              </td>
                              <td className="py-2 pr-3 text-right text-muted-foreground">
                                ₺{row.spent.toLocaleString("tr-TR")}
                              </td>
                              <td
                                className={`py-2 text-right font-semibold ${row.diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                {row.diff >= 0 ? "+" : ""}₺
                                {row.diff.toLocaleString("tr-TR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* E. Equipment Analytics */}
              <Card
                data-ocid="reporting.equipment.card"
                className="bg-[oklch(0.18_0.02_264)] border border-border xl:col-span-2"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4 text-amber-400" />
                    Ekipman Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      {
                        label: "Toplam",
                        value: companyEquipment.length,
                        color: "text-foreground",
                      },
                      {
                        label: "Aktif",
                        value: companyEquipment.filter(
                          (e) => e.status === "active",
                        ).length,
                        color: "text-emerald-400",
                      },
                      {
                        label: "Bakımda",
                        value: companyEquipment.filter(
                          (e) => e.status === "maintenance",
                        ).length,
                        color: "text-amber-400",
                      },
                      {
                        label: "Arızalı",
                        value: companyEquipment.filter(
                          (e) => e.status === "broken",
                        ).length,
                        color: "text-rose-400",
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-lg bg-white/5 p-3 text-center"
                      >
                        <p className={`text-xl font-bold ${kpi.color}`}>
                          {kpi.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {kpi.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  {companyEquipment.length === 0 ? (
                    <div
                      data-ocid="reporting.equipment.empty_state"
                      className="text-center py-8 text-muted-foreground"
                    >
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Henüz ekipman kaydı bulunmuyor.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart
                        data={[
                          {
                            durum: "Aktif",
                            adet: companyEquipment.filter(
                              (e) => e.status === "active",
                            ).length,
                          },
                          {
                            durum: "Bakımda",
                            adet: companyEquipment.filter(
                              (e) => e.status === "maintenance",
                            ).length,
                          },
                          {
                            durum: "Arızalı",
                            adet: companyEquipment.filter(
                              (e) => e.status === "broken",
                            ).length,
                          },
                          {
                            durum: "Boşta",
                            adet: companyEquipment.filter(
                              (e) => e.status === "idle",
                            ).length,
                          },
                        ]}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.3 0.01 264)"
                        />
                        <XAxis
                          dataKey="durum"
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(0.18 0.02 264)",
                            border: "1px solid oklch(0.3 0.02 264)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="adet"
                          radius={[4, 4, 0, 0]}
                          name="Ekipman Sayısı"
                        >
                          {[
                            "oklch(0.6 0.18 160)",
                            "oklch(0.7 0.18 60)",
                            "oklch(0.6 0.2 10)",
                            "oklch(0.55 0.02 264)",
                          ].map((color) => (
                            <Cell key={color} fill={color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {openFaults.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Açık Arızalar / Bakımlar
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium text-xs">
                                Ekipman
                              </th>
                              <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium text-xs">
                                Tür
                              </th>
                              <th className="text-left py-1.5 text-muted-foreground font-medium text-xs">
                                Açıklama
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {openFaults.slice(0, 5).map((fault, idx) => {
                              const eq = companyEquipment.find(
                                (e) =>
                                  e.id ===
                                  (fault as { equipmentId: string })
                                    .equipmentId,
                              );
                              return (
                                <tr
                                  key={
                                    (fault as { id: string }).id || String(idx)
                                  }
                                  className="border-b border-border/40"
                                >
                                  <td className="py-1.5 pr-3 font-medium text-xs">
                                    {eq?.name || "—"}
                                  </td>
                                  <td className="py-1.5 pr-3 text-xs text-amber-400">
                                    {(fault as { type: string }).type ===
                                    "maintenance"
                                      ? "Bakım"
                                      : "Arıza"}
                                  </td>
                                  <td className="py-1.5 text-xs text-muted-foreground truncate max-w-[160px]">
                                    {
                                      (fault as { description: string })
                                        .description
                                    }
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* F. Payroll Summary */}
              <Card
                data-ocid="reporting.payroll.card"
                className="bg-[oklch(0.18_0.02_264)] border border-border"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    Bordro Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Toplam Kayıt",
                        value: companyPayroll.length,
                        color: "text-foreground",
                      },
                      {
                        label: "Ödenen",
                        value: companyPayroll.filter(
                          (r) => (r as { status: string }).status === "paid",
                        ).length,
                        color: "text-emerald-400",
                      },
                      {
                        label: "Onaylanan",
                        value: companyPayroll.filter(
                          (r) =>
                            (r as { status: string }).status === "approved",
                        ).length,
                        color: "text-blue-400",
                      },
                      {
                        label: "Bekleyen",
                        value: companyPayroll.filter(
                          (r) => (r as { status: string }).status === "pending",
                        ).length,
                        color: "text-amber-400",
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-lg bg-white/5 p-3 text-center"
                      >
                        <p className={`text-xl font-bold ${kpi.color}`}>
                          {kpi.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {kpi.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                    <p className="text-lg font-bold text-emerald-400">
                      ₺
                      {companyPayroll
                        .filter(
                          (r) => (r as { status: string }).status === "paid",
                        )
                        .reduce(
                          (s, r) =>
                            s + ((r as { netSalary: number }).netSalary || 0),
                          0,
                        )
                        .toLocaleString("tr-TR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toplam Ödenen Net Maaş
                    </p>
                  </div>
                  {companyPayroll.length === 0 ? (
                    <div
                      data-ocid="reporting.payroll.empty_state"
                      className="text-center py-6 text-muted-foreground"
                    >
                      <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Henüz bordro kaydı bulunmuyor.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart
                        data={(() => {
                          const monthMap: Record<string, number> = {};
                          for (const r of companyPayroll) {
                            const rec = r as {
                              month: string;
                              netSalary: number;
                            };
                            monthMap[rec.month] =
                              (monthMap[rec.month] || 0) + rec.netSalary;
                          }
                          return Object.entries(monthMap)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .slice(-6)
                            .map(([month, total]) => ({
                              ay: month,
                              toplam: total,
                            }));
                        })()}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.3 0.01 264)"
                        />
                        <XAxis
                          dataKey="ay"
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) =>
                            `${(v / 1000).toFixed(0)}K`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(0.18 0.02 264)",
                            border: "1px solid oklch(0.3 0.02 264)",
                            borderRadius: "8px",
                          }}
                          formatter={(v: number) =>
                            `₺${v.toLocaleString("tr-TR")}`
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="toplam"
                          stroke="oklch(0.6 0.18 160)"
                          strokeWidth={2}
                          dot={{ fill: "oklch(0.6 0.18 160)", r: 3 }}
                          name="Net Maaş Toplamı"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* G. Quote & Discovery */}
              <Card
                data-ocid="reporting.quotes.card"
                className="bg-[oklch(0.18_0.02_264)] border border-border"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-violet-400" />
                    Teklif & Keşif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Toplam Teklif",
                        value: companyQuotes.length,
                        color: "text-foreground",
                      },
                      {
                        label: "Kabul Edilen",
                        value: companyQuotes.filter(
                          (q) =>
                            (q as { status: string }).status === "accepted",
                        ).length,
                        color: "text-emerald-400",
                      },
                      {
                        label: "Gönderilen",
                        value: companyQuotes.filter(
                          (q) => (q as { status: string }).status === "sent",
                        ).length,
                        color: "text-blue-400",
                      },
                      {
                        label: "Reddedilen",
                        value: companyQuotes.filter(
                          (q) =>
                            (q as { status: string }).status === "rejected",
                        ).length,
                        color: "text-rose-400",
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-lg bg-white/5 p-3 text-center"
                      >
                        <p className={`text-xl font-bold ${kpi.color}`}>
                          {kpi.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {kpi.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                      <p className="text-lg font-bold text-emerald-400">
                        ₺
                        {companyQuotes
                          .filter(
                            (q) =>
                              (q as { status: string }).status === "accepted",
                          )
                          .reduce(
                            (s, q) =>
                              s +
                              ((q as { totalAmount: number }).totalAmount || 0),
                            0,
                          )
                          .toLocaleString("tr-TR")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kabul Edilen Toplam
                      </p>
                    </div>
                    <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-center">
                      <p className="text-lg font-bold text-violet-400">
                        {(() => {
                          const accepted = companyQuotes.filter(
                            (q) =>
                              (q as { status: string }).status === "accepted",
                          ).length;
                          const denom = companyQuotes.filter((q) =>
                            ["sent", "accepted", "rejected"].includes(
                              (q as { status: string }).status,
                            ),
                          ).length;
                          return denom > 0
                            ? `%${Math.round((accepted / denom) * 100)}`
                            : "—";
                        })()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kabul Oranı
                      </p>
                    </div>
                  </div>
                  {companyQuotes.length === 0 ? (
                    <div
                      data-ocid="reporting.quotes.empty_state"
                      className="text-center py-6 text-muted-foreground"
                    >
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Henüz teklif kaydı bulunmuyor.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={[
                          {
                            durum: "Taslak",
                            adet: companyQuotes.filter(
                              (q) =>
                                (q as { status: string }).status === "draft",
                            ).length,
                          },
                          {
                            durum: "Gönderilen",
                            adet: companyQuotes.filter(
                              (q) =>
                                (q as { status: string }).status === "sent",
                            ).length,
                          },
                          {
                            durum: "Kabul",
                            adet: companyQuotes.filter(
                              (q) =>
                                (q as { status: string }).status === "accepted",
                            ).length,
                          },
                          {
                            durum: "Reddedilen",
                            adet: companyQuotes.filter(
                              (q) =>
                                (q as { status: string }).status === "rejected",
                            ).length,
                          },
                        ]}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.3 0.01 264)"
                        />
                        <XAxis
                          dataKey="durum"
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "oklch(0.7 0.02 264)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(0.18 0.02 264)",
                            border: "1px solid oklch(0.3 0.02 264)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="adet"
                          radius={[4, 4, 0, 0]}
                          name="Teklif Sayısı"
                        >
                          {[
                            "oklch(0.55 0.02 264)",
                            "oklch(0.55 0.18 230)",
                            "oklch(0.6 0.18 160)",
                            "oklch(0.6 0.2 10)",
                          ].map((color) => (
                            <Cell key={color} fill={color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* EVM Analizi */}
          <EVMSection projects={projects} expenses={expenses} />
        </>
      )}

      {/* ═══ Sözleşme & Hakediş Tab ═══ */}
      {activeTab === "sozlesme" &&
        (() => {
          const companyContracts = contracts.filter(
            (c) => c.companyId === activeCompanyId,
          );
          const companyHakedis = hakedisItems.filter(
            (h) => h.companyId === activeCompanyId,
          );
          const activeContracts = companyContracts.filter(
            (c) => c.status === "Aktif",
          ).length;
          const totalHakedisValue = companyHakedis
            .filter((h) => h.status === "Onaylandı")
            .reduce(
              (sum, h) =>
                sum +
                (h.items || []).reduce(
                  (
                    s: number,
                    item: {
                      amount?: number;
                      unitPrice?: number;
                      quantity?: number;
                    },
                  ) =>
                    s +
                    (item.amount ||
                      (item.unitPrice || 0) * (item.quantity || 0)),
                  0,
                ),
              0,
            );
          const contractsByStatus = [
            "Taslak",
            "Aktif",
            "Tamamlandı",
            "İptal",
          ].map((s) => ({
            durum: s,
            adet: companyContracts.filter((c) => c.status === s).length,
          }));
          const hakedisStatusData = [
            "Taslak",
            "Onay Bekliyor",
            "Onaylandı",
            "Reddedildi",
          ].map((s) => ({
            durum: s,
            adet: companyHakedis.filter((h) => h.status === s).length,
          }));
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Toplam Sözleşme",
                    value: companyContracts.length,
                    color: "text-amber-400",
                    bg: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
                  },
                  {
                    label: "Aktif Sözleşme",
                    value: activeContracts,
                    color: "text-emerald-400",
                    bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
                  },
                  {
                    label: "Onaylanan Hakediş",
                    value: `₺${totalHakedisValue.toLocaleString("tr-TR")}`,
                    color: "text-blue-400",
                    bg: "from-blue-500/10 to-cyan-500/5 border-blue-500/20",
                  },
                  {
                    label: "Hakediş Sayısı",
                    value: companyHakedis.length,
                    color: "text-violet-400",
                    bg: "from-violet-500/10 to-purple-500/5 border-violet-500/20",
                  },
                ].map((kpi, i) => (
                  <Card
                    key={kpi.label}
                    data-ocid={`reporting.sozlesme.kpi.card.${i + 1}`}
                    className={`bg-gradient-to-br border ${kpi.bg}`}
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {kpi.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className={`text-2xl font-bold ${kpi.color}`}>
                        {kpi.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card
                  data-ocid="reporting.sozlesme.contracts_status.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sözleşme Durumu Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companyContracts.length === 0 ? (
                      <div
                        data-ocid="reporting.sozlesme.contracts.empty_state"
                        className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                      >
                        Henüz sözleşme kaydı yok.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={contractsByStatus}
                          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.26 0.01 264)"
                          />
                          <XAxis
                            dataKey="durum"
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.16 0.01 264)",
                              border: "1px solid oklch(0.26 0.01 264)",
                              borderRadius: "8px",
                              color: "oklch(0.92 0.01 264)",
                            }}
                          />
                          <Bar dataKey="adet" radius={[4, 4, 0, 0]} name="Adet">
                            {contractsByStatus.map((entry, i) => (
                              <Cell
                                key={entry.durum}
                                fill={
                                  [
                                    "oklch(0.55 0.02 264)",
                                    "oklch(0.6 0.18 160)",
                                    "oklch(0.6 0.2 10)",
                                    "oklch(0.55 0.18 264)",
                                  ][i % 4]
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card
                  data-ocid="reporting.sozlesme.hakedis_status.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      Hakediş Onay Durumu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companyHakedis.length === 0 ? (
                      <div
                        data-ocid="reporting.sozlesme.hakedis.empty_state"
                        className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                      >
                        Henüz hakediş kaydı yok.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={hakedisStatusData}
                          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.26 0.01 264)"
                          />
                          <XAxis
                            dataKey="durum"
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.16 0.01 264)",
                              border: "1px solid oklch(0.26 0.01 264)",
                              borderRadius: "8px",
                              color: "oklch(0.92 0.01 264)",
                            }}
                          />
                          <Bar dataKey="adet" radius={[4, 4, 0, 0]} name="Adet">
                            {hakedisStatusData.map((entry, i) => (
                              <Cell
                                key={entry.durum}
                                fill={
                                  [
                                    "oklch(0.55 0.02 264)",
                                    "oklch(0.6 0.18 160)",
                                    "oklch(0.7 0.15 60)",
                                    "oklch(0.6 0.2 10)",
                                  ][i % 4]
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })()}

      {/* ═══ Risk & Kalite Tab ═══ */}
      {activeTab === "risk" &&
        (() => {
          const companyRisks = riskItems.filter(
            (r) => r.companyId === activeCompanyId,
          );
          const companyNCRs = ncrRecords.filter(
            (n) => n.companyId === activeCompanyId,
          );
          const companyChecklists = qualityChecklists.filter(
            (q) => q.companyId === activeCompanyId,
          );
          const openRisks = companyRisks.filter(
            (r) => r.status !== "Kapalı",
          ).length;
          const openNCRs = companyNCRs.filter(
            (n) => n.status !== "Kapatıldı",
          ).length;
          const totalChecklistItems = companyChecklists.reduce(
            (sum, c) => sum + (c.items || []).length,
            0,
          );
          const passedItems = companyChecklists.reduce(
            (sum, c) =>
              sum +
              (c.items || []).filter(
                (i: { status: string }) => i.status === "Geçti",
              ).length,
            0,
          );
          const checklistRate =
            totalChecklistItems > 0
              ? Math.round((passedItems / totalChecklistItems) * 100)
              : 0;
          const ncrBySeverity = ["Düşük", "Orta", "Yüksek"]
            .map((s, i) => ({
              name: s,
              value: companyNCRs.filter((n) => n.severity === s).length,
              color: [
                "oklch(0.6 0.18 160)",
                "oklch(0.7 0.15 60)",
                "oklch(0.6 0.2 10)",
              ][i],
            }))
            .filter((d) => d.value > 0);
          const ncrMonthly = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 5 + i,
              1,
            );
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            return {
              ay: d
                .toLocaleString("tr-TR", { month: "short" })
                .replace(".", ""),
              Açık: companyNCRs.filter(
                (n) => n.createdAt?.startsWith(key) && n.status !== "Kapatıldı",
              ).length,
              Kapalı: companyNCRs.filter(
                (n) => n.createdAt?.startsWith(key) && n.status === "Kapatıldı",
              ).length,
            };
          });
          const checklistByProject = projects
            .map((p) => {
              const pChecklists = companyChecklists.filter(
                (c) => c.projectId === p.id,
              );
              if (!pChecklists.length) return null;
              const total = pChecklists.reduce(
                (s, c) => s + (c.items || []).length,
                0,
              );
              const passed = pChecklists.reduce(
                (s, c) =>
                  s +
                  (c.items || []).filter(
                    (i: { status: string }) => i.status === "Geçti",
                  ).length,
                0,
              );
              return {
                name: p.title.slice(0, 20),
                rate: total > 0 ? Math.round((passed / total) * 100) : 0,
              };
            })
            .filter(Boolean)
            .slice(0, 6) as { name: string; rate: number }[];
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Açık Risk",
                    value: openRisks,
                    color: "text-rose-400",
                    bg: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
                  },
                  {
                    label: "Toplam NCR",
                    value: companyNCRs.length,
                    color: "text-amber-400",
                    bg: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
                  },
                  {
                    label: "Açık NCR",
                    value: openNCRs,
                    color: "text-orange-400",
                    bg: "from-orange-500/10 to-yellow-500/5 border-orange-500/20",
                  },
                  {
                    label: "Checklist Tamamlanma",
                    value: `${checklistRate}%`,
                    color: "text-emerald-400",
                    bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
                  },
                ].map((kpi, i) => (
                  <Card
                    key={kpi.label}
                    data-ocid={`reporting.risk.kpi.card.${i + 1}`}
                    className={`bg-gradient-to-br border ${kpi.bg}`}
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {kpi.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className={`text-2xl font-bold ${kpi.color}`}>
                        {kpi.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card
                  data-ocid="reporting.risk.ncr_severity.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      NCR Ciddiyet Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ncrBySeverity.length === 0 ? (
                      <div
                        data-ocid="reporting.risk.ncr_severity.empty_state"
                        className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                      >
                        Henüz NCR kaydı yok.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={ncrBySeverity}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={({ name, value }) => `${name}: ${value}`}
                            labelLine={false}
                          >
                            {ncrBySeverity.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.16 0.01 264)",
                              border: "1px solid oklch(0.26 0.01 264)",
                              borderRadius: "8px",
                              color: "oklch(0.92 0.01 264)",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              color: "oklch(0.7 0.02 264)",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card
                  data-ocid="reporting.risk.ncr_monthly.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      Aylık NCR Trendi (Son 6 Ay)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companyNCRs.length === 0 ? (
                      <div
                        data-ocid="reporting.risk.ncr_monthly.empty_state"
                        className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                      >
                        Henüz NCR kaydı yok.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={ncrMonthly}
                          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.26 0.01 264)"
                          />
                          <XAxis
                            dataKey="ay"
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.16 0.01 264)",
                              border: "1px solid oklch(0.26 0.01 264)",
                              borderRadius: "8px",
                              color: "oklch(0.92 0.01 264)",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              color: "oklch(0.7 0.02 264)",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="Açık"
                            fill="oklch(0.6 0.2 10)"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="Kapalı"
                            fill="oklch(0.6 0.18 160)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              {checklistByProject.length > 0 && (
                <Card
                  data-ocid="reporting.risk.checklist_projects.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      Proje Bazında Kalite Checklist Tamamlanma
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {checklistByProject.map((p, i) => (
                        <div
                          key={p.name}
                          data-ocid={`reporting.risk.checklist.item.${i + 1}`}
                        >
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground truncate">
                              {p.name}
                            </span>
                            <span className="text-amber-400 font-medium ml-2">
                              {p.rate}%
                            </span>
                          </div>
                          <Progress value={p.rate} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}

      {/* ═══ İSG & Saha Tab ═══ */}
      {activeTab === "isg" &&
        (() => {
          const companyISG = isgIncidents.filter(
            (i) => i.companyId === activeCompanyId,
          );
          const companyRFIs = rfis.filter(
            (r) => r.companyId === activeCompanyId,
          );
          const companyMRs = materialRequests.filter(
            (m) => m.companyId === activeCompanyId,
          );
          const last30 = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString();
          const last30Incidents = companyISG.filter(
            (i) => i.date >= last30,
          ).length;
          const openRFIs = companyRFIs.filter(
            (r) => r.status === "Açık",
          ).length;
          const fulfilledMRs = companyMRs.filter(
            (m) =>
              m.status === "Satın Almaya Aktarıldı" || m.status === "Onaylandı",
          ).length;
          const mrFulfilledPct =
            companyMRs.length > 0
              ? Math.round((fulfilledMRs / companyMRs.length) * 100)
              : 0;
          const isgByType = ["Kaza", "Ramak Kala", "Hastalık"].map(
            (type, i) => ({
              tip: type,
              adet: companyISG.filter((inc) => inc.type === type).length,
              color: [
                "oklch(0.6 0.2 10)",
                "oklch(0.7 0.15 60)",
                "oklch(0.55 0.18 230)",
              ][i],
            }),
          );
          const mrByStatus = [
            "Beklemede",
            "Onaylandı",
            "Reddedildi",
            "Satın Almaya Aktarıldı",
          ]
            .map((s, i) => ({
              name: s,
              value: companyMRs.filter((m) => m.status === s).length,
              color: [
                "oklch(0.55 0.02 264)",
                "oklch(0.6 0.18 160)",
                "oklch(0.6 0.2 10)",
                "oklch(0.7 0.15 60)",
              ][i],
            }))
            .filter((d) => d.value > 0);
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Toplam İSG Olayı",
                    value: companyISG.length,
                    color: "text-rose-400",
                    bg: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
                  },
                  {
                    label: "Son 30 Gün",
                    value: last30Incidents,
                    color: "text-orange-400",
                    bg: "from-orange-500/10 to-yellow-500/5 border-orange-500/20",
                  },
                  {
                    label: "Açık RFI",
                    value: openRFIs,
                    color: "text-blue-400",
                    bg: "from-blue-500/10 to-cyan-500/5 border-blue-500/20",
                  },
                  {
                    label: "Malzeme Karşılanma",
                    value: `${mrFulfilledPct}%`,
                    color: "text-emerald-400",
                    bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
                  },
                ].map((kpi, i) => (
                  <Card
                    key={kpi.label}
                    data-ocid={`reporting.isg.kpi.card.${i + 1}`}
                    className={`bg-gradient-to-br border ${kpi.bg}`}
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {kpi.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className={`text-2xl font-bold ${kpi.color}`}>
                        {kpi.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card
                  data-ocid="reporting.isg.incidents_by_type.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      İSG Olay Türlerine Göre Dağılım
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companyISG.length === 0 ? (
                      <div
                        data-ocid="reporting.isg.incidents.empty_state"
                        className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                      >
                        Henüz İSG olayı kaydı yok.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={isgByType}
                          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.26 0.01 264)"
                          />
                          <XAxis
                            dataKey="tip"
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "oklch(0.6 0.02 264)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.16 0.01 264)",
                              border: "1px solid oklch(0.26 0.01 264)",
                              borderRadius: "8px",
                              color: "oklch(0.92 0.01 264)",
                            }}
                          />
                          <Bar
                            dataKey="adet"
                            radius={[4, 4, 0, 0]}
                            name="Olay Sayısı"
                          >
                            {isgByType.map((entry) => (
                              <Cell key={entry.tip} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card
                  data-ocid="reporting.isg.mr_status.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      Malzeme Talep Durumu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companyMRs.length === 0 ? (
                      <div
                        data-ocid="reporting.isg.mr.empty_state"
                        className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                      >
                        Henüz malzeme talebi yok.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={mrByStatus}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={({ name, value }) => `${name}: ${value}`}
                            labelLine={false}
                          >
                            {mrByStatus.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.16 0.01 264)",
                              border: "1px solid oklch(0.26 0.01 264)",
                              borderRadius: "8px",
                              color: "oklch(0.92 0.01 264)",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              color: "oklch(0.7 0.02 264)",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              {openRFIs > 0 && (
                <Card
                  data-ocid="reporting.isg.open_rfis.card"
                  className="bg-card border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-base">Açık RFI'lar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {companyRFIs
                        .filter((r) => r.status === "Açık")
                        .slice(0, 10)
                        .map((rfi, i) => (
                          <div
                            key={rfi.id}
                            data-ocid={`reporting.isg.rfi.item.${i + 1}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {rfi.rfiNo} – {rfi.subject}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Sorumlu: {rfi.assignedTo}
                              </p>
                            </div>
                            <Badge
                              className={
                                rfi.dueDate < new Date().toISOString()
                                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              }
                            >
                              {rfi.dueDate < new Date().toISOString()
                                ? "Gecikmiş"
                                : "Açık"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}

      {/* ── KAPANIŞ RAPORLARI TAB ──────────────────────────────────────────── */}
      {activeTab === "kapanış" && (
        <ClosureReportsTab
          projects={projects}
          tasks={tasks}
          expenses={expenses}
          companyId={activeCompanyId || ""}
        />
      )}

      {/* ── S-EĞRİSİ TAB ──────────────────────────────────────────────────── */}
      {activeTab === "segri" && (
        <SCurveSection projects={projects} tasks={tasks} />
      )}

      {/* İşe Alım & Onboarding Tab */}
      {activeTab === "iseAlim" && (
        <div className="space-y-6">
          {recruitmentJobs.length === 0 &&
          recruitmentCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz İşe Alım Verisi Yok
              </h3>
              <p className="text-muted-foreground text-sm">
                İşe Alım & Onboarding modülünden veri girişi yapıldıkça burada
                görünecek.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Açık Pozisyon",
                    value: recruitmentJobs.filter(
                      (j: Job) => j.status === "open" || j.status === "Aktif",
                    ).length,
                    color: "text-amber-400",
                  },
                  {
                    label: "Toplam Aday",
                    value: recruitmentCandidates.length,
                    color: "text-blue-400",
                  },
                  {
                    label: "Onboarding Bekleyen",
                    value: recruitmentOnboarding.filter(
                      (o: Onboarding) => !o.completed,
                    ).length,
                    color: "text-orange-400",
                  },
                  {
                    label: "Tamamlanan Onboarding",
                    value: recruitmentOnboarding.filter(
                      (o: Onboarding) => o.completed,
                    ).length,
                    color: "text-green-400",
                  },
                ].map((kpi) => (
                  <Card key={kpi.label} className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        {kpi.label}
                      </p>
                      <p className={`text-3xl font-bold ${kpi.color}`}>
                        {kpi.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm text-foreground">
                      Aday Pipeline Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const stages = [
                        "Başvuru",
                        "Mülakat",
                        "Teklif",
                        "İşe Alındı",
                        "Reddedildi",
                      ];
                      const data = stages
                        .map((s) => ({
                          name: s,
                          count: recruitmentCandidates.filter(
                            (c: Candidate) => c.stage === s,
                          ).length,
                        }))
                        .filter((d) => d.count > 0);
                      return data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={data}>
                            <XAxis
                              dataKey="name"
                              tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                            />
                            <YAxis
                              tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "oklch(0.15 0 0)",
                                border: "1px solid oklch(0.25 0 0)",
                                borderRadius: 8,
                              }}
                            />
                            <Bar
                              dataKey="count"
                              name="Aday"
                              fill="oklch(0.72 0.18 75)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                          Aday verisi yok
                        </p>
                      );
                    })()}
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm text-foreground">
                      Onboarding Tamamlanma
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recruitmentOnboarding.length > 0 ? (
                      <>
                        <div className="flex items-center justify-center py-4">
                          <div className="relative w-32 h-32">
                            <svg
                              viewBox="0 0 36 36"
                              className="w-32 h-32 -rotate-90"
                              aria-label="Onboarding tamamlanma oranı"
                              role="img"
                            >
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9"
                                fill="none"
                                stroke="oklch(0.25 0 0)"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9"
                                fill="none"
                                stroke="oklch(0.72 0.18 75)"
                                strokeWidth="3"
                                strokeDasharray={`${Math.round((recruitmentOnboarding.filter((o: Onboarding) => o.completed).length / recruitmentOnboarding.length) * 100)} 100`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold text-amber-400">
                                {Math.round(
                                  (recruitmentOnboarding.filter(
                                    (o: Onboarding) => o.completed,
                                  ).length /
                                    recruitmentOnboarding.length) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                          {
                            recruitmentOnboarding.filter(
                              (o: Onboarding) => o.completed,
                            ).length
                          }{" "}
                          / {recruitmentOnboarding.length} tamamlandı
                        </p>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Onboarding verisi yok
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Avans & Harcama Tab */}
      {activeTab === "avans" && (
        <div className="space-y-6">
          {advances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz Avans Verisi Yok
              </h3>
              <p className="text-muted-foreground text-sm">
                Finans &gt; Avans & Harcama modülünden veri girişi yapıldıkça
                burada görünecek.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Toplam Avans",
                    value: `₺${advances.reduce((s: number, a: Advance) => s + (a.amount || 0), 0).toLocaleString("tr-TR")}`,
                    color: "text-amber-400",
                  },
                  {
                    label: "Onay Bekleyen",
                    value: advances.filter(
                      (a: Advance) =>
                        a.status === "pending" || a.status === "Beklemede",
                    ).length,
                    color: "text-orange-400",
                  },
                  {
                    label: "Onaylanan",
                    value: advances.filter(
                      (a: Advance) =>
                        a.status === "approved" || a.status === "Onaylandı",
                    ).length,
                    color: "text-green-400",
                  },
                  {
                    label: "Reddedilen",
                    value: advances.filter(
                      (a: Advance) =>
                        a.status === "rejected" || a.status === "Reddedildi",
                    ).length,
                    color: "text-red-400",
                  },
                ].map((kpi) => (
                  <Card key={kpi.label} className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        {kpi.label}
                      </p>
                      <p className={`text-2xl font-bold ${kpi.color}`}>
                        {kpi.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm text-foreground">
                      Kategori Bazlı Harcama
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const cats: Record<string, number> = {};
                      for (const a of advances) {
                        const c = (a as Advance).category || "Diğer";
                        cats[c] = (cats[c] || 0) + ((a as Advance).amount || 0);
                      }
                      const data = Object.entries(cats).map(
                        ([name, value]) => ({ name, value }),
                      );
                      const COLORS = [
                        "oklch(0.72 0.18 75)",
                        "oklch(0.65 0.15 250)",
                        "oklch(0.70 0.15 150)",
                        "oklch(0.65 0.18 30)",
                        "oklch(0.60 0.15 300)",
                      ];
                      return data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              dataKey="value"
                              nameKey="name"
                            >
                              {data.map((entry, i) => (
                                <Cell
                                  key={entry.name}
                                  fill={COLORS[i % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "oklch(0.15 0 0)",
                                border: "1px solid oklch(0.25 0 0)",
                                borderRadius: 8,
                              }}
                              formatter={(v: unknown) => [
                                `₺${Number(v).toLocaleString("tr-TR")}`,
                                "",
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                          Kategori verisi yok
                        </p>
                      );
                    })()}
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm text-foreground">
                      Aylık Harcama Trendi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const nowDate = new Date();
                      const months = Array.from({ length: 6 }, (_, i) => {
                        const d = new Date(
                          nowDate.getFullYear(),
                          nowDate.getMonth() - 5 + i,
                          1,
                        );
                        return {
                          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                          label: d
                            .toLocaleString("tr-TR", { month: "short" })
                            .replace(".", ""),
                        };
                      });
                      const data = months.map((m) => ({
                        month: m.label,
                        tutar: advances
                          .filter((a: Advance) => a.date?.startsWith(m.key))
                          .reduce(
                            (s: number, a: Advance) => s + (a.amount || 0),
                            0,
                          ),
                      }));
                      return (
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={data}>
                            <XAxis
                              dataKey="month"
                              tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                            />
                            <YAxis
                              tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "oklch(0.15 0 0)",
                                border: "1px solid oklch(0.25 0 0)",
                                borderRadius: 8,
                              }}
                              formatter={(v: unknown) => [
                                `₺${Number(v).toLocaleString("tr-TR")}`,
                                "Avans",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="tutar"
                              stroke="oklch(0.72 0.18 75)"
                              strokeWidth={2.5}
                              dot={{ fill: "oklch(0.72 0.18 75)", r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Şikayet & Talep Tab */}
      {activeTab === "sikayet" && (
        <div className="space-y-6">
          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz Şikayet Verisi Yok
              </h3>
              <p className="text-muted-foreground text-sm">
                CRM &gt; Şikayet & Talepler modülünden veri girişi yapıldıkça
                burada görünecek.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const open = complaints.filter(
                    (c: Complaint) =>
                      c.status !== "closed" &&
                      c.status !== "Kapatıldı" &&
                      c.status !== "resolved" &&
                      c.status !== "Çözüldü",
                  ).length;
                  const closed = complaints.filter(
                    (c: Complaint) =>
                      c.status === "closed" ||
                      c.status === "Kapatıldı" ||
                      c.status === "resolved" ||
                      c.status === "Çözüldü",
                  ).length;
                  const rate =
                    complaints.length > 0
                      ? Math.round((closed / complaints.length) * 100)
                      : 0;
                  return [
                    {
                      label: "Toplam Şikayet",
                      value: complaints.length,
                      color: "text-amber-400",
                    },
                    { label: "Açık", value: open, color: "text-orange-400" },
                    {
                      label: "Çözüldü",
                      value: closed,
                      color: "text-green-400",
                    },
                    {
                      label: "Çözüm Oranı",
                      value: `%${rate}`,
                      color: "text-blue-400",
                    },
                  ].map((kpi) => (
                    <Card key={kpi.label} className="bg-card border-border">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {kpi.label}
                        </p>
                        <p className={`text-2xl font-bold ${kpi.color}`}>
                          {kpi.value}
                        </p>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-foreground">
                    Kategori Bazlı Şikayet Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const cats: Record<string, number> = {};
                    for (const c of complaints) {
                      const cat = (c as Complaint).category || "Diğer";
                      cats[cat] = (cats[cat] || 0) + 1;
                    }
                    const data = Object.entries(cats)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => b.value - a.value);
                    const COLORS = [
                      "oklch(0.72 0.18 75)",
                      "oklch(0.65 0.15 250)",
                      "oklch(0.70 0.15 150)",
                      "oklch(0.65 0.18 30)",
                      "oklch(0.60 0.15 300)",
                    ];
                    return data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data} layout="vertical">
                          <XAxis
                            type="number"
                            tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                            allowDecimals={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                            width={120}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "oklch(0.15 0 0)",
                              border: "1px solid oklch(0.25 0 0)",
                              borderRadius: 8,
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Adet"
                            radius={[0, 4, 4, 0]}
                          >
                            {data.map((entry, i) => (
                              <Cell
                                key={entry.name}
                                fill={COLORS[i % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Veri yok
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Depo & Lokasyon Tab */}
      {activeTab === "depo" && (
        <div className="space-y-6">
          {warehouseLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">🏭</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz Depo Verisi Yok
              </h3>
              <p className="text-muted-foreground text-sm">
                Envanter &gt; Depo Lokasyonları modülünden veri girişi
                yapıldıkça burada görünecek.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "Toplam Lokasyon",
                    value: warehouseLocations.length,
                    color: "text-amber-400",
                  },
                  {
                    label: "Kritik Doluluk (>%80)",
                    value: warehouseLocations.filter(
                      (l: Location) =>
                        (l.capacity || 0) > 0 &&
                        (l.currentStock || 0) / (l.capacity || 1) > 0.8,
                    ).length,
                    color: "text-red-400",
                  },
                  {
                    label: "Ortalama Doluluk",
                    value: `%${warehouseLocations.length > 0 ? Math.round(warehouseLocations.reduce((s: number, l: Location) => s + ((l.capacity || 0) > 0 ? Math.min(100, ((l.currentStock || 0) / (l.capacity || 1)) * 100) : 0), 0) / warehouseLocations.length) : 0}`,
                    color: "text-blue-400",
                  },
                ].map((kpi) => (
                  <Card key={kpi.label} className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        {kpi.label}
                      </p>
                      <p className={`text-3xl font-bold ${kpi.color}`}>
                        {kpi.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-foreground">
                    Lokasyon Doluluk Oranları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warehouseLocations
                    .slice(0, 10)
                    .map((loc: Location, i: number) => {
                      const pct =
                        (loc.capacity || 0) > 0
                          ? Math.min(
                              100,
                              Math.round(
                                ((loc.currentStock || 0) /
                                  (loc.capacity || 1)) *
                                  100,
                              ),
                            )
                          : 0;
                      return (
                        <div
                          key={loc.name}
                          data-ocid={`reporting.depo.item.${i + 1}`}
                        >
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground">{loc.name}</span>
                            <span
                              className={
                                pct > 80
                                  ? "text-red-400"
                                  : pct > 60
                                    ? "text-amber-400"
                                    : "text-green-400"
                              }
                            >
                              {pct}%
                            </span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Taşeron İş Emirleri Tab */}
      {activeTab === "taseronIs" && (
        <div className="space-y-6">
          {subWorkOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz Taşeron İş Emri Verisi Yok
              </h3>
              <p className="text-muted-foreground text-sm">
                Taşeron Yönetimi &gt; İş Emirleri modülünden veri girişi
                yapıldıkça burada görünecek.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const open = subWorkOrders.filter(
                    (w: SubWorkOrder) =>
                      w.status !== "completed" && w.status !== "Tamamlandı",
                  ).length;
                  const completed = subWorkOrders.filter(
                    (w: SubWorkOrder) =>
                      w.status === "completed" || w.status === "Tamamlandı",
                  ).length;
                  const overdue = subWorkOrders.filter((w: SubWorkOrder) => {
                    if (
                      !w.plannedEnd ||
                      w.status === "completed" ||
                      w.status === "Tamamlandı"
                    )
                      return false;
                    return new Date(w.plannedEnd) < new Date();
                  }).length;
                  const delayRate =
                    subWorkOrders.length > 0
                      ? Math.round((overdue / subWorkOrders.length) * 100)
                      : 0;
                  return [
                    {
                      label: "Toplam İş Emri",
                      value: subWorkOrders.length,
                      color: "text-amber-400",
                    },
                    { label: "Açık", value: open, color: "text-orange-400" },
                    {
                      label: "Tamamlandı",
                      value: completed,
                      color: "text-green-400",
                    },
                    {
                      label: "Gecikme Oranı",
                      value: `%${delayRate}`,
                      color: "text-red-400",
                    },
                  ].map((kpi) => (
                    <Card key={kpi.label} className="bg-card border-border">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {kpi.label}
                        </p>
                        <p className={`text-2xl font-bold ${kpi.color}`}>
                          {kpi.value}
                        </p>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-foreground">
                    Taşeron Bazlı İş Yükü
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const byContractor: Record<string, number> = {};
                    for (const w of subWorkOrders) {
                      const id =
                        (w as SubWorkOrder).subcontractorId || "Belirsiz";
                      byContractor[id] = (byContractor[id] || 0) + 1;
                    }
                    const data = Object.entries(byContractor)
                      .map(([name, value]) => ({
                        name: name.length > 16 ? `${name.slice(0, 16)}…` : name,
                        value,
                      }))
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 8);
                    return data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data}>
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                          />
                          <YAxis
                            tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "oklch(0.15 0 0)",
                              border: "1px solid oklch(0.25 0 0)",
                              borderRadius: 8,
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="İş Emri"
                            fill="oklch(0.72 0.18 75)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Veri yok
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === "benchmark" && (
        <BenchmarkTab
          projects={projects}
          expenses={expenses}
          riskItems={riskItems}
          ncrRecords={ncrRecords}
          hrPersonnel={hrPersonnel}
        />
      )}
    </div>
  );
}

function EVMSection({ projects, expenses }: any) {
  const [selectedProjId, setSelectedProjId] = useState("");

  const project = projects.find((p: any) => p.id === selectedProjId);

  const calcEVM = () => {
    if (!project) return null;
    const budget = project.budget || 0;
    const progress = project.progress || 0;
    const today = new Date();
    const start = project.startDate ? new Date(project.startDate) : null;
    const end = project.endDate ? new Date(project.endDate) : null;

    const EV = budget * (progress / 100);
    const AC = expenses
      .filter(
        (e: any) => e.projectId === selectedProjId && e.status === "Onaylandı",
      )
      .reduce((s: number, e: any) => s + e.amount, 0);

    let PV = EV;
    if (start && end && end > start) {
      const totalDays = (end.getTime() - start.getTime()) / 86400000;
      const elapsedDays = Math.max(
        0,
        (today.getTime() - start.getTime()) / 86400000,
      );
      const timeRatio = Math.min(1, elapsedDays / totalDays);
      PV = budget * timeRatio;
    }

    const CPI = AC > 0 ? EV / AC : null;
    const SPI = PV > 0 ? EV / PV : null;
    const budgetVariance = EV - AC;
    const scheduleVariance = EV - PV;
    const EAC = CPI && CPI > 0 ? AC + (budget - EV) / CPI : null;

    return {
      EV,
      AC,
      PV,
      CPI,
      SPI,
      budgetVariance,
      scheduleVariance,
      EAC,
      budget,
    };
  };

  const evm = calcEVM();

  const getColor = (val: number | null) => {
    if (val === null) return "text-muted-foreground";
    if (val >= 1.0) return "text-green-400";
    if (val >= 0.8) return "text-amber-400";
    return "text-red-400";
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          EVM Analizi (Kazanılmış Değer)
        </h2>
        <div className="w-56">
          <Select value={selectedProjId} onValueChange={setSelectedProjId}>
            <SelectTrigger
              data-ocid="reporting.evm.project.select"
              className="bg-card border-border"
            >
              <SelectValue placeholder="Proje seçin..." />
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
      </div>

      {!selectedProjId ? (
        <Card
          data-ocid="reporting.evm.empty_state"
          className="bg-card border-border"
        >
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              EVM analizi için proje seçin
            </p>
          </CardContent>
        </Card>
      ) : evm ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            data-ocid="reporting.evm.cpi.card"
            className="bg-card border-border"
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                CPI (Maliyet Perf.)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-2xl font-bold ${getColor(evm.CPI)}`}>
                {evm.CPI !== null ? evm.CPI.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {evm.CPI !== null && evm.CPI >= 1
                  ? "Bütçe altında ✓"
                  : evm.CPI !== null
                    ? "Bütçe aşımı riski ⚠"
                    : "Veri yok"}
              </p>
            </CardContent>
          </Card>

          <Card
            data-ocid="reporting.evm.spi.card"
            className="bg-card border-border"
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                SPI (Zaman Perf.)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-2xl font-bold ${getColor(evm.SPI)}`}>
                {evm.SPI !== null ? evm.SPI.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {evm.SPI !== null && evm.SPI >= 1
                  ? "Zamanında ✓"
                  : evm.SPI !== null
                    ? "Gecikme riski ⚠"
                    : "Veri yok"}
              </p>
            </CardContent>
          </Card>

          <Card
            data-ocid="reporting.evm.budget_variance.card"
            className="bg-card border-border"
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Bütçe Varyansı
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p
                className={`text-lg font-bold ${evm.budgetVariance >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {formatCurrency(evm.budgetVariance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">EV - AC</p>
            </CardContent>
          </Card>

          <Card
            data-ocid="reporting.evm.eac.card"
            className="bg-card border-border"
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Tahmini Tamamlanma (EAC)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-lg font-bold text-foreground">
                {evm.EAC !== null ? formatCurrency(evm.EAC) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Bütçe: {formatCurrency(evm.budget)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

// ─── S-Eğrisi Section ────────────────────────────────────────────────────────
function SCurveSection({ projects, tasks }: { projects: any[]; tasks: any[] }) {
  const [selectedProjId, setSelectedProjId] = useState("");
  const activeProjects = projects.filter(
    (p: any) => p.status !== "Tamamlandı" && p.startDate && p.endDate,
  );
  const project = activeProjects.find((p: any) => p.id === selectedProjId);

  const curveData = React.useMemo(() => {
    if (!project) return [];
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const totalDays = Math.max((end.getTime() - start.getTime()) / 86400000, 1);
    const projectTasks = tasks.filter(
      (t: any) => t.projectId === project.id || t.project === project.title,
    );
    const totalTasks = projectTasks.length || 1;
    const completedTasks = projectTasks.filter(
      (t: any) => t.status === "Tamamlandı",
    );

    // Generate monthly points
    const points: { month: string; planned: number; actual: number }[] = [];
    const now = new Date();
    let cursor = new Date(start);
    cursor.setDate(1);

    while (cursor <= end && points.length < 24) {
      const daysElapsed = Math.max(
        (cursor.getTime() - start.getTime()) / 86400000,
        0,
      );
      const progress = Math.min(daysElapsed / totalDays, 1);
      // S-curve: slow start, fast middle, slow end
      const sCurve =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - 2 * (1 - progress) * (1 - progress);
      const plannedPct = Math.round(sCurve * 100);

      // Actual: based on completed tasks due before this date
      const doneByDate = completedTasks.filter((t: any) => {
        const due = t.dueDate || t.endDate || "";
        return due && new Date(due) <= cursor;
      }).length;
      const actualPct = Math.min(
        Math.round((doneByDate / totalTasks) * 100),
        100,
      );

      points.push({
        month: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
        planned: plannedPct,
        actual: cursor <= now ? actualPct : Number.NaN,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }
    return points;
  }, [project, tasks]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          S-Eğrisi & İlerleme Analizi
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Planlanan vs. gerçekleşen proje ilerlemesi
        </p>
      </div>

      <div className="max-w-xs">
        <Select
          value={selectedProjId}
          onValueChange={(v) => setSelectedProjId(v)}
        >
          <SelectTrigger
            data-ocid="reporting.segri.select"
            className="bg-card border-border"
          >
            <SelectValue placeholder="Proje seçin" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {activeProjects.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedProjId ? (
        <div
          data-ocid="reporting.segri.empty_state"
          className="text-center py-16"
        >
          <Activity className="w-12 h-12 mx-auto mb-3 text-amber-500/30" />
          <p className="text-muted-foreground">
            S-eğrisi görüntülemek için bir proje seçin.
          </p>
        </div>
      ) : curveData.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Bu proje için veri hesaplanamadı.
          </p>
        </div>
      ) : (
        <Card
          data-ocid="reporting.segri.card"
          className="bg-card border-border"
        >
          <CardHeader>
            <CardTitle className="text-base">
              {project?.title} — İlerleme Eğrisi
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {project?.startDate} → {project?.endDate}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={curveData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                />
                <YAxis
                  unit="%"
                  tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.2 0 0)",
                    border: "1px solid oklch(0.3 0 0)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "oklch(0.85 0 0)" }}
                  formatter={(value: any) =>
                    Number.isNaN(value) ? ["—", ""] : [`${value}%`]
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="planned"
                  name="Planlanan"
                  stroke="oklch(0.65 0.15 250)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Gerçekleşen"
                  stroke="oklch(0.75 0.18 75)"
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.75 0.18 75)", r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-6 mt-3 justify-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-0.5 bg-blue-400"
                  style={{ borderTop: "2px dashed" }}
                />
                <span className="text-xs text-muted-foreground">
                  Planlanan (S-eğrisi)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-amber-400" />
                <span className="text-xs text-muted-foreground">
                  Gerçekleşen
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
function BenchmarkTab({
  projects,
  expenses,
  riskItems,
  ncrRecords,
  hrPersonnel,
}: {
  projects: any[];
  expenses: any[];
  riskItems: any[];
  ncrRecords: any[];
  hrPersonnel: any[];
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggleProject = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 6
          ? [...prev, id]
          : prev,
    );
  };

  const selected = projects.filter((p) => selectedIds.includes(p.id));

  const calcMetrics = (p: any) => {
    const budget = p.budget || 0;
    const spent = expenses
      .filter(
        (e: any) =>
          e.projectId === p.id &&
          (e.status === "Onaylandı" || e.status === "approved"),
      )
      .reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const budgetVariance = budget > 0 ? ((spent - budget) / budget) * 100 : 0;

    const startDate = p.startDate ? new Date(p.startDate) : null;
    const endDate = p.endDate ? new Date(p.endDate) : null;
    const today = new Date();
    let scheduleVariance = 0;
    if (startDate && endDate) {
      const totalDays = Math.max(
        1,
        (endDate.getTime() - startDate.getTime()) / 86400000,
      );
      const elapsed = (today.getTime() - startDate.getTime()) / 86400000;
      const expectedProgress = Math.min(100, (elapsed / totalDays) * 100);
      scheduleVariance = (p.progress || 0) - expectedProgress;
    }

    const openRisks = riskItems.filter(
      (r: any) => r.projectId === p.id && r.status !== "Kapatıldı",
    ).length;
    const openPunch = (p.punchItems || []).filter(
      (x: any) => x.status !== "Kapatıldı",
    ).length;
    const ncrCount = ncrRecords.filter((n: any) => n.projectId === p.id).length;
    const personnelCount = hrPersonnel.filter(
      (h: any) => h.projectId === p.id || h.companyId,
    ).length;

    return {
      budgetVariance: Math.round(budgetVariance * 10) / 10,
      scheduleVariance: Math.round(scheduleVariance),
      totalExpense: spent,
      completion: p.progress || 0,
      openRisks,
      openPunch,
      ncrCount,
      personnelCount,
    };
  };

  const exportCSV = () => {
    const rows = [
      ["Metrik", ...selected.map((p) => p.title)],
      [
        "Bütçe Sapması (%)",
        ...selected.map((p) => calcMetrics(p).budgetVariance),
      ],
      [
        "Süre Sapması (gün)",
        ...selected.map((p) => calcMetrics(p).scheduleVariance),
      ],
      ["Toplam Gider (₺)", ...selected.map((p) => calcMetrics(p).totalExpense)],
      ["Tamamlanma (%)", ...selected.map((p) => calcMetrics(p).completion)],
      ["Açık Risk", ...selected.map((p) => calcMetrics(p).openRisks)],
      ["Punch List Açık", ...selected.map((p) => calcMetrics(p).openPunch)],
      ["NCR Sayısı", ...selected.map((p) => calcMetrics(p).ncrCount)],
      [
        "Personel Sayısı",
        ...selected.map((p) => calcMetrics(p).personnelCount),
      ],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "benchmark.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const PROJECT_COLORS = [
    "oklch(0.75 0.18 75)",
    "oklch(0.55 0.18 250)",
    "oklch(0.65 0.18 160)",
    "oklch(0.6 0.2 10)",
    "oklch(0.7 0.15 310)",
    "oklch(0.65 0.18 200)",
  ];

  const barData = selected.map((p, i) => ({
    name: p.title.length > 12 ? `${p.title.slice(0, 12)}…` : p.title,
    budgetVariance: calcMetrics(p).budgetVariance,
    fill: PROJECT_COLORS[i % PROJECT_COLORS.length],
  }));

  const radarData = [
    { subject: "Zaman" },
    { subject: "Bütçe" },
    { subject: "Kalite" },
    { subject: "Güvenlik" },
    { subject: "Kaynak" },
  ].map((d) => {
    const row: any = { subject: d.subject };
    selected.forEach((p, i) => {
      const m = calcMetrics(p);
      let score = 50;
      if (d.subject === "Zaman")
        score = Math.max(0, Math.min(100, 50 + m.scheduleVariance));
      if (d.subject === "Bütçe")
        score = Math.max(
          0,
          Math.min(100, 100 - Math.abs(m.budgetVariance) * 2),
        );
      if (d.subject === "Kalite")
        score = Math.max(
          0,
          Math.min(100, 100 - m.ncrCount * 10 - m.openPunch * 5),
        );
      if (d.subject === "Güvenlik")
        score = Math.max(0, Math.min(100, 100 - m.openRisks * 15));
      if (d.subject === "Kaynak") score = Math.min(100, m.personnelCount * 5);
      row[`proj_${i}`] = Math.round(score);
    });
    return row;
  });

  const metrics = [
    {
      key: "budgetVariance",
      label: "Bütçe Sapması (%)",
      fmt: (v: number) => `${v > 0 ? "+" : ""}${v}%`,
      warn: (v: number) => v > 10,
    },
    {
      key: "scheduleVariance",
      label: "Süre Sapması (gün)",
      fmt: (v: number) => `${v > 0 ? "+" : ""}${v} gün`,
      warn: (v: number) => v < -5,
    },
    {
      key: "totalExpense",
      label: "Toplam Gider",
      fmt: (v: number) => `${v.toLocaleString("tr-TR")} ₺`,
      warn: () => false,
    },
    {
      key: "completion",
      label: "Tamamlanma %",
      fmt: (v: number) => `${v}%`,
      warn: () => false,
    },
    {
      key: "openRisks",
      label: "Açık Risk Sayısı",
      fmt: (v: number) => String(v),
      warn: (v: number) => v > 3,
    },
    {
      key: "openPunch",
      label: "Punch List Açık",
      fmt: (v: number) => String(v),
      warn: (v: number) => v > 5,
    },
    {
      key: "ncrCount",
      label: "NCR Sayısı",
      fmt: (v: number) => String(v),
      warn: (v: number) => v > 2,
    },
    {
      key: "personnelCount",
      label: "Personel Sayısı",
      fmt: (v: number) => String(v),
      warn: () => false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Project Selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Proje Seçimi (max 6)</CardTitle>
            {selected.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={exportCSV}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV İndir
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {projects.map((p, i) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  data-ocid={`benchmark.project.toggle.${i + 1}`}
                  onClick={() => toggleProject(p.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${isSelected ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                >
                  {p.title}
                </button>
              );
            })}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Henüz proje bulunmuyor.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selected.length < 2 ? (
        <div data-ocid="benchmark.empty_state" className="text-center py-16">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-amber-500/30" />
          <p className="text-muted-foreground">
            Karşılaştırma için en az 2 proje seçin.
          </p>
        </div>
      ) : (
        <>
          {/* Comparison Table */}
          <Card
            data-ocid="benchmark.table.card"
            className="bg-card border-border overflow-hidden"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Karşılaştırma Tablosu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">
                        Metrik
                      </th>
                      {selected.map((p, i) => (
                        <th
                          key={p.id}
                          className="text-center p-3 font-semibold"
                          style={{
                            color: PROJECT_COLORS[i % PROJECT_COLORS.length],
                          }}
                        >
                          {p.title.length > 14
                            ? `${p.title.slice(0, 14)}…`
                            : p.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, mi) => (
                      <tr
                        key={metric.key}
                        className={mi % 2 === 0 ? "bg-background/30" : ""}
                      >
                        <td className="p-3 text-muted-foreground">
                          {metric.label}
                        </td>
                        {selected.map((p) => {
                          const val = (calcMetrics(p) as any)[metric.key];
                          const isWarn = metric.warn(val);
                          return (
                            <td key={p.id} className="p-3 text-center">
                              <span
                                className={
                                  isWarn
                                    ? "text-rose-400 font-semibold"
                                    : "text-foreground"
                                }
                              >
                                {metric.fmt(val)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card
            data-ocid="benchmark.barchart.card"
            className="bg-card border-border"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Bütçe Sapması (%) Karşılaştırması
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.3 0 0)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                  />
                  <YAxis
                    unit="%"
                    tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.2 0 0)",
                      border: "1px solid oklch(0.3 0 0)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "oklch(0.85 0 0)" }}
                    formatter={(v: any) => [`${v}%`, "Bütçe Sapması"]}
                  />
                  <Bar dataKey="budgetVariance" radius={[4, 4, 0, 0]}>
                    {barData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card
            data-ocid="benchmark.radarchart.card"
            className="bg-card border-border"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Çok Boyutlu Performans Analizi
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Zaman, Bütçe, Kalite, Güvenlik, Kaynak (0–100 normalize)
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart
                  data={radarData}
                  margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                >
                  <PolarGrid stroke="oklch(0.3 0 0)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 12, fill: "oklch(0.7 0 0)" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "oklch(0.5 0 0)" }}
                  />
                  {selected.map((p, i) => (
                    <Radar
                      key={p.id}
                      name={p.title}
                      dataKey={`proj_${i}`}
                      stroke={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                      fill={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.2 0 0)",
                      border: "1px solid oklch(0.3 0 0)",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
