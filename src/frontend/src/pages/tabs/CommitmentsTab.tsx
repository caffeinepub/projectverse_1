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
import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";

interface Commitment {
  id: string;
  name: string;
  budgetCode: string;
  amount: number;
  actualSpend: number;
  status: "Açık" | "Kapatıldı" | "İptal";
  projectId: string;
  date: string;
  notes: string;
}

export default function CommitmentsTab({ companyId }: { companyId: string }) {
  const { projects } = useApp();
  const key = `commitments_${companyId}`;
  const [open, setOpen] = useState(false);

  const load = (): Commitment[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const [commitments, setCommitments] = useState<Commitment[]>(load);

  const save = (data: Commitment[]) => {
    setCommitments(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const emptyForm = {
    name: "",
    budgetCode: "",
    amount: "",
    actualSpend: "",
    status: "Açık" as Commitment["status"],
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const companyProjects = projects.filter((p) => p.companyId === companyId);

  const handleAdd = () => {
    if (!form.name.trim() || !form.amount) return;
    const item: Commitment = {
      id: Date.now().toString(),
      name: form.name,
      budgetCode: form.budgetCode,
      amount: Number(form.amount),
      actualSpend: Number(form.actualSpend) || 0,
      status: form.status,
      projectId: form.projectId,
      date: form.date,
      notes: form.notes,
    };
    save([...commitments, item]);
    setForm(emptyForm);
    setOpen(false);
  };

  const totalCommitted = commitments.reduce((s, c) => s + c.amount, 0);
  const totalActual = commitments.reduce((s, c) => s + c.actualSpend, 0);
  const totalRemaining = totalCommitted - totalActual;

  const statusColor: Record<string, string> = {
    Açık: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Kapatıldı: "bg-green-500/15 text-green-400 border-green-500/30",
    İptal: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Toplam Taahhüt</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {totalCommitted.toLocaleString("tr-TR")} ₺
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Gerçekleşen Harcama</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">
              {totalActual.toLocaleString("tr-TR")} ₺
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Kalan Bütçe</p>
            <p
              className={`text-2xl font-bold mt-1 ${totalRemaining >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {totalRemaining.toLocaleString("tr-TR")} ₺
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      {totalCommitted > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Taahhüt vs Gerçekleşen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Taahhüt</span>
                  <span className="text-amber-400">
                    {totalCommitted.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Gerçekleşen</span>
                  <span className="text-orange-400">
                    {totalActual.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (totalActual / totalCommitted) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Kalan</span>
                  <span
                    className={
                      totalRemaining >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {totalRemaining.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${totalRemaining >= 0 ? "bg-green-500" : "bg-red-500"}`}
                    style={{
                      width: `${Math.min(100, (Math.abs(totalRemaining) / totalCommitted) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Taahhüt Listesi ({commitments.length})
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gradient-bg text-white"
              data-ocid="commitments.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-1" /> Yeni Taahhüt
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                Yeni Taahhüt
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Taahhüt Adı *</Label>
                <Input
                  data-ocid="commitments.name.input"
                  className="bg-background border-border mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Örn: Beton teslimatı taahhüdü"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bütçe Kodu</Label>
                  <Input
                    className="bg-background border-border mt-1"
                    value={form.budgetCode}
                    onChange={(e) =>
                      setForm({ ...form, budgetCode: e.target.value })
                    }
                    placeholder="BK-001"
                  />
                </div>
                <div>
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    className="bg-background border-border mt-1"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Taahhüt Tutarı (₺) *</Label>
                  <Input
                    type="number"
                    className="bg-background border-border mt-1"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Gerçekleşen (₺)</Label>
                  <Input
                    type="number"
                    className="bg-background border-border mt-1"
                    value={form.actualSpend}
                    onChange={(e) =>
                      setForm({ ...form, actualSpend: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label>Proje</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(v) => setForm({ ...form, projectId: v })}
                >
                  <SelectTrigger className="bg-background border-border mt-1">
                    <SelectValue placeholder="Proje seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">—</SelectItem>
                    {companyProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durum</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Commitment["status"] })
                  }
                >
                  <SelectTrigger className="bg-background border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Açık">Açık</SelectItem>
                    <SelectItem value="Kapatıldı">Kapatıldı</SelectItem>
                    <SelectItem value="İptal">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notlar</Label>
                <Textarea
                  className="bg-background border-border mt-1"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setOpen(false)}
              >
                İptal
              </Button>
              <Button
                className="gradient-bg text-white"
                data-ocid="commitments.submit_button"
                onClick={handleAdd}
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {commitments.length === 0 ? (
        <div
          data-ocid="commitments.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Henüz taahhüt kaydı yok</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Taahhüt Adı
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Bütçe Kodu
                </TableHead>
                <TableHead className="text-muted-foreground">Tutar</TableHead>
                <TableHead className="text-muted-foreground">
                  Gerçekleşen
                </TableHead>
                <TableHead className="text-muted-foreground">Durum</TableHead>
                <TableHead className="text-muted-foreground">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commitments.map((c, i) => {
                const proj = companyProjects.find((p) => p.id === c.projectId);
                return (
                  <TableRow
                    key={c.id}
                    data-ocid={`commitments.item.${i + 1}`}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {c.name}
                      </div>
                      {proj && (
                        <div className="text-xs text-muted-foreground">
                          {proj.title}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {c.budgetCode || "—"}
                    </TableCell>
                    <TableCell className="text-amber-400 font-semibold">
                      {c.amount.toLocaleString("tr-TR")} ₺
                    </TableCell>
                    <TableCell className="text-orange-400">
                      {c.actualSpend.toLocaleString("tr-TR")} ₺
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${statusColor[c.status]}`}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {c.date}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
