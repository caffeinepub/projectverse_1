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
  CheckCircle2,
  FileSignature,
  Plus,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Quote, QuoteItem } from "../contexts/AppContext";
import { useApp } from "../contexts/AppContext";

type QuoteStatus = Quote["status"];

const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string }> =
  {
    draft: {
      label: "Taslak",
      className: "bg-muted text-muted-foreground border-border",
    },
    sent: {
      label: "Gönderildi",
      className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    accepted: {
      label: "Kabul Edildi",
      className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    rejected: {
      label: "Reddedildi",
      className: "bg-destructive/20 text-destructive border-destructive/30",
    },
  };

const NEXT_STATUS: Record<QuoteStatus, QuoteStatus | null> = {
  draft: "sent",
  sent: "accepted",
  accepted: null,
  rejected: null,
};

const NEXT_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Gönder",
  sent: "Kabul Et",
  accepted: "",
  rejected: "",
};

function emptyItem(): QuoteItem {
  return {
    id: `qi${Date.now()}${Math.random()}`,
    description: "",
    unit: "Adet",
    quantity: 1,
    unitPrice: 0,
    total: 0,
  };
}

export default function Quotes() {
  const {
    quotes,
    setQuotes,
    crmLeads,
    crmContacts,
    auditLogs,
    addAuditLog,
    user,
  } = useApp();

  const [addOpen, setAddOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);

  const [form, setForm] = useState({
    title: "",
    leadId: "",
    contactId: "",
    contactName: "",
    validUntil: "",
    notes: "",
  });
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);

  const openAdd = () => {
    setForm({
      title: "",
      leadId: "",
      contactId: "",
      contactName: "",
      validUntil: "",
      notes: "",
    });
    setItems([emptyItem()]);
    setEditQuote(null);
    setAddOpen(true);
  };

  const openEdit = (q: Quote) => {
    setEditQuote(q);
    setForm({
      title: q.title,
      leadId: q.leadId || "",
      contactId: q.contactId || "",
      contactName: "",
      validUntil: q.validUntil,
      notes: q.notes,
    });
    setItems(q.items.length > 0 ? q.items : [emptyItem()]);
    setAddOpen(true);
  };

  const totalAmount = items.reduce((s, i) => s + i.total, 0);

  const handleItemChange = (
    idx: number,
    field: keyof QuoteItem,
    value: string | number,
  ) => {
    setItems((prev) => {
      const updated = prev.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          next.total =
            (field === "quantity" ? Number(value) : item.quantity) *
            (field === "unitPrice" ? Number(value) : item.unitPrice);
        }
        return next;
      });
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Teklif başlığı zorunludur");
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      toast.error("Tüm kalemlerin açıklaması dolu olmalı");
      return;
    }

    if (editQuote) {
      const updated = quotes.map((q) =>
        q.id === editQuote.id
          ? {
              ...q,
              title: form.title,
              leadId: form.leadId || undefined,
              contactId: form.contactId || undefined,
              validUntil: form.validUntil,
              notes: form.notes,
              items,
              totalAmount,
            }
          : q,
      );
      setQuotes(updated);
      addAuditLog({
        module: "quotes",
        action: "Güncellendi",
        description: `Teklif düzenlendi: ${form.title}`,
        performedBy: user?.name || "?",
      });
      toast.success("Teklif güncellendi");
    } else {
      const newQuote: Quote = {
        id: `q${Date.now()}`,
        title: form.title,
        leadId: form.leadId || undefined,
        contactId: form.contactId || undefined,
        items,
        totalAmount,
        status: "draft",
        validUntil: form.validUntil,
        notes: form.notes,
        companyId: "",
        createdAt: new Date().toISOString(),
        createdBy: user?.name || "?",
      };
      setQuotes([newQuote, ...quotes]);
      addAuditLog({
        module: "quotes",
        action: "Oluşturuldu",
        description: `Yeni teklif: ${form.title} (${totalAmount.toLocaleString("tr-TR")} ₺)`,
        performedBy: user?.name || "?",
      });
      toast.success("Teklif oluşturuldu");
    }
    setAddOpen(false);
  };

  const handleAdvanceStatus = (q: Quote) => {
    const next = NEXT_STATUS[q.status];
    if (!next) return;
    const updated = quotes.map((qq) =>
      qq.id === q.id ? { ...qq, status: next } : qq,
    );
    setQuotes(updated);
    addAuditLog({
      module: "quotes",
      action: "Durum Güncellendi",
      description: `${q.title}: ${STATUS_CONFIG[q.status].label} → ${STATUS_CONFIG[next].label}`,
      performedBy: user?.name || "?",
    });
    toast.success(`Durum güncellendi: ${STATUS_CONFIG[next].label}`);
  };

  const handleReject = (q: Quote) => {
    const updated = quotes.map((qq) =>
      qq.id === q.id ? { ...qq, status: "rejected" as QuoteStatus } : qq,
    );
    setQuotes(updated);
    addAuditLog({
      module: "quotes",
      action: "Reddedildi",
      description: `${q.title} reddedildi`,
      performedBy: user?.name || "?",
    });
    toast.success("Teklif reddedildi");
  };

  const handleDelete = (id: string) => {
    const q = quotes.find((x) => x.id === id);
    setQuotes(quotes.filter((x) => x.id !== id));
    addAuditLog({
      module: "quotes",
      action: "Silindi",
      description: `Teklif silindi: ${q?.title || id}`,
      performedBy: user?.name || "?",
    });
    toast.success("Teklif silindi");
  };

  const getContactName = (q: Quote) => {
    if (q.contactId) {
      const c = crmContacts.find((x) => x.id === q.contactId);
      if (c) return c.name;
    }
    if (q.leadId) {
      const l = crmLeads.find((x) => x.id === q.leadId);
      if (l) return l.title;
    }
    return "-";
  };

  const kpi = {
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
  };

  const quoteAuditLogs = auditLogs.filter((l) => l.module === "quotes");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileSignature className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Teklif & Keşif</h1>
          <p className="text-sm text-muted-foreground">
            Müşteri teklifleri ve keşif kalemleri
          </p>
        </div>
      </div>

      <Tabs defaultValue="quotes">
        <TabsList className="bg-card border border-border">
          <TabsTrigger data-ocid="quotes.tab" value="quotes">
            Teklifler
          </TabsTrigger>
          <TabsTrigger data-ocid="quotes.items.tab" value="items">
            Keşif Kalemleri
          </TabsTrigger>
          <TabsTrigger data-ocid="quotes.audit.tab" value="audit">
            Denetim Logu
          </TabsTrigger>
        </TabsList>

        {/* ─── QUOTES TAB ─── */}
        <TabsContent value="quotes" className="mt-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Toplam Teklif</p>
                <p
                  data-ocid="quotes.total.card"
                  className="text-2xl font-bold text-foreground mt-1"
                >
                  {kpi.total}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Taslak</p>
                <p className="text-2xl font-bold text-muted-foreground mt-1">
                  {kpi.draft}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Gönderildi</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {kpi.sent}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Kabul Edildi</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {kpi.accepted}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end">
            <Button
              data-ocid="quotes.primary_button"
              onClick={openAdd}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Teklif
            </Button>
          </div>

          {/* Quotes List */}
          {quotes.length === 0 ? (
            <div
              data-ocid="quotes.empty_state"
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <FileSignature className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">Henüz teklif oluşturulmadı.</p>
              <p className="text-xs mt-1 opacity-70">
                Müşteriler için teklif hazırlamaya başlayın.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {quotes.map((q, idx) => {
                const sc = STATUS_CONFIG[q.status];
                const next = NEXT_STATUS[q.status];
                return (
                  <Card
                    key={q.id}
                    data-ocid={`quotes.item.${idx + 1}`}
                    className="bg-card border-border hover:border-primary/30 transition-colors"
                  >
                    <CardContent className="pt-4 pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">
                              {q.title}
                            </span>
                            <Badge variant="outline" className={sc.className}>
                              {sc.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Müşteri: {getContactName(q)}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            <span>
                              Toplam:{" "}
                              <span className="text-primary font-semibold">
                                {q.totalAmount.toLocaleString("tr-TR")} ₺
                              </span>
                            </span>
                            {q.validUntil && (
                              <span>Geçerlilik: {q.validUntil}</span>
                            )}
                            <span>
                              {new Date(q.createdAt).toLocaleDateString(
                                "tr-TR",
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {next && (
                            <Button
                              data-ocid={`quotes.submit_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              className="border-primary/30 hover:bg-primary/10 text-primary"
                              onClick={() => handleAdvanceStatus(q)}
                            >
                              <Send className="w-3.5 h-3.5 mr-1" />
                              {NEXT_STATUS_LABEL[q.status]}
                            </Button>
                          )}
                          {q.status === "sent" && (
                            <Button
                              data-ocid={`quotes.delete_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                              onClick={() => handleReject(q)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reddet
                            </Button>
                          )}
                          <Button
                            data-ocid={`quotes.edit_button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="border-border"
                            onClick={() => openEdit(q)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(q.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── ITEMS TAB ─── */}
        <TabsContent value="items" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Tüm Keşif Kalemleri</CardTitle>
            </CardHeader>
            <CardContent>
              {quotes.flatMap((q) => q.items).length === 0 ? (
                <div
                  data-ocid="quotes.items.empty_state"
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  Henüz keşif kalemi yok.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teklif</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.flatMap((q) =>
                      q.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {q.title}
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice.toLocaleString("tr-TR")} ₺
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.total.toLocaleString("tr-TR")} ₺
                          </TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── AUDIT TAB ─── */}
        <TabsContent value="audit" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Denetim Logu</CardTitle>
            </CardHeader>
            <CardContent>
              {quoteAuditLogs.length === 0 ? (
                <div
                  data-ocid="quotes.audit.empty_state"
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  Henüz işlem kaydı yok.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>Detay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteAuditLogs.slice(0, 100).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.performedBy}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── ADD / EDIT DIALOG ─── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          data-ocid="quotes.dialog"
          className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editQuote ? "Teklifi Düzenle" : "Yeni Teklif"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Teklif Başlığı *</Label>
                <Input
                  data-ocid="quotes.input"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Teklif adını girin"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1">
                <Label>CRM Fırsatı (opsiyonel)</Label>
                <Select
                  value={form.leadId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, leadId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="quotes.select"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Fırsat seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none">-- Seçme --</SelectItem>
                    {crmLeads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Müşteri</Label>
                <Select
                  value={form.contactId}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      contactId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none">-- Seçme --</SelectItem>
                    {crmContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Geçerlilik Tarihi</Label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validUntil: e.target.value }))
                  }
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1">
                <Label>Not</Label>
                <Textarea
                  data-ocid="quotes.textarea"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Teklif notu..."
                  className="bg-background border-border resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Kalemler</Label>
                <Button
                  data-ocid="quotes.secondary_button"
                  size="sm"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={addItem}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Kalem Ekle
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="w-20">Birim</TableHead>
                      <TableHead className="w-20">Miktar</TableHead>
                      <TableHead className="w-28">Birim Fiyat</TableHead>
                      <TableHead className="w-28">Toplam</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Açıklama"
                            className="bg-background border-border h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            onChange={(e) =>
                              handleItemChange(idx, "unit", e.target.value)
                            }
                            placeholder="Adet"
                            className="bg-background border-border h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            className="bg-background border-border h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                            className="bg-background border-border h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          {item.total.toLocaleString("tr-TR")} ₺
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-right text-sm font-semibold"
                      >
                        Toplam:
                      </TableCell>
                      <TableCell className="text-sm font-bold text-primary">
                        {totalAmount.toLocaleString("tr-TR")} ₺
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="quotes.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setAddOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="quotes.save_button"
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {editQuote ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
