import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../contexts/AppContext";

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  expectedDate: string;
  deliveredDate?: string;
  category?: string;
  qualityScore?: number;
  priceScore?: number;
}

export default function SupplyChainAnalysis() {
  const { activeCompanyId, suppliers } = useApp();

  const orders: PurchaseOrder[] = useMemo(() => {
    return JSON.parse(
      localStorage.getItem(`pv_purchaseOrders_${activeCompanyId}`) || "[]",
    );
  }, [activeCompanyId]);

  const companySuppliers = useMemo(() => suppliers ?? [], [suppliers]);

  const supplierStats = useMemo(() => {
    return companySuppliers.map((sup: { id: string; name: string }) => {
      const supOrders = orders.filter(
        (o) => o.supplierId === sup.id || o.supplierName === sup.name,
      );
      const delivered = supOrders.filter(
        (o) => o.status === "Teslim Edildi" || o.status === "delivered",
      );
      const delayed = supOrders.filter((o) => {
        if (!o.expectedDate || !o.deliveredDate) return false;
        return new Date(o.deliveredDate) > new Date(o.expectedDate);
      });
      const onTimeRate =
        delivered.length > 0
          ? Math.round(
              ((delivered.length - delayed.length) / delivered.length) * 100,
            )
          : 0;
      const avgQuality =
        supOrders.reduce((s, o) => s + (o.qualityScore ?? 3), 0) /
        Math.max(supOrders.length, 1);
      const avgPrice =
        supOrders.reduce((s, o) => s + (o.priceScore ?? 3), 0) /
        Math.max(supOrders.length, 1);
      const overall = Math.round((onTimeRate / 20 + avgQuality + avgPrice) / 3);
      return {
        id: sup.id,
        name: sup.name,
        totalOrders: supOrders.length,
        onTimeRate,
        avgQuality: Math.round(avgQuality * 10) / 10,
        avgPrice: Math.round(avgPrice * 10) / 10,
        overall,
        delayedCount: delayed.length,
        trend: onTimeRate >= 80 ? "up" : "down",
      };
    });
  }, [companySuppliers, orders]);

  const delayedOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (!o.expectedDate) return false;
        const ref = o.deliveredDate ? new Date(o.deliveredDate) : new Date();
        return ref > new Date(o.expectedDate);
      })
      .map((o) => {
        const ref = o.deliveredDate ? new Date(o.deliveredDate) : new Date();
        const days = Math.ceil(
          (ref.getTime() - new Date(o.expectedDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return { ...o, delayDays: days };
      });
  }, [orders]);

  const avgDelivery =
    supplierStats.length > 0
      ? Math.round(
          supplierStats.reduce((s, sup) => s + sup.onTimeRate, 0) /
            supplierStats.length,
        )
      : 0;

  const topPerformer = supplierStats.sort((a, b) => b.overall - a.overall)[0];

  const categoryMap = useMemo(() => {
    const map: Record<string, { supplierName: string; score: number }[]> = {};
    for (const sup of supplierStats) {
      const supCatOrders = orders.filter(
        (o) => o.supplierName === sup.name && o.category,
      );
      for (const o of supCatOrders) {
        const cat = o.category ?? "Genel";
        if (!map[cat]) map[cat] = [];
        const existing = map[cat].find((e) => e.supplierName === sup.name);
        if (!existing)
          map[cat].push({ supplierName: sup.name, score: sup.overall });
      }
    }
    return map;
  }, [supplierStats, orders]);

  const scoreColor = (score: number) => {
    if (score >= 4) return "text-green-400";
    if (score >= 3) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Network className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tedarik Zinciri Analizi
          </h1>
          <p className="text-muted-foreground text-sm">
            Tedarikçi performansı ve gecikme analizi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">
              Ort. Teslimat Performansı
            </p>
            <p className="text-3xl font-bold text-amber-400">%{avgDelivery}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">
              Toplam Gecikmeli Sipariş
            </p>
            <p className="text-3xl font-bold text-red-400">
              {delayedOrders.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">En İyi Tedarikçi</p>
            <p className="text-lg font-bold text-green-400">
              {topPerformer?.name ?? "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Tedarikçi Performansı</TabsTrigger>
          <TabsTrigger value="delays">Gecikme Analizi</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatif Öneriler</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">
                Tedarikçi Performans Tablosu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supplierStats.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="supply_chain.empty_state"
                >
                  <Network className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>
                    Tedarikçi ve sipariş verisi için önce Satın Alma modülüne
                    gidin
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead className="text-right">
                        Toplam Sipariş
                      </TableHead>
                      <TableHead className="text-right">Zamanında %</TableHead>
                      <TableHead className="text-right">Kalite Skoru</TableHead>
                      <TableHead className="text-right">Fiyat Skoru</TableHead>
                      <TableHead className="text-right">Genel Skor</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierStats.map((s, i) => (
                      <TableRow
                        key={s.id}
                        data-ocid={`supply_chain.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">
                          {s.totalOrders}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              s.onTimeRate >= 80
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            %{s.onTimeRate}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right ${scoreColor(s.avgQuality)}`}
                        >
                          {s.avgQuality}
                        </TableCell>
                        <TableCell
                          className={`text-right ${scoreColor(s.avgPrice)}`}
                        >
                          {s.avgPrice}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${scoreColor(s.overall)}`}
                        >
                          {s.overall}
                        </TableCell>
                        <TableCell>
                          {s.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delays" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Gecikmeli Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              {delayedOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Gecikmeli sipariş tespit edilmedi</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead>Beklenen Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">
                        Gecikme (gün)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delayedOrders.map((o, i) => (
                      <TableRow
                        key={o.id}
                        data-ocid={`supply_chain.delay.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {o.supplierName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {o.expectedDate}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-red-400 font-bold">
                          +{o.delayDays} gün
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alternatives" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">
                Kategori Bazlı Alternatif Öneriler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(categoryMap).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>
                    Kategori verisi için siparişlere kategori bilgisi ekleyin
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(categoryMap).map(([cat, supList]) => (
                    <div key={cat}>
                      <p className="text-sm font-medium text-amber-400 mb-2">
                        {cat}
                      </p>
                      <div className="space-y-1">
                        {supList
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 3)
                          .map((s, i) => (
                            <div
                              key={s.supplierName}
                              className="flex items-center justify-between p-2 rounded bg-muted/20"
                            >
                              <span className="text-sm">
                                {i + 1}. {s.supplierName}
                              </span>
                              <Badge
                                className={
                                  s.score >= 4
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }
                              >
                                Skor: {s.score}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
