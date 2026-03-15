import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Milestone } from "../contexts/AppContext";
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
  useApp,
} from "../contexts/AppContext";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Düşük", color: "oklch(0.68 0.18 200)" },
  medium: { label: "Orta", color: "oklch(0.72 0.18 50)" },
  high: { label: "Yüksek", color: "oklch(0.65 0.22 25)" },
  critical: { label: "Kritik", color: "oklch(0.58 0.22 25)" },
};

function MilestonesTab({ projectId }: { projectId: string }) {
  const { milestones, addMilestone, updateMilestone, deleteMilestone } =
    useApp();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    targetDate: "",
    description: "",
  });

  const projectMilestones = milestones.filter((m) => m.projectId === projectId);
  const today = new Date().toISOString().split("T")[0];

  const handleAdd = () => {
    if (!form.title || !form.targetDate) return;
    const milestone: Milestone = {
      id: `ms${Date.now()}`,
      projectId,
      title: form.title,
      targetDate: form.targetDate,
      description: form.description,
      completed: false,
      completedDate: undefined,
    };
    addMilestone(milestone);
    setForm({ title: "", targetDate: "", description: "" });
    setAddOpen(false);
  };

  const getMilestoneStatus = (m: Milestone) => {
    if (m.completed)
      return {
        label: "Tamamlandı",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      };
    if (m.targetDate < today)
      return {
        label: "Gecikmiş",
        color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      };
    return {
      label: "Bekliyor",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Kilometre Taşları</h2>
          <Badge variant="outline" className="text-xs">
            {projectMilestones.filter((m) => m.completed).length}/
            {projectMilestones.length} tamamlandı
          </Badge>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="milestone.open_modal_button"
              size="sm"
              className="gradient-bg text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Taş Ekle
            </Button>
          </DialogTrigger>
          <DialogContent
            data-ocid="milestone.dialog"
            className="bg-card border-border"
          >
            <DialogHeader>
              <DialogTitle>Kilometre Taşı Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Başlık</Label>
                <Input
                  data-ocid="milestone.title_input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Kilometre taşı başlığı..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Hedef Tarih</Label>
                <Input
                  data-ocid="milestone.date_input"
                  type="date"
                  value={form.targetDate}
                  onChange={(e) =>
                    setForm({ ...form, targetDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Açıklama</Label>
                <Input
                  data-ocid="milestone.desc_input"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Kısa açıklama (opsiyonel)..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="milestone.cancel_button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="border-border"
              >
                İptal
              </Button>
              <Button
                data-ocid="milestone.submit_button"
                onClick={handleAdd}
                disabled={!form.title || !form.targetDate}
                className="gradient-bg text-white"
              >
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projectMilestones.length === 0 ? (
        <div
          data-ocid="milestone.empty_state"
          className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl"
        >
          <Flag className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Henüz kilometre taşı eklenmemiş.</p>
          <p className="text-xs mt-1">
            Proje dönüm noktalarını takip etmek için taş ekleyin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projectMilestones.map((milestone, idx) => {
            const st = getMilestoneStatus(milestone);
            return (
              <div
                key={milestone.id}
                data-ocid={`milestone.item.${idx + 1}`}
                className={`flex items-start gap-3 bg-card border rounded-xl px-4 py-3 ${
                  milestone.completed
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : milestone.targetDate < today
                      ? "border-rose-500/20 bg-rose-500/5"
                      : "border-border"
                }`}
              >
                <button
                  type="button"
                  data-ocid={`milestone.checkbox.${idx + 1}`}
                  className="mt-0.5 flex-shrink-0"
                  onClick={() =>
                    updateMilestone(milestone.id, {
                      completed: !milestone.completed,
                      completedDate: !milestone.completed ? today : undefined,
                    })
                  }
                >
                  {milestone.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/50" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium text-sm ${milestone.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {milestone.title}
                    </span>
                    <Badge variant="outline" className={`text-xs ${st.color}`}>
                      {st.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {milestone.targetDate}
                    </span>
                    {milestone.completedDate && (
                      <span>Tamamlandı: {milestone.completedDate}</span>
                    )}
                    {milestone.description && (
                      <span className="truncate">{milestone.description}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid={`milestone.delete_button.${idx + 1}`}
                  className="flex-shrink-0 text-muted-foreground hover:text-rose-400 transition-colors"
                  onClick={() => deleteMilestone(milestone.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail({
  projectId,
  onBack,
}: { projectId: string; onBack: () => void }) {
  const {
    t,
    projects,
    tasks,
    addTask,
    updateTaskStatus,
    hrPersonnel,
    addNotification,
    taskComments,
    addTaskComment,
    user,
  } = useApp();
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    assignee: "",
    dueDate: "",
    status: "todo" as TaskStatus,
  });

  const project = projects.find((p) => p.id === projectId);
  if (!project)
    return <div className="text-muted-foreground">Proje bulunamadı.</div>;

  const projectTasks = tasks.filter((t2) => t2.projectId === projectId);
  const byStatus = (s: TaskStatus) =>
    projectTasks.filter((t2) => t2.status === s);

  const selectedTaskComments = selectedTask
    ? taskComments.filter((c) => c.taskId === selectedTask.id)
    : [];

  const handleAddTask = () => {
    if (!form.title.trim()) return;
    addTask({ ...form, projectId });
    if (form.assignee) {
      addNotification({
        type: "task_assigned",
        title: "Görev Atandı",
        message: `"${form.title}" görevi ${form.assignee} kişisine atandı.`,
      });
    }
    setNewTaskOpen(false);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      assignee: "",
      dueDate: "",
      status: "todo",
    });
  };

  const openAddTask = (col: TaskStatus) => {
    setForm((f) => ({ ...f, status: col }));
    setNewTaskOpen(true);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedTask) return;
    addTaskComment(
      selectedTask.id,
      commentText.trim(),
      user?.name || "Kullanıcı",
    );
    setCommentText("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-ocid="project_detail.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {project.title}
          </h1>
          <p className="text-muted-foreground text-sm">{project.description}</p>
        </div>
        <StatusPill status={project.status} />
      </div>

      <Tabs defaultValue="kanban">
        <TabsList className="bg-card border border-border">
          <TabsTrigger data-ocid="project_detail.tab.1" value="overview">
            {t.overview}
          </TabsTrigger>
          <TabsTrigger data-ocid="project_detail.tab.2" value="tasks">
            {t.tasks}
          </TabsTrigger>
          <TabsTrigger data-ocid="project_detail.tab.3" value="kanban">
            {t.kanban}
          </TabsTrigger>
          <TabsTrigger data-ocid="project_detail.tab.4" value="milestones">
            Kilometre Taşları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard label="Durum" value={project.status} />
            <InfoCard label="Başlangıç" value={project.startDate || "-"} />
            <InfoCard label="Bitiş" value={project.endDate || "-"} />
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Genel İlerleme
              </span>
              <span className="text-sm font-bold text-primary">
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          {project.budget && (
            <InfoCard
              label="Bütçe"
              value={`₺${project.budget.toLocaleString()}`}
            />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">
              {projectTasks.length} görev
            </span>
            <Button
              data-ocid="task.add_button"
              size="sm"
              onClick={() => openAddTask("todo")}
              className="gradient-bg text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              {t.newTask}
            </Button>
          </div>
          {projectTasks.length === 0 ? (
            <div
              data-ocid="tasks.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              {t.noTasks}
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Görev
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Öncelik
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Atanan
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Tarih
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Durum
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Yorumlar
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTasks.map((task, i) => {
                    const commentCount = taskComments.filter(
                      (c) => c.taskId === task.id && !c.isStatusLog,
                    ).length;
                    return (
                      <TableRow
                        key={task.id}
                        data-ocid={`task.item.${i + 1}`}
                        className="border-border cursor-pointer hover:bg-white/5"
                        onClick={() => setSelectedTask(task)}
                      >
                        <TableCell className="font-medium text-foreground">
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={task.priority} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs gradient-bg text-white">
                                {task.assignee?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {task.assignee || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {task.dueDate || "-"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={task.status}
                            onValueChange={(v) =>
                              updateTaskStatus(task.id, v as TaskStatus)
                            }
                          >
                            <SelectTrigger className="w-32 h-7 text-xs border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              <SelectItem value="todo">Yapılacak</SelectItem>
                              <SelectItem value="in_progress">
                                Devam Ediyor
                              </SelectItem>
                              <SelectItem value="done">Tamamlandı</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            data-ocid={`task.secondary_button.${i + 1}`}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {commentCount > 0 && <span>{commentCount}</span>}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["todo", "in_progress", "done"] as TaskStatus[]).map(
              (col, ci) => {
                const ocids = [
                  "kanban.todo_column",
                  "kanban.inprogress_column",
                  "kanban.done_column",
                ];
                const colLabels: Record<TaskStatus, string> = {
                  todo: t.todo,
                  in_progress: t.inProgress,
                  done: t.done,
                };
                const colColors: Record<TaskStatus, string> = {
                  todo: "oklch(0.68 0.18 200)",
                  in_progress: "oklch(0.72 0.18 50)",
                  done: "oklch(0.72 0.16 160)",
                };
                const colTasks = byStatus(col);
                return (
                  <div
                    key={col}
                    data-ocid={ocids[ci]}
                    className="rounded-xl p-4"
                    style={{
                      background: "oklch(0.19 0.008 264)",
                      border: "1px solid oklch(0.28 0.01 264)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: colColors[col] }}
                        />
                        <span className="font-semibold text-sm text-foreground">
                          {colLabels[col]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-border text-muted-foreground"
                        >
                          {colTasks.length}
                        </Badge>
                        <button
                          type="button"
                          data-ocid="task.add_button"
                          onClick={() => openAddTask(col)}
                          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {colTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          {t.noTasks}
                        </p>
                      ) : (
                        colTasks.map((task, ti) => (
                          <div
                            key={task.id}
                            data-ocid={`task.item.${ti + 1}`}
                            className="rounded-lg p-3 cursor-pointer hover:border-primary/40 transition-colors"
                            style={{
                              background: "oklch(0.22 0.01 264)",
                              border: "1px solid oklch(0.3 0.012 264)",
                            }}
                            onClick={() => setSelectedTask(task)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && setSelectedTask(task)
                            }
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-medium text-foreground leading-tight">
                                {task.title}
                              </p>
                              <PriorityBadge priority={task.priority} />
                            </div>
                            {task.assignee && (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-[10px] gradient-bg text-white">
                                    {task.assignee[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {task.assignee}
                                </span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1 mt-2">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {task.dueDate}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </TabsContent>

        {/* ─── MILESTONES TAB ─── */}
        <TabsContent value="milestones" className="mt-4">
          <MilestonesTab projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* Task Comments Sheet */}
      <Sheet
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <SheetContent
          data-ocid="task_comments.sheet"
          className="bg-card border-border w-full sm:max-w-md flex flex-col"
        >
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-left">{selectedTask?.title}</SheetTitle>
            {selectedTask && (
              <div className="flex items-center gap-2 mt-1">
                <PriorityBadge priority={selectedTask.priority} />
                <StatusBadge status={selectedTask.status} />
              </div>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 mt-4 pr-1">
            {selectedTaskComments.length === 0 ? (
              <div
                data-ocid="task_comments.empty_state"
                className="text-center py-10 text-muted-foreground text-sm"
              >
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Henüz yorum yok. İlk yorumu siz yazın.
              </div>
            ) : (
              <div className="space-y-3">
                {[...selectedTaskComments].reverse().map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg p-3 ${
                      comment.isStatusLog
                        ? "border border-border/50"
                        : "border border-border"
                    }`}
                    style={{
                      background: comment.isStatusLog
                        ? "oklch(0.19 0.005 264)"
                        : "oklch(0.22 0.01 264)",
                    }}
                  >
                    {comment.isStatusLog ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground italic">
                          {comment.text}
                        </p>
                        <span className="ml-auto text-[10px] text-muted-foreground/60">
                          {new Date(comment.timestamp).toLocaleDateString(
                            "tr-TR",
                          )}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px] gradient-bg text-white">
                              {comment.author[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-foreground">
                            {comment.author}
                          </span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {new Date(comment.timestamp).toLocaleString(
                              "tr-TR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {comment.text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment input */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                data-ocid="task_comments.textarea"
                placeholder="Yorum yazın..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-background border-border resize-none text-sm"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button
                data-ocid="task_comments.submit_button"
                size="icon"
                className="gradient-bg text-white self-end"
                onClick={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent data-ocid="new_task.dialog" className="bg-card">
          <DialogHeader>
            <DialogTitle>{t.newTask}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık</Label>
              <Input
                data-ocid="new_task.title_input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Görev başlığı..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="new_task.desc_textarea"
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
                <Label>Öncelik</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v as TaskPriority })
                  }
                >
                  <SelectTrigger
                    data-ocid="new_task.priority_select"
                    className="mt-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Atanan Kişi</Label>
                <Select
                  value={form.assignee}
                  onValueChange={(v) => setForm({ ...form, assignee: v })}
                >
                  <SelectTrigger
                    data-ocid="new_task.assignee_input"
                    className="mt-1"
                  >
                    <SelectValue placeholder="Kişi seçin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {hrPersonnel.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name} ({p.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Bitiş Tarihi</Label>
              <Input
                data-ocid="new_task.due_input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button
              data-ocid="new_task.submit_button"
              onClick={handleAddTask}
              className="w-full gradient-bg text-white"
            >
              {t.create}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
      style={{ background: `${c.color}22`, color: c.color }}
    >
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { label: string; color: string }> = {
    todo: { label: "Yapılacak", color: "oklch(0.68 0.18 200)" },
    in_progress: { label: "Devam Ediyor", color: "oklch(0.72 0.18 50)" },
    done: { label: "Tamamlandı", color: "oklch(0.72 0.16 160)" },
  };
  const c = config[status];
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ background: `${c.color}22`, color: c.color }}
    >
      {c.label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    planning: { label: "Planlama", color: "oklch(0.68 0.18 200)" },
    active: { label: "Aktif", color: "oklch(0.72 0.16 160)" },
    on_hold: { label: "Beklemede", color: "oklch(0.72 0.18 50)" },
    completed: { label: "Tamamlandı", color: "oklch(0.62 0.22 280)" },
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
