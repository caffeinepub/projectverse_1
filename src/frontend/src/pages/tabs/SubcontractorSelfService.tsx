import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Building2, DollarSign, FileText } from "lucide-react";
import { useMemo, useState } from "react";

interface Subcontractor {
  id: string;
  name: string;
}

interface SubContract {
  id: string;
  subcontractorId: string;
  projectName: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface SubPayment {
  id: string;
  subcontractorId: string;
  amount: number;
  date: string;
  description: string;
  status: string;
}

const CONTRACT_STATUS_STYLES: Record<string, string> = {
  "Devam Ediyor": "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Tamamlandı: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  İptal: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
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

export default function SubcontractorSelfService({
  companyId,
  subcontractors,
}: {
  companyId: string;
  subcontractors: Subcontractor[];
}) {
  const [selectedId, setSelectedId] = useState("");

  const contracts = useMemo((): SubContract[] => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_contracts_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  }, [companyId]);

  const payments = useMemo((): SubPayment[] => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_payments_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  }, [companyId]);

  const myContracts = contracts.filter((c) => c.subcontractorId === selectedId);
  const myPayments = payments.filter((p) => p.subcontractorId === selectedId);

  const totalContract = myContracts.reduce((s, c) => s + c.amount, 0);
  const paidAmount = myPayments
    .filter((p) => p.status === "Ödendi")
    .reduce((s, p) => s + p.amount, 0);
  const pendingAmount = myPayments
    .filter((p) => p.status !== "Ödendi")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Taşeron Öz Servis Portalı
        </h2>
        <p className="text-sm text-muted-foreground">
          Taşeron firma bazında sözleşme, ödeme ve hakediş özeti
        </p>
      </div>

      <div className="max-w-xs">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger
            data-ocid="subcontractor.selfservice.select"
            className="bg-card border-border"
          >
            <SelectValue placeholder="Taşeron firma seçin" />
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

      {!selectedId ? (
        <div
          data-ocid="subcontractor.selfservice.empty_state"
          className="text-center py-14"
        >
          <Building2 className="w-12 h-12 mx-auto mb-3 text-amber-500/30" />
          <p className="text-muted-foreground">
            Görüntülemek için bir taşeron firma seçin.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Toplam Sözleşme Tutarı
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totalContract)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {myContracts.length} sözleşme
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Ödenen Tutar
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-emerald-400">
                  {formatCurrency(paidAmount)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  Bekleyen Ödemeler
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-amber-400">
                  {formatCurrency(pendingAmount)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contracts */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Sözleşmeler
            </h3>
            {myContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sözleşme bulunamadı.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Proje</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myContracts.map((c, idx) => (
                      <TableRow
                        key={c.id}
                        data-ocid={`subcontractor.selfservice.contract.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="font-medium">
                          {c.projectName}
                        </TableCell>
                        <TableCell>{formatCurrency(c.amount)}</TableCell>
                        <TableCell>{c.startDate}</TableCell>
                        <TableCell>{c.endDate}</TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${CONTRACT_STATUS_STYLES[c.status] || ""}`}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Payments */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Ödeme Geçmişi
            </h3>
            {myPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ödeme kaydı bulunamadı.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Tarih</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myPayments.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        data-ocid={`subcontractor.selfservice.payment.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{p.description}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${PAYMENT_STATUS_STYLES[p.status] || ""}`}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
