import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  Calendar,
  CheckCircle2,
  DollarSign,
  Plus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { type LeaveType, useApp } from "../contexts/AppContext";

export default function SelfService() {
  const {
    activeCompanyId,
    user,
    hrPersonnel,
    hrLeaves,
    setHrLeaves,
    payrollRecords,
  } = useApp();

  // Find current user's personnel record
  const myPersonnel = hrPersonnel.find((p) => p.name === user?.name);

  const myLeaves = hrLeaves.filter(
    (l) => l.personnelId === myPersonnel?.id || l.name === user?.name,
  );

  const myPayroll = payrollRecords.filter(
    (p) =>
      p.companyId === activeCompanyId &&
      (myPersonnel
        ? p.personnelId === myPersonnel.id
        : p.personnelName === user?.name),
  );

  // Certifications stored in localStorage (HR module stores them separately)
  interface CertEntry {
    name: string;
    expiryDate?: string;
    issuer?: string;
    personnelId: string;
  }
  const allCerts: CertEntry[] = (() => {
    try {
      const s = localStorage.getItem(`pv_hr_certs_${activeCompanyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  })();
  const myCerts = allCerts.filter((c) => c.personnelId === myPersonnel?.id);

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "Yıllık" as LeaveType,
    startDate: "",
    endDate: "",
    note: "",
  });

  const handleSubmitLeave = () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !myPersonnel) return;
    const newLeave = {
      id: Date.now().toString(),
      name: user?.name || "",
      personnelId: myPersonnel.id,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      status: "Bekliyor" as const,
      note: leaveForm.note,
    };
    setHrLeaves([...hrLeaves, newLeave]);
    setLeaveForm({ type: "Yıllık", startDate: "", endDate: "", note: "" });
    setLeaveDialogOpen(false);
  };

  const STATUS_STYLES: Record<string, string> = {
    Bekliyor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Onaylandı: "bg-green-500/15 text-green-400 border-green-500/30",
    Reddedildi: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Öz Servis Portalı</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kişisel bilgileriniz, izin talepleriniz ve bordro geçmişiniz
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white text-xl font-bold">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {user?.name || "Kullanıcı"}
            </h2>
            {myPersonnel && (
              <>
                <p className="text-sm text-muted-foreground">
                  {myPersonnel.role || myPersonnel.department}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {myPersonnel.department}
                </p>
              </>
            )}
          </div>
        </div>
        {myPersonnel && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Durum</p>
              <p className="text-sm font-medium text-foreground">
                {myPersonnel.status}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Yıllık İzin Bakiyesi
              </p>
              <p className="text-sm font-medium text-amber-400">
                {myPersonnel.annualLeaveBalance ?? 20} gün
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Onaylı İzin</p>
              <p className="text-sm font-medium text-green-400">
                {myLeaves.filter((l) => l.status === "Onaylandı").length} talep
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sertifika</p>
              <p className="text-sm font-medium text-blue-400">
                {myCerts.length} adet
              </p>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="leaves">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="selfservice.leaves.tab"
            value="leaves"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white gap-2"
          >
            <Calendar className="w-4 h-4" />
            İzin Taleplerim
          </TabsTrigger>
          <TabsTrigger
            data-ocid="selfservice.payroll.tab"
            value="payroll"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Bordro Geçmişim
          </TabsTrigger>
          <TabsTrigger
            data-ocid="selfservice.certs.tab"
            value="certs"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white gap-2"
          >
            <Award className="w-4 h-4" />
            Sertifikalarım
          </TabsTrigger>
        </TabsList>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">
              İzin Taleplerim
            </h3>
            {myPersonnel && (
              <Button
                data-ocid="selfservice.leaves.add_button"
                onClick={() => setLeaveDialogOpen(true)}
                size="sm"
                className="gradient-bg text-white gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni Talep
              </Button>
            )}
          </div>
          {myLeaves.length === 0 ? (
            <div
              data-ocid="selfservice.leaves.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Henüz izin talebiniz yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeaves.map((leave, idx) => (
                <Card
                  key={leave.id}
                  data-ocid={`selfservice.leaves.item.${idx + 1}`}
                  className="bg-card border-border"
                >
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {leave.type}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {leave.startDate} – {leave.endDate}
                        </p>
                        {leave.note && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {leave.note}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`border text-xs ${STATUS_STYLES[leave.status] || ""}`}
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="mt-4">
          {myPayroll.length === 0 ? (
            <div
              data-ocid="selfservice.payroll.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <DollarSign className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Bordro kaydı bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPayroll.map((record, idx) => (
                <Card
                  key={record.id}
                  data-ocid={`selfservice.payroll.item.${idx + 1}`}
                  className="bg-card border-border"
                >
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {record.month}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Brüt:{" "}
                          {Number(record.grossSalary || 0).toLocaleString(
                            "tr-TR",
                          )}{" "}
                          ₺
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">
                          {Number(record.netSalary || 0).toLocaleString(
                            "tr-TR",
                          )}{" "}
                          ₺
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Net Maaş
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certs" className="mt-4">
          {myCerts.length === 0 ? (
            <div
              data-ocid="selfservice.certs.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Award className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Sertifika kaydı bulunamadı
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myCerts.map((cert, idx) => {
                const isExpired =
                  cert.expiryDate && new Date(cert.expiryDate) < new Date();
                const certKey = `cert-${cert.name}-${idx}`;
                return (
                  <Card
                    key={certKey}
                    data-ocid={`selfservice.certs.item.${idx + 1}`}
                    className="bg-card border-border"
                  >
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isExpired ? "bg-red-500/10" : "bg-amber-500/10"
                          }`}
                        >
                          <Award
                            className={`w-5 h-5 ${
                              isExpired ? "text-red-400" : "text-amber-400"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {cert.name}
                          </p>
                          {cert.issuer && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cert.issuer}
                            </p>
                          )}
                          {cert.expiryDate && (
                            <div className="flex items-center gap-1 mt-1">
                              {isExpired ? (
                                <XCircle className="w-3 h-3 text-red-400" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              )}
                              <span
                                className={`text-xs ${
                                  isExpired
                                    ? "text-red-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {isExpired ? "Süresi Dolmuş: " : "Son: "}
                                {cert.expiryDate}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Leave Request Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent
          data-ocid="selfservice.leaves.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Yeni İzin Talebi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>İzin Türü</Label>
              <Select
                value={leaveForm.type}
                onValueChange={(v) =>
                  setLeaveForm((prev) => ({ ...prev, type: v as LeaveType }))
                }
              >
                <SelectTrigger
                  data-ocid="selfservice.leaves.type_select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Yıllık">Yıllık İzin</SelectItem>
                  <SelectItem value="Hastalık">Hastalık İzni</SelectItem>
                  <SelectItem value="Mazeret">Mazeret İzni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Başlangıç *</Label>
                <Input
                  data-ocid="selfservice.leaves.start_input"
                  type="date"
                  min={today}
                  value={leaveForm.startDate}
                  onChange={(e) =>
                    setLeaveForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Bitiş *</Label>
                <Input
                  data-ocid="selfservice.leaves.end_input"
                  type="date"
                  min={leaveForm.startDate || today}
                  value={leaveForm.endDate}
                  onChange={(e) =>
                    setLeaveForm((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="selfservice.leaves.reason_textarea"
                value={leaveForm.note}
                onChange={(e) =>
                  setLeaveForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="İzin sebebinizi belirtin (opsiyonel)"
                className="bg-background border-border mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="selfservice.leaves.cancel_button"
              variant="outline"
              onClick={() => setLeaveDialogOpen(false)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="selfservice.leaves.submit_button"
              onClick={handleSubmitLeave}
              disabled={
                !leaveForm.startDate || !leaveForm.endDate || !myPersonnel
              }
              className="gradient-bg text-white"
            >
              Talep Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
