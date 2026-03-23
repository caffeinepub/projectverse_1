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
import { Textarea } from "@/components/ui/textarea";
import {
  BookTemplate,
  Calendar,
  FolderKanban,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

interface TemplateTask {
  id: string;
  name: string;
  durationDays: number;
}

interface TemplateMilestone {
  id: string;
  name: string;
  dayOffset: number;
}

interface TemplateBudgetCategory {
  id: string;
  name: string;
  estimatedAmount: number;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  tasks: TemplateTask[];
  milestones: TemplateMilestone[];
  budgetCategories: TemplateBudgetCategory[];
  createdAt: string;
}

function loadTemplates(companyId: string): ProjectTemplate[] {
  const raw = localStorage.getItem(`pv_project_templates_${companyId}`);
  return raw ? JSON.parse(raw) : [];
}

function saveTemplates(companyId: string, templates: ProjectTemplate[]) {
  localStorage.setItem(
    `pv_project_templates_${companyId}`,
    JSON.stringify(templates),
  );
}

export default function ProjectTemplates() {
  const { activeCompanyId, activeRoleId, checkPermission } = useApp();
  const canView =
    checkPermission("projects", "view") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";
  const canEdit =
    checkPermission("projects", "edit") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";

  const [templates, setTemplates] = useState<ProjectTemplate[]>(() =>
    loadTemplates(activeCompanyId || ""),
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [tasks, setTasks] = useState<TemplateTask[]>([]);
  const [milestones, setMilestones] = useState<TemplateMilestone[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<
    TemplateBudgetCategory[]
  >([]);
  const [newTask, setNewTask] = useState({ name: "", durationDays: 7 });
  const [newMilestone, setNewMilestone] = useState({ name: "", dayOffset: 30 });
  const [newBudget, setNewBudget] = useState({ name: "", estimatedAmount: 0 });

  if (!canView) return <AccessDenied />;

  const persist = (updated: ProjectTemplate[]) => {
    setTemplates(updated);
    saveTemplates(activeCompanyId || "", updated);
  };

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("Şablon adı zorunludur.");
      return;
    }
    const newTemplate: ProjectTemplate = {
      id: `tpl_${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      tasks,
      milestones,
      budgetCategories,
      createdAt: new Date().toISOString(),
    };
    persist([...templates, newTemplate]);
    setOpen(false);
    setForm({ name: "", description: "" });
    setTasks([]);
    setMilestones([]);
    setBudgetCategories([]);
    toast.success("Şablon oluşturuldu.");
  };

  const handleDelete = (id: string) => {
    persist(templates.filter((t) => t.id !== id));
    toast.success("Şablon silindi.");
  };

  const handleAddTask = () => {
    if (!newTask.name.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `task_${Date.now()}`,
        name: newTask.name.trim(),
        durationDays: newTask.durationDays,
      },
    ]);
    setNewTask({ name: "", durationDays: 7 });
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name.trim()) return;
    setMilestones((prev) => [
      ...prev,
      {
        id: `ms_${Date.now()}`,
        name: newMilestone.name.trim(),
        dayOffset: newMilestone.dayOffset,
      },
    ]);
    setNewMilestone({ name: "", dayOffset: 30 });
  };

  const handleAddBudget = () => {
    if (!newBudget.name.trim()) return;
    setBudgetCategories((prev) => [
      ...prev,
      {
        id: `bc_${Date.now()}`,
        name: newBudget.name.trim(),
        estimatedAmount: newBudget.estimatedAmount,
      },
    ]);
    setNewBudget({ name: "", estimatedAmount: 0 });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Proje Şablonları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tekrar kullanılabilir proje şablonları oluşturun
          </p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="templates.primary_button"
                className="gradient-bg text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Şablon Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent
              data-ocid="templates.dialog"
              className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <DialogHeader>
                <DialogTitle>Yeni Proje Şablonu</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Şablon Adı *</Label>
                    <Input
                      data-ocid="templates.name.input"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="mt-1 bg-background border-border"
                      placeholder="örn: Konut İnşaatı Şablonu"
                    />
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      data-ocid="templates.description.textarea"
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      className="mt-1 bg-background border-border"
                      placeholder="Şablon hakkında açıklama..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Görevler
                  </p>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2"
                      >
                        <span className="flex-1 text-sm">{task.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.durationDays} gün
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-rose-400"
                          onClick={() =>
                            setTasks((prev) =>
                              prev.filter((t) => t.id !== task.id),
                            )
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newTask.name}
                        onChange={(e) =>
                          setNewTask((p) => ({ ...p, name: e.target.value }))
                        }
                        className="bg-background border-border text-sm"
                        placeholder="Görev adı"
                      />
                      <Input
                        type="number"
                        value={newTask.durationDays}
                        onChange={(e) =>
                          setNewTask((p) => ({
                            ...p,
                            durationDays: Number.parseInt(e.target.value) || 1,
                          }))
                        }
                        className="bg-background border-border text-sm w-24"
                        placeholder="Gün"
                        min={1}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddTask}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Kilometre Taşları
                  </p>
                  <div className="space-y-2">
                    {milestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2"
                      >
                        <span className="flex-1 text-sm">{ms.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {ms.dayOffset}. gün
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-rose-400"
                          onClick={() =>
                            setMilestones((prev) =>
                              prev.filter((m) => m.id !== ms.id),
                            )
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newMilestone.name}
                        onChange={(e) =>
                          setNewMilestone((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="bg-background border-border text-sm"
                        placeholder="Kilometre taşı adı"
                      />
                      <Input
                        type="number"
                        value={newMilestone.dayOffset}
                        onChange={(e) =>
                          setNewMilestone((p) => ({
                            ...p,
                            dayOffset: Number.parseInt(e.target.value) || 1,
                          }))
                        }
                        className="bg-background border-border text-sm w-24"
                        placeholder="Gün"
                        min={1}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddMilestone}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Budget Categories */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Bütçe Kalemleri
                  </p>
                  <div className="space-y-2">
                    {budgetCategories.map((bc) => (
                      <div
                        key={bc.id}
                        className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2"
                      >
                        <span className="flex-1 text-sm">{bc.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {bc.estimatedAmount.toLocaleString("tr-TR")} ₺
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-rose-400"
                          onClick={() =>
                            setBudgetCategories((prev) =>
                              prev.filter((b) => b.id !== bc.id),
                            )
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newBudget.name}
                        onChange={(e) =>
                          setNewBudget((p) => ({ ...p, name: e.target.value }))
                        }
                        className="bg-background border-border text-sm"
                        placeholder="Kategori adı"
                      />
                      <Input
                        type="number"
                        value={newBudget.estimatedAmount}
                        onChange={(e) =>
                          setNewBudget((p) => ({
                            ...p,
                            estimatedAmount:
                              Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="bg-background border-border text-sm w-36"
                        placeholder="Tahmini tutar"
                        min={0}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddBudget}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  data-ocid="templates.cancel_button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  data-ocid="templates.submit_button"
                  className="gradient-bg text-white"
                  onClick={handleCreate}
                >
                  Şablon Oluştur
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {templates.length === 0 ? (
        <div
          data-ocid="templates.empty_state"
          className="text-center py-24 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto opacity-60">
            <BookTemplate className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-lg">
              Henüz şablon yok
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Proje şablonları oluşturarak yeni projeleri hızla başlatın.
            </p>
          </div>
          {canEdit && (
            <Button
              className="gradient-bg text-white"
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Şablonu Oluştur
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl, idx) => (
            <Card
              key={tpl.id}
              data-ocid={`templates.item.${idx + 1}`}
              className="bg-card border-border hover:border-primary/40 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                    <LayoutTemplate className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {tpl.name}
                    </CardTitle>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      data-ocid={`templates.delete_button.${idx + 1}`}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-400 flex-shrink-0"
                      onClick={() => handleDelete(tpl.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-primary">
                      {tpl.tasks.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Görev</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-amber-400">
                      {tpl.milestones.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Milestone</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-emerald-400">
                      {tpl.budgetCategories.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bütçe Kalemi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(tpl.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <Button
                  size="sm"
                  data-ocid={`templates.secondary_button.${idx + 1}`}
                  className="w-full gradient-bg text-white"
                  onClick={() => {
                    toast.success(
                      `"${tpl.name}" şablonundan proje oluşturmak için Projeler modülüne gidin.`,
                    );
                  }}
                >
                  <FolderKanban className="h-3.5 w-3.5 mr-2" />
                  Şablondan Proje Aç
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
