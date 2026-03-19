import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange, Plus, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

interface Assignment {
  id: string;
  resourceType: "personnel" | "equipment";
  resourceId: string;
  resourceName: string;
  projectId: string;
  startDate: string;
  endDate: string;
}

const PROJECT_COLORS = [
  "bg-amber-500/80",
  "bg-blue-500/80",
  "bg-green-500/80",
  "bg-purple-500/80",
  "bg-pink-500/80",
  "bg-cyan-500/80",
  "bg-orange-500/80",
];

export default function ResourceCalendar() {
  const { hrPersonnel, equipment, projects, currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "default";
  const storageKey = `pv_resource_assignments_${companyId}`;

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({
    resourceType: "personnel" as "personnel" | "equipment",
    resourceId: "",
    projectId: "",
    startDate: "",
    endDate: "",
  });

  const save = (updated: Assignment[]) => {
    setAssignments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (
      !form.resourceId ||
      !form.projectId ||
      !form.startDate ||
      !form.endDate
    ) {
      toast.error("Tüm alanlar zorunludur");
      return;
    }
    const resourceList =
      form.resourceType === "personnel" ? hrPersonnel : equipment;
    const resource = resourceList.find((r) => r.id === form.resourceId);
    const a: Assignment = {
      id: Date.now().toString(),
      resourceType: form.resourceType,
      resourceId: form.resourceId,
      resourceName: resource?.name ?? form.resourceId,
      projectId: form.projectId,
      startDate: form.startDate,
      endDate: form.endDate,
    };
    save([...assignments, a]);
    toast.success("Atama eklendi");
    setOpenNew(false);
    setForm({
      resourceType: "personnel",
      resourceId: "",
      projectId: "",
      startDate: "",
      endDate: "",
    });
  };

  // Build date columns
  const getDates = () => {
    const dates: Date[] = [];
    const base = new Date();
    if (viewMode === "week") {
      const start = new Date(base);
      start.setDate(start.getDate() - start.getDay() + 1 + weekOffset * 7);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
      }
    } else {
      const year = base.getFullYear();
      const month = base.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dates.push(new Date(year, month, i));
      }
    }
    return dates;
  };

  const dates = getDates();
  const dateStrs = dates.map((d) => d.toISOString().split("T")[0]);

  const getAssignmentsForCell = (resourceId: string, dateStr: string) =>
    assignments.filter(
      (a) =>
        a.resourceId === resourceId &&
        a.startDate <= dateStr &&
        a.endDate >= dateStr,
    );

  const getProjectColor = (projectId: string) =>
    PROJECT_COLORS[
      projects.findIndex((p) => p.id === projectId) % PROJECT_COLORS.length
    ] ?? PROJECT_COLORS[0];

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.title ?? id;

  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const assignedThisMonth = new Set(
    assignments
      .filter(
        (a) =>
          a.startDate.startsWith(thisMonthStr) ||
          a.endDate.startsWith(thisMonthStr),
      )
      .map((a) => a.resourceId),
  ).size;
  const totalResources = hrPersonnel.length + equipment.length;
  const unassigned = totalResources - assignedThisMonth;

  const allResources = [
    ...hrPersonnel.map((p) => ({
      id: p.id,
      name: p.name,
      type: "personnel" as const,
    })),
    ...equipment.map((e) => ({
      id: e.id,
      name: e.name,
      type: "equipment" as const,
    })),
  ];

  const resourceOptions =
    form.resourceType === "personnel" ? hrPersonnel : equipment;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kaynak Takvimi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personel ve ekipman atama takvimi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
            className={viewMode === "week" ? "bg-amber-500 text-black" : ""}
            data-ocid="resourcecalendar.toggle"
          >
            Hafta
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            className={viewMode === "month" ? "bg-amber-500 text-black" : ""}
            data-ocid="resourcecalendar.toggle"
          >
            Ay
          </Button>
          <Button
            data-ocid="resourcecalendar.open_modal_button"
            onClick={() => setOpenNew(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Atama Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <CalendarRange className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bu Ay Atanan</p>
              <p className="text-2xl font-bold text-foreground">
                {assignedThisMonth}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atanmamış</p>
              <p className="text-2xl font-bold text-foreground">
                {unassigned < 0 ? 0 : unassigned}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "week" && (
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((o) => o - 1)}
            data-ocid="resourcecalendar.pagination_prev"
          >
            &lt; Önceki
          </Button>
          <span className="text-muted-foreground px-2">
            {dates[0]?.toLocaleDateString("tr-TR")} –{" "}
            {dates[6]?.toLocaleDateString("tr-TR")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((o) => o + 1)}
            data-ocid="resourcecalendar.pagination_next"
          >
            Sonraki &gt;
          </Button>
        </div>
      )}

      {allResources.length === 0 ? (
        <div
          data-ocid="resourcecalendar.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Kaynak bulunamadı
          </h3>
          <p className="text-muted-foreground text-sm">
            Personel veya ekipman ekledikten sonra burada görünecek
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground font-medium sticky left-0 bg-background min-w-32 border-b border-border">
                  Kaynak
                </th>
                {dates.map((d) => (
                  <th
                    key={d.toISOString()}
                    className="text-center p-1 text-muted-foreground font-medium border-b border-border min-w-16"
                  >
                    <div>
                      {d.toLocaleDateString("tr-TR", { weekday: "short" })}
                    </div>
                    <div className="text-amber-400">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allResources.map((resource) => (
                <tr
                  key={resource.id}
                  className="border-b border-border/50 hover:bg-muted/20"
                >
                  <td className="p-2 sticky left-0 bg-background">
                    <div className="flex items-center gap-1.5">
                      {resource.type === "personnel" ? (
                        <Users className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Wrench className="w-3 h-3 text-blue-400" />
                      )}
                      <span className="text-foreground font-medium truncate max-w-24">
                        {resource.name}
                      </span>
                    </div>
                  </td>
                  {dateStrs.map((dateStr) => {
                    const cellAssignments = getAssignmentsForCell(
                      resource.id,
                      dateStr,
                    );
                    return (
                      <td
                        key={dateStr}
                        className="p-0.5 border-l border-border/30 align-top min-h-8"
                      >
                        {cellAssignments.map((a) => (
                          <div
                            key={a.id}
                            className={`${getProjectColor(a.projectId)} text-white rounded px-1 py-0.5 mb-0.5 truncate text-xs leading-tight`}
                            title={getProjectName(a.projectId)}
                          >
                            {getProjectName(a.projectId)}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="max-w-md bg-card border-border"
          data-ocid="resourcecalendar.dialog"
        >
          <DialogHeader>
            <DialogTitle>Atama Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kaynak Türü</Label>
              <Select
                value={form.resourceType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    resourceType: v as "personnel" | "equipment",
                    resourceId: "",
                  }))
                }
              >
                <SelectTrigger data-ocid="resourcecalendar.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personnel">Personel</SelectItem>
                  <SelectItem value="equipment">Ekipman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kaynak *</Label>
              <Select
                value={form.resourceId}
                onValueChange={(v) => setForm((f) => ({ ...f, resourceId: v }))}
              >
                <SelectTrigger data-ocid="resourcecalendar.select">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {resourceOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proje *</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
              >
                <SelectTrigger data-ocid="resourcecalendar.select">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Başlangıç *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  data-ocid="resourcecalendar.input"
                />
              </div>
              <div>
                <Label>Bitiş *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  data-ocid="resourcecalendar.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenNew(false)}
              data-ocid="resourcecalendar.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="resourcecalendar.submit_button"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
