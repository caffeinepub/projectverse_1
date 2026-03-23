import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../contexts/AppContext";

interface ProjectHubProps {
  projectId: string;
  onBack: () => void;
}

export default function ProjectHub({ projectId, onBack }: ProjectHubProps) {
  const { projects, tasks, currentCompany } = useApp();

  const project = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const companyId = currentCompany?.id || "";

  // Finance data
  const projectExpenses = useMemo(() => {
    const key = `finance_expenses_${companyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId]);

  const approvedExpenses = projectExpenses.filter(
    (e: { projectId?: string; status?: string; amount?: number }) =>
      e.projectId === projectId && e.status === "Onaylandı",
  );
  const totalSpent = approvedExpenses.reduce(
    (s: number, e: { amount?: number }) => s + (e.amount || 0),
    0,
  );
  const totalBudget = project?.budget || 0;
  const remaining = totalBudget - totalSpent;
  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Risk data
  const risks = useMemo(() => {
    const key = `riskRegister_${companyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId]);
  const openHighRisks = risks.filter(
    (r: { status?: string; level?: string }) =>
      r.status === "Açık" && (r.level === "Yüksek" || r.level === "Kritik"),
  ).length;
  const allOpenRisks = risks.filter(
    (r: { status?: string }) => r.status === "Açık",
  );

  // Punch list
  const punchList = useMemo(() => {
    const key = `punchList_${companyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId]);
  const openPunch = punchList.filter(
    (p: { status?: string }) => p.status !== "Kapalı",
  ).length;
  const closedPunch = punchList.filter(
    (p: { status?: string }) => p.status === "Kapalı",
  ).length;

  // Meetings
  const meetings = useMemo(() => {
    const key = `meetings_${companyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId]);
  const lastMeeting =
    meetings.length > 0
      ? meetings.sort(
          (a: { date?: string }, b: { date?: string }) =>
            new Date(b.date || "").getTime() - new Date(a.date || "").getTime(),
        )[0]
      : null;

  // Hakediş
  const hakedis = useMemo(() => {
    const key = `hakedis_${companyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId]);
  const projectHakedis = hakedis.filter(
    (h: { projectId?: string }) => h.projectId === projectId,
  );
  const latestHakedis =
    projectHakedis.length > 0
      ? projectHakedis.sort(
          (a: { createdAt?: string }, b: { createdAt?: string }) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime(),
        )[0]
      : null;

  // NCR
  const ncrs = useMemo(() => {
    const key = `ncr_${companyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId]);
  const openNcrs = ncrs.filter(
    (n: { status?: string }) => n.status !== "Kapalı",
  ).length;

  // Tasks for this project
  const projectTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.projectId === projectId)
        .sort((a, b) => a.id.localeCompare(b.id)),
    [tasks, projectId],
  );

  // Personnel (from HR)
  const personnel = useMemo(() => {
    const key = `hr_personnel_${companyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId]);
  const activePersonnel = personnel.filter(
    (p: { projectId?: string; status?: string }) =>
      p.projectId === projectId ||
      (p.status === "Aktif" && p.projectId === projectId),
  ).length;

  // Milestones
  const milestones = useMemo(() => {
    const key = `milestones_${companyId}_${projectId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, [companyId, projectId]);
  const upcomingMilestones = milestones
    .filter(
      (m: { date?: string; completed?: boolean }) =>
        !m.completed && new Date(m.date || "") >= new Date(),
    )
    .sort(
      (a: { date?: string }, b: { date?: string }) =>
        new Date(a.date || "").getTime() - new Date(b.date || "").getTime(),
    )
    .slice(0, 3);

  // Schedule
  const today = new Date();
  const endDate = project?.endDate ? new Date(project.endDate) : null;
  const daysRemaining = endDate
    ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const recentTasks = projectTasks.slice(0, 5);
  const topRisks = allOpenRisks.slice(0, 3);

  if (!project) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Proje bulunamadı.
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  const STATUS_LABELS: Record<string, string> = {
    planning: "Planlama",
    active: "Aktif",
    on_hold: "Beklemede",
    completed: "Tamamlandı",
  };
  const TASK_STATUS_LABELS: Record<string, string> = {
    todo: "Yapılacak",
    in_progress: "Devam Ediyor",
    done: "Tamamlandı",
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-ocid="project_hub.back_button"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <LayoutDashboard className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-foreground">
              {project.title}
            </h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Budget */}
        <Card
          className="bg-gray-800/60 border-gray-700/50 col-span-2"
          data-ocid="project_hub.budget_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Bütçe
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Toplam</p>
                <p className="text-sm font-semibold text-foreground">
                  {totalBudget > 0 ? formatCurrency(totalBudget) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Harcanan</p>
                <p className="text-sm font-semibold text-orange-400">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kalan</p>
                <p
                  className={`text-sm font-semibold ${
                    remaining < 0 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>
            <Progress value={Math.min(budgetPct, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              %{budgetPct.toFixed(1)} kullanıldı
            </p>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.schedule_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Takvim
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">Bitiş Tarihi</p>
            <p className="text-sm font-semibold text-foreground mb-1">
              {project.endDate || "—"}
            </p>
            {daysRemaining !== null && (
              <Badge
                className={`text-xs ${
                  daysRemaining < 0
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : daysRemaining < 30
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "bg-green-500/20 text-green-400 border-green-500/30"
                }`}
              >
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)} gün gecikmiş`
                  : `${daysRemaining} gün kaldı`}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Open Risks */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.risks_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Açık Riskler
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={`text-2xl font-bold ${
                openHighRisks > 0 ? "text-red-400" : "text-foreground"
              }`}
            >
              {allOpenRisks.length}
            </p>
            {openHighRisks > 0 && (
              <p className="text-xs text-red-400">
                {openHighRisks} yüksek/kritik
              </p>
            )}
          </CardContent>
        </Card>

        {/* Punch List */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.punchlist_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-green-400" />
              Punch List
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Açık</p>
                <p className="text-xl font-bold text-orange-400">{openPunch}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kapalı</p>
                <p className="text-xl font-bold text-green-400">
                  {closedPunch}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Meeting */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.meeting_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Son Toplantı
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {lastMeeting ? (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {lastMeeting.date || "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {lastMeeting.title || ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Toplantı yok</p>
            )}
          </CardContent>
        </Card>

        {/* Hakediş */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.hakedis_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Son Hakediş
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {latestHakedis ? (
              <>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  {latestHakedis.status || "Bekliyor"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  #{latestHakedis.hakedisNo || ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Hakediş yok</p>
            )}
          </CardContent>
        </Card>

        {/* NCR */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.ncr_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-pink-400" />
              Açık NCR
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={`text-2xl font-bold ${
                openNcrs > 0 ? "text-pink-400" : "text-foreground"
              }`}
            >
              {openNcrs}
            </p>
          </CardContent>
        </Card>

        {/* Active Personnel */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.personnel_card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Aktif Personel
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-cyan-400">
              {activePersonnel > 0
                ? activePersonnel
                : personnel.filter(
                    (p: { status?: string }) => p.status === "Aktif",
                  ).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Tasks */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.tasks_card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Son Görevler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Bu projeye ait görev yok
              </p>
            ) : (
              recentTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-1.5 border-b border-gray-700/40 last:border-0"
                  data-ocid={`project_hub.tasks_card.item.${i + 1}`}
                >
                  <p className="text-sm text-foreground truncate flex-1">
                    {task.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs ml-2 flex-shrink-0 ${
                      task.status === "done"
                        ? "border-green-500/30 text-green-400"
                        : task.status === "in_progress"
                          ? "border-blue-500/30 text-blue-400"
                          : "border-gray-500/30 text-muted-foreground"
                    }`}
                  >
                    {TASK_STATUS_LABELS[task.status] || task.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Open Risks */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.open_risks_card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Açık Riskler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Açık risk yok
              </p>
            ) : (
              topRisks.map(
                (
                  risk: {
                    id?: string;
                    title?: string;
                    level?: string;
                    owner?: string;
                  },
                  i: number,
                ) => (
                  <div
                    key={risk.id || i}
                    className="flex items-center justify-between py-1.5 border-b border-gray-700/40 last:border-0"
                    data-ocid={`project_hub.open_risks_card.item.${i + 1}`}
                  >
                    <div className="flex-1 truncate">
                      <p className="text-sm text-foreground truncate">
                        {risk.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {risk.owner}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ml-2 flex-shrink-0 ${
                        risk.level === "Kritik"
                          ? "border-red-500/30 text-red-400"
                          : risk.level === "Yüksek"
                            ? "border-orange-500/30 text-orange-400"
                            : "border-yellow-500/30 text-yellow-400"
                      }`}
                    >
                      {risk.level}
                    </Badge>
                  </div>
                ),
              )
            )}
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.milestones_card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Yaklaşan Kilometre Taşları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Yaklaşan kilometre taşı yok
              </p>
            ) : (
              upcomingMilestones.map(
                (
                  m: {
                    id?: string;
                    title?: string;
                    date?: string;
                    completed?: boolean;
                  },
                  i: number,
                ) => (
                  <div
                    key={m.id || i}
                    className="flex items-center justify-between py-1.5 border-b border-gray-700/40 last:border-0"
                    data-ocid={`project_hub.milestones_card.item.${i + 1}`}
                  >
                    <p className="text-sm text-foreground truncate flex-1">
                      {m.title}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {m.date}
                    </span>
                  </div>
                ),
              )
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card
          className="bg-gray-800/60 border-gray-700/50"
          data-ocid="project_hub.activity_card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Son Aktivite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTasks.length === 0 && allOpenRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz aktivite yok
              </p>
            ) : (
              [
                ...recentTasks.slice(0, 3).map((task) => ({
                  id: `task-${task.id}`,
                  text: `Görev: ${task.title}`,
                  sub: TASK_STATUS_LABELS[task.status] || task.status,
                  color: "text-amber-400",
                })),
                ...allOpenRisks
                  .slice(0, 2)
                  .map((r: { id?: string; title?: string }) => ({
                    id: `risk-${r.id}`,
                    text: `Risk: ${r.title}`,
                    sub: "Açık",
                    color: "text-red-400",
                  })),
              ]
                .slice(0, 5)
                .map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 py-1.5 border-b border-gray-700/40 last:border-0"
                    data-ocid={`project_hub.activity_card.item.${i + 1}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.color.replace("text-", "bg-")}`}
                    />
                    <div>
                      <p className="text-sm text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
