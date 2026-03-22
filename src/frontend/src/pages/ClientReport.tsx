import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Copy,
  DollarSign,
  FolderKanban,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

const HAKEDIS_STATUS: Record<string, string> = {
  Taslak: "bg-muted text-muted-foreground",
  Onay_Bekliyor: "bg-amber-500/20 text-amber-400",
  Onaylandı: "bg-green-500/20 text-green-400",
  Reddedildi: "bg-red-500/20 text-red-400",
};

export default function ClientReport() {
  const { projects, tasks, expenses, hakedisItems, riskItems, currentCompany } =
    useApp();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const companyProjects = projects.filter(
    (p) => p.companyId === currentCompany?.id,
  );

  const project = companyProjects.find((p) => p.id === selectedProjectId);

  const projectTasks = tasks.filter((t) => t.projectId === selectedProjectId);
  const openTasks = projectTasks.filter((t) => t.status !== "done").length;

  const projectExpenses = expenses.filter(
    (e) => e.projectId === selectedProjectId && e.status === "Onaylandı",
  );
  const totalExpenses = projectExpenses.reduce((s, e) => s + e.amount, 0);

  const projectHakedis = hakedisItems.filter(
    (h) => h.projectId === selectedProjectId,
  );

  const openRisks = (riskItems || []).filter(
    (r) => r.projectId === selectedProjectId && r.status !== "Kapalı",
  ).length;

  const budgetUsagePct =
    project?.budget && project.budget > 0
      ? Math.min(100, Math.round((totalExpenses / project.budget) * 100))
      : 0;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(
        `${window.location.origin}/client-report?project=${selectedProjectId}`,
      )
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabel: Record<string, string> = {
    planning: "Planlama",
    active: "Aktif",
    on_hold: "Beklemede",
    completed: "Tamamlandı",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Müşteri Raporu</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proje bazlı özet rapor — müşteriye paylaşılabilir
          </p>
        </div>
        {selectedProjectId && (
          <Button
            data-ocid="client_report.share.primary_button"
            className="gradient-bg text-white"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Raporu Paylaş
          </Button>
        )}
      </div>

      {/* Project Selector */}
      <div className="max-w-xs">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger
            data-ocid="client_report.project.select"
            className="bg-card border-border"
          >
            <SelectValue placeholder="Proje seçin..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {companyProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedProjectId ? (
        <Card
          data-ocid="client_report.empty_state"
          className="bg-card border-border"
        >
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <BarChart2 className="w-14 h-14 text-muted-foreground/30" />
            <p className="text-muted-foreground text-center">
              Raporu görüntülemek için bir proje seçin
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project Header */}
          {project && (
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {project.title}
                    </h2>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-amber-500/20 text-amber-400">
                        {statusLabel[project.status] || project.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Başlangıç</p>
                    <p className="text-sm font-medium text-foreground">
                      {project.startDate || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Bitiş</p>
                    <p className="text-sm font-medium text-foreground">
                      {project.endDate || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              data-ocid="client_report.progress.card"
              className="bg-card border-border"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-amber-400" />
                  Tamamlanma
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-amber-400">
                  %{project?.progress ?? 0}
                </p>
                <Progress value={project?.progress ?? 0} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card
              data-ocid="client_report.budget.card"
              className="bg-card border-border"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Bütçe Kullanımı
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-foreground">
                  %{budgetUsagePct}
                </p>
                {project?.budget ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(totalExpenses)} /{" "}
                    {formatCurrency(project.budget)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Bütçe tanımlı değil
                  </p>
                )}
              </CardContent>
            </Card>

            <Card
              data-ocid="client_report.open_tasks.card"
              className="bg-card border-border"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Açık Görevler
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-foreground">
                  {openTasks}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  / {projectTasks.length} toplam
                </p>
              </CardContent>
            </Card>

            <Card
              data-ocid="client_report.open_risks.card"
              className="bg-card border-border"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Açık Riskler
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-foreground">
                  {openRisks}
                </p>
                <p className="text-xs text-muted-foreground mt-1">aktif risk</p>
              </CardContent>
            </Card>
          </div>

          {/* Hakediş Table */}
          {projectHakedis.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Hakediş Durumu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Hakediş No
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Dönem
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Tutar
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Durum
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectHakedis.map((h, idx) => {
                      const total = h.items.reduce(
                        (s, i) =>
                          s + i.quantity * i.unitPrice * (i.completion / 100),
                        0,
                      );
                      return (
                        <TableRow
                          key={h.id}
                          data-ocid={`client_report.hakedis.item.${idx + 1}`}
                          className="border-border"
                        >
                          <TableCell className="font-medium text-foreground">
                            {`HAK-${h.id.slice(-5).toUpperCase()}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {h.period}
                          </TableCell>
                          <TableCell className="text-right text-amber-400">
                            {formatCurrency(total)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                HAKEDIS_STATUS[h.status] ||
                                "bg-muted text-muted-foreground"
                              }
                            >
                              {h.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent
          data-ocid="client_report.share.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Raporu Paylaş</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aşağıdaki linki müşterinizle paylaşarak projeye ait özet raporu
              görüntülemelerini sağlayabilirsiniz.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
              <p className="text-xs text-muted-foreground flex-1 truncate">
                {window.location.origin}/client-report?project=
                {selectedProjectId}
              </p>
              <Button
                data-ocid="client_report.share.copy_button"
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-400 flex-shrink-0"
                onClick={handleCopyLink}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                {copied ? "Kopyalandı!" : "Kopyala"}
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              data-ocid="client_report.share.close_button"
              variant="ghost"
              onClick={() => setShareOpen(false)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
