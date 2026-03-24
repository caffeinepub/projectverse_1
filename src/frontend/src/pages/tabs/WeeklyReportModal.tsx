import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  ClipboardList,
  DollarSign,
  FileText,
  Printer,
} from "lucide-react";
import type { Project } from "../../contexts/AppContext";

interface WeeklyReportModalProps {
  project: Project | null;
  companyId: string;
  open: boolean;
  onClose: () => void;
}

export default function WeeklyReportModal({
  project,
  companyId,
  open,
  onClose,
}: WeeklyReportModalProps) {
  if (!project) return null;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long" });

  // Load related data from localStorage
  function loadKey<T>(key: string): T[] {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  type Task = {
    projectId: string;
    status: string;
    updatedAt?: string;
    dueDate?: string;
  };
  type Risk = { projectId: string; status: string };
  type PunchItem = { projectId: string; status: string };
  type SiteLog = { projectId: string; date: string };
  type Milestone = {
    projectId: string;
    date: string;
    title: string;
    status?: string;
  };
  type Expense = { projectId: string; amount: number; status?: string };

  const tasks = loadKey<Task>(`tasks_${companyId}`);
  const risks = loadKey<Risk>(`risks_${companyId}`);
  const punchItems = loadKey<PunchItem>(`punchlist_${companyId}`);
  const siteLogs = loadKey<SiteLog>(`sitelogs_${companyId}`);
  const milestones = loadKey<Milestone>(`milestones_${companyId}`);
  const expenses = loadKey<Expense>(`expenses_${companyId}`);

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const weeklyCompleted = projectTasks.filter((t) => {
    if (t.status !== "done") return false;
    return true;
  }).length;
  const totalTasks = projectTasks.length;

  const projectExpenses = expenses.filter(
    (e) => e.projectId === project.id && e.status === "Onaylandı",
  );
  const totalSpent = projectExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const budget = project.budget || 0;
  const budgetPct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

  const openRisks = risks.filter(
    (r) =>
      r.projectId === project.id &&
      r.status !== "Kapatıldı" &&
      r.status !== "closed",
  ).length;

  const projectPunch = punchItems.filter((p) => p.projectId === project.id);
  const closedPunch = projectPunch.filter(
    (p) => p.status === "Kapatıldı" || p.status === "closed",
  ).length;
  const punchPct =
    projectPunch.length > 0
      ? Math.round((closedPunch / projectPunch.length) * 100)
      : 0;

  const weekSiteLogs = siteLogs.filter((s) => {
    if (s.projectId !== project.id) return false;
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }).length;

  const nextMilestones = milestones
    .filter(
      (m) =>
        m.projectId === project.id && m.date >= now.toISOString().slice(0, 10),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const stats = [
    {
      icon: <CheckSquare className="w-4 h-4 text-green-400" />,
      label: "Bu Hafta Tamamlanan Görev",
      value: `${weeklyCompleted} / ${totalTasks}`,
      sub: "görev",
    },
    {
      icon: <DollarSign className="w-4 h-4 text-amber-400" />,
      label: "Bütçe Kullanım Oranı",
      value: `%${budgetPct}`,
      sub: `${totalSpent.toLocaleString("tr-TR")} ₺ / ${budget.toLocaleString("tr-TR")} ₺`,
      progress: budgetPct,
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      label: "Açık Risk Sayısı",
      value: openRisks.toString(),
      sub: "açık risk",
    },
    {
      icon: <ClipboardList className="w-4 h-4 text-blue-400" />,
      label: "Punch List Tamamlanma",
      value: `%${punchPct}`,
      sub: `${closedPunch} / ${projectPunch.length}`,
      progress: punchPct,
    },
    {
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      label: "Şantiye Log Girişi",
      value: weekSiteLogs.toString(),
      sub: "bu hafta",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Haftalık İlerleme Raporu
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {project.title} &bull; {fmt(weekStart)} – {fmt(weekEnd)}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* KPI Stats */}
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-3 rounded-lg bg-background border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {s.value}
                </span>
                <span className="text-xs text-muted-foreground">{s.sub}</span>
              </div>
              {s.progress !== undefined && (
                <Progress value={s.progress} className="h-1.5 mt-2" />
              )}
            </div>
          ))}

          {/* Next milestones */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">
                Yaklaşan Milestonlar
              </span>
            </div>
            {nextMilestones.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Yaklaşan milestone yok
              </p>
            ) : (
              <ul className="space-y-1">
                {nextMilestones.map((m) => (
                  <li
                    key={m.title + m.date}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-foreground">{m.title}</span>
                    <span className="text-muted-foreground">{m.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="border-border gap-2"
            data-ocid="weekly_report.print_button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" /> Yazdır
          </Button>
          <Button className="gradient-bg text-white" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
