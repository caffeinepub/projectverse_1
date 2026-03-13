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
import { useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

type ExpenseStatus = "Onaylandı" | "Bekliyor" | "Reddedildi";
type InvoiceStatus = "Ödendi" | "Bekliyor" | "Gecikmiş";

interface ProjectBudget {
  id: string;
  project: string;
  planned: number;
  spent: number;
}

interface Expense {
  id: string;
  category: string;
  projectId: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  description: string;
  createdBy: string;
}

interface Invoice {
  id: string;
  supplier: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  project: string;
}

const BUDGETS: ProjectBudget[] = [
  { id: "p1", project: "İstanbul Rezidans", planned: 2500000, spent: 1820000 },
  { id: "p2", project: "Ankara Plaza", planned: 4200000, spent: 1950000 },
  { id: "p3", project: "İzmir Liman", planned: 1800000, spent: 1650000 },
  { id: "p4", project: "Bursa Konutları", planned: 950000, spent: 310000 },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "e1",
    category: "Malzeme",
    projectId: "p1",
    amount: 85000,
    date: "2026-03-10",
    status: "Onaylandı",
    description: "Çelik profil alımı",
    createdBy: "Mehmet Demir",
  },
  {
    id: "e2",
    category: "İşçilik",
    projectId: "p2",
    amount: 42000,
    date: "2026-03-11",
    status: "Bekliyor",
    description: "Aylık işçilik gideri",
    createdBy: "Ahmet Yılmaz",
  },
  {
    id: "e3",
    category: "Ekipman",
    projectId: "p3",
    amount: 120000,
    date: "2026-03-08",
    status: "Onaylandı",
    description: "Vinç kiralama",
    createdBy: "Ali Çelik",
  },
  {
    id: "e4",
    category: "Ulaşım",
    projectId: "p1",
    amount: 8500,
    date: "2026-03-12",
    status: "Bekliyor",
    description: "Saha ulaşım masrafları",
    createdBy: "Zeynep Arslan",
  },
  {
    id: "e5",
    category: "Malzeme",
    projectId: "p4",
    amount: 35000,
    date: "2026-03-05",
    status: "Reddedildi",
    description: "Boya ve yalıtım malzemeleri",
    createdBy: "Selin Öztürk",
  },
  {
    id: "e6",
    category: "Danışmanlık",
    projectId: "p2",
    amount: 18000,
    date: "2026-03-13",
    status: "Bekliyor",
    description: "Mimari danışmanlık hizmeti",
    createdBy: "Fatma Kaya",
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: "i1",
    supplier: "Demirçelik A.Ş.",
    amount: 285000,
    dueDate: "2026-03-25",
    status: "Bekliyor",
    project: "İstanbul Rezidans",
  },
  {
    id: "i2",
    supplier: "İnşaat Malzeme Ltd.",
    amount: 96000,
    dueDate: "2026-03-10",
    status: "Ödendi",
    project: "Ankara Plaza",
  },
  {
    id: "i3",
    supplier: "Teknik Yapı San.",
    amount: 145000,
    dueDate: "2026-03-05",
    status: "Gecikmiş",
    project: "İzmir Liman",
  },
  {
    id: "i4",
    supplier: "Elektrik Sistemleri",
    amount: 52000,
    dueDate: "2026-04-01",
    status: "Bekliyor",
    project: "Bursa Konutları",
  },
  {
    id: "i5",
    supplier: "Yıldız İnşaat Malz.",
    amount: 78000,
    dueDate: "2026-02-28",
    status: "Gecikmiş",
    project: "İstanbul Rezidans",
  },
];

const CATEGORIES = [
  "Malzeme",
  "İşçilik",
  "Ekipman",
  "Ulaşım",
  "Danışmanlık",
  "Diğer",
];

const PROJECTS = [
  { id: "p1", name: "İstanbul Rezidans" },
  { id: "p2", name: "Ankara Plaza" },
  { id: "p3", name: "İzmir Liman" },
  { id: "p4", name: "Bursa Konutları" },
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
  const { activeRoleId, checkPermission } = useApp();
  const canEdit =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "manager_idari" ||
    checkPermission("finance", "edit");

  const canView =
    checkPermission("finance", "view") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";

  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "Malzeme",
    projectId: "p1",
    description: "",
  });

  if (!canView) return <AccessDenied />;

  const totalBudget = BUDGETS.reduce((s, b) => s + b.planned, 0);
  const totalSpent = BUDGETS.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const pendingExpenses = expenses.filter((e) => e.status === "Bekliyor");
  const pendingTotal = pendingExpenses.reduce((s, e) => s + e.amount, 0);

  const handleApproveExpense = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "Onaylandı" } : e)),
    );
  };

  const handleRejectExpense = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "Reddedildi" } : e)),
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
      createdBy: "Ben",
    };
    setExpenses((prev) => [expense, ...prev]);
    setNewExpense({
      amount: "",
      category: "Malzeme",
      projectId: "p1",
      description: "",
    });
    setNewExpenseOpen(false);
  };

  const getProjectName = (id: string) =>
    PROJECTS.find((p) => p.id === id)?.name || id;

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
                  {BUDGETS.map((b, i) => {
                    const pct = Math.round((b.spent / b.planned) * 100);
                    const remaining = b.planned - b.spent;
                    const isOver = pct >= 90;
                    return (
                      <TableRow
                        key={b.id}
                        data-ocid={`finance.budget.row.${i + 1}`}
                        className="border-border hover:bg-white/5"
                      >
                        <TableCell className="font-medium">
                          {b.project}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {fmt(b.planned)}
                        </TableCell>
                        <TableCell className="text-right text-rose-400">
                          {fmt(b.spent)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${remaining < 0 ? "text-rose-400" : "text-emerald-400"}`}
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
                                "--progress-fill": isOver
                                  ? "oklch(0.65 0.22 25)"
                                  : "oklch(0.62 0.22 280)",
                              }}
                            />
                            <span
                              className={`text-xs font-semibold ${isOver ? "text-rose-400" : "text-muted-foreground"}`}
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {PROJECTS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Button
                    data-ocid="finance.expense.upload_button"
                    variant="outline"
                    className="w-full border-border border-dashed"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Fatura Yükle
                  </Button>
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
              {INITIAL_INVOICES.length} fatura
            </p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INITIAL_INVOICES.map((inv, i) => (
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
                            className={`text-xs ${inv.status === "Gecikmiş" ? "text-rose-400" : "text-muted-foreground"}`}
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
