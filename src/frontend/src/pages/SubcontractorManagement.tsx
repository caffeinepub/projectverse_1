import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Building2,
  Check,
  DollarSign,
  FileText,
  Mail,
  Phone,
  Plus,
  ReceiptText,
  Shield,
  ShieldCheck,
  User,
  Wrench,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../contexts/AppContext";
import SubcontractorHakedisTab from "./tabs/SubcontractorHakedisTab";
import SubcontractorSelfService from "./tabs/SubcontractorSelfService";
import WorkOrdersTab from "./tabs/WorkOrdersTab";

interface Subcontractor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  specialty: string;
  city: string;
  status: "Aktif" | "Pasif";
  createdAt: string;
}

interface SubContract {
  id: string;
  subcontractorId: string;
  projectName: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "Devam Ediyor" | "Tamamlandı" | "İptal";
}

interface SubPayment {
  id: string;
  subcontractorId: string;
  amount: number;
  date: string;
  description: string;
  status: "Ödendi" | "Bekliyor" | "Gecikmiş";
}

interface SubHSERecord {
  id: string;
  subcontractorId: string;
  employeeName: string;
  employeeRole: string;
  certificates: {
    name: string;
    expiryDate: string;
    status: "Geçerli" | "Süresi Dolmuş" | "Yakında Dolacak";
  }[];
  kpdDelivered: boolean;
  kpdDate: string;
  hseTrainingCompleted: boolean;
  hseTrainingDate: string;
  complianceScore: number;
  createdAt: string;
}

const SPECIALTIES = [
  "Elektrik",
  "Tesisat",
  "Beton",
  "Çelik Konstrüksiyon",
  "Alçıpan",
  "Boyacılık",
  "Zemin Kaplaması",
  "Cam & Alüminyum",
  "Isı & Ses Yalıtımı",
  "Peyzaj",
  "Diğer",
];

const EMPLOYEE_ROLES = [
  "Elektrikçi",
  "Kalıpçı",
  "Kaynakçı",
  "Boyacı",
  "Tesisatçı",
  "Beton İşçisi",
  "Çelik Montajcı",
  "Formen",
  "Ustabaşı",
  "Sıvacı",
  "Vinç Operatörü",
  "Diğer",
];

const CONTRACT_STATUS_STYLES: Record<SubContract["status"], string> = {
  "Devam Ediyor": "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Tamamlandı: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  İptal: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

const PAYMENT_STATUS_STYLES: Record<SubPayment["status"], string> = {
  Ödendi: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Bekliyor: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Gecikmiş: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);
}

function calcComplianceScore(
  kpdDelivered: boolean,
  hseTrainingCompleted: boolean,
  certificates: SubHSERecord["certificates"],
): number {
  let score = 0;
  if (kpdDelivered) score += 40;
  if (hseTrainingCompleted) score += 30;
  if (certificates.length > 0) {
    const validCount = certificates.filter(
      (c) => c.status === "Geçerli",
    ).length;
    score += Math.round((validCount / certificates.length) * 30);
  } else {
    score += 30; // no certs required → full cert points
  }
  return score;
}

