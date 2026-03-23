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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Edit,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface InsurancePolicy {
  id: string;
  policyNo: string;
  type: string;
  company: string;
  startDate: string;
  endDate: string;
  premium: string;
  status: string;
  notes: string;
}

interface EquipmentWarranty {
  id: string;
  equipmentName: string;
  supplier: string;
  purchaseDate: string;
  warrantyEnd: string;
  status: string;
  notes: string;
}

const INSURANCE_TYPES = [
  "İnşaat All Risk",
  "İşveren Sorumluluk",
  "Mesleki Sorumluluk",
  "Taşıt Sigortası",
  "Yangın Sigortası",
  "Kaza Sigortası",
  "Diğer",
];

function daysUntil(dateStr: string): number {
  if (!dateStr) return 9999;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Insurance() {
  const { activeCompanyId } = useApp();
  const insKey = `pv_insurance_${activeCompanyId}`;
  const warKey = `pv_warranty_${activeCompanyId}`;

  const [policies, setPolicies] = useState<InsurancePolicy[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(insKey) || "[]");
    } catch {
      return [];
    }
  });
  const [warranties, setWarranties] = useState<EquipmentWarranty[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(warKey) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(insKey, JSON.stringify(policies));
  }, [policies, insKey]);
  useEffect(() => {
    localStorage.setItem(warKey, JSON.stringify(warranties));
  }, [warranties, warKey]);

  const [policyDialog, setPolicyDialog] = useState(false);
  const [warrantyDialog, setWarrantyDialog] = useState(false);
  const [editPolicyId, setEditPolicyId] = useState<string | null>(null);
  const [editWarrantyId, setEditWarrantyId] = useState<string | null>(null);

  const EMPTY_POLICY: Omit<InsurancePolicy, "id"> = {
    policyNo: "",
    type: "",
    company: "",
    startDate: "",
    endDate: "",
    premium: "",
    status: "Aktif",
    notes: "",
  };
  const EMPTY_WARRANTY: Omit<EquipmentWarranty, "id"> = {
    equipmentName: "",
    supplier: "",
    purchaseDate: "",
    warrantyEnd: "",
    status: "Aktif",
    notes: "",
  };

  const [policyForm, setPolicyForm] =
    useState<Omit<InsurancePolicy, "id">>(EMPTY_POLICY);
  const [warrantyForm, setWarrantyForm] =
    useState<Omit<EquipmentWarranty, "id">>(EMPTY_WARRANTY);

  const openAddPolicy = () => {
    setEditPolicyId(null);
    setPolicyForm(EMPTY_POLICY);
    setPolicyDialog(true);
  };
  const openEditPolicy = (p: InsurancePolicy) => {
    setEditPolicyId(p.id);
    setPolicyForm({
      policyNo: p.policyNo,
      type: p.type,
      company: p.company,
      startDate: p.startDate,
      endDate: p.endDate,
      premium: p.premium,
      status: p.status,
      notes: p.notes,
    });
    setPolicyDialog(true);
  };
  const openAddWarranty = () => {
    setEditWarrantyId(null);
    setWarrantyForm(EMPTY_WARRANTY);
    setWarrantyDialog(true);
  };
  const openEditWarranty = (w: EquipmentWarranty) => {
    setEditWarrantyId(w.id);
    setWarrantyForm({
      equipmentName: w.equipmentName,
      supplier: w.supplier,
      purchaseDate: w.purchaseDate,
      warrantyEnd: w.warrantyEnd,
      status: w.status,
      notes: w.notes,
    });
    setWarrantyDialog(true);
  };

  const savePolicy = () => {
    if (!policyForm.policyNo || !policyForm.type || !policyForm.company) return;
    if (editPolicyId) {
      setPolicies((p) =>
        p.map((x) => (x.id === editPolicyId ? { ...x, ...policyForm } : x)),
      );
    } else {
      setPolicies((p) => [...p, { id: crypto.randomUUID(), ...policyForm }]);
    }
    setPolicyDialog(false);
  };

  const saveWarranty = () => {
    if (!warrantyForm.equipmentName || !warrantyForm.supplier) return;
    if (editWarrantyId) {
      setWarranties((p) =>
        p.map((x) => (x.id === editWarrantyId ? { ...x, ...warrantyForm } : x)),
      );
    } else {
      setWarranties((p) => [
        ...p,
        { id: crypto.randomUUID(), ...warrantyForm },
      ]);
    }
    setWarrantyDialog(false);
  };

  const expiringPolicies = policies.filter((p) => {
    const d = daysUntil(p.endDate);
    return d >= 0 && d <= 30;
  });
  const expiringWarranties = warranties.filter((w) => {
    const d = daysUntil(w.warrantyEnd);
    return d >= 0 && d <= 30;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Sigorta & Garanti Takibi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Poliçe ve ekipman garanti yönetimi
        </p>
      </div>

      {/* Expiry Warnings */}
      {(expiringPolicies.length > 0 || expiringWarranties.length > 0) && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-400 font-medium text-sm">
                Yaklaşan Son Tarihler (30 gün içinde)
              </p>
              <ul className="text-amber-300/80 text-xs mt-1 space-y-0.5">
                {expiringPolicies.map((p) => (
                  <li key={p.id}>
                    • Poliçe {p.policyNo} — {daysUntil(p.endDate)} gün kaldı
                  </li>
                ))}
                {expiringWarranties.map((w) => (
                  <li key={w.id}>
                    • {w.equipmentName} garantisi — {daysUntil(w.warrantyEnd)}{" "}
                    gün kaldı
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="policies">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="insurance.policies.tab"
            value="policies"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white text-xs md:text-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Sigorta Poliçeleri (
            {policies.length})
          </TabsTrigger>
          <TabsTrigger
            data-ocid="insurance.warranties.tab"
            value="warranties"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white text-xs md:text-sm"
          >
            <Wrench className="w-3.5 h-3.5 mr-1.5" /> Ekipman Garantileri (
            {warranties.length})
          </TabsTrigger>
        </TabsList>

        {/* POLICIES TAB */}
        <TabsContent value="policies" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              data-ocid="insurance.policy.open_modal_button"
              onClick={openAddPolicy}
              className="gradient-bg text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Poliçe Ekle
            </Button>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {policies.length === 0 ? (
                <div
                  data-ocid="insurance.policies.empty_state"
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Henüz sigorta poliçesi yok
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Poliçe No
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Tür
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Sigorta Şirketi
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Başlangıç
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Bitiş
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Prim
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Durum
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((p, idx) => {
                      const days = daysUntil(p.endDate);
                      const expiring = days >= 0 && days <= 30;
                      return (
                        <TableRow
                          key={p.id}
                          data-ocid={`insurance.policy.item.${idx + 1}`}
                          className="border-border hover:bg-muted/30"
                        >
                          <TableCell className="font-mono text-xs text-amber-400">
                            {p.policyNo}
                          </TableCell>
                          <TableCell className="text-sm">{p.type}</TableCell>
                          <TableCell className="text-sm">{p.company}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.startDate}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span
                              className={
                                expiring
                                  ? "text-amber-400 font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {p.endDate}
                            </span>
                            {expiring && (
                              <Badge className="ml-2 text-xs bg-amber-500/15 text-amber-400 border-amber-500/30 border">
                                {days}g
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.premium
                              ? `${Number(p.premium).toLocaleString("tr-TR")} ₺`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs border ${p.status === "Aktif" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                data-ocid={`insurance.policy.edit_button.${idx + 1}`}
                                onClick={() => openEditPolicy(p)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                data-ocid={`insurance.policy.delete_button.${idx + 1}`}
                                onClick={() =>
                                  setPolicies((prev) =>
                                    prev.filter((x) => x.id !== p.id),
                                  )
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WARRANTIES TAB */}
        <TabsContent value="warranties" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              data-ocid="insurance.warranty.open_modal_button"
              onClick={openAddWarranty}
              className="gradient-bg text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Garanti Ekle
            </Button>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {warranties.length === 0 ? (
                <div
                  data-ocid="insurance.warranties.empty_state"
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Wrench className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Henüz garanti kaydı yok
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Ekipman
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Tedarikçi
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Satın Alma
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Garanti Bitiş
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Durum
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warranties.map((w, idx) => {
                      const days = daysUntil(w.warrantyEnd);
                      const expiring = days >= 0 && days <= 30;
                      return (
                        <TableRow
                          key={w.id}
                          data-ocid={`insurance.warranty.item.${idx + 1}`}
                          className="border-border hover:bg-muted/30"
                        >
                          <TableCell className="text-sm font-medium">
                            {w.equipmentName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {w.supplier}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {w.purchaseDate}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span
                              className={
                                expiring
                                  ? "text-amber-400 font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {w.warrantyEnd}
                            </span>
                            {expiring && (
                              <Badge className="ml-2 text-xs bg-amber-500/15 text-amber-400 border-amber-500/30 border">
                                {days}g
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs border ${w.status === "Aktif" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
                            >
                              {w.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                data-ocid={`insurance.warranty.edit_button.${idx + 1}`}
                                onClick={() => openEditWarranty(w)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                data-ocid={`insurance.warranty.delete_button.${idx + 1}`}
                                onClick={() =>
                                  setWarranties((prev) =>
                                    prev.filter((x) => x.id !== w.id),
                                  )
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Policy Dialog */}
      <Dialog open={policyDialog} onOpenChange={setPolicyDialog}>
        <DialogContent
          data-ocid="insurance.policy.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editPolicyId ? "Poliçeyi Düzenle" : "Yeni Poliçe"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Poliçe No *</Label>
              <Input
                data-ocid="insurance.policy.input"
                className="border-border bg-background"
                placeholder="POL-2025-001"
                value={policyForm.policyNo}
                onChange={(e) =>
                  setPolicyForm((p) => ({ ...p, policyNo: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Tür *</Label>
              <Select
                value={policyForm.type}
                onValueChange={(v) => setPolicyForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="insurance.policy.type.select"
                >
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  {INSURANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Sigorta Şirketi *</Label>
              <Input
                className="border-border bg-background"
                placeholder="Şirket adı"
                value={policyForm.company}
                onChange={(e) =>
                  setPolicyForm((p) => ({ ...p, company: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Başlangıç Tarihi</Label>
              <Input
                type="date"
                className="border-border bg-background"
                value={policyForm.startDate}
                onChange={(e) =>
                  setPolicyForm((p) => ({ ...p, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Bitiş Tarihi</Label>
              <Input
                type="date"
                className="border-border bg-background"
                value={policyForm.endDate}
                onChange={(e) =>
                  setPolicyForm((p) => ({ ...p, endDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Prim (₺)</Label>
              <Input
                type="number"
                className="border-border bg-background"
                placeholder="0"
                value={policyForm.premium}
                onChange={(e) =>
                  setPolicyForm((p) => ({ ...p, premium: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Durum</Label>
              <Select
                value={policyForm.status}
                onValueChange={(v) =>
                  setPolicyForm((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="insurance.policy.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Pasif">Pasif</SelectItem>
                  <SelectItem value="İptal">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Notlar</Label>
              <Textarea
                className="border-border bg-background resize-none"
                rows={2}
                value={policyForm.notes}
                onChange={(e) =>
                  setPolicyForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="insurance.policy.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setPolicyDialog(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="insurance.policy.submit_button"
              className="gradient-bg text-white"
              onClick={savePolicy}
              disabled={
                !policyForm.policyNo || !policyForm.type || !policyForm.company
              }
            >
              {editPolicyId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warranty Dialog */}
      <Dialog open={warrantyDialog} onOpenChange={setWarrantyDialog}>
        <DialogContent
          data-ocid="insurance.warranty.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editWarrantyId ? "Garantiyi Düzenle" : "Yeni Garanti"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Ekipman Adı *</Label>
              <Input
                data-ocid="insurance.warranty.input"
                className="border-border bg-background"
                placeholder="Ekipman adı"
                value={warrantyForm.equipmentName}
                onChange={(e) =>
                  setWarrantyForm((p) => ({
                    ...p,
                    equipmentName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Tedarikçi *</Label>
              <Input
                className="border-border bg-background"
                placeholder="Tedarikçi"
                value={warrantyForm.supplier}
                onChange={(e) =>
                  setWarrantyForm((p) => ({ ...p, supplier: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Satın Alma Tarihi</Label>
              <Input
                type="date"
                className="border-border bg-background"
                value={warrantyForm.purchaseDate}
                onChange={(e) =>
                  setWarrantyForm((p) => ({
                    ...p,
                    purchaseDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Garanti Bitiş</Label>
              <Input
                type="date"
                className="border-border bg-background"
                value={warrantyForm.warrantyEnd}
                onChange={(e) =>
                  setWarrantyForm((p) => ({
                    ...p,
                    warrantyEnd: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Durum</Label>
              <Select
                value={warrantyForm.status}
                onValueChange={(v) =>
                  setWarrantyForm((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="insurance.warranty.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Süresi Doldu">Süresi Doldu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Notlar</Label>
              <Textarea
                className="border-border bg-background resize-none"
                rows={2}
                value={warrantyForm.notes}
                onChange={(e) =>
                  setWarrantyForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="insurance.warranty.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setWarrantyDialog(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="insurance.warranty.submit_button"
              className="gradient-bg text-white"
              onClick={saveWarranty}
              disabled={!warrantyForm.equipmentName || !warrantyForm.supplier}
            >
              {editWarrantyId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
