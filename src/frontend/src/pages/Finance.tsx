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
import React from "react";
import { useEffect, useMemo, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";
import AdvancesTab from "./tabs/AdvancesTab";

import type {
  AuditLog,
  Expense,
  ExpenseStatus,
  HakedisItem,
  HakedisLineItem,
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

// ── NAKIT AKIŞ BILEŞENI ────────────────────────────────────────────────────
interface CashFlowEntry {
  id: string;
  month: string; // "YYYY-MM"
  amount: number;
  type: "gelir" | "gider";
  category: string;
  description: string;
}

function CashFlowTab({ companyId }: { companyId: string }) {
  const storageKey = `pv_cashflow_${companyId}`;

  const [entries, setEntries] = React.useState<CashFlowEntry[]>(() => {
    try {
      const s = localStorage.getItem(`pv_cashflow_${companyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, storageKey]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    month: new Date().toISOString().slice(0, 7),
    amount: "",
    type: "gelir" as "gelir" | "gider",
    category: "Diğer",
    description: "",
  });

  const handleAdd = () => {
    if (!form.month || !form.amount) return;
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        month: form.month,
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        description: form.description,
      },
    ]);
    setForm({
      month: new Date().toISOString().slice(0, 7),
      amount: "",
      type: "gelir",
      category: "Diğer",
      description: "",
    });
    setDialogOpen(false);
  };

  // Build 12-month forward projection
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return d.toISOString().slice(0, 7);
  });

  const monthData = months.map((m) => {
    const inc = entries
      .filter((e) => e.month === m && e.type === "gelir")
      .reduce((s, e) => s + e.amount, 0);
    const exp = entries
      .filter((e) => e.month === m && e.type === "gider")
      .reduce((s, e) => s + e.amount, 0);
    const [year, mo] = m.split("-");
    const label = new Date(Number(year), Number(mo) - 1).toLocaleString(
      "tr-TR",
      { month: "short", year: "2-digit" },
    );
    return { month: m, label, gelir: inc, gider: exp, net: inc - exp };
  });

  const totalIncome = monthData.reduce((s, r) => s + r.gelir, 0);
  const totalExpense = monthData.reduce((s, r) => s + r.gider, 0);
  const totalNet = totalIncome - totalExpense;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Nakit Akış Projeksiyonu
        </h2>
        <Button
          data-ocid="finance.cashflow.add_button"
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="gradient-bg text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Kayıt Ekle
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">
              Toplam Gelir (12 Ay)
            </p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {fmt(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">
              Toplam Gider (12 Ay)
            </p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {fmt(totalExpense)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Net Nakit Akışı</p>
            <p
              className={`text-xl font-bold mt-1 ${totalNet >= 0 ? "text-amber-400" : "text-red-400"}`}
            >
              {fmt(totalNet)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Aylık Nakit Akış Grafiği
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div
              data-ocid="finance.cashflow.empty_state"
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                Nakit akış kaydı ekleyin
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">
                      Ay
                    </th>
                    <th className="text-right py-2 text-green-400 font-medium">
                      Gelir
                    </th>
                    <th className="text-right py-2 text-red-400 font-medium">
                      Gider
                    </th>
                    <th className="text-right py-2 text-amber-400 font-medium">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthData
                    .filter((r) => r.gelir > 0 || r.gider > 0)
                    .map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="py-2 text-foreground">{row.label}</td>
                        <td className="py-2 text-right text-green-400">
                          {row.gelir > 0 ? fmt(row.gelir) : "—"}
                        </td>
                        <td className="py-2 text-right text-red-400">
                          {row.gider > 0 ? fmt(row.gider) : "—"}
                        </td>
                        <td
                          className={`py-2 text-right font-medium ${row.net >= 0 ? "text-amber-400" : "text-red-400"}`}
                        >
                          {fmt(row.net)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Kayıtlar
          </h3>
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              data-ocid={`finance.cashflow.item.${idx + 1}`}
              className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${entry.type === "gelir" ? "bg-green-400" : "bg-red-400"}`}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {entry.description || entry.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.month} · {entry.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-semibold ${entry.type === "gelir" ? "text-green-400" : "text-red-400"}`}
                >
                  {entry.type === "gelir" ? "+" : "-"}
                  {fmt(entry.amount)}
                </span>
                <Button
                  data-ocid={`finance.cashflow.delete_button.${idx + 1}`}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-400"
                  onClick={() =>
                    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
                  }
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="finance.cashflow.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Nakit Akış Kaydı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ay *</Label>
                <Input
                  data-ocid="finance.cashflow.month_input"
                  type="month"
                  value={form.month}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, month: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Tür</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      type: v as "gelir" | "gider",
                    }))
                  }
                >
                  <SelectTrigger
                    data-ocid="finance.cashflow.type_select"
                    className="bg-background border-border mt-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="gelir">Gelir</SelectItem>
                    <SelectItem value="gider">Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tutar (₺) *</Label>
              <Input
                data-ocid="finance.cashflow.amount_input"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger
                  data-ocid="finance.cashflow.category_select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {[
                    "Hakediş",
                    "Kira",
                    "Malzeme",
                    "İşçilik",
                    "Ekipman",
                    "Vergi",
                    "Diğer",
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                data-ocid="finance.cashflow.description_input"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="bg-background border-border mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="finance.cashflow.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="finance.cashflow.save_button"
              onClick={handleAdd}
              disabled={!form.month || !form.amount}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
    addAuditLog,
    auditLogs,
    hakedisItems,
    setHakedisItems,
    activeCompanyId,
  } = useApp();
  const { wbsCodes } = useApp();

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
    wbsCode: "",
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
  // ─── Hakediş State ───────────────────────────────────────────────────────────
  const [hakedisOpen, setHakedisOpen] = useState(false);
  const [hakedisLines, setHakedisLines] = useState<HakedisLineItem[]>([
    {
      id: "line1",
      name: "",
      unit: "m²",
      quantity: 0,
      unitPrice: 0,
      completion: 100,
    },
  ]);
  const [newHakedis, setNewHakedis] = useState({
    projectId: "",
    period: new Date().toISOString().slice(0, 7),
    deductions: 0,
    stopaj: 3,
  });

  const hakedisTotal = useMemo(() => {
    return hakedisLines.reduce(
      (sum, l) => sum + l.quantity * l.unitPrice * (l.completion / 100),
      0,
    );
  }, [hakedisLines]);

  const hakedisNet = useMemo(() => {
    const gross = hakedisTotal;
    const deductionAmt = Number(newHakedis.deductions) || 0;
    const stopajAmt = gross * (Number(newHakedis.stopaj) / 100);
    return gross - deductionAmt - stopajAmt;
  }, [hakedisTotal, newHakedis.deductions, newHakedis.stopaj]);

  const handleAddHakedis = () => {
    const proj = projects.find((p) => p.id === newHakedis.projectId);
    if (!proj) return;
    const item: HakedisItem = {
      id: `hkd${Date.now()}`,
      companyId: "",
      projectId: newHakedis.projectId,
      projectName: proj.title,
      period: newHakedis.period,
      items: hakedisLines.filter((l) => l.name.trim()),
      status: "Taslak",
      deductions: Number(newHakedis.deductions) || 0,
      stopaj: Number(newHakedis.stopaj) || 3,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || "",
    };
    setHakedisItems([item, ...hakedisItems]);
    setHakedisOpen(false);
    setHakedisLines([
      {
        id: "line1",
        name: "",
        unit: "m²",
        quantity: 0,
        unitPrice: 0,
        completion: 100,
      },
    ]);
    setNewHakedis({
      projectId: "",
      period: new Date().toISOString().slice(0, 7),
      deductions: 0,
      stopaj: 3,
    });
  };

  const updateHakedisStatus = (id: string, status: HakedisItem["status"]) => {
    setHakedisItems(
      hakedisItems.map((h) => (h.id === id ? { ...h, status } : h)),
    );
  };

  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    supplier: "",
    amount: "",
    dueDate: "",
    projectId: "",
    installments: 1,
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
      projectId: newInvoice.projectId,
      installments: newInvoice.installments,
    };
    setInvoices([inv, ...invoices]);
    setNewInvoice({
      supplier: "",
      amount: "",
      dueDate: "",
      projectId: "",
      installments: 1,
    });
    setNewInvoiceOpen(false);
  };

  // Auto-flag overdue invoices on mount and when invoices change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional – only re-run on count change to avoid loop
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const hasOverdue = invoices.some(
      (inv) => inv.status === "Bekliyor" && inv.dueDate && inv.dueDate < today,
    );
    if (hasOverdue) {
      setInvoices(
        invoices.map((inv) =>
          inv.status === "Bekliyor" && inv.dueDate && inv.dueDate < today
            ? { ...inv, status: "Gecikmiş" as const }
            : inv,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices.length]);

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
    const expense = expenses.find((e) => e.id === id);
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, status: "Onaylandı" } : e)),
    );
    if (expense) {
      addAuditLog({
        module: "finance",
        action: "Gider Onaylandı",
        description: `${expense.amount} TL - ${expense.category}`,
        performedBy: user?.name || "Kullanıcı",
      });
    }
  };

  const handleRejectExpense = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, status: "Reddedildi" } : e)),
    );
    if (expense) {
      addAuditLog({
        module: "finance",
        action: "Gider Reddedildi",
        description: `${expense.amount} TL - ${expense.category}`,
        performedBy: user?.name || "Kullanıcı",
      });
    }
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
      wbsCode: newExpense.wbsCode || undefined,
    };
    setExpenses([expense, ...expenses]);
    addAuditLog({
      module: "finance",
      action: "Gider Eklendi",
      description: `${expense.amount} TL - ${expense.category}`,
      performedBy: user?.name || "Kullanıcı",
    });
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
      wbsCode: "",
    });
    setNewExpenseOpen(false);
  };

  const handleMarkInvoicePaid = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    setInvoices(
      invoices.map((i) =>
        i.id === invoiceId ? { ...i, status: "Ödendi" as InvoiceStatus } : i,
      ),
    );
    if (inv) {
      addAuditLog({
        module: "finance",
        action: "Fatura Ödendi",
        description: `${inv.supplier} - ${inv.amount} TL`,
        performedBy: user?.name || "Kullanıcı",
      });
    }
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
          <TabsTrigger
            data-ocid="finance.hakedis.tab"
            value="hakedis"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Hakediş
          </TabsTrigger>
          <TabsTrigger
            data-ocid="finance.audit.tab"
            value="audit"
            className="text-xs md:text-sm"
          >
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            data-ocid="finance.cashflow.tab"
            value="cashflow"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white text-xs md:text-sm"
          >
            Nakit Akış
          </TabsTrigger>
          <TabsTrigger
            data-ocid="finance.advances.tab"
            value="advances"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white text-xs md:text-sm"
          >
            Avans & Harcama
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
                  {wbsCodes.length > 0 && (
                    <div>
                      <Label>WBS Kodu (Opsiyonel)</Label>
                      <Select
                        value={newExpense.wbsCode}
                        onValueChange={(v) =>
                          setNewExpense({ ...newExpense, wbsCode: v })
                        }
                      >
                        <SelectTrigger
                          data-ocid="finance.expense.wbs.select"
                          className="bg-background border-border mt-1"
                        >
                          <SelectValue placeholder="WBS kodu seçin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {wbsCodes.map((w: any) => (
                            <SelectItem key={w.id} value={w.code}>
                              {w.code} - {w.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                        value={newInvoice.projectId}
                        onValueChange={(v) =>
                          setNewInvoice({ ...newInvoice, projectId: v })
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
                            <SelectItem key={p.id} value={p.id}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Taksit Sayısı</Label>
                        <Input
                          data-ocid="finance.invoice.installments.input"
                          type="number"
                          min={1}
                          value={newInvoice.installments}
                          onChange={(e) =>
                            setNewInvoice({
                              ...newInvoice,
                              installments: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="bg-background border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label>Taksit Tutarı</Label>
                        <Input
                          readOnly
                          value={
                            newInvoice.amount && newInvoice.installments > 1
                              ? `${(Number(newInvoice.amount) / newInvoice.installments).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                              : "-"
                          }
                          className="bg-background border-border mt-1 text-muted-foreground"
                        />
                      </div>
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
                        {projects.find((p) => p.id === inv.projectId)?.title ??
                          inv.projectId}
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

        {/* ── HAKEDİŞ TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="hakedis" className="space-y-5">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">
                  Toplam Hakediş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{hakedisItems.length}</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-green-400">
                  Onaylanan Tutar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">
                  ₺
                  {hakedisItems
                    .filter((h) => h.status === "Onaylandı")
                    .reduce((s, h) => {
                      const gross = h.items.reduce(
                        (sum, l) =>
                          sum + l.quantity * l.unitPrice * (l.completion / 100),
                        0,
                      );
                      return (
                        s + gross - h.deductions - gross * (h.stopaj / 100)
                      );
                    }, 0)
                    .toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-amber-400">
                  Onay Bekleyen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">
                  {
                    hakedisItems.filter((h) => h.status === "Onay Bekliyor")
                      .length
                  }
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-blue-400">Bu Ay</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-400">
                  {
                    hakedisItems.filter((h) =>
                      h.createdAt?.startsWith(
                        new Date().toISOString().slice(0, 7),
                      ),
                    ).length
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold">Hakediş Listesi</h2>
            <Dialog open={hakedisOpen} onOpenChange={setHakedisOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="finance.hakedis.open_modal_button"
                  className="gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Hakediş
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="finance.hakedis.dialog"
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <DialogHeader>
                  <DialogTitle>Hakediş Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Proje</Label>
                      <Select
                        value={newHakedis.projectId}
                        onValueChange={(v) =>
                          setNewHakedis({ ...newHakedis, projectId: v })
                        }
                      >
                        <SelectTrigger data-ocid="finance.hakedis.project.select">
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
                    <div className="space-y-1">
                      <Label>Dönem (Ay/Yıl)</Label>
                      <Input
                        data-ocid="finance.hakedis.period.input"
                        type="month"
                        value={newHakedis.period}
                        onChange={(e) =>
                          setNewHakedis({
                            ...newHakedis,
                            period: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>İş Kalemleri</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHakedisLines([
                            ...hakedisLines,
                            {
                              id: `line${Date.now()}`,
                              name: "",
                              unit: "m²",
                              quantity: 0,
                              unitPrice: 0,
                              completion: 100,
                            },
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Kalem Ekle
                      </Button>
                    </div>
                    <div className="rounded border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left px-2 py-2 font-medium">
                              Kalem Adı
                            </th>
                            <th className="text-left px-2 py-2 font-medium">
                              Birim
                            </th>
                            <th className="text-left px-2 py-2 font-medium">
                              Miktar
                            </th>
                            <th className="text-left px-2 py-2 font-medium">
                              Birim Fiyat
                            </th>
                            <th className="text-left px-2 py-2 font-medium">
                              Tamamlanma %
                            </th>
                            <th className="text-left px-2 py-2 font-medium">
                              Tutar
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {hakedisLines.map((line, i) => (
                            <tr
                              key={line.id}
                              className="border-t border-border"
                            >
                              <td className="px-1 py-1">
                                <Input
                                  className="h-7 text-xs"
                                  value={line.name}
                                  onChange={(e) =>
                                    setHakedisLines(
                                      hakedisLines.map((l, j) =>
                                        j === i
                                          ? { ...l, name: e.target.value }
                                          : l,
                                      ),
                                    )
                                  }
                                  placeholder="Kalem adı"
                                />
                              </td>
                              <td className="px-1 py-1">
                                <Input
                                  className="h-7 text-xs w-16"
                                  value={line.unit}
                                  onChange={(e) =>
                                    setHakedisLines(
                                      hakedisLines.map((l, j) =>
                                        j === i
                                          ? { ...l, unit: e.target.value }
                                          : l,
                                      ),
                                    )
                                  }
                                />
                              </td>
                              <td className="px-1 py-1">
                                <Input
                                  className="h-7 text-xs w-20"
                                  type="number"
                                  value={line.quantity || ""}
                                  onChange={(e) =>
                                    setHakedisLines(
                                      hakedisLines.map((l, j) =>
                                        j === i
                                          ? {
                                              ...l,
                                              quantity: Number(e.target.value),
                                            }
                                          : l,
                                      ),
                                    )
                                  }
                                />
                              </td>
                              <td className="px-1 py-1">
                                <Input
                                  className="h-7 text-xs w-24"
                                  type="number"
                                  value={line.unitPrice || ""}
                                  onChange={(e) =>
                                    setHakedisLines(
                                      hakedisLines.map((l, j) =>
                                        j === i
                                          ? {
                                              ...l,
                                              unitPrice: Number(e.target.value),
                                            }
                                          : l,
                                      ),
                                    )
                                  }
                                />
                              </td>
                              <td className="px-1 py-1">
                                <Input
                                  className="h-7 text-xs w-16"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={line.completion}
                                  onChange={(e) =>
                                    setHakedisLines(
                                      hakedisLines.map((l, j) =>
                                        j === i
                                          ? {
                                              ...l,
                                              completion: Number(
                                                e.target.value,
                                              ),
                                            }
                                          : l,
                                      ),
                                    )
                                  }
                                />
                              </td>
                              <td className="px-2 py-1 text-right font-medium">
                                ₺
                                {(
                                  line.quantity *
                                  line.unitPrice *
                                  (line.completion / 100)
                                ).toLocaleString("tr-TR", {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                    <div className="space-y-1">
                      <Label>Kesintiler (₺)</Label>
                      <Input
                        data-ocid="finance.hakedis.deductions.input"
                        type="number"
                        value={newHakedis.deductions || ""}
                        onChange={(e) =>
                          setNewHakedis({
                            ...newHakedis,
                            deductions: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Stopaj (%)</Label>
                      <Input
                        data-ocid="finance.hakedis.stopaj.input"
                        type="number"
                        value={newHakedis.stopaj}
                        onChange={(e) =>
                          setNewHakedis({
                            ...newHakedis,
                            stopaj: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Net Tutar</Label>
                      <div className="h-9 flex items-center px-3 rounded border border-border bg-muted/30 font-bold text-green-400">
                        ₺
                        {hakedisNet.toLocaleString("tr-TR", {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    data-ocid="finance.hakedis.cancel_button"
                    variant="outline"
                    onClick={() => setHakedisOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="finance.hakedis.submit_button"
                    className="gradient-bg text-white"
                    onClick={handleAddHakedis}
                  >
                    Oluştur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* List */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Proje
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Dönem
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                    Brüt Tutar
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                    Kesinti
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                    Net Tutar
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Durum
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                    Aksiyon
                  </th>
                </tr>
              </thead>
              <tbody>
                {hakedisItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <div
                        data-ocid="finance.hakedis.empty_state"
                        className="flex flex-col items-center gap-3 text-muted-foreground"
                      >
                        <FileText className="h-10 w-10 opacity-30" />
                        <p>Henüz hakediş kaydı yok</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hakedisItems.map((h, idx) => {
                    const gross = h.items.reduce(
                      (s, l) =>
                        s + l.quantity * l.unitPrice * (l.completion / 100),
                      0,
                    );
                    const net = gross - h.deductions - gross * (h.stopaj / 100);
                    return (
                      <tr
                        key={h.id}
                        data-ocid={`finance.hakedis.item.${idx + 1}`}
                        className="border-t border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {h.projectName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {h.period}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₺
                          {gross.toLocaleString("tr-TR", {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400">
                          ₺
                          {(
                            h.deductions +
                            gross * (h.stopaj / 100)
                          ).toLocaleString("tr-TR", {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-400">
                          ₺
                          {net.toLocaleString("tr-TR", {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${h.status === "Onaylandı" ? "text-green-400 border-green-500/30" : h.status === "Onay Bekliyor" ? "text-amber-400 border-amber-500/30" : h.status === "Reddedildi" ? "text-red-400 border-red-500/30" : ""}`}
                          >
                            {h.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {h.status === "Taslak" && (
                              <Button
                                data-ocid={`finance.hakedis.send.${idx + 1}`}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() =>
                                  updateHakedisStatus(h.id, "Onay Bekliyor")
                                }
                              >
                                Onaya Gönder
                              </Button>
                            )}
                            {h.status === "Onay Bekliyor" && (
                              <>
                                <Button
                                  data-ocid={`finance.hakedis.approve.${idx + 1}`}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-green-400 border-green-500/30"
                                  onClick={() =>
                                    updateHakedisStatus(h.id, "Onaylandı")
                                  }
                                >
                                  Onayla
                                </Button>
                                <Button
                                  data-ocid={`finance.hakedis.reject.${idx + 1}`}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-red-400 border-red-500/30"
                                  onClick={() =>
                                    updateHakedisStatus(h.id, "Reddedildi")
                                  }
                                >
                                  Reddet
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-border"
                  style={{ background: "oklch(0.15 0.018 245)" }}
                >
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Tarih
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    İşlem
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Açıklama
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Yapan
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.filter((l) => l.module === "finance").length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Henüz denetim kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  auditLogs
                    .filter((l) => l.module === "finance")
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.performedBy}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── NAKİT AKIŞ TAB ─────────────────────────────────────────────── */}
        <TabsContent value="cashflow" className="space-y-5">
          <CashFlowTab companyId={activeCompanyId || ""} />
        </TabsContent>
        {/* ── AVANS & HARCAMA TAB ───────────────────────────────────────── */}
        <TabsContent value="advances" className="space-y-5">
          <AdvancesTab companyId={activeCompanyId || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