export default function SubcontractorManagement() {
  const { activeCompanyId, user: currentUser } = useApp();
  const companyId = activeCompanyId || "default";

  // ── State ─────────────────────────────────────────────────────────────────
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_subcontractors_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  const [contracts, setContracts] = useState<SubContract[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_subcontracts_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  const [payments, setPayments] = useState<SubPayment[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_subpayments_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  // ── HSE Records ───────────────────────────────────────────────────────────
  const [hseRecords, setHseRecords] = useState<SubHSERecord[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_sub_hse_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  const saveHseRecords = (data: SubHSERecord[]) => {
    setHseRecords(data);
    localStorage.setItem(`pv_sub_hse_${companyId}`, JSON.stringify(data));
  };

  const [hseFilterSub, setHseFilterSub] = useState("all");
  const [newHseOpen, setNewHseOpen] = useState(false);
  const [newHse, setNewHse] = useState({
    subcontractorId: "",
    employeeName: "",
    employeeRole: "",
    kpdDelivered: false,
    kpdDate: "",
    hseTrainingCompleted: false,
    hseTrainingDate: "",
    certName: "",
    certExpiry: "",
  });

  const handleAddHse = () => {
    if (!newHse.subcontractorId || !newHse.employeeName || !newHse.employeeRole)
      return;
    const certificates: SubHSERecord["certificates"] = [];
    if (newHse.certName.trim() && newHse.certExpiry) {
      const today = new Date();
      const expiry = new Date(newHse.certExpiry);
      const diffDays = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      let certStatus: SubHSERecord["certificates"][number]["status"] =
        "Geçerli";
      if (diffDays < 0) certStatus = "Süresi Dolmuş";
      else if (diffDays <= 30) certStatus = "Yakında Dolacak";
      certificates.push({
        name: newHse.certName.trim(),
        expiryDate: newHse.certExpiry,
        status: certStatus,
      });
    }
    const score = calcComplianceScore(
      newHse.kpdDelivered,
      newHse.hseTrainingCompleted,
      certificates,
    );
    const record: SubHSERecord = {
      id: `hse_${Date.now()}`,
      subcontractorId: newHse.subcontractorId,
      employeeName: newHse.employeeName,
      employeeRole: newHse.employeeRole,
      certificates,
      kpdDelivered: newHse.kpdDelivered,
      kpdDate: newHse.kpdDate,
      hseTrainingCompleted: newHse.hseTrainingCompleted,
      hseTrainingDate: newHse.hseTrainingDate,
      complianceScore: score,
      createdAt: new Date().toISOString().split("T")[0],
    };
    saveHseRecords([record, ...hseRecords]);
    setNewHseOpen(false);
    setNewHse({
      subcontractorId: "",
      employeeName: "",
      employeeRole: "",
      kpdDelivered: false,
      kpdDate: "",
      hseTrainingCompleted: false,
      hseTrainingDate: "",
      certName: "",
      certExpiry: "",
    });
  };

  const filteredHseRecords = useMemo(() => {
    if (hseFilterSub === "all") return hseRecords;
    return hseRecords.filter((r) => r.subcontractorId === hseFilterSub);
  }, [hseRecords, hseFilterSub]);

  const hseKpis = useMemo(() => {
    const total = hseRecords.length;
    const compliant = hseRecords.filter((r) => r.complianceScore >= 80).length;
    const nonCompliant = hseRecords.filter(
      (r) => r.complianceScore < 60,
    ).length;
    const avg =
      total > 0
        ? Math.round(
            hseRecords.reduce((s, r) => s + r.complianceScore, 0) / total,
          )
        : 0;
    return { total, compliant, nonCompliant, avg };
  }, [hseRecords]);

  const saveSubcontractors = (data: Subcontractor[]) => {
    setSubcontractors(data);
    localStorage.setItem(
      `pv_subcontractors_${companyId}`,
      JSON.stringify(data),
    );
  };

  const saveContracts = (data: SubContract[]) => {
    setContracts(data);
    localStorage.setItem(`pv_subcontracts_${companyId}`, JSON.stringify(data));
  };

  // ── Audit Log ─────────────────────────────────────────────────────────────
  interface AuditEntry {
    id: string;
    action: string;
    details: string;
    user: string;
    timestamp: string;
  }
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_sub_audit_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      setAuditLog(
        JSON.parse(localStorage.getItem(`pv_sub_audit_${companyId}`) || "[]"),
      );
    } catch {
      setAuditLog([]);
    }
  }, [companyId]);
  const addAuditEntry = (action: string, details: string) => {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}`,
      action,
      details,
      user: currentUser?.name || "Kullanıcı",
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => {
      const updated = [entry, ...prev];
      localStorage.setItem(
        `pv_sub_audit_${companyId}`,
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const savePayments = (data: SubPayment[]) => {
    setPayments(data);
    localStorage.setItem(`pv_subpayments_${companyId}`, JSON.stringify(data));
  };

  // ── New subcontractor form ────────────────────────────────────────────────
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [newSub, setNewSub] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    specialty: "",
    city: "",
  });

  const handleAddSub = () => {
    if (!newSub.name.trim() || !newSub.specialty) return;
    const sub: Subcontractor = {
      id: `sub_${Date.now()}`,
      ...newSub,
      status: "Aktif",
      createdAt: new Date().toISOString().split("T")[0],
    };
    saveSubcontractors([sub, ...subcontractors]);
    addAuditEntry("Taşeron Eklendi", `${sub.name} firmasi eklendi`);
    setNewSubOpen(false);
    setNewSub({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      specialty: "",
      city: "",
    });
  };

  // ── New contract form ─────────────────────────────────────────────────────
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    subcontractorId: "",
    projectName: "",
    amount: "",
    startDate: "",
    endDate: "",
    status: "Devam Ediyor" as SubContract["status"],
  });

  const handleAddContract = () => {
    if (
      !newContract.subcontractorId ||
      !newContract.projectName ||
      !newContract.amount
    )
      return;
    const contract: SubContract = {
      id: `contract_${Date.now()}`,
      subcontractorId: newContract.subcontractorId,
      projectName: newContract.projectName,
      amount: Number(newContract.amount),
      startDate: newContract.startDate,
      endDate: newContract.endDate,
      status: newContract.status,
    };
    saveContracts([contract, ...contracts]);
    addAuditEntry(
      "Sözleşme Eklendi",
      `${subMap[contract.subcontractorId] || contract.subcontractorId} - ${contract.projectName}`,
    );
    setNewContractOpen(false);
    setNewContract({
      subcontractorId: "",
      projectName: "",
      amount: "",
      startDate: "",
      endDate: "",
      status: "Devam Ediyor",
    });
  };

  // ── New payment form ──────────────────────────────────────────────────────
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    subcontractorId: "",
    amount: "",
    date: "",
    description: "",
    status: "Bekliyor" as SubPayment["status"],
  });

  const handleAddPayment = () => {
    if (!newPayment.subcontractorId || !newPayment.amount) return;
    const payment: SubPayment = {
      id: `pay_${Date.now()}`,
      subcontractorId: newPayment.subcontractorId,
      amount: Number(newPayment.amount),
      date: newPayment.date || new Date().toISOString().split("T")[0],
      description: newPayment.description,
      status: newPayment.status,
    };
    savePayments([payment, ...payments]);
    addAuditEntry(
      "Ödeme Eklendi",
      `${subMap[payment.subcontractorId] || payment.subcontractorId} - ${payment.amount} ₺`,
    );
    setNewPaymentOpen(false);
    setNewPayment({
      subcontractorId: "",
      amount: "",
      date: "",
      description: "",
      status: "Bekliyor",
    });
  };

  // ── Payment Approval ──────────────────────────────────────────────────────
  const handleApprovePayment = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;
    const updated = payments.map((p) =>
      p.id === paymentId
        ? { ...p, status: "Ödendi" as SubPayment["status"] }
        : p,
    );
    savePayments(updated);
    // Create Finance expense
    try {
      const expenses = JSON.parse(
        localStorage.getItem(`pv_expenses_${companyId}`) || "[]",
      );
      expenses.push({
        id: `exp_sub_${Date.now()}`,
        projectId: payment.subcontractorId,
        description: `Taşeron Ödemesi: ${subMap[payment.subcontractorId] || ""}`,
        amount: payment.amount,
        date: payment.date,
        status: "Onaylandı",
        category: "taseron",
        createdBy: currentUser?.name || "Sistem",
      });
      localStorage.setItem(
        `pv_expenses_${companyId}`,
        JSON.stringify(expenses),
      );
    } catch {}
    addAuditEntry(
      "Ödeme Onaylandı",
      `${subMap[payment.subcontractorId] || ""} - ${payment.amount} ₺`,
    );
  };
  const handleRejectPayment = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;
    const updated = payments.map((p) =>
      p.id === paymentId
        ? { ...p, status: "Gecikmiş" as SubPayment["status"] }
        : p,
    );
    savePayments(updated);
    addAuditEntry(
      "Ödeme Reddedildi",
      `${subMap[payment.subcontractorId] || ""} - ${payment.amount} ₺`,
    );
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const activeContracts = contracts.filter(
      (c) => c.status === "Devam Ediyor",
    ).length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const paidThisMonth = payments
      .filter((p) => p.status === "Ödendi" && p.date.startsWith(thisMonth))
      .reduce((s, p) => s + p.amount, 0);
    const pendingPayments = payments
      .filter((p) => p.status === "Bekliyor" || p.status === "Gecikmiş")
      .reduce((s, p) => s + p.amount, 0);
    return {
      total: subcontractors.length,
      activeContracts,
      paidThisMonth,
      pendingPayments,
    };
  }, [subcontractors, contracts, payments]);

  const subMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of subcontractors) m[s.id] = s.name;
    return m;
  }, [subcontractors]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Taşeron Yönetimi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Alt yüklenici firmalar, sözleşmeler ve ödemeler
          </p>
        </div>
        <Dialog open={newSubOpen} onOpenChange={setNewSubOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="subcontractor.add_button"
              className="gradient-bg text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Yeni Taşeron
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Yeni Taşeron Firma</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Firma Adı *</Label>
                <Input
                  data-ocid="subcontractor.name_input"
                  className="bg-background border-border mt-1"
                  value={newSub.name}
                  onChange={(e) =>
                    setNewSub({ ...newSub, name: e.target.value })
                  }
                  placeholder="Firma adı"
                />
              </div>
              <div>
                <Label>İletişim Kişisi</Label>
                <Input
                  className="bg-background border-border mt-1"
                  value={newSub.contactPerson}
                  onChange={(e) =>
                    setNewSub({ ...newSub, contactPerson: e.target.value })
                  }
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefon</Label>
                  <Input
                    className="bg-background border-border mt-1"
                    value={newSub.phone}
                    onChange={(e) =>
                      setNewSub({ ...newSub, phone: e.target.value })
                    }
                    placeholder="0532 xxx xxxx"
                  />
                </div>
                <div>
                  <Label>E-posta</Label>
                  <Input
                    className="bg-background border-border mt-1"
                    value={newSub.email}
                    onChange={(e) =>
                      setNewSub({ ...newSub, email: e.target.value })
                    }
                    placeholder="firma@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Uzmanlık Alanı *</Label>
                  <Select
                    value={newSub.specialty}
                    onValueChange={(v) =>
                      setNewSub({ ...newSub, specialty: v })
                    }
                  >
                    <SelectTrigger className="bg-background border-border mt-1">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {SPECIALTIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Şehir</Label>
                  <Input
                    className="bg-background border-border mt-1"
                    value={newSub.city}
                    onChange={(e) =>
                      setNewSub({ ...newSub, city: e.target.value })
                    }
                    placeholder="İstanbul"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewSubOpen(false)}>
                İptal
              </Button>
              <Button
                className="gradient-bg text-white"
                onClick={handleAddSub}
                disabled={!newSub.name.trim() || !newSub.specialty}
              >
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/15">
                <Wrench className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Taşeron</p>
                <p className="text-2xl font-bold text-foreground">
                  {kpis.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/15">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Aktif Sözleşmeler
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {kpis.activeContracts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bu Ay Ödenen</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(kpis.paidThisMonth)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/15">
                <DollarSign className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Bekleyen Ödemeler
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(kpis.pendingPayments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subcontractors">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1">
          <TabsTrigger
            value="subcontractors"
            data-ocid="subcontractor.subcontractors.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
          >
            Taşeronlar
          </TabsTrigger>
          <TabsTrigger
            value="contracts"
            data-ocid="subcontractor.contracts.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
          >
            Sözleşmeler
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            data-ocid="subcontractor.payments.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
          >
            Ödemeler
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            data-ocid="subcontractor.audit.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
          >
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger
            value="selfservice"
            data-ocid="subcontractor.selfservice.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
          >
            Öz Servis
          </TabsTrigger>
          <TabsTrigger
            value="workorders"
            data-ocid="subcontractor.workorders.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
          >
            İş Emirleri
          </TabsTrigger>
          <TabsTrigger
            value="hse"
            data-ocid="subcontractor.hse.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            İSG Uyum
          </TabsTrigger>
          <TabsTrigger
            value="hakedis"
            data-ocid="subcontractor.hakedis.tab"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 flex items-center gap-1"
          >
            <ReceiptText className="w-3.5 h-3.5" />
            Hakediş
          </TabsTrigger>
        </TabsList>

        {/* Subcontractors Tab */}
        <TabsContent value="subcontractors" className="mt-6">
          {subcontractors.length === 0 ? (
            <div
              data-ocid="subcontractor.list.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Henüz taşeron firma eklenmedi.</p>
              <p className="text-sm mt-1">
                "Yeni Taşeron" butonuyla alt yüklenici firmalar
                ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {subcontractors.map((sub, idx) => (
                <Card
                  key={sub.id}
                  data-ocid={`subcontractor.list.item.${idx + 1}`}
                  className="bg-card border-border"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/15 mt-0.5">
                          <Building2 className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {sub.name}
                            </h3>
                            <Badge
                              className={
                                sub.status === "Aktif"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                              }
                            >
                              {sub.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              {sub.specialty}
                            </span>
                            {sub.contactPerson && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {sub.contactPerson}
                              </span>
                            )}
                            {sub.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {sub.phone}
                              </span>
                            )}
                            {sub.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {sub.email}
                              </span>
                            )}
                            {sub.city && (
                              <span className="text-xs">{sub.city}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const updated = subcontractors.map((s) =>
                              s.id === sub.id
                                ? {
                                    ...s,
                                    status: (s.status === "Aktif"
                                      ? "Pasif"
                                      : "Aktif") as Subcontractor["status"],
                                  }
                                : s,
                            );
                            saveSubcontractors(updated);
                          }}
                        >
                          {sub.status === "Aktif" ? "Pasif Yap" : "Aktif Yap"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              {contracts.length} sözleşme
            </h2>
            <Dialog open={newContractOpen} onOpenChange={setNewContractOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="subcontractor.contract.add_button"
                  size="sm"
                  className="gradient-bg text-white gap-1"
                  disabled={subcontractors.length === 0}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Sözleşme Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Yeni Sözleşme</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Taşeron *</Label>
                    <Select
                      value={newContract.subcontractorId}
                      onValueChange={(v) =>
                        setNewContract({ ...newContract, subcontractorId: v })
                      }
                    >
                      <SelectTrigger className="bg-background border-border mt-1">
                        <SelectValue placeholder="Taşeron seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {subcontractors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Proje Adı *</Label>
                    <Input
                      className="bg-background border-border mt-1"
                      value={newContract.projectName}
                      onChange={(e) =>
                        setNewContract({
                          ...newContract,
                          projectName: e.target.value,
                        })
                      }
                      placeholder="Proje adı"
                    />
                  </div>
                  <div>
                    <Label>Sözleşme Tutarı (₺) *</Label>
                    <Input
                      className="bg-background border-border mt-1"
                      type="number"
                      value={newContract.amount}
                      onChange={(e) =>
                        setNewContract({
                          ...newContract,
                          amount: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Başlangıç Tarihi</Label>
                      <Input
                        className="bg-background border-border mt-1"
                        type="date"
                        value={newContract.startDate}
                        onChange={(e) =>
                          setNewContract({
                            ...newContract,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Bitiş Tarihi</Label>
                      <Input
                        className="bg-background border-border mt-1"
                        type="date"
                        value={newContract.endDate}
                        onChange={(e) =>
                          setNewContract({
                            ...newContract,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Durum</Label>
                    <Select
                      value={newContract.status}
                      onValueChange={(v) =>
                        setNewContract({
                          ...newContract,
                          status: v as SubContract["status"],
                        })
                      }
                    >
                      <SelectTrigger className="bg-background border-border mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Devam Ediyor">
                          Devam Ediyor
                        </SelectItem>
                        <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                        <SelectItem value="İptal">İptal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNewContractOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    className="gradient-bg text-white"
                    onClick={handleAddContract}
                    disabled={
                      !newContract.subcontractorId ||
                      !newContract.projectName ||
                      !newContract.amount
                    }
                  >
                    Ekle
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {contracts.length === 0 ? (
            <div
              data-ocid="subcontractor.contracts.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Henüz sözleşme eklenmedi.</p>
              <p className="text-sm mt-1">
                Önce taşeron firma ekleyin, ardından sözleşme oluşturun.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Taşeron
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Proje
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tutar
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Başlangıç
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Bitiş
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract, idx) => (
                    <tr
                      key={contract.id}
                      data-ocid={`subcontractor.contracts.item.${idx + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {subMap[contract.subcontractorId] || "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {contract.projectName}
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-medium">
                        {formatCurrency(contract.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {contract.startDate || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {contract.endDate || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            CONTRACT_STATUS_STYLES[contract.status]
                          }`}
                        >
                          {contract.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              {payments.length} ödeme kaydı
            </h2>
            <Dialog open={newPaymentOpen} onOpenChange={setNewPaymentOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="subcontractor.payment.add_button"
                  size="sm"
                  className="gradient-bg text-white gap-1"
                  disabled={subcontractors.length === 0}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ödeme Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Yeni Ödeme</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Taşeron *</Label>
                    <Select
                      value={newPayment.subcontractorId}
                      onValueChange={(v) =>
                        setNewPayment({ ...newPayment, subcontractorId: v })
                      }
                    >
                      <SelectTrigger className="bg-background border-border mt-1">
                        <SelectValue placeholder="Taşeron seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {subcontractors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tutar (₺) *</Label>
                    <Input
                      className="bg-background border-border mt-1"
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, amount: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Tarih</Label>
                    <Input
                      className="bg-background border-border mt-1"
                      type="date"
                      value={newPayment.date}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Input
                      className="bg-background border-border mt-1"
                      value={newPayment.description}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          description: e.target.value,
                        })
                      }
                      placeholder="Ödeme açıklaması"
                    />
                  </div>
                  <div>
                    <Label>Durum</Label>
                    <Select
                      value={newPayment.status}
                      onValueChange={(v) =>
                        setNewPayment({
                          ...newPayment,
                          status: v as SubPayment["status"],
                        })
                      }
                    >
                      <SelectTrigger className="bg-background border-border mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Ödendi">Ödendi</SelectItem>
                        <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                        <SelectItem value="Gecikmiş">Gecikmiş</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNewPaymentOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    className="gradient-bg text-white"
                    onClick={handleAddPayment}
                    disabled={!newPayment.subcontractorId || !newPayment.amount}
                  >
                    Ekle
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {payments.length === 0 ? (
            <div
              data-ocid="subcontractor.payments.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Henüz ödeme kaydı eklenmedi.</p>
              <p className="text-sm mt-1">
                Taşeronlara yapılan ödemeleri buradan takip edebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Taşeron
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tutar
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tarih
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Açıklama
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Durum
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr
                      key={payment.id}
                      data-ocid={`subcontractor.payments.item.${idx + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {subMap[payment.subcontractorId] || "—"}
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {payment.date}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {payment.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            PAYMENT_STATUS_STYLES[payment.status]
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {payment.status === "Bekliyor" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleApprovePayment(payment.id)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              onClick={() => handleRejectPayment(payment.id)}
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-6">
          {auditLog.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Henüz denetim kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Zaman
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Kullanıcı
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      İşlem
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Detay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(entry.timestamp).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {entry.user}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {entry.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Self Service Tab */}
        <TabsContent value="selfservice" className="mt-6">
          <SubcontractorSelfService
            companyId={companyId}
            subcontractors={subcontractors}
          />
        </TabsContent>

        <TabsContent value="workorders" className="mt-6">
          <WorkOrdersTab
            companyId={companyId}
            subcontractors={subcontractors}
          />
        </TabsContent>

        {/* Hakedis Tab */}
        <TabsContent value="hakedis" className="mt-6">
          <SubcontractorHakedisTab
            companyId={companyId}
            subcontractors={subcontractors}
          />
        </TabsContent>

        {/* HSE Compliance Tab */}
        <TabsContent value="hse" className="mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/15">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Takip Edilen
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {hseKpis.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Uyumlu (≥80)
                    </p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {hseKpis.compliant}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/15">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Uyumsuz (&lt;60)
                    </p>
                    <p className="text-2xl font-bold text-rose-400">
                      {hseKpis.nonCompliant}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ort. Uyum Skoru
                    </p>
                    <p className="text-2xl font-bold text-amber-400">
                      {hseKpis.avg}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <Select value={hseFilterSub} onValueChange={setHseFilterSub}>
              <SelectTrigger
                data-ocid="subcontractor.hse.select"
                className="bg-background border-border w-full sm:w-56"
              >
                <SelectValue placeholder="Tüm Taşeronlar" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Tüm Taşeronlar</SelectItem>
                {subcontractors.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={newHseOpen} onOpenChange={setNewHseOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="subcontractor.hse.add_button"
                  size="sm"
                  className="gradient-bg text-white gap-1"
                  disabled={subcontractors.length === 0}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Kayıt Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle>İSG Uyum Kaydı Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  <div>
                    <Label>Taşeron Firma *</Label>
                    <Select
                      value={newHse.subcontractorId}
                      onValueChange={(v) =>
                        setNewHse({ ...newHse, subcontractorId: v })
                      }
                    >
                      <SelectTrigger className="bg-background border-border mt-1">
                        <SelectValue placeholder="Taşeron seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {subcontractors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Çalışan Adı *</Label>
                      <Input
                        data-ocid="subcontractor.hse.name_input"
                        className="bg-background border-border mt-1"
                        value={newHse.employeeName}
                        onChange={(e) =>
                          setNewHse({ ...newHse, employeeName: e.target.value })
                        }
                        placeholder="Ad Soyad"
                      />
                    </div>
                    <div>
                      <Label>Meslek *</Label>
                      <Select
                        value={newHse.employeeRole}
                        onValueChange={(v) =>
                          setNewHse({ ...newHse, employeeRole: v })
                        }
                      >
                        <SelectTrigger className="bg-background border-border mt-1">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {EMPLOYEE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      KKD (Kişisel Koruyucu Donanım)
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setNewHse({
                            ...newHse,
                            kpdDelivered: !newHse.kpdDelivered,
                          })
                        }
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          newHse.kpdDelivered
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-border bg-background"
                        }`}
                      >
                        {newHse.kpdDelivered && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <span className="text-sm">KKD Teslim Edildi</span>
                    </div>
                    {newHse.kpdDelivered && (
                      <div>
                        <Label className="text-xs">Teslim Tarihi</Label>
                        <Input
                          className="bg-background border-border mt-1 h-8 text-sm"
                          type="date"
                          value={newHse.kpdDate}
                          onChange={(e) =>
                            setNewHse({ ...newHse, kpdDate: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      İSG Eğitimi
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setNewHse({
                            ...newHse,
                            hseTrainingCompleted: !newHse.hseTrainingCompleted,
                          })
                        }
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          newHse.hseTrainingCompleted
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-border bg-background"
                        }`}
                      >
                        {newHse.hseTrainingCompleted && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <span className="text-sm">Eğitim Tamamlandı</span>
                    </div>
                    {newHse.hseTrainingCompleted && (
                      <div>
                        <Label className="text-xs">Eğitim Tarihi</Label>
                        <Input
                          className="bg-background border-border mt-1 h-8 text-sm"
                          type="date"
                          value={newHse.hseTrainingDate}
                          onChange={(e) =>
                            setNewHse({
                              ...newHse,
                              hseTrainingDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Sertifika (İsteğe Bağlı)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Sertifika Adı</Label>
                        <Input
                          className="bg-background border-border mt-1 h-8 text-sm"
                          value={newHse.certName}
                          onChange={(e) =>
                            setNewHse({ ...newHse, certName: e.target.value })
                          }
                          placeholder="ör. Forklift Operatörlük"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Son Geçerlilik</Label>
                        <Input
                          className="bg-background border-border mt-1 h-8 text-sm"
                          type="date"
                          value={newHse.certExpiry}
                          onChange={(e) =>
                            setNewHse({ ...newHse, certExpiry: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/20 border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Tahmini Uyum Skoru
                    </p>
                    <p className="text-2xl font-bold text-amber-400">
                      {calcComplianceScore(
                        newHse.kpdDelivered,
                        newHse.hseTrainingCompleted,
                        newHse.certName.trim() && newHse.certExpiry
                          ? [
                              {
                                name: newHse.certName,
                                expiryDate: newHse.certExpiry,
                                status: "Geçerli",
                              },
                            ]
                          : [],
                      )}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / 100
                      </span>
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNewHseOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    className="gradient-bg text-white"
                    onClick={handleAddHse}
                    disabled={
                      !newHse.subcontractorId ||
                      !newHse.employeeName ||
                      !newHse.employeeRole
                    }
                  >
                    Ekle
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          {filteredHseRecords.length === 0 ? (
            <div
              data-ocid="subcontractor.hse.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Henüz İSG uyum kaydı eklenmedi.</p>
              <p className="text-sm mt-1">
                Taşeron çalışanlarının KKD, eğitim ve sertifika uyumunu buradan
                takip edebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Çalışan
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Meslek
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Taşeron
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      KKD
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Eğitim
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Sertifika
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Uyum Skoru
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHseRecords.map((rec, idx) => {
                    const scoreColor =
                      rec.complianceScore >= 80
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : rec.complianceScore >= 60
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/30";
                    return (
                      <tr
                        key={rec.id}
                        data-ocid={`subcontractor.hse.item.${idx + 1}`}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {rec.employeeName}
                        </td>
                        <td className="px-4 py-3 text-foreground/80 text-xs">
                          {rec.employeeRole}
                        </td>
                        <td className="px-4 py-3 text-foreground/80 text-xs">
                          {subMap[rec.subcontractorId] || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rec.kpdDelivered ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XIcon className="w-4 h-4 text-rose-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rec.hseTrainingCompleted ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XIcon className="w-4 h-4 text-rose-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-muted-foreground">
                            {rec.certificates.length > 0 ? (
                              <span className="flex items-center justify-center gap-1">
                                {rec.certificates.length}
                                {rec.certificates.some(
                                  (c) => c.status === "Süresi Dolmuş",
                                ) && (
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                )}
                                {rec.certificates.some(
                                  (c) => c.status === "Yakında Dolacak",
                                ) && (
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                )}
                              </span>
                            ) : (
                              "—"
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-semibold border ${scoreColor}`}
                          >
                            {rec.complianceScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
