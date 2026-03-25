import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../contexts/AppContext";

export default function BIAnalytics() {
  const { activeCompanyId, projects, tasks } = useApp();

  const invoices = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_invoices_${activeCompanyId}`) || "[]",
      );
    } catch {
      return [];
    }
  }, [activeCompanyId]);

  const supplierEvals = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_supplier_evals_${activeCompanyId}`) || "[]",
      );
    } catch {
      return [];
    }
  }, [activeCompanyId]);

  const hrPersonnel = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_hr_personnel_${activeCompanyId}`) || "[]",
      );
    } catch {
      return [];
    }
  }, [activeCompanyId]);

  // Monthly cost trend from invoices
  const costTrend = useMemo(() => {
    const months: Record<
      string,
      { ay: string; planlanan: number; gerceklesen: number }
    > = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = {
        ay: d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
        planlanan: 0,
        gerceklesen: 0,
      };
    }
    for (const inv of invoices as {
      date?: string;
      dueDate?: string;
      amount?: number;
      totalAmount?: number;
    }[]) {
      const dateStr = inv.date || inv.dueDate || "";
      if (!dateStr) continue;
      const key = dateStr.slice(0, 7);
      if (months[key]) {
        months[key].gerceklesen += Number.parseFloat(
          String(inv.amount || inv.totalAmount || 0),
        );
      }
    }
    for (const p of projects) {
      const key = (p.startDate || "").slice(0, 7);
      if (months[key]) {
        months[key].planlanan += Number.parseFloat(String(p.budget || 0)) / 6;
      }
    }
    return Object.values(months);
  }, [invoices, projects]);

  // Personnel productivity
  const personnelScores = useMemo(() => {
    return hrPersonnel.slice(0, 8).map((p: { id: string; name: string }) => {
      const assigned = tasks.filter((t) => t.assignee === p.name).length;
      const done = tasks.filter(
        (t) => t.assignee === p.name && t.status === "done",
      ).length;
      const score = assigned > 0 ? Math.round((done / assigned) * 100) : 0;
      return { name: p.name, tamamlanan: done, atanan: assigned, skor: score };
    });
  }, [hrPersonnel, tasks]);

  // Project delay risk
  const projectRisks = useMemo(() => {
    return projects.slice(0, 8).map((p) => {
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const overdue = projTasks.filter(
        (t) =>
          t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date(),
      ).length;
      const riskScore =
        projTasks.length > 0
          ? Math.round((overdue / projTasks.length) * 100)
          : 0;
      const daysLate =
        p.endDate && new Date(p.endDate) < new Date()
          ? Math.ceil(
              (Date.now() - new Date(p.endDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
      return { name: p.title, riskScore, daysLate, status: p.status };
    });
  }, [projects, tasks]);

  // Supplier performance trend
  const supplierTrend = useMemo(() => {
    const evalMap: Record<string, number[]> = {};
    for (const e of supplierEvals as {
      supplierId?: string;
      supplierName?: string;
      overallScore?: number;
      score?: number;
    }[]) {
      const key = e.supplierName || e.supplierId || "Diğer";
      if (!evalMap[key]) evalMap[key] = [];
      evalMap[key].push(
        Number.parseFloat(String(e.overallScore || e.score || 0)),
      );
    }
    return Object.entries(evalMap)
      .slice(0, 6)
      .map(([tedarikci, scores]) => ({
        tedarikci: tedarikci.slice(0, 12),
        ortalama:
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0,
      }));
  }, [supplierEvals]);

  // Portfolio KPIs
  const kpis = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const totalBudget = projects.reduce(
      (s, p) => s + Number.parseFloat(String(p.budget || 0)),
      0,
    );
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    return {
      total,
      active,
      completed,
      totalBudget,
      doneTasks,
      totalTasks: tasks.length,
    };
  }, [projects, tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          BI & Trend Analizi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          İş zekası göstergeleri ve eğilim analizleri
        </p>
      </div>

      {/* Portfolio KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Toplam Proje", value: kpis.total },
          { label: "Aktif Proje", value: kpis.active },
          { label: "Tamamlanan", value: kpis.completed },
          {
            label: "Toplam Bütçe",
            value: `${(kpis.totalBudget / 1000000).toFixed(1)}M ₺`,
          },
          { label: "Görev (Bitti)", value: kpis.doneTasks },
          { label: "Toplam Görev", value: kpis.totalTasks },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Maliyet Trendi (Son 6 Ay)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costTrend.some((d) => d.planlanan > 0 || d.gerceklesen > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={costTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="ay"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="planlanan"
                    fill="var(--primary)"
                    name="Planlanan"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="gerceklesen"
                    fill="var(--muted-foreground)"
                    name="Gerçekleşen"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                <Activity className="w-6 h-6 mr-2" /> Veri yok
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Tedarikçi Performans Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supplierTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={supplierTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="tedarikci"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="ortalama"
                    fill="var(--primary)"
                    name="Ort. Puan"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                <Activity className="w-6 h-6 mr-2" /> Tedarikçi değerlendirme
                verisi yok
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personnel Productivity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Personel Verimlilik Skoru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {personnelScores.length > 0 ? (
              <div className="space-y-2">
                {personnelScores.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-32 truncate">
                      {p.name}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${p.skor}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {p.tamamlanan}/{p.atanan}
                    </span>
                    <span className="text-sm font-medium text-foreground w-10 text-right">
                      %{p.skor}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                Personel ve görev verisi yok
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Delay Risk */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Proje Gecikme Risk Skoru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectRisks.length > 0 ? (
              <div className="space-y-2">
                {projectRisks.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-32 truncate">
                      {p.name}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          p.riskScore > 50
                            ? "bg-destructive"
                            : p.riskScore > 25
                              ? "bg-warning"
                              : "bg-primary"
                        }`}
                        style={{ width: `${p.riskScore}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground text-right w-20">
                      {p.daysLate > 0 ? `${p.daysLate}g geç` : "Zamanında"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                Proje verisi yok
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
