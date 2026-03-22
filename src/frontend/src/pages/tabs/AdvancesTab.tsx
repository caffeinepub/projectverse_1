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
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Plus,
  Receipt,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface AdvanceRequest {
  id: string;
  personnelName: string;
  amount: number;
  description: string;
  date: string;
  status: "Bekliyor" | "Onaylandı" | "Reddedildi" | "Ödendi";
  type: "avans";
}

interface ExpenseReport {
  id: string;
  personnelName: string;
  category: "Yol" | "Konaklama" | "Malzeme" | "Diğer";
  amount: number;
  description: string;
  date: string;
  receiptNo: string;
  status: "Bekliyor" | "Onaylandı" | "Reddedildi" | "Ödendi";
  type: "harcama";
}

const STATUS_COLORS: Record<string, string> = {
  Bekliyor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Onaylandı: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Reddedildi: "bg-red-500/15 text-red-400 border-red-500/30",
  Ödendi: "bg-green-500/15 text-green-400 border-green-500/30",
};

export default function AdvancesTab({ companyId }: { companyId: string }) {
  const storageAdvances = `pv_advances_${companyId}`;

  const [advances, setAdvances] = useState<AdvanceRequest[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageAdvances) || "[]");
    } catch {
      return [];
    }
  });

  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [newAdvance, setNewAdvance] = useState({
    personnelName: "",
    amount: "",
    description: "",
  });
  const [newExpense, setNewExpense] = useState({
    personnelName: "",
    category: "Yol" as ExpenseReport["category"],
    amount: "",
    description: "",
    receiptNo: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    localStorage.setItem(storageAdvances, JSON.stringify(advances));
  }, [advances, storageAdvances]);

  const stats = useMemo(() => {
    const pending = advances
      .filter((a) => a.status === "Bekliyor")
      .reduce((s, a) => s + a.amount, 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const approvedThisMonth = advances
      .filter((a) => a.status === "Onaylandı" && a.date.startsWith(thisMonth))
      .reduce((s, a) => s + a.amount, 0);
    return { pending, approvedThisMonth };
  }, [advances]);

  function addAdvance() {
    if (!newAdvance.personnelName || !newAdvance.amount) {
      toast.error("Personel adı ve miktar zorunludur.");
      return;
    }
    const entry: AdvanceRequest = {
      id: Date.now().toString(),
      personnelName: newAdvance.personnelName,
      amount: Number(newAdvance.amount),
      description: newAdvance.description,
      date: new Date().toISOString().split("T")[0],
      status: "Bekliyor",
      type: "avans",
    };
    setAdvances((prev) => [entry, ...prev]);
    setNewAdvance({ personnelName: "", amount: "", description: "" });
    setAdvanceOpen(false);
    toast.success("Avans talebi oluşturuldu.");
  }

  function addExpense() {
    if (!newExpense.personnelName || !newExpense.amount) {
      toast.error("Personel adı ve tutar zorunludur.");
      return;
    }
    const receiptSuffix = newExpense.receiptNo
      ? ` | Fiş: ${newExpense.receiptNo}`
      : "";
    const expenseDesc = `[${newExpense.category}] ${newExpense.description}${receiptSuffix}`;
    const entry: AdvanceRequest = {
      id: Date.now().toString(),
      personnelName: newExpense.personnelName,
      amount: Number(newExpense.amount),
      description: expenseDesc,
      date: newExpense.date,
      status: "Bekliyor",
      type: "avans",
    };
    setAdvances((prev) => [entry, ...prev]);
    // Also write to shared expenses key
    try {
      const raw = JSON.parse(
        localStorage.getItem(`pv_expenses_${companyId}`) || "[]",
      );
      raw.push({
        id: entry.id,
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
        category: newExpense.category,
        status: "Bekliyor",
        personnelName: newExpense.personnelName,
      });
      localStorage.setItem(`pv_expenses_${companyId}`, JSON.stringify(raw));
    } catch {}
    setNewExpense({
      personnelName: "",
      category: "Yol",
      amount: "",
      description: "",
      receiptNo: "",
      date: new Date().toISOString().split("T")[0],
    });
    setExpenseOpen(false);
    toast.success("Harcama bildirimi oluşturuldu.");
  }

  function updateStatus(id: string, status: AdvanceRequest["status"]) {
    setAdvances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
    toast.success(`Durum güncellendi: ${status}`);
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Bekleyen Avans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">
              {stats.pending.toLocaleString("tr-TR")} ₺
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {advances.filter((a) => a.status === "Bekliyor").length} talep
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Bu Ay Onaylanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              {stats.approvedThisMonth.toLocaleString("tr-TR")} ₺
            </p>
            <p className="text-xs text-muted-foreground mt-1">Onaylı harcama</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          data-ocid="finance.advances.add_advance_button"
          size="sm"
          className="gradient-bg text-white"
          onClick={() => setAdvanceOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Avans Talebi
        </Button>
        <Button
          data-ocid="finance.advances.add_expense_button"
          size="sm"
          variant="outline"
          className="border-border"
          onClick={() => setExpenseOpen(true)}
        >
          <Receipt className="h-4 w-4 mr-1" /> Harcama Bildirimi
        </Button>
      </div>

      {/* List */}
      {advances.length === 0 ? (
        <div
          data-ocid="finance.advances.empty_state"
          className="text-center py-14 text-muted-foreground bg-card rounded-xl border border-border"
        >
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Henüz kayıt yok</p>
          <p className="text-sm mt-1">
            Avans talebi veya harcama bildirimi oluşturun.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Personel
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Açıklama
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Miktar
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Tarih
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Durum
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {advances.map((a, idx) => (
                <tr
                  key={a.id}
                  data-ocid={`finance.advances.item.${idx + 1}`}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{a.personnelName}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {a.description}
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-400">
                    {a.amount.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.date}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[a.status]}`}
                    >
                      {a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {a.status === "Bekliyor" && (
                        <>
                          <Button
                            data-ocid={`finance.advances.approve_button.${idx + 1}`}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-400"
                            title="Onayla"
                            onClick={() => updateStatus(a.id, "Onaylandı")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            data-ocid={`finance.advances.reject_button.${idx + 1}`}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400"
                            title="Reddet"
                            onClick={() => updateStatus(a.id, "Reddedildi")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {a.status === "Onaylandı" && (
                        <Button
                          data-ocid={`finance.advances.pay_button.${idx + 1}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-green-400"
                          onClick={() => updateStatus(a.id, "Ödendi")}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Öde
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Advance Dialog */}
      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent
          data-ocid="finance.advances.advance.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Avans Talebi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Personel Adı *</Label>
              <Input
                data-ocid="finance.advances.advance.name.input"
                value={newAdvance.personnelName}
                onChange={(e) =>
                  setNewAdvance((p) => ({
                    ...p,
                    personnelName: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Miktar (₺) *</Label>
              <Input
                data-ocid="finance.advances.advance.amount.input"
                type="number"
                value={newAdvance.amount}
                onChange={(e) =>
                  setNewAdvance((p) => ({ ...p, amount: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="finance.advances.advance.description.input"
                value={newAdvance.description}
                onChange={(e) =>
                  setNewAdvance((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="finance.advances.advance.cancel_button"
              variant="outline"
              onClick={() => setAdvanceOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="finance.advances.advance.submit_button"
              className="gradient-bg text-white"
              onClick={addAdvance}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent
          data-ocid="finance.advances.expense.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Harcama Bildirimi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Personel Adı *</Label>
              <Input
                data-ocid="finance.advances.expense.name.input"
                value={newExpense.personnelName}
                onChange={(e) =>
                  setNewExpense((p) => ({
                    ...p,
                    personnelName: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select
                value={newExpense.category}
                onValueChange={(v) =>
                  setNewExpense((p) => ({
                    ...p,
                    category: v as ExpenseReport["category"],
                  }))
                }
              >
                <SelectTrigger
                  data-ocid="finance.advances.expense.category.select"
                  className="border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yol">Yol</SelectItem>
                  <SelectItem value="Konaklama">Konaklama</SelectItem>
                  <SelectItem value="Malzeme">Malzeme</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tutar (₺) *</Label>
              <Input
                data-ocid="finance.advances.expense.amount.input"
                type="number"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense((p) => ({ ...p, amount: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="finance.advances.expense.description.input"
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div>
              <Label>Fiş No</Label>
              <Input
                data-ocid="finance.advances.expense.receipt.input"
                value={newExpense.receiptNo}
                onChange={(e) =>
                  setNewExpense((p) => ({ ...p, receiptNo: e.target.value }))
                }
                placeholder="FIS-001"
              />
            </div>
            <div>
              <Label>Tarih</Label>
              <Input
                data-ocid="finance.advances.expense.date.input"
                type="date"
                value={newExpense.date}
                onChange={(e) =>
                  setNewExpense((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="finance.advances.expense.cancel_button"
              variant="outline"
              onClick={() => setExpenseOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="finance.advances.expense.submit_button"
              className="gradient-bg text-white"
              onClick={addExpense}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
