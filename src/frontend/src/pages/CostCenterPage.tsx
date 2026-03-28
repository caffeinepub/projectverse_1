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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Edit, Layers, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

type CostCenterType = "Şantiye" | "İdari" | "Ekipman" | "İşçilik" | "Genel";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: CostCenterType;
  budget: number;
  actual: number;
  description: string;
  projectId: string;
  status: "Aktif" | "Pasif";
  expenses: Expense[];
}

const emptyCenter = (): Omit<CostCenter, "id" | "actual" | "expenses"> => ({
  code: "",
  name: "",
  type: "Genel",
  budget: 0,
  description: "",
  projectId: "",
  status: "Aktif",
});

const emptyExpense = (): Omit<Expense, "id"> => ({
  description: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  category: "Genel",
});

const TYPE_COLORS: Record<CostCenterType, string> = {
  Şantiye: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  İdari: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ekipman: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  İşçilik: "bg-green-500/20 text-green-400 border-green-500/30",
  Genel: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    n,
  );

export default function CostCenterPage() {
  const { activeCompanyId, projects } = useApp();
  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );

  const storageKey = `costCenters_${activeCompanyId}`;

  const [centers, setCenters] = useState<CostCenter[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCenter());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpense());
  const [expenseCenterId, setExpenseCenterId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(centers));
  }, [centers, storageKey]);

  const totalBudget = centers.reduce((s, c) => s + c.budget, 0);
  const totalActual = centers.reduce((s, c) => s + c.actual, 0);
  const usagePct =
    totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyCenter());
    setShowDialog(true);
  };

  const openEdit = (c: CostCenter) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      name: c.name,
      type: c.type,
      budget: c.budget,
      description: c.description,
      projectId: c.projectId,
      status: c.status,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) return;
    if (editingId) {
      setCenters((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)),
      );
    } else {
      const newCenter: CostCenter = {
        id: crypto.randomUUID(),
        ...form,
        actual: 0,
        expenses: [],
      };
      setCenters((prev) => [...prev, newCenter]);
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    setCenters((prev) => prev.filter((c) => c.id !== id));
  };

  const openAddExpense = (centerId: string) => {
    setExpenseCenterId(centerId);
    setExpenseForm(emptyExpense());
    setShowExpenseDialog(true);
  };

  const handleSaveExpense = () => {
    if (!expenseCenterId || !expenseForm.description) return;
    const expense: Expense = { id: crypto.randomUUID(), ...expenseForm };
    setCenters((prev) =>
      prev.map((c) =>
        c.id === expenseCenterId
          ? {
              ...c,
              expenses: [...c.expenses, expense],
              actual: c.actual + expense.amount,
            }
          : c,
      ),
    );
    setShowExpenseDialog(false);
  };

  const handleDeleteExpense = (centerId: string, expenseId: string) => {
    setCenters((prev) =>
      prev.map((c) => {
        if (c.id !== centerId) return c;
        const exp = c.expenses.find((e) => e.id === expenseId);
        return {
          ...c,
          expenses: c.expenses.filter((e) => e.id !== expenseId),
          actual: c.actual - (exp?.amount ?? 0),
        };
      }),
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Layers className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Maliyet Merkezi Yönetimi
            </h1>
            <p className="text-sm text-gray-400">
              Maliyet merkezlerini tanımlayın ve giderleri takip edin
            </p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          data-ocid="costcenter.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Maliyet Merkezi
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-400 font-medium">
              Toplam Merkez
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{centers.length}</p>
            <p className="text-xs text-gray-500">
              {centers.filter((c) => c.status === "Aktif").length} aktif
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-400 font-medium">
              Toplam Bütçe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">
              {fmt(totalBudget)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-400 font-medium">
              Toplam Gerçekleşen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{fmt(totalActual)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-400 font-medium">
              Bütçe Kullanımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${usagePct > 90 ? "text-red-400" : usagePct > 70 ? "text-yellow-400" : "text-green-400"}`}
            >
              %{usagePct}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base">
            Maliyet Merkezleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {centers.length === 0 ? (
            <div
              className="text-center py-12 text-gray-500"
              data-ocid="costcenter.empty_state"
            >
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Henüz maliyet merkezi eklenmedi</p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="costcenter.list">
              {centers.map((c, idx) => {
                const remaining = c.budget - c.actual;
                const pct =
                  c.budget > 0 ? Math.round((c.actual / c.budget) * 100) : 0;
                const isExpanded = expandedId === c.id;
                return (
                  <div
                    key={c.id}
                    className="border border-gray-700 rounded-lg overflow-hidden"
                    data-ocid={`costcenter.item.${idx + 1}`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 p-3 cursor-pointer hover:bg-gray-700/30 transition-colors text-left"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      <div className="text-xs font-mono text-amber-400 w-20 shrink-0">
                        {c.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">
                          {c.name}
                        </p>
                        {c.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {c.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs border ${TYPE_COLORS[c.type]} shrink-0`}
                      >
                        {c.type}
                      </Badge>
                      <div className="hidden md:flex flex-col items-end shrink-0 w-28">
                        <p className="text-xs text-gray-400">
                          Bütçe: {fmt(c.budget)}
                        </p>
                        <p className="text-xs text-white">
                          Ger: {fmt(c.actual)}
                        </p>
                      </div>
                      <div className="hidden md:block w-20 shrink-0">
                        <div className="h-1.5 bg-gray-700 rounded-full">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              pct > 90
                                ? "bg-red-500"
                                : pct > 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 text-right">
                          %{pct}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs border shrink-0 ${
                          c.status === "Aktif"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {c.status}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(c);
                          }}
                          data-ocid={`costcenter.edit_button.${idx + 1}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c.id);
                          }}
                          data-ocid={`costcenter.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </button>

                    {/* Expanded expense panel */}
                    {isExpanded && (
                      <div className="border-t border-gray-700 bg-gray-900/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-300">
                            Atanmış Giderler
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddExpense(c.id);
                            }}
                            data-ocid={`costcenter.open_modal_button.${idx + 1}`}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Gider Ekle
                          </Button>
                        </div>
                        {c.expenses.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3">
                            Henüz gider eklenmedi
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-700">
                                <TableHead className="text-gray-400 text-xs">
                                  Açıklama
                                </TableHead>
                                <TableHead className="text-gray-400 text-xs">
                                  Kategori
                                </TableHead>
                                <TableHead className="text-gray-400 text-xs">
                                  Tarih
                                </TableHead>
                                <TableHead className="text-gray-400 text-xs text-right">
                                  Tutar
                                </TableHead>
                                <TableHead className="w-8" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {c.expenses.map((exp) => (
                                <TableRow
                                  key={exp.id}
                                  className="border-gray-700"
                                >
                                  <TableCell className="text-white text-xs">
                                    {exp.description}
                                  </TableCell>
                                  <TableCell className="text-gray-400 text-xs">
                                    {exp.category}
                                  </TableCell>
                                  <TableCell className="text-gray-400 text-xs">
                                    {exp.date}
                                  </TableCell>
                                  <TableCell className="text-amber-400 text-xs text-right">
                                    {fmt(exp.amount)}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-400"
                                      onClick={() =>
                                        handleDeleteExpense(c.id, exp.id)
                                      }
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs">
                          <span className="text-gray-400">Kalan Bütçe</span>
                          <span
                            className={
                              remaining < 0
                                ? "text-red-400 font-semibold"
                                : "text-green-400 font-semibold"
                            }
                          >
                            {fmt(remaining)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-gray-900 border-gray-700 text-white max-w-md"
          data-ocid="costcenter.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editingId ? "Maliyet Merkezi Düzenle" : "Yeni Maliyet Merkezi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Kod *</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="MM-001"
                  className="bg-gray-800 border-gray-600 text-white"
                  data-ocid="costcenter.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Tür</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as CostCenterType }))
                  }
                >
                  <SelectTrigger
                    className="bg-gray-800 border-gray-600 text-white"
                    data-ocid="costcenter.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {(
                      [
                        "Şantiye",
                        "İdari",
                        "Ekipman",
                        "İşçilik",
                        "Genel",
                      ] as CostCenterType[]
                    ).map((t) => (
                      <SelectItem key={t} value={t} className="text-white">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Ad *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Maliyet merkezi adı"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Bütçe (TRY)</Label>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) =>
                  setForm((p) => ({ ...p, budget: Number(e.target.value) }))
                }
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">
                Proje Bağlantısı (İsteğe Bağlı)
              </Label>
              <Select
                value={form.projectId || "none"}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, projectId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="none" className="text-gray-400">
                    -- Bağlantısız --
                  </SelectItem>
                  {companyProjects.map((proj) => (
                    <SelectItem
                      key={proj.id}
                      value={proj.id}
                      className="text-white"
                    >
                      {proj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Durum</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as "Aktif" | "Pasif" }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="Aktif" className="text-white">
                    Aktif
                  </SelectItem>
                  <SelectItem value="Pasif" className="text-white">
                    Pasif
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                className="bg-gray-800 border-gray-600 text-white resize-none"
                data-ocid="costcenter.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-gray-600 text-gray-300"
              data-ocid="costcenter.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-ocid="costcenter.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent
          className="bg-gray-900 border-gray-700 text-white max-w-sm"
          data-ocid="costcenter.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400">Gider Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Açıklama *</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Gider açıklaması"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Tutar (TRY)</Label>
                <Input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm((p) => ({
                      ...p,
                      amount: Number(e.target.value),
                    }))
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Tarih</Label>
                <Input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Kategori</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(v) =>
                  setExpenseForm((p) => ({ ...p, category: v }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {[
                    "Genel",
                    "Malzeme",
                    "İşçilik",
                    "Ekipman",
                    "Seyahat",
                    "Kira",
                    "Diğer",
                  ].map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExpenseDialog(false)}
              className="border-gray-600 text-gray-300"
              data-ocid="costcenter.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveExpense}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-ocid="costcenter.submit_button"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
