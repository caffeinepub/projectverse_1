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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CheckCircle,
  Plus,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

interface BankAccount {
  id: string;
  bankName: string;
  accountNo: string;
  iban: string;
  branch: string;
  currency: string;
  balance: number;
  type: "banka" | "kasa";
}

interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  direction: "giriş" | "çıkış";
  balance: number;
  recordedBy: string;
}

interface AuditEntry {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
}

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

export default function BankAccounts() {
  const { activeCompanyId, user, checkPermission } = useApp();
  const companyId = activeCompanyId || "default";

  const canView = checkPermission("finance", "view");
  const canEdit = checkPermission("finance", "edit");

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_bank_accounts_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<BankTransaction[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_bank_transactions_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_bank_audit_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  interface BankReconciliation {
    id: string;
    bankAccountId: string;
    period: string;
    systemBalance: number;
    statementBalance: number;
    status: "Uyumlu" | "Fark Var";
    createdBy: string;
    createdAt: string;
  }

  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>(
    () => {
      try {
        return JSON.parse(
          localStorage.getItem(`pv_${companyId}_bankReconciliations`) || "[]",
        );
      } catch {
        return [];
      }
    },
  );

  const [recon, setRecon] = useState({
    bankAccountId: "",
    period: new Date().toISOString().slice(0, 7),
    statementBalance: "",
  });

  const saveRecon = () => {
    if (!recon.bankAccountId || !recon.statementBalance) return;
    const acc = accounts.find((a) => a.id === recon.bankAccountId);
    if (!acc) return;
    const sysBalance = acc.balance;
    const stmtBalance = Number(recon.statementBalance) || 0;
    const diff = Math.abs(sysBalance - stmtBalance);
    const status: "Uyumlu" | "Fark Var" = diff < 0.01 ? "Uyumlu" : "Fark Var";
    const entry: BankReconciliation = {
      id: Date.now().toString(),
      bankAccountId: recon.bankAccountId,
      period: recon.period,
      systemBalance: sysBalance,
      statementBalance: stmtBalance,
      status,
      createdBy: user?.name || "Kullanıcı",
      createdAt: new Date().toLocaleString("tr-TR"),
    };
    setReconciliations((prev) => [entry, ...prev]);
    localStorage.setItem(
      `pv_${companyId}_bankReconciliations`,
      JSON.stringify([entry, ...reconciliations]),
    );
    addAudit("Mutabakat eklendi", `${acc.bankName} - ${recon.period}`);
    setRecon({
      bankAccountId: "",
      period: new Date().toISOString().slice(0, 7),
      statementBalance: "",
    });
  };

  useEffect(() => {
    localStorage.setItem(
      `pv_bank_accounts_${companyId}`,
      JSON.stringify(accounts),
    );
  }, [accounts, companyId]);

  useEffect(() => {
    localStorage.setItem(
      `pv_bank_transactions_${companyId}`,
      JSON.stringify(transactions),
    );
  }, [transactions, companyId]);

  useEffect(() => {
    localStorage.setItem(
      `pv_bank_audit_${companyId}`,
      JSON.stringify(auditLog),
    );
  }, [auditLog, companyId]);

  const addAudit = (action: string, details: string) => {
    const entry: AuditEntry = {
      id: Date.now().toString(),
      action,
      details,
      user: user?.name || "Kullanıcı",
      timestamp: new Date().toLocaleString("tr-TR"),
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  // ─── Account Dialog ──────────────────────────────────────────────────────
  type AccFormType = {
    bankName: string;
    accountNo: string;
    iban: string;
    branch: string;
    currency: string;
    balance: string;
    type: "banka" | "kasa";
  };
  const emptyAcc: AccFormType = {
    bankName: "",
    accountNo: "",
    iban: "",
    branch: "",
    currency: "TRY",
    balance: "",
    type: "banka",
  };
  const [accOpen, setAccOpen] = useState(false);
  const [editAccId, setEditAccId] = useState<string | null>(null);
  const [accForm, setAccForm] = useState<AccFormType>(emptyAcc);

  const openNewAcc = (type: "banka" | "kasa" = "banka") => {
    setEditAccId(null);
    setAccForm({ ...emptyAcc, type });
    setAccOpen(true);
  };

  const openEditAcc = (acc: BankAccount) => {
    setEditAccId(acc.id);
    setAccForm({
      bankName: acc.bankName,
      accountNo: acc.accountNo,
      iban: acc.iban,
      branch: acc.branch,
      currency: acc.currency,
      balance: String(acc.balance),
      type: acc.type,
    });
    setAccOpen(true);
  };

  const saveAcc = () => {
    if (!accForm.bankName.trim()) return;
    if (editAccId) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editAccId
            ? { ...a, ...accForm, balance: Number(accForm.balance) || 0 }
            : a,
        ),
      );
      addAudit("Hesap güncellendi", accForm.bankName);
    } else {
      const newAcc: BankAccount = {
        id: Date.now().toString(),
        ...accForm,
        balance: Number(accForm.balance) || 0,
      };
      setAccounts((prev) => [...prev, newAcc]);
      addAudit("Hesap eklendi", newAcc.bankName);
    }
    setAccOpen(false);
  };

  // ─── Transaction Dialog ──────────────────────────────────────────────────
  type TxFormType = {
    accountId: string;
    description: string;
    amount: string;
    direction: "giriş" | "çıkış";
    date: string;
  };
  const emptyTx: TxFormType = {
    accountId: "",
    description: "",
    amount: "",
    direction: "giriş",
    date: new Date().toISOString().slice(0, 10),
  };
  const [txOpen, setTxOpen] = useState(false);
  const [txForm, setTxForm] = useState<TxFormType>(emptyTx);
  const [filterAccId, setFilterAccId] = useState("all");

  const saveTx = () => {
    if (!txForm.accountId || !txForm.amount) return;
    const acc = accounts.find((a) => a.id === txForm.accountId);
    if (!acc) return;
    const amount = Number(txForm.amount) || 0;
    const newBal =
      txForm.direction === "giriş"
        ? acc.balance + amount
        : acc.balance - amount;
    const newTx: BankTransaction = {
      id: Date.now().toString(),
      accountId: txForm.accountId,
      date: txForm.date,
      description: txForm.description,
      amount,
      direction: txForm.direction,
      balance: newBal,
      recordedBy: user?.name || "Kullanıcı",
    };
    setTransactions((prev) => [newTx, ...prev]);
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === txForm.accountId ? { ...a, balance: newBal } : a,
      ),
    );
    addAudit(
      "Hareket eklendi",
      `${txForm.direction === "giriş" ? "+" : "-"}${amount} | ${acc.bankName}`,
    );
    setTxForm(emptyTx);
    setTxOpen(false);
  };

  const bankAccounts = accounts.filter((a) => a.type === "banka");
  const kasaAccounts = accounts.filter((a) => a.type === "kasa");
  const totalBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const thisMonthIn = transactions
    .filter(
      (t) =>
        t.direction === "giriş" &&
        t.date.startsWith(new Date().toISOString().slice(0, 7)),
    )
    .reduce((s, t) => s + t.amount, 0);
  const thisMonthOut = transactions
    .filter(
      (t) =>
        t.direction === "çıkış" &&
        t.date.startsWith(new Date().toISOString().slice(0, 7)),
    )
    .reduce((s, t) => s + t.amount, 0);

  const filteredTx =
    filterAccId === "all"
      ? transactions
      : transactions.filter((t) => t.accountId === filterAccId);

  if (!canView) return <AccessDenied />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">
          Banka Hesabı & Kasa
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hesap hareketleri ve kasa yönetimi
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Banka Bakiyesi",
            value: `₺${totalBalance.toLocaleString("tr-TR")}`,
            icon: Building2,
            color: "text-amber-400",
          },
          {
            label: "Aktif Hesap",
            value: bankAccounts.length,
            icon: Wallet,
            color: "text-blue-400",
          },
          {
            label: "Bu Ay Giriş",
            value: `₺${thisMonthIn.toLocaleString("tr-TR")}`,
            icon: ArrowUp,
            color: "text-emerald-400",
          },
          {
            label: "Bu Ay Çıkış",
            value: `₺${thisMonthOut.toLocaleString("tr-TR")}`,
            icon: ArrowDown,
            color: "text-rose-400",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="bank.accounts.tab"
            value="accounts"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Hesaplar
          </TabsTrigger>
          <TabsTrigger
            data-ocid="bank.movements.tab"
            value="movements"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Hareketler
          </TabsTrigger>
          <TabsTrigger
            data-ocid="bank.kasalar.tab"
            value="kasalar"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Kasalar
          </TabsTrigger>
          <TabsTrigger
            data-ocid="bank.audit.tab"
            value="audit"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            data-ocid="bank.reconciliation.tab"
            value="reconciliation"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Mutabakat
          </TabsTrigger>
        </TabsList>

        {/* HESAPLAR */}
        <TabsContent value="accounts" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-foreground">Banka Hesapları</h2>
            {canEdit && (
              <Button
                data-ocid="bank.add_account.button"
                onClick={() => openNewAcc("banka")}
                className="gradient-bg text-white gap-2"
              >
                <Plus className="w-4 h-4" /> Hesap Ekle
              </Button>
            )}
          </div>
          {bankAccounts.length === 0 ? (
            <div
              data-ocid="bank.accounts.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Henüz banka hesabı eklenmemiş
              </p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Banka Adı</TableHead>
                      <TableHead>Hesap No</TableHead>
                      <TableHead>IBAN</TableHead>
                      <TableHead>Şube</TableHead>
                      <TableHead>Para Birimi</TableHead>
                      <TableHead>Bakiye</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((acc, idx) => (
                      <TableRow
                        key={acc.id}
                        data-ocid={`bank.account.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="font-medium">
                          {acc.bankName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {acc.accountNo}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {acc.iban}
                        </TableCell>
                        <TableCell>{acc.branch}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{acc.currency}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-amber-400">
                          {acc.balance.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditAcc(acc)}
                              className="text-xs"
                            >
                              Düzenle
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* HAREKETLERs */}
        <TabsContent value="movements" className="mt-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="font-semibold text-foreground">İşlem Hareketleri</h2>
            <div className="flex gap-2">
              <Select value={filterAccId} onValueChange={setFilterAccId}>
                <SelectTrigger
                  data-ocid="bank.filter_account.select"
                  className="w-40 bg-card border-border"
                >
                  <SelectValue placeholder="Tüm Hesaplar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Tüm Hesaplar</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canEdit && (
                <Button
                  data-ocid="bank.add_tx.button"
                  onClick={() => setTxOpen(true)}
                  className="gradient-bg text-white gap-2"
                >
                  <Plus className="w-4 h-4" /> Hareket Ekle
                </Button>
              )}
            </div>
          </div>
          {filteredTx.length === 0 ? (
            <div
              data-ocid="bank.movements.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ArrowUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Henüz hareket kaydı yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Tarih</TableHead>
                      <TableHead>Hesap</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Bakiye</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTx.map((tx, idx) => (
                      <TableRow
                        key={tx.id}
                        data-ocid={`bank.tx.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="text-sm">{tx.date}</TableCell>
                        <TableCell className="text-sm">
                          {accounts.find((a) => a.id === tx.accountId)
                            ?.bankName || "-"}
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tx.direction === "giriş"
                                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                            }
                          >
                            {tx.direction === "giriş" ? (
                              <ArrowDown className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 mr-1" />
                            )}
                            {tx.direction}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`font-semibold ${tx.direction === "giriş" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {tx.direction === "giriş" ? "+" : "-"}₺
                          {tx.amount.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          ₺{tx.balance.toLocaleString("tr-TR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* KASALAR */}
        <TabsContent value="kasalar" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-foreground">Kasalar</h2>
            {canEdit && (
              <Button
                data-ocid="bank.add_kasa.button"
                onClick={() => openNewAcc("kasa")}
                className="gradient-bg text-white gap-2"
              >
                <Plus className="w-4 h-4" /> Kasa Ekle
              </Button>
            )}
          </div>
          {kasaAccounts.length === 0 ? (
            <div
              data-ocid="bank.kasalar.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Wallet className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Henüz kasa eklenmemiş</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kasaAccounts.map((kasa, idx) => (
                <Card
                  key={kasa.id}
                  data-ocid={`bank.kasa.card.${idx + 1}`}
                  className="bg-slate-800/50 border-slate-700"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-amber-400" />
                      {kasa.bankName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-400">
                      ₺{kasa.balance.toLocaleString("tr-TR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kasa.currency}
                    </p>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-3 text-xs"
                        onClick={() => openEditAcc(kasa)}
                      >
                        Düzenle
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* DENETİM LOGU */}
        <TabsContent value="audit" className="mt-6">
          <h2 className="font-semibold text-foreground mb-4">Denetim Logu</h2>
          {auditLog.length === 0 ? (
            <div
              data-ocid="bank.audit.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <p className="text-muted-foreground">Henüz kayıt yok</p>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead>Zaman</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>Detay</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((e, idx) => (
                      <TableRow
                        key={e.id}
                        data-ocid={`bank.audit.row.${idx + 1}`}
                        className="border-slate-700 hover:bg-muted/20"
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {e.timestamp}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {e.action}
                        </TableCell>
                        <TableCell className="text-sm">{e.details}</TableCell>
                        <TableCell className="text-sm">{e.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* MUTABAKAT */}
        <TabsContent value="reconciliation" className="mt-6">
          <div className="flex flex-col gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base">Yeni Mutabakat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label>Banka Hesabı *</Label>
                    <Select
                      value={recon.bankAccountId}
                      onValueChange={(v) =>
                        setRecon((p) => ({ ...p, bankAccountId: v }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="bank.recon.account.select"
                        className="mt-1 bg-card border-border"
                      >
                        <SelectValue placeholder="Hesap seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {accounts
                          .filter((a) => a.type === "banka")
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.bankName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dönem (Ay/Yıl)</Label>
                    <Input
                      data-ocid="bank.recon.period.input"
                      type="month"
                      value={recon.period}
                      onChange={(e) =>
                        setRecon((p) => ({ ...p, period: e.target.value }))
                      }
                      className="mt-1 bg-card border-border"
                    />
                  </div>
                  <div>
                    <Label>Ekstre Bakiyesi *</Label>
                    <Input
                      data-ocid="bank.recon.balance.input"
                      type="number"
                      value={recon.statementBalance}
                      onChange={(e) =>
                        setRecon((p) => ({
                          ...p,
                          statementBalance: e.target.value,
                        }))
                      }
                      className="mt-1 bg-card border-border"
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    data-ocid="bank.recon.save_button"
                    onClick={saveRecon}
                    className="gradient-bg text-white"
                  >
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
            {reconciliations.length === 0 ? (
              <div
                data-ocid="bank.reconciliation.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <CheckCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Henüz mutabakat kaydı yok
                </p>
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead>Banka</TableHead>
                        <TableHead>Dönem</TableHead>
                        <TableHead>Sistem Bakiyesi</TableHead>
                        <TableHead>Ekstre Bakiyesi</TableHead>
                        <TableHead>Fark</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reconciliations.map((r, idx) => {
                        const diff = r.systemBalance - r.statementBalance;
                        return (
                          <TableRow
                            key={r.id}
                            data-ocid={`bank.recon.row.${idx + 1}`}
                            className="border-slate-700 hover:bg-muted/20"
                          >
                            <TableCell>
                              {accounts.find((a) => a.id === r.bankAccountId)
                                ?.bankName || "-"}
                            </TableCell>
                            <TableCell>{r.period}</TableCell>
                            <TableCell className="font-mono">
                              ₺{r.systemBalance.toLocaleString("tr-TR")}
                            </TableCell>
                            <TableCell className="font-mono">
                              ₺{r.statementBalance.toLocaleString("tr-TR")}
                            </TableCell>
                            <TableCell
                              className={`font-mono ${Math.abs(diff) > 0.01 ? "text-rose-400" : "text-emerald-400"}`}
                            >
                              {diff >= 0 ? "+" : ""}
                              {diff.toLocaleString("tr-TR")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  r.status === "Uyumlu"
                                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                    : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                                }
                              >
                                {r.status === "Uyumlu" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {r.status}
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Account Dialog */}
      <Dialog open={accOpen} onOpenChange={setAccOpen}>
        <DialogContent
          data-ocid="bank.account.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>
              {editAccId
                ? "Hesabı Düzenle"
                : accForm.type === "kasa"
                  ? "Yeni Kasa"
                  : "Yeni Banka Hesabı"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Banka / Kasa Adı *</Label>
              <Input
                data-ocid="bank.account.name.input"
                value={accForm.bankName}
                onChange={(e) =>
                  setAccForm((p) => ({ ...p, bankName: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="Örn: Ziraat Bankası"
              />
            </div>
            {accForm.type === "banka" && (
              <>
                <div>
                  <Label>Hesap No</Label>
                  <Input
                    data-ocid="bank.account.accountno.input"
                    value={accForm.accountNo}
                    onChange={(e) =>
                      setAccForm((p) => ({ ...p, accountNo: e.target.value }))
                    }
                    className="mt-1 bg-card border-border"
                  />
                </div>
                <div>
                  <Label>IBAN</Label>
                  <Input
                    data-ocid="bank.account.iban.input"
                    value={accForm.iban}
                    onChange={(e) =>
                      setAccForm((p) => ({ ...p, iban: e.target.value }))
                    }
                    className="mt-1 bg-card border-border"
                    placeholder="TR00 0000..."
                  />
                </div>
                <div>
                  <Label>Şube</Label>
                  <Input
                    data-ocid="bank.account.branch.input"
                    value={accForm.branch}
                    onChange={(e) =>
                      setAccForm((p) => ({ ...p, branch: e.target.value }))
                    }
                    className="mt-1 bg-card border-border"
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Para Birimi</Label>
                <Select
                  value={accForm.currency}
                  onValueChange={(v) =>
                    setAccForm((p) => ({ ...p, currency: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="bank.account.currency.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Başlangıç Bakiyesi</Label>
                <Input
                  data-ocid="bank.account.balance.input"
                  type="number"
                  value={accForm.balance}
                  onChange={(e) =>
                    setAccForm((p) => ({ ...p, balance: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAccOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="bank.account.save_button"
              onClick={saveAcc}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent
          data-ocid="bank.tx.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Hareket Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hesap *</Label>
              <Select
                value={txForm.accountId}
                onValueChange={(v) =>
                  setTxForm((p) => ({ ...p, accountId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="bank.tx.account.select"
                  className="mt-1 bg-card border-border"
                >
                  <SelectValue placeholder="Hesap seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tarih</Label>
              <Input
                data-ocid="bank.tx.date.input"
                type="date"
                value={txForm.date}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, date: e.target.value }))
                }
                className="mt-1 bg-card border-border"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                data-ocid="bank.tx.desc.input"
                value={txForm.description}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, description: e.target.value }))
                }
                className="mt-1 bg-card border-border"
                placeholder="İşlem açıklaması"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tür</Label>
                <Select
                  value={txForm.direction}
                  onValueChange={(v: "giriş" | "çıkış") =>
                    setTxForm((p) => ({ ...p, direction: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="bank.tx.direction.select"
                    className="mt-1 bg-card border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="giriş">Giriş</SelectItem>
                    <SelectItem value="çıkış">Çıkış</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tutar *</Label>
                <Input
                  data-ocid="bank.tx.amount.input"
                  type="number"
                  value={txForm.amount}
                  onChange={(e) =>
                    setTxForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTxOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="bank.tx.save_button"
              onClick={saveTx}
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
