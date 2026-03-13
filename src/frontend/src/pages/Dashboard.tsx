import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  HardHat,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

const recentActivities = [
  {
    text: 'Ahmet Yılmaz "Temel hazırlık" görevini tamamladı',
    time: "2 saat önce",
    color: "oklch(0.72 0.16 160)",
  },
  {
    text: "Mehmet Kaya Konya Lojistik Merkezi projesine eklendi",
    time: "4 saat önce",
    color: "oklch(0.62 0.22 280)",
  },
  {
    text: 'Yeni iş emri oluşturuldu: "A Blok Çatı Su Yalıtımı"',
    time: "5 saat önce",
    color: "oklch(0.72 0.18 50)",
  },
  {
    text: "İstanbul Ofis Renovasyonu planlama aşamasına geçti",
    time: "2 gün önce",
    color: "oklch(0.68 0.18 200)",
  },
];

const upcomingDeadlines = [
  {
    project: "Konya Lojistik",
    task: "Elektrik altyapısı",
    date: "15 Nis",
    daysLeft: 12,
  },
  {
    project: "Ankara Rezidans",
    task: "Zemin etüdü raporu",
    date: "10 Mar",
    daysLeft: 3,
  },
  {
    project: "Konya Lojistik",
    task: "A Blok Çatı Su Yalıtımı",
    date: "10 Nis",
    daysLeft: 7,
  },
];

const barData = [
  { day: "Pts", completed: 5 },
  { day: "Sal", completed: 8 },
  { day: "Çar", completed: 3 },
  { day: "Per", completed: 12 },
  { day: "Cum", completed: 7 },
  { day: "Cmt", completed: 2 },
  { day: "Paz", completed: 1 },
];

