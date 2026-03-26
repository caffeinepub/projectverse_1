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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  ChevronDown,
  ChevronUp,
  FilePlus,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

const STATUS_STYLES: Record<string, string> = {
  Taslak: "bg-muted text-muted-foreground",
  Aktif: "bg-green-500/20 text-green-400",
  Tamamlandı: "bg-blue-500/20 text-blue-400",
  İptal: "bg-red-500/20 text-red-400",
};

const CO_STATUS_STYLES: Record<string, string> = {
  Beklemede: "bg-amber-500/20 text-amber-400",
  Onaylandı: "bg-green-500/20 text-green-400",
  Reddedildi: "bg-red-500/20 text-red-400",
};

const ADDENDUM_STATUS_STYLES: Record<string, string> = {
  Taslak: "bg-muted text-muted-foreground",
  İmzalandı: "bg-green-500/20 text-green-400",
  İptal: "bg-red-500/20 text-red-400",
};

const ADDENDUM_TYPE_STYLES: Record<string, string> = {
  Zeyilname: "bg-blue-500/20 text-blue-400",
  "Ek Protokol": "bg-purple-500/20 text-purple-400",
  Revizyon: "bg-amber-500/20 text-amber-400",
  "Fiyat Farkı": "bg-orange-500/20 text-orange-400",
};

