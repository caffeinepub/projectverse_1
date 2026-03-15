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
  DollarSign,
  Download,
  FolderKanban,
  TrendingUp,
  Users,
} from "lucide-react";
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
  } = useApp();

  const canView =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "pm" ||
    activeRoleId === "supervisor" ||
    checkPermission("reporting", "view");

  const [period, setPeriod] = useState("Son 6 Ay");

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

  const totalCustomers = crmContacts.length;
  const openOpportunities = crmLeads.filter(
    (l) => l.status !== "Kazanıldı" && l.status !== "Kaybedildi",
  ).length;
  const pipelineValue = crmLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const totalQsInspections = qsInspections.length;
  const incidentCount = qsIncidents.length;
  const openFindings = qsInspections.filter(
    (i: { status: string }) => i.status === "Düzeltici Aksiyon Gerekiyor",
  ).length;

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
  const totalSpent = expenses.reduce(
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
    const projectExpenses = expenses
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
    toplam: expenses
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

  void invoices;

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
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
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
                      <p className="text-muted-foreground text-xs">Görevler</p>
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
      </div>
    </div>
  );
}