export default function Dashboard() {
  const {
    checkPermission,
    t,
    projects,
    tasks,
    workOrders,
    fieldInspections,
    currentCompany,
  } = useApp();

  const stats = useMemo(() => {
    const companyProjects = projects.filter(
      (p) => p.companyId === (currentCompany?.id || "c1"),
    );
    const activeProjects = companyProjects.filter(
      (p) => p.status === "active",
    ).length;
    const completedTasks = tasks.filter((t2) => t2.status === "done").length;
    const today = new Date();
    const overdueTasks = tasks.filter(
      (t2) =>
        t2.status !== "done" && t2.dueDate && new Date(t2.dueDate) < today,
    ).length;
    const activeWorkOrders = workOrders.filter(
      (w) => w.status === "open" || w.status === "in_progress",
    ).length;
    const openInspections = fieldInspections.filter(
      (f) => f.status === "scheduled" || f.status === "in_progress",
    ).length;
    return {
      activeProjects,
      completedTasks,
      overdueTasks,
      teamMembers: 24,
      activeWorkOrders,
      openInspections,
    };
  }, [projects, tasks, workOrders, fieldInspections, currentCompany]);

  const pieData = [
    {
      name: t.statusPlanning,
      value: projects.filter((p) => p.status === "planning").length,
      color: "oklch(0.68 0.18 200)",
    },
    {
      name: t.statusActive,
      value: projects.filter((p) => p.status === "active").length,
      color: "oklch(0.72 0.16 160)",
    },
    {
      name: t.statusOnHold,
      value: projects.filter((p) => p.status === "on_hold").length,
      color: "oklch(0.72 0.18 50)",
    },
    {
      name: t.statusCompleted,
      value: projects.filter((p) => p.status === "completed").length,
      color: "oklch(0.62 0.22 280)",
    },
  ].filter((d) => d.value > 0);

  if (!checkPermission("dashboard", "view")) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.dashboard}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {currentCompany?.name || "ProjectVerse"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          data-ocid="dashboard.active_projects_card"
          className="bg-card border-border"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t.activeProjects}
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.activeProjects}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.62 0.22 280 / 0.15)",
                  border: "1px solid oklch(0.62 0.22 280 / 0.3)",
                }}
              >
                <FolderKanban
                  className="w-6 h-6"
                  style={{ color: "oklch(0.72 0.2 280)" }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp
                className="w-3 h-3"
                style={{ color: "oklch(0.72 0.16 160)" }}
              />
              <span
                className="text-xs"
                style={{ color: "oklch(0.72 0.16 160)" }}
              >
                +2 bu ay
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t.completedTasks}
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.completedTasks}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.72 0.16 160 / 0.15)",
                  border: "1px solid oklch(0.72 0.16 160 / 0.3)",
                }}
              >
                <CheckCircle2
                  className="w-6 h-6"
                  style={{ color: "oklch(0.72 0.16 160)" }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp
                className="w-3 h-3"
                style={{ color: "oklch(0.72 0.16 160)" }}
              />
              <span
                className="text-xs"
                style={{ color: "oklch(0.72 0.16 160)" }}
              >
                +12 bu hafta
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          data-ocid="dashboard.overdue_tasks_card"
          className="bg-card border-border"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t.overdueTasks}
                </p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: "oklch(0.65 0.22 25)" }}
                >
                  {stats.overdueTasks}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.65 0.22 25 / 0.15)",
                  border: "1px solid oklch(0.65 0.22 25 / 0.3)",
                }}
              >
                <AlertTriangle
                  className="w-6 h-6"
                  style={{ color: "oklch(0.65 0.22 25)" }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Acil müdahale gerekiyor
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t.teamMembers}</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.teamMembers}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.68 0.18 200 / 0.15)",
                  border: "1px solid oklch(0.68 0.18 200 / 0.3)",
                }}
              >
                <Users
                  className="w-6 h-6"
                  style={{ color: "oklch(0.68 0.18 200)" }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">3 yeni bu ay</p>
          </CardContent>
        </Card>
      </div>

      {/* Field Ops Summary */}
      <Card
        data-ocid="dashboard.field_summary_card"
        className="bg-card border-border"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HardHat
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.18 50)" }}
            />
            {t.fieldSummary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              className="p-4 rounded-xl"
              style={{
                background: "oklch(0.62 0.22 280 / 0.1)",
                border: "1px solid oklch(0.62 0.22 280 / 0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Wrench
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.2 280)" }}
                />
                <span className="text-xs text-muted-foreground">
                  {t.activeWorkOrders}
                </span>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: "oklch(0.72 0.2 280)" }}
              >
                {stats.activeWorkOrders}
              </p>
            </div>
            <div
              className="p-4 rounded-xl"
              style={{
                background: "oklch(0.72 0.18 50 / 0.1)",
                border: "1px solid oklch(0.72 0.18 50 / 0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.18 50)" }}
                />
                <span className="text-xs text-muted-foreground">
                  {t.openInspections}
                </span>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: "oklch(0.72 0.18 50)" }}
              >
                {stats.openInspections}
              </p>
            </div>
            <div
              className="p-4 rounded-xl col-span-2 md:col-span-1"
              style={{
                background: "oklch(0.72 0.16 160 / 0.1)",
                border: "1px solid oklch(0.72 0.16 160 / 0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.16 160)" }}
                />
                <span className="text-xs text-muted-foreground">
                  Son Tamamlanan
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {workOrders.find((w) => w.status === "completed")?.title || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.projectStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx={65}
                    cy={65}
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {entry.name}
                    </span>
                    <span className="text-sm font-semibold text-foreground ml-auto pl-4">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.taskCompletion}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barData} barSize={24}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.19 0.008 264)",
                    border: "1px solid oklch(0.3 0.012 264)",
                    borderRadius: 8,
                    color: "oklch(0.96 0.008 264)",
                  }}
                />
                <Bar
                  dataKey="completed"
                  fill="oklch(0.62 0.22 280)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((a) => (
              <div key={a.text} className="flex items-start gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ background: a.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">
                    {a.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.upcomingDeadlines}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.map((d) => (
              <div
                key={d.task}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "oklch(0.22 0.01 264)" }}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {d.task}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.project}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {d.date}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${d.daysLeft <= 3 ? "border-destructive/50 text-destructive" : "border-primary/50 text-primary"}`}
                  >
                    {d.daysLeft} {t.days}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.projects}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.slice(0, 4).map((project) => (
            <div key={project.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {project.title}
                  </span>
                  <StatusBadge status={project.status} t={t} />
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground w-10 text-right">
                {project.progress}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: { status: string; t: ReturnType<typeof useApp>["t"] }) {
  const config: Record<string, { label: string; color: string }> = {
    planning: { label: t.statusPlanning, color: "oklch(0.68 0.18 200)" },
    active: { label: t.statusActive, color: "oklch(0.72 0.16 160)" },
    on_hold: { label: t.statusOnHold, color: "oklch(0.72 0.18 50)" },
    completed: { label: t.statusCompleted, color: "oklch(0.62 0.22 280)" },
  };
  const c = config[status] || config.planning;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        background: `${c.color}22`,
        color: c.color,
        border: `1px solid ${c.color}44`,
      }}
    >
      {c.label}
    </span>
  );
}
