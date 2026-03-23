import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Check, ChevronLeft, ChevronRight, Clock, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAY_KEYS)[number];

interface TimesheetEntry {
  projectId: string;
  projectName: string;
  hours: Record<DayKey, number>;
}

interface WeekTimesheet {
  id: string;
  userId: string;
  userName: string;
  weekStart: string; // ISO date of Monday
  entries: TimesheetEntry[];
  status: "draft" | "submitted" | "approved" | "rejected";
  comment?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`;
}

function loadTimesheets(companyId: string): WeekTimesheet[] {
  const raw = localStorage.getItem(`pv_timesheets_${companyId}`);
  return raw ? JSON.parse(raw) : [];
}

function saveTimesheets(companyId: string, data: WeekTimesheet[]) {
  localStorage.setItem(`pv_timesheets_${companyId}`, JSON.stringify(data));
}

const STATUS_LABELS: Record<WeekTimesheet["status"], string> = {
  draft: "Taslak",
  submitted: "Onay Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const STATUS_COLORS: Record<WeekTimesheet["status"], string> = {
  draft: "bg-muted/30 text-muted-foreground border-muted",
  submitted: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function Timesheet() {
  const { activeCompanyId, activeRoleId, checkPermission, projects, user } =
    useApp();
  const canView =
    checkPermission("hr", "view") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "personnel";

  const isManager = activeRoleId === "owner" || activeRoleId === "manager";

  const [timesheets, setTimesheets] = useState<WeekTimesheet[]>(() =>
    loadTimesheets(activeCompanyId || ""),
  );
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const currentWeekStart = useMemo(() => {
    const base = getWeekStart(new Date());
    base.setDate(base.getDate() + currentWeekOffset * 7);
    return base;
  }, [currentWeekOffset]);

  const weekKey = currentWeekStart.toISOString().slice(0, 10);

  const existingSheet = timesheets.find(
    (ts) => ts.weekStart === weekKey && ts.userId === (user?.id || "me"),
  );

  const [entries, setEntries] = useState<TimesheetEntry[]>(() => {
    if (existingSheet) return existingSheet.entries;
    return (projects || []).slice(0, 5).map((p) => ({
      projectId: p.id,
      projectName: p.title,
      hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    }));
  });

  const persist = (updated: WeekTimesheet[]) => {
    setTimesheets(updated);
    saveTimesheets(activeCompanyId || "", updated);
  };

  const handleHourChange = (projectId: string, day: DayKey, value: string) => {
    const num = Math.max(0, Math.min(24, Number.parseFloat(value) || 0));
    setEntries((prev) =>
      prev.map((e) =>
        e.projectId === projectId
          ? { ...e, hours: { ...e.hours, [day]: num } }
          : e,
      ),
    );
  };

  const totalPerDay = useMemo(() => {
    const totals: Record<DayKey, number> = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
    };
    for (const entry of entries) {
      for (const day of DAY_KEYS) {
        totals[day] += entry.hours[day];
      }
    }
    return totals;
  }, [entries]);

  const totalAllDays = DAY_KEYS.reduce((sum, d) => sum + totalPerDay[d], 0);

  const handleSubmit = () => {
    const sheet: WeekTimesheet = {
      id: existingSheet?.id || `ts_${Date.now()}`,
      userId: user?.id || "me",
      userName: user?.name || "Kullanıcı",
      weekStart: weekKey,
      entries,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };
    const updated = timesheets.filter(
      (ts) => !(ts.weekStart === weekKey && ts.userId === (user?.id || "me")),
    );
    persist([...updated, sheet]);
    toast.success("Hafta gönderildi, onay bekleniyor.");
  };

  const handleApprove = (tsId: string) => {
    persist(
      timesheets.map((ts) =>
        ts.id === tsId
          ? {
              ...ts,
              status: "approved",
              reviewedAt: new Date().toISOString(),
              reviewedBy: user?.name || "Yönetici",
            }
          : ts,
      ),
    );
    toast.success("Zaman çizelgesi onaylandı.");
  };

  const handleReject = (tsId: string) => {
    persist(
      timesheets.map((ts) =>
        ts.id === tsId
          ? {
              ...ts,
              status: "rejected",
              reviewedAt: new Date().toISOString(),
              reviewedBy: user?.name || "Yönetici",
            }
          : ts,
      ),
    );
    toast.error("Zaman çizelgesi reddedildi.");
  };

  // Monthly summary
  const now = new Date();
  const monthSheets = timesheets.filter((ts) => {
    const d = new Date(ts.weekStart);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  type ProjectHours = Record<string, { name: string; total: number }>;
  const monthlySummary: ProjectHours = {};
  for (const ts of monthSheets) {
    for (const entry of ts.entries) {
      if (!monthlySummary[entry.projectId]) {
        monthlySummary[entry.projectId] = { name: entry.projectName, total: 0 };
      }
      monthlySummary[entry.projectId].total += DAY_KEYS.reduce(
        (s, d) => s + (entry.hours[d] || 0),
        0,
      );
    }
  }

  const pendingSheets = timesheets.filter((ts) => ts.status === "submitted");

  if (!canView) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Zaman Çizelgesi</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Proje bazlı çalışma saatlerini kaydedin ve onaya gönderin
        </p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="timesheet.weekly.tab"
            value="weekly"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Clock className="h-4 w-4 mr-2" />
            Haftalık Giriş
          </TabsTrigger>
          <TabsTrigger
            data-ocid="timesheet.monthly.tab"
            value="monthly"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Aylık Özet
          </TabsTrigger>
          {isManager && (
            <TabsTrigger
              data-ocid="timesheet.pending.tab"
              value="pending"
              className="data-[state=active]:gradient-bg data-[state=active]:text-white"
            >
              Onay Bekleyenler
              {pendingSheets.length > 0 && (
                <Badge className="ml-2 h-4 min-w-4 px-1 text-xs gradient-bg text-white border-0">
                  {pendingSheets.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* WEEKLY TAB */}
        <TabsContent value="weekly" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                data-ocid="timesheet.pagination_prev"
                className="border-border h-8 w-8"
                onClick={() => setCurrentWeekOffset((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">
                {formatWeekLabel(currentWeekStart)}
              </span>
              <Button
                variant="outline"
                size="icon"
                data-ocid="timesheet.pagination_next"
                className="border-border h-8 w-8"
                onClick={() => setCurrentWeekOffset((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {existingSheet && (
                <Badge
                  className={`${STATUS_COLORS[existingSheet.status]} border`}
                >
                  {STATUS_LABELS[existingSheet.status]}
                </Badge>
              )}
              <Button
                data-ocid="timesheet.submit_button"
                className="gradient-bg text-white"
                onClick={handleSubmit}
                disabled={
                  existingSheet?.status === "submitted" ||
                  existingSheet?.status === "approved"
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Hafta Gönder
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-x-auto">
            <Table data-ocid="timesheet.table">
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground min-w-40">
                    Proje
                  </TableHead>
                  {DAYS.map((day) => (
                    <TableHead
                      key={day}
                      className="text-center text-muted-foreground w-16"
                    >
                      {day}
                    </TableHead>
                  ))}
                  <TableHead className="text-center text-muted-foreground">
                    Toplam
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Erişilebilir proje bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry, idx) => {
                    const rowTotal = DAY_KEYS.reduce(
                      (s, d) => s + entry.hours[d],
                      0,
                    );
                    const isDisabled =
                      existingSheet?.status === "submitted" ||
                      existingSheet?.status === "approved";
                    return (
                      <TableRow
                        key={entry.projectId}
                        data-ocid={`timesheet.row.${idx + 1}`}
                        className="border-border hover:bg-white/5"
                      >
                        <TableCell className="font-medium text-sm">
                          {entry.projectName}
                        </TableCell>
                        {DAY_KEYS.map((day) => (
                          <TableCell key={day} className="p-1">
                            <Input
                              type="number"
                              value={entry.hours[day] || ""}
                              onChange={(e) =>
                                handleHourChange(
                                  entry.projectId,
                                  day,
                                  e.target.value,
                                )
                              }
                              className="w-14 h-8 text-center text-sm bg-background border-border p-1"
                              min={0}
                              max={24}
                              step={0.5}
                              disabled={isDisabled}
                              placeholder="0"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-semibold text-primary">
                          {rowTotal > 0 ? rowTotal : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                <TableRow className="border-border bg-background/30 font-semibold">
                  <TableCell className="text-sm">Günlük Toplam</TableCell>
                  {DAY_KEYS.map((day) => (
                    <TableCell
                      key={day}
                      className="text-center text-sm text-amber-400"
                    >
                      {totalPerDay[day] > 0 ? totalPerDay[day] : "-"}
                    </TableCell>
                  ))}
                  <TableCell className="text-center text-primary font-bold">
                    {totalAllDays}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* MONTHLY SUMMARY TAB */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {now.toLocaleDateString("tr-TR", {
                month: "long",
                year: "numeric",
              })}{" "}
              – Aylık Özet
            </h2>
          </div>
          {Object.keys(monthlySummary).length === 0 ? (
            <div
              data-ocid="timesheet.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Bu ay henüz kayıt bulunmuyor.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">
                      Proje
                    </TableHead>
                    <TableHead className="text-center text-muted-foreground">
                      Toplam Saat
                    </TableHead>
                    <TableHead className="text-center text-muted-foreground">
                      Gün Eşdeğeri
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(monthlySummary).map((item) => (
                    <TableRow
                      key={item.name}
                      className="border-border hover:bg-white/5"
                    >
                      <TableCell className="font-medium text-sm">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-center text-primary font-semibold">
                        {item.total}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {(item.total / 8).toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* PENDING APPROVALS TAB */}
        {isManager && (
          <TabsContent value="pending" className="space-y-4">
            {pendingSheets.length === 0 ? (
              <div
                data-ocid="timesheet.pending.empty_state"
                className="text-center py-16 text-muted-foreground"
              >
                <Check className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Onay bekleyen zaman çizelgesi yok.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSheets.map((ts, idx) => {
                  const total = ts.entries.reduce(
                    (s, e) =>
                      s + DAY_KEYS.reduce((es, d) => es + (e.hours[d] || 0), 0),
                    0,
                  );
                  return (
                    <Card
                      key={ts.id}
                      data-ocid={`timesheet.pending.item.${idx + 1}`}
                      className="bg-card border-border"
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{ts.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            Hafta:{" "}
                            {new Date(ts.weekStart).toLocaleDateString("tr-TR")}{" "}
                            &bull; {total} saat
                          </p>
                          {ts.submittedAt && (
                            <p className="text-xs text-muted-foreground">
                              Gönderildi:{" "}
                              {new Date(ts.submittedAt).toLocaleString("tr-TR")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            data-ocid={`timesheet.pending.confirm_button.${idx + 1}`}
                            className="gradient-bg text-white"
                            onClick={() => handleApprove(ts.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`timesheet.pending.cancel_button.${idx + 1}`}
                            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            onClick={() => handleReject(ts.id)}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Reddet
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
