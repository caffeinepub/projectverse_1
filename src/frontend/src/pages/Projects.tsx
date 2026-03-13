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
import { ArrowRight, Calendar, Plus, Users } from "lucide-react";
import { useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { type Project, useApp } from "../contexts/AppContext";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: "Planlama", color: "oklch(0.68 0.18 200)" },
  active: { label: "Aktif", color: "oklch(0.72 0.16 160)" },
  on_hold: { label: "Beklemede", color: "oklch(0.72 0.18 50)" },
  completed: { label: "Tamamlandı", color: "oklch(0.62 0.22 280)" },
};

export default function Projects({
  onOpenProject,
}: { onOpenProject: (id: string) => void }) {
  const { checkPermission, t, projects, addProject, currentCompany } = useApp();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "active" as Project["status"],
    startDate: "",
    endDate: "",
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
      budget: undefined,
    });
    setOpen(false);
    setForm({
      title: "",
      description: "",
      status: "active",
      startDate: "",
      endDate: "",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.projects}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {companyProjects.length} proje
          </p>
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
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{project.members.length || 1} üye</span>
                </div>
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
            </button>
          ))}
        </div>
      )}
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
