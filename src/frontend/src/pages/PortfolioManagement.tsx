import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
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

export default function PortfolioManagement() {
  const { projects, activeCompanyId } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const companyProjects = useMemo(
    () => projects.filter((p) => p.companyId === activeCompanyId),
    [projects, activeCompanyId],
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? companyProjects
        : companyProjects.filter((p) => (p.status as string) === statusFilter),
    [companyProjects, statusFilter],
  );

  const totalBudget = companyProjects.reduce(
    (s, p) => s + (Number(p.budget) || 0),
    0,
  );
  const totalSpent = companyProjects.reduce(
    (s, p) => s + Number(p.budget) * ((p.progress ?? 0) / 100),
    0,
  );
  const active = companyProjects.filter((p) => p.status === "active").length;
  const completed = companyProjects.filter(
    (p) => p.status === "completed",
  ).length;
  const delayed = companyProjects.filter((p) => p.status === "on_hold").length;

  const chartData = companyProjects.slice(0, 10).map((p) => ({
    name: p.title.length > 12 ? `${p.title.slice(0, 12)}…` : p.title,
    Bütçe: Number(p.budget) || 0,
    Harcanan: Math.round(Number(p.budget ?? 0) * ((p.progress ?? 0) / 100)),
  }));

  const getHealth = (p: {
    budget?: number | string;
    spent?: number | string;
    status?: string;
  }) => {
    const budget = Number(p.budget) || 0;
    const spent = Number(p.spent) || 0;
    if (p.status === "on_hold") return "red";
    if (budget > 0 && spent / budget > 0.9) return "yellow";
    return "green";
  };

  const statusLabel = (s?: string) => {
    if (!s) return "Aktif";
    const m: Record<string, string> = {
      active: "Aktif",
      completed: "Tamamlandı",
      planning: "Planlama",
      on_hold: "Beklemede",
    };
    return m[s] ?? s;
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Portföy Yönetimi
          </h1>
          <p className="text-muted-foreground text-sm">
            Tüm projelerin portföy görünümü
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Toplam Proje</p>
            <p className="text-3xl font-bold text-amber-400">
              {companyProjects.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">
              Aktif / Tamamlanan / Gecikmiş
            </p>
            <p className="text-xl font-bold text-foreground">
              <span className="text-green-400">{active}</span> /{" "}
              <span className="text-blue-400">{completed}</span> /{" "}
              <span className="text-red-400">{delayed}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Toplam Bütçe</p>
            <p className="text-xl font-bold text-amber-400">
              {fmt(totalBudget)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Toplam Harcanan</p>
            <p className="text-xl font-bold text-red-400">
              {fmt(Math.round(totalSpent))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projeler</TabsTrigger>
          <TabsTrigger value="chart">Bütçe Grafiği</TabsTrigger>
          <TabsTrigger value="conflicts">Kaynak Çakışmaları</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Proje Listesi</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-ocid="portfolio.select">
                  <SelectValue placeholder="Durum Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="planning">Planlama</SelectItem>
                  <SelectItem value="on_hold">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="portfolio.empty_state"
                >
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Henüz proje yok</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proje</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead className="text-right">Bütçe</TableHead>
                      <TableHead className="text-right">Harcanan</TableHead>
                      <TableHead>Sağlık</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p, i) => {
                      const health = getHealth(p);
                      return (
                        <TableRow
                          key={p.id}
                          data-ocid={`portfolio.item.${i + 1}`}
                        >
                          <TableCell className="font-medium">
                            {p.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {statusLabel(p.status as string)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.startDate ?? "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.endDate ?? "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(Number(p.budget) || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(
                              Math.round(
                                Number(p.budget ?? 0) *
                                  ((p.progress ?? 0) / 100),
                              ),
                            )}
                          </TableCell>
                          <TableCell>
                            {health === "green" && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            {health === "yellow" && (
                              <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            )}
                            {health === "red" && (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">
                Proje Bütçe vs Harcanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Grafik için proje eklenmesi gerekiyor
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#1c1c2e",
                        border: "1px solid rgba(245,158,11,0.3)",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="Bütçe" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="Harcanan"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="mt-4">
          <ResourceConflicts
            projects={companyProjects}
            activeCompanyId={activeCompanyId ?? ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResourceConflicts({
  projects,
  activeCompanyId,
}: {
  projects: { id: string; title: string; status?: string }[];
  activeCompanyId: string;
}) {
  const tasksByProject = useMemo(() => {
    const result: { projectName: string; assignee: string }[] = [];
    const activeProjs = projects.filter((p) => p.status === "active");
    for (const p of activeProjs) {
      const tasks: { assignedTo?: string; assigned?: string }[] = JSON.parse(
        localStorage.getItem(`pv_tasks_${activeCompanyId}_${p.id}`) || "[]",
      );
      for (const t of tasks) {
        const name = t.assignedTo ?? t.assigned ?? "";
        if (name) result.push({ projectName: p.title, assignee: name });
      }
    }
    return result;
  }, [projects, activeCompanyId]);

  const conflicts = useMemo(() => {
    const byPerson: Record<string, string[]> = {};
    for (const { assignee, projectName } of tasksByProject) {
      if (!byPerson[assignee]) byPerson[assignee] = [];
      if (!byPerson[assignee].includes(projectName))
        byPerson[assignee].push(projectName);
    }
    return Object.entries(byPerson).filter(([, ps]) => ps.length > 1);
  }, [tasksByProject]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          Kaynak Çakışmaları
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conflicts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p>Kaynak çakışması tespit edilmedi</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personel</TableHead>
                <TableHead>Aktif Projeler</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts.map(([person, ps], i) => (
                <TableRow
                  key={person}
                  data-ocid={`portfolio.conflict.item.${i + 1}`}
                >
                  <TableCell className="font-medium">{person}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ps.join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Çakışma
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

void TrendingUp;
