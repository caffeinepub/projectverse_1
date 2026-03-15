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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

import type {
  Expense,
  ExpenseStatus,
  Invoice,
  InvoiceStatus,
} from "../contexts/AppContext";

const CATEGORIES = [
  "Malzeme",
  "İşçilik",
  "Ekipman",
  "Ulaşım",
  "Danışmanlık",
  "Diğer",
];

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

const EXPENSE_STATUS_STYLES: Record<ExpenseStatus, string> = {
  Onaylandı: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Bekliyor: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Reddedildi: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Ödendi: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Bekliyor: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Gecikmiş: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

export default function Finance() {
  const {
    activeRoleId,
    checkPermission,
    expenses,
    setExpenses,
    invoices,
    setInvoices,
    projects,
    user,
    addNotification,
  } = useApp();

  const canEdit =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "pm" ||
    checkPermission("finance", "edit");

  const canView =
    canEdit ||
    activeRoleId === "supervisor" ||
    activeRoleId === "staff" ||
    checkPermission("finance", "view");

  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "Malzeme",
    projectId: "",
    description: "",
  });

  // Dynamic budget computation from real project + expense data
  const projectBudgets = useMemo(() => {
    return projects
      .filter((p) => p.budget && p.budget > 0)
      .map((p) => ({
        id: p.id,
        project: p.title,
        planned: p.budget!,
        spent: expenses
          .filter((e) => e.projectId === p.id && e.status === "Onaylandı")
          .reduce((s, e) => s + e.amount, 0),
      }));
  }, [projects, expenses]);

  const today = new Date().toISOString().split("T")[0];
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    supplier: "",
    amount: "",
    dueDate: "",
    project: "",
  });

  const handleAddInvoice = () => {
    if (!newInvoice.supplier || !newInvoice.amount) return;
    const inv: Invoice = {
      id: `inv${Date.now()}`,
      supplier: newInvoice.supplier,
      amount: Number(newInvoice.amount),
      dueDate: newInvoice.dueDate,
      status:
        newInvoice.dueDate && newInvoice.dueDate < today
          ? "Gecikmiş"
          : "Bekliyor",
      project: newInvoice.project,
    };
    setInvoices([inv, ...invoices]);
    setNewInvoice({ supplier: "", amount: "", dueDate: "", project: "" });
    setNewInvoiceOpen(false);
  };

  if (!canView) return <AccessDenied />;

  const totalBudget = projectBudgets.reduce((s, b) => s + b.planned, 0);
  const totalSpent = projectBudgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const pendingExpenses = expenses.filter((e) => e.status === "Bekliyor");
  const pendingTotal = pendingExpenses.reduce((s, e) => s + e.amount, 0);

  // Check if selected project is near/over budget
  const getProjectBudgetWarning = (projectId: string): string | null => {
    const pb = projectBudgets.find((b) => b.id === projectId);
    if (!pb) return null;
    const pct = pb.planned > 0 ? (pb.spent / pb.planned) * 100 : 0;
    if (pct >= 100) return `Bu proje bütçesi aşılmış (%${Math.round(pct)})!`;
    if (pct >= 85)
      return `Bu proje bütçesinin %${Math.round(pct)}'i kullanılmış, dikkatli olun.`;
    return null;
  };

  const handleApproveExpense = (id: string) => {
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, status: "Onaylandı" } : e)),
    );
  };

  const handleRejectExpense = (id: string) => {
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, status: "Reddedildi" } : e)),
    );
  };

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) return;
    const expense: Expense = {
      id: `e${Date.now()}`,
      category: newExpense.category,
      projectId: newExpense.projectId,
      amount: Number(newExpense.amount),
      date: new Date().toISOString().split("T")[0],
      status: "Bekliyor",
      description: newExpense.description,
      createdBy: user?.name || "",
    };
    setExpenses([expense, ...expenses]);
    // Notify if budget overrun
    const warn = getProjectBudgetWarning(expense.projectId);
    if (warn?.includes("aşılmış")) {
      addNotification({
        type: "order_status",
        title: "Bütçe Aşıldı",
        message: warn,
      });
    }
    setNewExpense({
      amount: "",
      category: "Malzeme",
      projectId: "",
      description: "",
    });
    setNewExpenseOpen(false);
  };

  const handleMarkInvoicePaid = (invoiceId: string) => {
    setInvoices(
      invoices.map((i) =>
        i.id === invoiceId ? { ...i, status: "Ödendi" as InvoiceStatus } : i,
      ),
    );
  };

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.title || id;

  const budgetWarning = getProjectBudgetWarning(newExpense.projectId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Finans</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bütçe takibi, giderler ve faturalar
          </p>
        </div>
      </div>

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="finance.budget.tab"
            value="budget"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Bütçe
          </TabsTrigger>
          <TabsTrigger
            data-ocid="finance.expenses.tab"
            value="expenses"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Giderler
          </TabsTrigger>
          <TabsTrigger
            data-ocid="finance.invoices.tab"
            value="invoices"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Faturalar
          </TabsTrigger>
        </TabsList>

        {/* BUDGET TAB */}
        <TabsContent value="budget" className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Toplam Bütçe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-xl font-bold gradient-text">
                    {fmt(totalBudget)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Harcanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-rose-400" />
                  <span className="text-xl font-bold text-rose-400">
                    {fmt(totalSpent)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Kalan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <span className="text-xl font-bold text-emerald-400">
                    {fmt(totalRemaining)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Onay Bekleyen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span className="text-xl font-bold text-amber-400">
                    {fmt(pendingTotal)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingExpenses.length} gider
                </p>
              </CardContent>
            </Card>
          </div>

          {projectBudgets.filter(
            (b) => Math.round((b.spent / b.planned) * 100) >= 100,
          ).length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-400">
                  Bütçe Aşımı Uyarısı
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {projectBudgets
                    .filter(
                      (b) => Math.round((b.spent / b.planned) * 100) >= 100,
                    )
                    .map((b) => b.project)
                    .join(", ")}{" "}
                  projelerinde bütçe aşıldı.
                </p>
              </div>
            </div>
          )}

          {projectBudgets.length === 0 ? (
            <div
              data-ocid="finance.budget.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              Bütçeli proje bulunamadı. Projelerinize bütçe tanımlayın.
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Proje Bütçe Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Proje
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Planlanan Bütçe
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Harcanan
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Kalan
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Durum
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectBudgets.map((b, i) => {
                      const pct =
                        b.planned > 0
                          ? Math.round((b.spent / b.planned) * 100)
                          : 0;
                      const remaining = b.planned - b.spent;
                      const isExceeded = pct >= 100;
                      const isNear = pct >= 85 && pct < 100;
                      return (
                        <TableRow
                          key={b.id}
                          data-ocid={`finance.budget.row.${i + 1}`}
                          className="border-border hover:bg-white/5"
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div className="flex items-center gap-2">
                                {b.project}
                                {isExceeded && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium">
                                    Bütçe Aşıldı
                                  </span>
                                )}
                                {isNear && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                                    Bütçe Sınırına Yakın
                                  </span>
                                )}
                              </div>
                              {(() => {
                                const utilization =
                                  b.planned > 0
                                    ? Math.min((b.spent / b.planned) * 100, 100)
                                    : 0;
                                const barColor =
                                  utilization < 60
                                    ? "bg-green-500"
                                    : utilization < 85
                                      ? "bg-yellow-500"
                                      : "bg-red-500";
                                return (
                                  <div className="mt-1.5">
                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                      <span>Bütçe Kullanımı</span>
                                      <span>{utilization.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${barColor}`}
                                        style={{ width: `${utilization}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {fmt(b.planned)}
                          </TableCell>
                          <TableCell className="text-right text-rose-400">
                            {fmt(b.spent)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              remaining < 0
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {fmt(remaining)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress
                                value={Math.min(pct, 100)}
                                className="h-1.5 flex-1"
                                style={{
                                  // @ts-ignore
                                  "--progress-fill": isExceeded
                                    ? "oklch(0.58 0.22 25)"
                                    : isNear
                                      ? "oklch(0.72 0.18 50)"
                                      : "oklch(0.62 0.22 280)",
                                }}
                              />
                              <span
                                className={`text-xs font-semibold ${
                                  isExceeded
                                    ? "text-rose-400"
                                    : isNear
                                      ? "text-amber-400"
                                      : "text-muted-foreground"
                                }`}
                              >
                                %{pct}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {expenses.length} gider kaydı
            </p>
            <Dialog open={newExpenseOpen} onOpenChange={setNewExpenseOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="finance.expense.primary_button"
                  className="gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Gider
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="finance.expense.dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>Gider Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Tutar (₺)</Label>
                    <Input
                      data-ocid="finance.expense.input"
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      className="bg-background border-border mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(v) =>
                        setNewExpense({ ...newExpense, category: v })
                      }
                    >
                      <SelectTrigger
                        data-ocid="finance.expense.select"
                        className="bg-background border-border mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Proje</Label>
                    <Select
                      value={newExpense.projectId}
                      onValueChange={(v) =>
                        setNewExpense({ ...newExpense, projectId: v })
                      }
                    >
                      <SelectTrigger className="bg-background border-border mt-1">
                        <SelectValue placeholder="Proje seçin..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Budget warning */}
                    {budgetWarning && (
                      <div className="flex items-start gap-2 mt-2 p-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-400">
                          {budgetWarning}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      data-ocid="finance.expense.textarea"
                      value={newExpense.description}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          description: e.target.value,
                        })
                      }
                      className="bg-background border-border mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="finance.expense.cancel_button"
                    onClick={() => setNewExpenseOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="finance.expense.submit_button"
                    className="gradient-bg text-white"
                    onClick={handleAddExpense}
                  >
                    Gider Oluştur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Açıklama
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Kategori
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Proje
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      Tutar
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Tarih
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Durum
                    </TableHead>
                    {canEdit && (
                      <TableHead className="text-muted-foreground">
                        İşlem
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e, i) => (
                    <TableRow
                      key={e.id}
                      data-ocid={`finance.expense.row.${i + 1}`}
                      className="border-border hover:bg-white/5"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{e.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.createdBy}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {e.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {getProjectName(e.projectId)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {fmt(e.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {e.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${EXPENSE_STATUS_STYLES[e.status]}`}
                        >
                          {e.status === "Bekliyor" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {e.status === "Onaylandı" && (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {e.status === "Reddedildi" && (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {e.status}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          {e.status === "Bekliyor" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                data-ocid={`finance.expense.confirm_button.${i + 1}`}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 text-xs"
                                onClick={() => handleApproveExpense(e.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                data-ocid={`finance.expense.delete_button.${i + 1}`}
                                className="h-7 px-2 text-xs"
                                onClick={() => handleRejectExpense(e.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {invoices.length} fatura
            </p>
            {canEdit && (
              <Dialog open={newInvoiceOpen} onOpenChange={setNewInvoiceOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="finance.invoice.open_modal_button"
                    size="sm"
                    className="gradient-bg text-white gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Yeni Fatura
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Yeni Fatura Ekle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Tedarikçi</Label>
                      <Input
                        data-ocid="finance.invoice.supplier.input"
                        value={newInvoice.supplier}
                        onChange={(e) =>
                          setNewInvoice({
                            ...newInvoice,
                            supplier: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                        placeholder="Tedarikçi adı"
                      />
                    </div>
                    <div>
                      <Label>Tutar (₺)</Label>
                      <Input
                        data-ocid="finance.invoice.amount.input"
                        type="number"
                        value={newInvoice.amount}
                        onChange={(e) =>
                          setNewInvoice({
                            ...newInvoice,
                            amount: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Vade Tarihi</Label>
                      <Input
                        data-ocid="finance.invoice.due_date.input"
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) =>
                          setNewInvoice({
                            ...newInvoice,
                            dueDate: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label>Proje</Label>
                      <Select
                        value={newInvoice.project}
                        onValueChange={(v) =>
                          setNewInvoice({ ...newInvoice, project: v })
                        }
                      >
                        <SelectTrigger
                          data-ocid="finance.invoice.project.select"
                          className="bg-background border-border mt-1"
                        >
                          <SelectValue placeholder="Proje seçin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.title}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="finance.invoice.cancel_button"
                      variant="outline"
                      onClick={() => setNewInvoiceOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="finance.invoice.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddInvoice}
                    >
                      Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Tedarikçi
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Proje
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      Tutar
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Vade Tarihi
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Durum
                    </TableHead>
                    {canEdit && (
                      <TableHead className="text-muted-foreground">
                        İşlem
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv, i) => (
                    <TableRow
                      key={inv.id}
                      data-ocid={`finance.invoice.row.${i + 1}`}
                      className="border-border hover:bg-white/5"
                    >
                      <TableCell className="font-medium">
                        {inv.supplier}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.project}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {fmt(inv.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {inv.status === "Gecikmiş" && (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                          )}
                          <span
                            className={`text-xs ${
                              inv.status === "Gecikmiş"
                                ? "text-rose-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {inv.dueDate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${INVOICE_STATUS_STYLES[inv.status]}`}
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          {(inv.status === "Bekliyor" ||
                            inv.status === "Gecikmiş") && (
                            <Button
                              size="sm"
                              data-ocid={`finance.invoice.confirm_button.${i + 1}`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3 text-xs gap-1"
                              onClick={() => handleMarkInvoicePaid(inv.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Ödendi
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
