import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckSquare,
  DollarSign,
  Plus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { type Project, useApp } from "../contexts/AppContext";
import WeeklyReportModal from "./tabs/WeeklyReportModal";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: "Planlama", color: "oklch(0.68 0.18 200)" },
  active: { label: "Aktif", color: "oklch(0.72 0.16 160)" },
  on_hold: { label: "Beklemede", color: "oklch(0.72 0.18 50)" },
  completed: { label: "Tamamlandı", color: "oklch(0.62 0.22 280)" },
};

export default function Projects({
  onOpenProject,
}: { onOpenProject: (id: string) => void }) {
  const { checkPermission, t, projects, tasks, addProject, currentCompany } =
    useApp();
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [open, setOpen] = useState(false);
  const [weeklyProject, setWeeklyProject] = useState<Project | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "active" as Project["status"],
    startDate: "",
    endDate: "",
    budget: "",
  });

  if (!checkPermission("projects", "view")) return <AccessDenied />;

  const companyProjects = projects.filter(
    (p) => p.companyId === (currentCompany?.id || "c1"),
  );
  const filtered =
    filter === "all"
      ? companyProjects
      : companyProjects.filter((p) => p.status === filter);

  const handleCreate = () => {
    if (!form.title.trim()) return;
    addProject({
      ...form,
      companyId: currentCompany?.id || "c1",
      members: [],
      budget: form.budget ? Number(form.budget) : undefined,
    });
    setOpen(false);
    setForm({
      title: "",
      description: "",
      status: "active",
      startDate: "",
      endDate: "",
      budget: "",
    });
  };

  const tabs = ["all", "active", "planning", "on_hold", "completed"];
  const tabLabels: Record<string, string> = {
    all: t.allProjects,
    active: t.active,
    planning: t.planning,
    on_hold: t.onHold,
    completed: t.completed,
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.projects}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {companyProjects.length} proje
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
            <button
              type="button"
              data-ocid="projects.list.toggle"
              onClick={() => setViewMode("list")}
              className={`px-2 py-1 text-xs rounded ${viewMode === "list" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
            >
              Liste
            </button>
            <button
              type="button"
              data-ocid="projects.kanban.toggle"
              onClick={() => setViewMode("kanban")}
              className={`px-2 py-1 text-xs rounded ${viewMode === "kanban" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
            >
              Kanban
            </button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="projects.primary_button"
                className="gradient-bg text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.newProject}
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="new_project.dialog" className="bg-card">
              <DialogHeader>
                <DialogTitle>{t.newProject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Proje Adı</Label>
                  <Input
                    data-ocid="new_project.title_input"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Proje adı..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Textarea
                    data-ocid="new_project.desc_textarea"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Başlangıç</Label>
                    <Input
                      data-ocid="new_project.start_input"
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Bitiş</Label>
                    <Input
                      data-ocid="new_project.end_input"
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Bütçe (TL, isteğe bağlı)</Label>
                  <Input
                    data-ocid="new_project.budget_input"
                    type="number"
                    value={form.budget}
                    onChange={(e) =>
                      setForm({ ...form, budget: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Durum</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as Project["status"] })
                    }
                  >
                    <SelectTrigger
                      data-ocid="new_project.status_select"
                      className="mt-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="planning">Planlama</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="on_hold">Beklemede</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-ocid="new_project.submit_button"
                  onClick={handleCreate}
                  className="w-full gradient-bg text-white"
                >
                  {t.create}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            data-ocid="projects.filter.tab"
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab
                ? "gradient-bg text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          data-ocid="projects.empty_state"
          className="text-center py-20 text-muted-foreground"
        >
          {t.noProjects}
        </div>
      ) : viewMode === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project, i) => {
            const projectTasks = tasks.filter(
              (t2) => t2.projectId === project.id,
            );
            const completedCount = projectTasks.filter(
              (t2) => t2.status === "done",
            ).length;
            const totalCount = projectTasks.length;
            const hasOverdue = projectTasks.some(
              (t2) =>
                t2.status !== "done" &&
                t2.dueDate &&
                new Date(t2.dueDate) < today,
            );
            return (
              <button
                type="button"
                key={project.id}
                data-ocid={`projects.item.${i + 1}`}
                className="glass-card rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group text-left"
                onClick={() => onOpenProject(project.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {project.title}
                  </h3>
                  <StatusPill status={project.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>
                <Progress value={project.progress} className="h-1.5 mb-3" />
                <div className="flex items-center justify-between flex-wrap gap-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{project.members.length || 1} üye</span>
                  </div>
                  {totalCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckSquare className="w-3 h-3" />
                      <span>
                        {completedCount}/{totalCount} görev
                      </span>
                    </div>
                  )}
                  {project.budget && project.budget > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="w-3 h-3" />
                      <span>{project.budget.toLocaleString("tr-TR")} TL</span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{project.endDate}</span>
                    </div>
                  )}
                  <div
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: "oklch(0.72 0.2 280)" }}
                  >
                    <span>{project.progress}%</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
                {hasOverdue && (
                  <div className="flex items-center gap-1 mt-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-500/50 text-orange-400 bg-orange-500/10"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Gecikmiş görev
                    </Badge>
                  </div>
                )}
                <button
                  type="button"
                  data-ocid={`projects.weekly_report.button.${i + 1}`}
                  className="mt-3 w-full text-xs text-amber-400 border border-amber-500/30 rounded-lg py-1.5 hover:bg-amber-500/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWeeklyProject(project);
                  }}
                >
                  📊 Haftalık Rapor
                </button>
              </button>
            );
          })}
        </div>
      ) : (
        /* Kanban view */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {(["planning", "active", "on_hold", "completed"] as const).map(
            (status) => {
              const colProjects = companyProjects.filter(
                (p) => p.status === status,
              );
              const cfg = STATUS_CONFIG[status];
              return (
                <div
                  key={status}
                  className="rounded-xl border border-border bg-card/50 overflow-hidden"
                >
                  <div
                    className="px-3 py-2.5 border-b border-border flex items-center justify-between"
                    style={{ background: `${cfg.color}11` }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                      {colProjects.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[120px]">
                    {colProjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Proje yok
                      </p>
                    ) : (
                      colProjects.map((project, i) => {
                        const projectTasks = tasks.filter(
                          (t2) => t2.projectId === project.id,
                        );
                        const completedCount = projectTasks.filter(
                          (t2) => t2.status === "done",
                        ).length;
                        const totalCount = projectTasks.length;
                        const hasOverdue = projectTasks.some(
                          (t2) =>
                            t2.status !== "done" &&
                            t2.dueDate &&
                            new Date(t2.dueDate) < today,
                        );
                        return (
                          <button
                            type="button"
                            key={project.id}
                            data-ocid={`projects.kanban.item.${i + 1}`}
                            className="w-full text-left p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => onOpenProject(project.id)}
                          >
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                              {project.title}
                            </p>
                            <Progress
                              value={project.progress}
                              className="h-1 mb-2"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {project.progress}%
                              </span>
                              {totalCount > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CheckSquare className="w-3 h-3" />
                                  <span>
                                    {completedCount}/{totalCount}
                                  </span>
                                </div>
                              )}
                              {project.endDate && (
                                <span className="text-xs text-muted-foreground">
                                  {project.endDate}
                                </span>
                              )}
                            </div>
                            {hasOverdue && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <AlertTriangle className="w-3 h-3 text-orange-400" />
                                <span className="text-xs text-orange-400">
                                  Gecikmiş
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
      <WeeklyReportModal
        project={weeklyProject}
        companyId={currentCompany?.id || "c1"}
        open={!!weeklyProject}
        onClose={() => setWeeklyProject(null)}
      />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.planning;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
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
