import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../contexts/AppContext";

export default function ProjectPL() {
  const { activeCompanyId, projects } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  const financeKey = `pv_finance_${activeCompanyId}`;
  const purchaseKey = `pv_purchases_${activeCompanyId}`;
  const hakedisKey = `pv_hakedis_${activeCompanyId}`;

  const financeRecords: {
    id: string;
    tur: string;
    tutar: string;
    proje?: string;
    tarih?: string;
    aciklama?: string;
  }[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(financeKey) || "[]");
    } catch {
      return [];
    }
  }, [financeKey]);

  const purchaseRecords: {
    id: string;
    toplamTutar?: string;
    projeAdi?: string;
    tarih?: string;
  }[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(purchaseKey) || "[]");
    } catch {
      return [];
    }
  }, [purchaseKey]);

  const hakedisRecords: {
    id: string;
    toplamTutar?: string;
    projeId?: string;
    durum?: string;
  }[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(hakedisKey) || "[]");
    } catch {
      return [];
    }
  }, [hakedisKey]);

  const projectPLData = useMemo(() => {
    return projects.map((project) => {
      // Gelirler: finance gelir kayıtları + onaylı hakedişler
      const financeGelir = financeRecords
        .filter(
          (r) =>
            r.tur === "Gelir" &&
            (r.proje === project.title || r.proje === project.id),
        )
        .reduce((s, r) => s + (Number.parseFloat(r.tutar) || 0), 0);

      const hakedisGelir = hakedisRecords
        .filter((r) => r.projeId === project.id && r.durum === "Onaylandı")
        .reduce(
          (s, r) => s + (Number.parseFloat(r.toplamTutar || "0") || 0),
          0,
        );

      const toplamGelir = financeGelir + hakedisGelir;

      // Giderler: finance gider kayıtları + satın alma siparişleri
      const financeGider = financeRecords
        .filter(
          (r) =>
            r.tur === "Gider" &&
            (r.proje === project.title || r.proje === project.id),
        )
        .reduce((s, r) => s + (Number.parseFloat(r.tutar) || 0), 0);

      const satinAlmaGider = purchaseRecords
        .filter((r) => r.projeAdi === project.title)
        .reduce(
          (s, r) => s + (Number.parseFloat(r.toplamTutar || "0") || 0),
          0,
        );

      const toplamGider = financeGider + satinAlmaGider;

      const budget = Number.parseFloat(String(project.budget || "0"));
      const netKarZarar = toplamGelir - toplamGider;
      const marj = toplamGelir > 0 ? (netKarZarar / toplamGelir) * 100 : 0;
      const butceKullanim = budget > 0 ? (toplamGider / budget) * 100 : 0;

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        budget,
        toplamGelir,
        toplamGider,
        netKarZarar,
        marj,
        butceKullanim,
        financeGelir,
        hakedisGelir,
        financeGider,
        satinAlmaGider,
      };
    });
  }, [projects, financeRecords, hakedisRecords, purchaseRecords]);

  const selectedPL =
    selectedProjectId === "all"
      ? null
      : projectPLData.find((p) => p.id === selectedProjectId);

  const portfolioTotals = useMemo(() => {
    return projectPLData.reduce(
      (acc, p) => ({
        gelir: acc.gelir + p.toplamGelir,
        gider: acc.gider + p.toplamGider,
        net: acc.net + p.netKarZarar,
        budget: acc.budget + p.budget,
      }),
      { gelir: 0, gider: 0, net: 0, budget: 0 },
    );
  }, [projectPLData]);

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Proje Gelir-Gider Özeti (P&L)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proje bazlı kar-zarar analizi ve gelir-gider dağılımı
          </p>
        </div>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger
            data-ocid="pl.project_select"
            className="w-52 bg-background border-border"
          >
            <SelectValue placeholder="Proje Seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Projeler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
              Toplam Gelir
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-green-400">
              {fmt(selectedPL ? selectedPL.toplamGelir : portfolioTotals.gelir)}{" "}
              ₺
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
              Toplam Gider
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-red-400">
              {fmt(selectedPL ? selectedPL.toplamGider : portfolioTotals.gider)}{" "}
              ₺
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              Net Kar / Zarar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {(() => {
              const net = selectedPL
                ? selectedPL.netKarZarar
                : portfolioTotals.net;
              return (
                <div className="flex items-center gap-1">
                  {net >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <p
                    className={`text-xl font-bold ${
                      net >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {fmt(net)} ₺
                  </p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Kar Marjı
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {(() => {
              const g = selectedPL
                ? selectedPL.toplamGelir
                : portfolioTotals.gelir;
              const n = selectedPL
                ? selectedPL.netKarZarar
                : portfolioTotals.net;
              const marj = g > 0 ? (n / g) * 100 : 0;
              return (
                <p
                  className={`text-xl font-bold ${
                    marj >= 0 ? "text-primary" : "text-red-400"
                  }`}
                >
                  %{marj.toFixed(1)}
                </p>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Proje Karşılaştırması</TabsTrigger>
          <TabsTrigger value="detail">Gelir/Gider Detayı</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz proje eklenmedi.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-auto">
              <Table data-ocid="pl.projects_table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Bütçe (₺)</TableHead>
                    <TableHead className="text-right">Gelir (₺)</TableHead>
                    <TableHead className="text-right">Gider (₺)</TableHead>
                    <TableHead className="text-right">Net K/Z (₺)</TableHead>
                    <TableHead className="text-right">Kar Marjı</TableHead>
                    <TableHead className="text-right">Bütçe Kullanım</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectPLData
                    .filter(
                      (p) =>
                        selectedProjectId === "all" ||
                        p.id === selectedProjectId,
                    )
                    .map((p, idx) => (
                      <TableRow data-ocid={`pl.row.${idx + 1}`} key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "completed"
                                ? "default"
                                : p.status === "active"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {p.status || "Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {p.budget > 0 ? fmt(p.budget) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-green-400 font-medium">
                          {p.toplamGelir > 0 ? fmt(p.toplamGelir) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-red-400 font-medium">
                          {p.toplamGider > 0 ? fmt(p.toplamGider) : "-"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            p.netKarZarar >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {p.toplamGelir > 0 || p.toplamGider > 0
                            ? fmt(p.netKarZarar)
                            : "-"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            p.marj >= 0 ? "text-primary" : "text-red-400"
                          }`}
                        >
                          {p.toplamGelir > 0 ? `%${p.marj.toFixed(1)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.budget > 0 ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-muted rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    p.butceKullanim > 90
                                      ? "bg-destructive"
                                      : p.butceKullanim > 70
                                        ? "bg-yellow-500"
                                        : "bg-primary"
                                  }`}
                                  style={{
                                    width: `${Math.min(p.butceKullanim, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                %{p.butceKullanim.toFixed(0)}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          {selectedProjectId === "all" ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Detay görüntülemek için yukarıdan bir proje seçin.
              </p>
            </div>
          ) : selectedPL ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-green-400 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Gelir Kalemleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Finans Gelirleri
                    </span>
                    <span className="font-medium text-green-400">
                      {fmt(selectedPL.financeGelir)} ₺
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Onaylı Hakedişler
                    </span>
                    <span className="font-medium text-green-400">
                      {fmt(selectedPL.hakedisGelir)} ₺
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold">Toplam Gelir</span>
                    <span className="font-bold text-green-400 text-lg">
                      {fmt(selectedPL.toplamGelir)} ₺
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4" />
                    Gider Kalemleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Finans Giderleri
                    </span>
                    <span className="font-medium text-red-400">
                      {fmt(selectedPL.financeGider)} ₺
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Satın Alma Siparişleri
                    </span>
                    <span className="font-medium text-red-400">
                      {fmt(selectedPL.satinAlmaGider)} ₺
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold">Toplam Gider</span>
                    <span className="font-bold text-red-400 text-lg">
                      {fmt(selectedPL.toplamGider)} ₺
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2 bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Net Kar / Zarar
                      </p>
                      <p
                        className={`text-3xl font-bold mt-1 ${
                          selectedPL.netKarZarar >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {fmt(selectedPL.netKarZarar)} ₺
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Kar Marjı</p>
                      <p
                        className={`text-3xl font-bold mt-1 ${
                          selectedPL.marj >= 0 ? "text-primary" : "text-red-400"
                        }`}
                      >
                        %{selectedPL.marj.toFixed(1)}
                      </p>
                    </div>
                    {selectedPL.budget > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Bütçe Kullanımı
                        </p>
                        <p
                          className={`text-3xl font-bold mt-1 ${
                            selectedPL.butceKullanim > 90
                              ? "text-red-400"
                              : "text-primary"
                          }`}
                        >
                          %{selectedPL.butceKullanim.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