export default function Contracts() {
  const {
    contracts,
    setContracts,
    changeOrders,
    setChangeOrders,
    contractAddendums,
    setContractAddendums,
    projects,
    hakedisItems,
    currentCompany,
    checkPermission,
    user,
    addAuditLog,
  } = useApp();

  const canView = checkPermission("contracts", "view");
  const canEdit = checkPermission("contracts", "edit");

  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [contractOpen, setContractOpen] = useState(false);
  const [coOpen, setCoOpen] = useState(false);
  const [addendumOpen, setAddendumOpen] = useState(false);

  const [newContract, setNewContract] = useState({
    contractNo: "",
    clientName: "",
    projectId: "",
    amount: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "Taslak" as const,
  });

  const [newCO, setNewCO] = useState({
    contractId: "",
    orderNo: "",
    description: "",
    amount: "",
    requestedBy: "",
  });

  const [newAddendum, setNewAddendum] = useState({
    contractId: "",
    addendumNo: "",
    type: "Zeyilname" as
      | "Zeyilname"
      | "Ek Protokol"
      | "Revizyon"
      | "Fiyat Farkı",
    description: "",
    amountChange: "",
    effectiveDate: "",
    status: "Taslak" as "Taslak" | "İmzalandı" | "İptal",
  });

  const companyContracts = contracts.filter(
    (c) => c.companyId === currentCompany?.id,
  );
  const companyChangeOrders = changeOrders.filter(
    (co) => co.companyId === currentCompany?.id,
  );
  const companyAddendums = (contractAddendums || []).filter(
    (a) => a.companyId === currentCompany?.id,
  );

  if (!canView) return <AccessDenied />;

  const handleAddContract = () => {
    if (
      !newContract.contractNo ||
      !newContract.clientName ||
      !newContract.amount
    )
      return;
    const project = projects.find((p) => p.id === newContract.projectId);
    const contract = {
      id: `ct${Date.now()}`,
      companyId: currentCompany?.id || "",
      contractNo: newContract.contractNo,
      clientName: newContract.clientName,
      projectId: newContract.projectId,
      projectName: project?.title || "",
      amount: Number(newContract.amount),
      startDate: newContract.startDate,
      endDate: newContract.endDate,
      status: newContract.status,
      description: newContract.description,
      createdAt: new Date().toISOString(),
    };
    setContracts([contract, ...contracts]);
    addAuditLog({
      module: "contracts",
      action: "Sözleşme Eklendi",
      description: `${contract.contractNo} - ${contract.clientName}`,
      performedBy: user?.name || "",
    });
    setNewContract({
      contractNo: "",
      clientName: "",
      projectId: "",
      amount: "",
      startDate: "",
      endDate: "",
      description: "",
      status: "Taslak",
    });
    setContractOpen(false);
  };

  const handleAddCO = () => {
    if (!newCO.contractId || !newCO.orderNo || !newCO.amount) return;
    const co = {
      id: `co${Date.now()}`,
      companyId: currentCompany?.id || "",
      contractId: newCO.contractId,
      orderNo: newCO.orderNo,
      description: newCO.description,
      amount: Number(newCO.amount),
      status: "Beklemede" as const,
      requestedBy: newCO.requestedBy || user?.name || "",
      createdAt: new Date().toISOString(),
    };
    setChangeOrders([co, ...changeOrders]);
    setNewCO({
      contractId: "",
      orderNo: "",
      description: "",
      amount: "",
      requestedBy: "",
    });
    setCoOpen(false);
  };

  const handleAddAddendum = () => {
    if (!newAddendum.contractId || !newAddendum.addendumNo) return;
    const contract = companyContracts.find(
      (c) => c.id === newAddendum.contractId,
    );
    const amountChange = Number(newAddendum.amountChange) || 0;
    const revisedAmount = (contract?.amount || 0) + amountChange;
    const addendum = {
      id: `ad${Date.now()}`,
      companyId: currentCompany?.id || "",
      contractId: newAddendum.contractId,
      contractNo: contract?.contractNo || "",
      addendumNo: newAddendum.addendumNo,
      type: newAddendum.type,
      description: newAddendum.description,
      amountChange,
      revisedAmount,
      effectiveDate: newAddendum.effectiveDate,
      status: newAddendum.status,
      createdAt: new Date().toISOString(),
    };
    setContractAddendums([addendum, ...(contractAddendums || [])]);
    addAuditLog({
      module: "contracts",
      action: "Adendum Eklendi",
      description: `${addendum.addendumNo} - ${addendum.type} (${contract?.contractNo})`,
      performedBy: user?.name || "",
    });
    setNewAddendum({
      contractId: "",
      addendumNo: "",
      type: "Zeyilname",
      description: "",
      amountChange: "",
      effectiveDate: "",
      status: "Taslak",
    });
    setAddendumOpen(false);
  };

  const handleCOStatus = (id: string, status: "Onaylandı" | "Reddedildi") => {
    setChangeOrders(
      changeOrders.map((co) => (co.id === id ? { ...co, status } : co)),
    );
  };

  const handleAddendumStatus = (id: string, status: "İmzalandı" | "İptal") => {
    setContractAddendums(
      (contractAddendums || []).map((a) =>
        a.id === id ? { ...a, status } : a,
      ),
    );
  };

  const getContractHakedisTotal = (contractId: string) => {
    const contract = companyContracts.find((c) => c.id === contractId);
    if (!contract) return 0;
    return hakedisItems
      .filter(
        (h) => h.projectId === contract.projectId && h.status === "Onaylandı",
      )
      .reduce((sum, h) => {
        const itemTotal = h.items.reduce(
          (s, i) => s + i.quantity * i.unitPrice * (i.completion / 100),
          0,
        );
        return sum + itemTotal;
      }, 0);
  };

  const getContractCOs = (contractId: string) =>
    companyChangeOrders.filter((co) => co.contractId === contractId);

  const getContractAddendums = (contractId: string) =>
    companyAddendums.filter((a) => a.contractId === contractId);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Sözleşme Yönetimi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Müşteri sözleşmeleri, değişiklik emirleri ve adendumlar
          </p>
        </div>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="contracts" data-ocid="contracts.contracts.tab">
            Sözleşmeler
          </TabsTrigger>
          <TabsTrigger
            value="changeOrders"
            data-ocid="contracts.change_orders.tab"
          >
            Değişiklik Emirleri
          </TabsTrigger>
          <TabsTrigger value="addendums" data-ocid="contracts.addendums.tab">
            Adendum & Revizyon
          </TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="mt-4 space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <Dialog open={contractOpen} onOpenChange={setContractOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="contracts.add.primary_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Sözleşme
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="contracts.add.dialog"
                  className="bg-card border-border max-w-lg"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Sözleşme</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Sözleşme No *</Label>
                        <Input
                          data-ocid="contracts.contract_no.input"
                          value={newContract.contractNo}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              contractNo: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="SZ-2024-001"
                        />
                      </div>
                      <div>
                        <Label>Müşteri Adı *</Label>
                        <Input
                          data-ocid="contracts.client_name.input"
                          value={newContract.clientName}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              clientName: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="Müşteri adı"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Proje</Label>
                      <Select
                        value={newContract.projectId}
                        onValueChange={(v) =>
                          setNewContract({ ...newContract, projectId: v })
                        }
                      >
                        <SelectTrigger
                          data-ocid="contracts.project.select"
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
                        <Label>Sözleşme Tutarı (₺) *</Label>
                        <Input
                          data-ocid="contracts.amount.input"
                          type="number"
                          value={newContract.amount}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              amount: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Durum</Label>
                        <Select
                          value={newContract.status}
                          onValueChange={(v) =>
                            setNewContract({ ...newContract, status: v as any })
                          }
                        >
                          <SelectTrigger
                            data-ocid="contracts.status.select"
                            className="bg-background border-border mt-1"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {["Taslak", "Aktif", "Tamamlandı", "İptal"].map(
                              (s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Başlangıç Tarihi</Label>
                        <Input
                          data-ocid="contracts.start_date.input"
                          type="date"
                          value={newContract.startDate}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              startDate: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label>Bitiş Tarihi</Label>
                        <Input
                          data-ocid="contracts.end_date.input"
                          type="date"
                          value={newContract.endDate}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              endDate: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Açıklama</Label>
                      <Textarea
                        data-ocid="contracts.description.textarea"
                        value={newContract.description}
                        onChange={(e) =>
                          setNewContract({
                            ...newContract,
                            description: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setContractOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="contracts.add.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddContract}
                    >
                      Sözleşme Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {companyContracts.length === 0 ? (
            <Card
              data-ocid="contracts.empty_state"
              className="bg-card border-border"
            >
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <FileText className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Henüz sözleşme eklenmedi
                </p>
                {canEdit && (
                  <Button
                    className="gradient-bg text-white"
                    onClick={() => setContractOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Sözleşmeyi Ekle
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {companyContracts.map((contract, idx) => {
                const hakedisTotal = getContractHakedisTotal(contract.id);
                const coList = getContractCOs(contract.id);
                const addendumList = getContractAddendums(contract.id);
                const isExpanded = expandedContract === contract.id;

                return (
                  <Card
                    key={contract.id}
                    data-ocid={`contracts.item.${idx + 1}`}
                    className="bg-card border-border"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {contract.contractNo}
                            </span>
                            <Badge className={STATUS_STYLES[contract.status]}>
                              {contract.status}
                            </Badge>
                            {addendumList.length > 0 && (
                              <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                                {addendumList.length} Adendum
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {contract.clientName}
                          </p>
                          {contract.projectName && (
                            <p className="text-xs text-muted-foreground/70">
                              {contract.projectName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-amber-400">
                              {formatCurrency(contract.amount)}
                            </p>
                            {hakedisTotal > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Hakediş: {formatCurrency(hakedisTotal)}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`contracts.expand.toggle.${idx + 1}`}
                            onClick={() =>
                              setExpandedContract(
                                isExpanded ? null : contract.id,
                              )
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {(contract.startDate || contract.endDate) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {contract.startDate} – {contract.endDate}
                        </p>
                      )}
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="border-t border-border pt-3">
                          {contract.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {contract.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              Değişiklik Emirleri ({coList.length})
                            </h4>
                          </div>
                          {coList.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Bu sözleşmeye ait değişiklik emri yok.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {coList.map((co) => (
                                <div
                                  key={co.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                                >
                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      {co.orderNo}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {co.description}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-amber-400">
                                      {formatCurrency(co.amount)}
                                    </span>
                                    <Badge
                                      className={CO_STATUS_STYLES[co.status]}
                                    >
                                      {co.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Change Orders Tab */}
        <TabsContent value="changeOrders" className="mt-4 space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <Dialog open={coOpen} onOpenChange={setCoOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="contracts.co.primary_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Değişiklik Emri
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="contracts.co.dialog"
                  className="bg-card border-border"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Değişiklik Emri</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Sözleşme *</Label>
                      <Select
                        value={newCO.contractId}
                        onValueChange={(v) =>
                          setNewCO({ ...newCO, contractId: v })
                        }
                      >
                        <SelectTrigger
                          data-ocid="contracts.co.contract.select"
                          className="bg-background border-border mt-1"
                        >
                          <SelectValue placeholder="Sözleşme seçin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {companyContracts.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.contractNo} - {c.clientName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Emir No *</Label>
                        <Input
                          data-ocid="contracts.co.order_no.input"
                          value={newCO.orderNo}
                          onChange={(e) =>
                            setNewCO({ ...newCO, orderNo: e.target.value })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="DE-001"
                        />
                      </div>
                      <div>
                        <Label>Tutar (₺) *</Label>
                        <Input
                          data-ocid="contracts.co.amount.input"
                          type="number"
                          value={newCO.amount}
                          onChange={(e) =>
                            setNewCO({ ...newCO, amount: e.target.value })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Talep Eden</Label>
                      <Input
                        data-ocid="contracts.co.requester.input"
                        value={newCO.requestedBy}
                        onChange={(e) =>
                          setNewCO({ ...newCO, requestedBy: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                        placeholder="Ad Soyad"
                      />
                    </div>
                    <div>
                      <Label>Açıklama</Label>
                      <Textarea
                        data-ocid="contracts.co.description.textarea"
                        value={newCO.description}
                        onChange={(e) =>
                          setNewCO({ ...newCO, description: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={() => setCoOpen(false)}>
                      İptal
                    </Button>
                    <Button
                      data-ocid="contracts.co.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddCO}
                    >
                      Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {companyChangeOrders.length === 0 ? (
            <Card
              data-ocid="contracts.co.empty_state"
              className="bg-card border-border"
            >
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <FileText className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Değişiklik emri bulunamadı
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Emir No
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Sözleşme
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Açıklama
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Tutar
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Talep Eden
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
                    {companyChangeOrders.map((co, idx) => {
                      const contract = companyContracts.find(
                        (c) => c.id === co.contractId,
                      );
                      return (
                        <TableRow
                          key={co.id}
                          data-ocid={`contracts.co.item.${idx + 1}`}
                          className="border-border"
                        >
                          <TableCell className="font-medium text-foreground">
                            {co.orderNo}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {contract?.contractNo || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {co.description || "-"}
                          </TableCell>
                          <TableCell className="text-right text-amber-400">
                            {formatCurrency(co.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {co.requestedBy}
                          </TableCell>
                          <TableCell>
                            <Badge className={CO_STATUS_STYLES[co.status]}>
                              {co.status}
                            </Badge>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              {co.status === "Beklemede" && (
                                <div className="flex gap-1">
                                  <Button
                                    data-ocid={`contracts.co.approve.button.${idx + 1}`}
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-green-400 hover:text-green-300"
                                    onClick={() =>
                                      handleCOStatus(co.id, "Onaylandı")
                                    }
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    data-ocid={`contracts.co.reject.button.${idx + 1}`}
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-400 hover:text-red-300"
                                    onClick={() =>
                                      handleCOStatus(co.id, "Reddedildi")
                                    }
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Addendum & Revision Tab */}
        <TabsContent value="addendums" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Sözleşme zeyilnameleri, ek protokoller ve revizyon kayıtları
            </p>
            {canEdit && (
              <Dialog open={addendumOpen} onOpenChange={setAddendumOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="contracts.addendum.primary_button"
                    className="gradient-bg text-white"
                  >
                    <FilePlus className="h-4 w-4 mr-2" />
                    Yeni Adendum
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="contracts.addendum.dialog"
                  className="bg-card border-border max-w-lg"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Adendum / Revizyon</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Sözleşme *</Label>
                      <Select
                        value={newAddendum.contractId}
                        onValueChange={(v) =>
                          setNewAddendum({ ...newAddendum, contractId: v })
                        }
                      >
                        <SelectTrigger
                          data-ocid="contracts.addendum.contract.select"
                          className="bg-background border-border mt-1"
                        >
                          <SelectValue placeholder="Sözleşme seçin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {companyContracts.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.contractNo} - {c.clientName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Adendum No *</Label>
                        <Input
                          data-ocid="contracts.addendum.no.input"
                          value={newAddendum.addendumNo}
                          onChange={(e) =>
                            setNewAddendum({
                              ...newAddendum,
                              addendumNo: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="AD-001"
                        />
                      </div>
                      <div>
                        <Label>Tür</Label>
                        <Select
                          value={newAddendum.type}
                          onValueChange={(v) =>
                            setNewAddendum({ ...newAddendum, type: v as any })
                          }
                        >
                          <SelectTrigger
                            data-ocid="contracts.addendum.type.select"
                            className="bg-background border-border mt-1"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {[
                              "Zeyilname",
                              "Ek Protokol",
                              "Revizyon",
                              "Fiyat Farkı",
                            ].map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tutar Değişimi (₺)</Label>
                        <Input
                          data-ocid="contracts.addendum.amount.input"
                          type="number"
                          value={newAddendum.amountChange}
                          onChange={(e) =>
                            setNewAddendum({
                              ...newAddendum,
                              amountChange: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="+/- tutar"
                        />
                      </div>
                      <div>
                        <Label>Yürürlük Tarihi</Label>
                        <Input
                          data-ocid="contracts.addendum.date.input"
                          type="date"
                          value={newAddendum.effectiveDate}
                          onChange={(e) =>
                            setNewAddendum({
                              ...newAddendum,
                              effectiveDate: e.target.value,
                            })
                          }
                          className="bg-background border-border mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Durum</Label>
                      <Select
                        value={newAddendum.status}
                        onValueChange={(v) =>
                          setNewAddendum({ ...newAddendum, status: v as any })
                        }
                      >
                        <SelectTrigger
                          data-ocid="contracts.addendum.status.select"
                          className="bg-background border-border mt-1"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {["Taslak", "İmzalandı", "İptal"].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Açıklama</Label>
                      <Textarea
                        data-ocid="contracts.addendum.description.textarea"
                        value={newAddendum.description}
                        onChange={(e) =>
                          setNewAddendum({
                            ...newAddendum,
                            description: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                        rows={2}
                        placeholder="Adendum içeriği veya revizyon detayları"
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setAddendumOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="contracts.addendum.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddAddendum}
                    >
                      Adendum Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {companyAddendums.length === 0 ? (
            <Card
              data-ocid="contracts.addendums.empty_state"
              className="bg-card border-border"
            >
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <FilePlus className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Henüz adendum veya revizyon eklenmedi
                </p>
                {canEdit && (
                  <Button
                    className="gradient-bg text-white"
                    onClick={() => setAddendumOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Adendumu Ekle
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Adendum No
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Sözleşme
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Tür
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Açıklama
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Tutar Değişimi
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Revize Tutar
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Yürürlük
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
                    {companyAddendums.map((a, idx) => (
                      <TableRow
                        key={a.id}
                        data-ocid={`contracts.addendum.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="font-medium text-foreground">
                          {a.addendumNo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.contractNo || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              ADDENDUM_TYPE_STYLES[a.type] ||
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {a.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[160px] truncate">
                          {a.description || "-"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${a.amountChange >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {a.amountChange >= 0 ? "+" : ""}
                          {formatCurrency(a.amountChange)}
                        </TableCell>
                        <TableCell className="text-right text-amber-400">
                          {formatCurrency(a.revisedAmount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.effectiveDate || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={ADDENDUM_STATUS_STYLES[a.status]}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            {a.status === "Taslak" && (
                              <div className="flex gap-1">
                                <Button
                                  data-ocid={`contracts.addendum.sign.${idx + 1}`}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-400 hover:text-green-300"
                                  onClick={() =>
                                    handleAddendumStatus(a.id, "İmzalandı")
                                  }
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  data-ocid={`contracts.addendum.cancel.${idx + 1}`}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-400 hover:text-red-300"
                                  onClick={() =>
                                    handleAddendumStatus(a.id, "İptal")
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
