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
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  FileCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

type SubmittalStatus =
  | "Beklemede"
  | "İncelemede"
  | "Onaylandı"
  | "Reddedildi"
  | "Revizyon Gerekli";

interface HistoryEntry {
  id: string;
  date: string;
  user: string;
  status: SubmittalStatus;
  note: string;
}

interface MaterialSubmittal {
  id: string;
  submittalNo: string;
  malzemeAdi: string;
  spesifikasyon: string;
  tedarikci: string;
  miktar: string;
  birim: string;
  projeId: string;
  bolum: string;
  aciklama: string;
  durum: SubmittalStatus;
  versiyon: number;
  parentId: string | null;
  gonderiTarihi: string;
  companyId: string;
  history: HistoryEntry[];
}

const STATUS_STYLES: Record<SubmittalStatus, string> = {
  Beklemede: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  İncelemede: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Onaylandı: "bg-green-500/20 text-green-400 border-green-500/30",
  Reddedildi: "bg-red-500/20 text-red-400 border-red-500/30",
  "Revizyon Gerekli": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const STATUS_LIST: SubmittalStatus[] = [
  "Beklemede",
  "İncelemede",
  "Onaylandı",
  "Reddedildi",
  "Revizyon Gerekli",
];

const UNITS = [
  "adet",
  "kg",
  "ton",
  "m",
  "m²",
  "m³",
  "lt",
  "paket",
  "kutu",
  "rulo",
];

const BOLUMLER = [
  "Betonarme",
  "Çelik Yapı",
  "Cephe",
  "Çatı",
  "Elektrik",
  "Mekanik",
  "Isı Yalıtım",
  "Zemin",
  "Yol & Altyapı",
  "İç Mekan",
  "Diğer",
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function genSubmittalNo(list: MaterialSubmittal[]) {
  const max = list.reduce((acc, s) => {
    const m = s.submittalNo.match(/MS-(\d+)/);
    return m ? Math.max(acc, Number.parseInt(m[1])) : acc;
  }, 0);
  return `MS-${String(max + 1).padStart(3, "0")}`;
}

export default function MaterialSubmittals() {
  const { currentCompany, projects, checkPermission, user } = useApp();
  const companyId = currentCompany?.id || "";
  const storageKey = `materialSubmittals_${companyId}`;

  const [submittals, setSubmittals] = useState<MaterialSubmittal[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const save = (data: MaterialSubmittal[]) => {
    setSubmittals(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const canView = checkPermission("materialSubmittals", "view");
  const canEdit = checkPermission("materialSubmittals", "edit");

  const companyProjects = projects.filter((p) => p.companyId === companyId);

  // Filters
  const [filterProje, setFilterProje] = useState("all");
  const [filterDurum, setFilterDurum] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");

  // Modals
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionDialogType, setActionDialogType] = useState<
    null | "incele" | "onayla" | "reddet" | "revizyon"
  >(null);

  const [form, setForm] = useState({
    malzemeAdi: "",
    spesifikasyon: "",
    tedarikci: "",
    miktar: "",
    birim: "adet",
    projeId: "",
    bolum: "",
    aciklama: "",
    durum: "Beklemede" as SubmittalStatus,
  });

  const filtered = useMemo(() => {
    return submittals.filter((s) => {
      if (filterProje !== "all" && s.projeId !== filterProje) return false;
      if (filterDurum !== "all" && s.durum !== filterDurum) return false;
      if (
        filterSearch &&
        !s.malzemeAdi.toLowerCase().includes(filterSearch.toLowerCase()) &&
        !s.submittalNo.toLowerCase().includes(filterSearch.toLowerCase()) &&
        !s.tedarikci.toLowerCase().includes(filterSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [submittals, filterProje, filterDurum, filterSearch]);

  const selected = submittals.find((s) => s.id === selectedId) || null;

  const getProjectName = (id: string) =>
    companyProjects.find((p) => p.id === id)?.title || id || "-";

  const handleCreate = () => {
    if (!form.malzemeAdi.trim()) return;
    const now = new Date().toISOString();
    const userName = user?.name || "Kullanıcı";
    const newItem: MaterialSubmittal = {
      id: genId(),
      submittalNo: genSubmittalNo(submittals),
      malzemeAdi: form.malzemeAdi,
      spesifikasyon: form.spesifikasyon,
      tedarikci: form.tedarikci,
      miktar: form.miktar,
      birim: form.birim,
      projeId: form.projeId,
      bolum: form.bolum,
      aciklama: form.aciklama,
      durum: "Beklemede",
      versiyon: 1,
      parentId: null,
      gonderiTarihi: now,
      companyId,
      history: [
        {
          id: genId(),
          date: now,
          user: userName,
          status: "Beklemede",
          note: "Onay talebi oluşturuldu.",
        },
      ],
    };
    save([newItem, ...submittals]);
    setForm({
      malzemeAdi: "",
      spesifikasyon: "",
      tedarikci: "",
      miktar: "",
      birim: "adet",
      projeId: "",
      bolum: "",
      aciklama: "",
      durum: "Beklemede",
    });
    setNewOpen(false);
  };

  const applyAction = (
    type: "incele" | "onayla" | "reddet" | "revizyon",
    note: string,
  ) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    const userName = user?.name || "Kullanıcı";
    const statusMap: Record<string, SubmittalStatus> = {
      incele: "İncelemede",
      onayla: "Onaylandı",
      reddet: "Reddedildi",
      revizyon: "Revizyon Gerekli",
    };
    const newStatus = statusMap[type];

    if (type === "revizyon") {
      // Create new version
      const original = submittals.find((s) => s.id === selectedId);
      if (!original) return;
      const maxVer = submittals
        .filter((s) => s.parentId === original.parentId || s.id === original.id)
        .reduce((acc, s) => Math.max(acc, s.versiyon), original.versiyon);
      const newItem: MaterialSubmittal = {
        ...original,
        id: genId(),
        versiyon: maxVer + 1,
        durum: "Beklemede",
        parentId: original.parentId || original.id,
        gonderiTarihi: now,
        history: [
          {
            id: genId(),
            date: now,
            user: userName,
            status: "Beklemede",
            note: `v${maxVer + 1} revizyon oluşturuldu. ${note}`,
          },
        ],
      };
      const updated = submittals.map((s) =>
        s.id === selectedId
          ? {
              ...s,
              durum: "Revizyon Gerekli" as SubmittalStatus,
              history: [
                ...s.history,
                {
                  id: genId(),
                  date: now,
                  user: userName,
                  status: "Revizyon Gerekli" as SubmittalStatus,
                  note: note || "Revizyon talep edildi.",
                },
              ],
            }
          : s,
      );
      save([newItem, ...updated]);
      setSelectedId(newItem.id);
    } else {
      const updated = submittals.map((s) =>
        s.id === selectedId
          ? {
              ...s,
              durum: newStatus,
              history: [
                ...s.history,
                {
                  id: genId(),
                  date: now,
                  user: userName,
                  status: newStatus,
                  note:
                    note ||
                    {
                      incele: "İncelemeye alındı.",
                      onayla: "Onaylandı.",
                      reddet: "Reddedildi.",
                      revizyon: "Revizyon talep edildi.",
                    }[type],
                },
              ],
            }
          : s,
      );
      save(updated);
    }
    setActionDialogType(null);
    setActionNote("");
  };

  if (!canView) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <FileCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Malzeme Onay Talepleri
            </h1>
            <p className="text-sm text-muted-foreground">
              Material Submittal — malzeme onay süreçleri
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={() => setNewOpen(true)}
            data-ocid="submittal.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Onay Talebi
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-card/60 border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Malzeme adı, no, tedarikçi..."
              className="w-56 bg-background/50"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              data-ocid="submittal.search_input"
            />
            <Select value={filterProje} onValueChange={setFilterProje}>
              <SelectTrigger
                className="w-44 bg-background/50"
                data-ocid="submittal.select"
              >
                <SelectValue placeholder="Tüm Projeler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Projeler</SelectItem>
                {companyProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDurum} onValueChange={setFilterDurum}>
              <SelectTrigger
                className="w-44 bg-background/50"
                data-ocid="submittal.select"
              >
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {STATUS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_LIST.map((status) => {
          const count = submittals.filter(
            (s) => s.durum === status && s.companyId === companyId,
          ).length;
          return (
            <Card
              key={status}
              className="bg-card/60 border-border/50 cursor-pointer hover:border-amber-500/40 transition-colors"
              onClick={() =>
                setFilterDurum(filterDurum === status ? "all" : status)
              }
            >
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {status}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table or Empty */}
      {filtered.length === 0 ? (
        <Card
          className="bg-card/60 border-border/50"
          data-ocid="submittal.empty_state"
        >
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
              <ClipboardCheck className="w-10 h-10 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">
                Henüz onay talebi oluşturulmadı
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Malzeme kullanılmadan önce mühendis/işveren onayına sunun
              </p>
            </div>
            {canEdit && (
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => setNewOpen(true)}
                data-ocid="submittal.primary_button"
              >
                <Plus className="w-4 h-4 mr-2" />
                İlk Onay Talebi Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/60 border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table data-ocid="submittal.table">
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">No</TableHead>
                    <TableHead className="text-muted-foreground">
                      Malzeme Adı
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Proje
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Tedarikçi
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Bölüm
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Gönderim
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Ver.
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Durum
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, idx) => (
                    <TableRow
                      key={s.id}
                      className="border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedId(s.id)}
                      data-ocid={`submittal.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-amber-400 text-sm">
                        {s.submittalNo}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {s.malzemeAdi}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getProjectName(s.projeId)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.tedarikci || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.bolum || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(s.gonderiTarihi).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-amber-300/80">
                          v{s.versiyon}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs border ${STATUS_STYLES[s.durum]}`}
                        >
                          {s.durum}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Panel Dialog */}
      <Dialog
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
      >
        <DialogContent
          className="max-w-2xl bg-background border-border/60"
          data-ocid="submittal.dialog"
        >
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <span className="text-amber-400 font-mono">
                    {selected.submittalNo}
                  </span>
                  <span>— {selected.malzemeAdi}</span>
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    v{selected.versiyon}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="detay" className="mt-2">
                <TabsList className="bg-muted/30">
                  <TabsTrigger value="detay" data-ocid="submittal.tab">
                    Detay
                  </TabsTrigger>
                  <TabsTrigger value="gecmis" data-ocid="submittal.tab">
                    Revizyon Geçmişi
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detay" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Durum</p>
                      <Badge
                        className={`mt-1 border ${STATUS_STYLES[selected.durum]}`}
                      >
                        {selected.durum}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Proje</p>
                      <p className="text-sm text-white mt-1">
                        {getProjectName(selected.projeId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tedarikçi</p>
                      <p className="text-sm text-white mt-1">
                        {selected.tedarikci || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Miktar</p>
                      <p className="text-sm text-white mt-1">
                        {selected.miktar
                          ? `${selected.miktar} ${selected.birim}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Bölüm / İmalat
                      </p>
                      <p className="text-sm text-white mt-1">
                        {selected.bolum || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Gönderim Tarihi
                      </p>
                      <p className="text-sm text-white mt-1">
                        {new Date(selected.gonderiTarihi).toLocaleString(
                          "tr-TR",
                        )}
                      </p>
                    </div>
                  </div>
                  {selected.spesifikasyon && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Spesifikasyon / Teknik Detay
                      </p>
                      <p className="text-sm text-white mt-1 bg-muted/20 rounded p-3">
                        {selected.spesifikasyon}
                      </p>
                    </div>
                  )}
                  {selected.aciklama && (
                    <div>
                      <p className="text-xs text-muted-foreground">Açıklama</p>
                      <p className="text-sm text-white mt-1 bg-muted/20 rounded p-3">
                        {selected.aciklama}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {canEdit && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                      {selected.durum === "Beklemede" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => setActionDialogType("incele")}
                          data-ocid="submittal.secondary_button"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          İncelemeye Al
                        </Button>
                      )}
                      {(selected.durum === "Beklemede" ||
                        selected.durum === "İncelemede") && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600/80 hover:bg-green-600 text-white"
                            onClick={() => setActionDialogType("onayla")}
                            data-ocid="submittal.confirm_button"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                            onClick={() => setActionDialogType("reddet")}
                            data-ocid="submittal.delete_button"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reddet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                            onClick={() => setActionDialogType("revizyon")}
                            data-ocid="submittal.edit_button"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Revizyon İste
                          </Button>
                        </>
                      )}
                      {(selected.durum === "Onaylandı" ||
                        selected.durum === "Reddedildi" ||
                        selected.durum === "Revizyon Gerekli") && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Süreç tamamlandı — geçmişi inceleyebilirsiniz.
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="gecmis" className="mt-4">
                  <div className="space-y-3">
                    {selected.history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Henüz geçmiş kaydı yok.
                      </p>
                    ) : (
                      [...selected.history].reverse().map((h) => (
                        <div
                          key={h.id}
                          className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border/30"
                        >
                          <div className="mt-0.5">
                            <RefreshCw className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={`text-xs border ${STATUS_STYLES[h.status]}`}
                              >
                                {h.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {h.user} —{" "}
                                {new Date(h.date).toLocaleString("tr-TR")}
                              </span>
                            </div>
                            <p className="text-sm text-white/80 mt-1">
                              {h.note}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirm Dialog */}
      <Dialog
        open={!!actionDialogType}
        onOpenChange={(o) => {
          if (!o) {
            setActionDialogType(null);
            setActionNote("");
          }
        }}
      >
        <DialogContent className="max-w-sm bg-background border-border/60">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionDialogType === "incele" && "İncelemeye Al"}
              {actionDialogType === "onayla" && "Onayla"}
              {actionDialogType === "reddet" && "Reddet"}
              {actionDialogType === "revizyon" && "Revizyon İste"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-muted-foreground">Not (isteğe bağlı)</Label>
            <Textarea
              className="bg-background/50 resize-none"
              rows={3}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Açıklama veya not ekleyin..."
              data-ocid="submittal.textarea"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogType(null);
                setActionNote("");
              }}
              data-ocid="submittal.cancel_button"
            >
              İptal
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={() =>
                actionDialogType && applyAction(actionDialogType, actionNote)
              }
              data-ocid="submittal.submit_button"
            >
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Submittal Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent
          className="max-w-lg bg-background border-border/60"
          data-ocid="submittal.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              Yeni Malzeme Onay Talebi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Malzeme Adı *</Label>
              <Input
                className="bg-background/50"
                value={form.malzemeAdi}
                onChange={(e) =>
                  setForm((f) => ({ ...f, malzemeAdi: e.target.value }))
                }
                placeholder="Örn: C30/37 Beton, S420 Donatı Çeliği..."
                data-ocid="submittal.input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Spesifikasyon / Teknik Detay
              </Label>
              <Textarea
                className="bg-background/50 resize-none"
                rows={3}
                value={form.spesifikasyon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spesifikasyon: e.target.value }))
                }
                placeholder="Teknik özellikler, standartlar, sertifikalar..."
                data-ocid="submittal.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tedarikçi</Label>
                <Input
                  className="bg-background/50"
                  value={form.tedarikci}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tedarikci: e.target.value }))
                  }
                  placeholder="Tedarikçi adı"
                  data-ocid="submittal.input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Proje</Label>
                <Select
                  value={form.projeId}
                  onValueChange={(v) => setForm((f) => ({ ...f, projeId: v }))}
                >
                  <SelectTrigger
                    className="bg-background/50"
                    data-ocid="submittal.select"
                  >
                    <SelectValue placeholder="Proje seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Miktar</Label>
                <Input
                  className="bg-background/50"
                  type="number"
                  value={form.miktar}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, miktar: e.target.value }))
                  }
                  placeholder="0"
                  data-ocid="submittal.input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Birim</Label>
                <Select
                  value={form.birim}
                  onValueChange={(v) => setForm((f) => ({ ...f, birim: v }))}
                >
                  <SelectTrigger
                    className="bg-background/50"
                    data-ocid="submittal.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Bölüm / İmalat Kalemi
              </Label>
              <Select
                value={form.bolum}
                onValueChange={(v) => setForm((f) => ({ ...f, bolum: v }))}
              >
                <SelectTrigger
                  className="bg-background/50"
                  data-ocid="submittal.select"
                >
                  <SelectValue placeholder="Bölüm seçin" />
                </SelectTrigger>
                <SelectContent>
                  {BOLUMLER.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Açıklama</Label>
              <Textarea
                className="bg-background/50 resize-none"
                rows={2}
                value={form.aciklama}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aciklama: e.target.value }))
                }
                placeholder="Ek notlar..."
                data-ocid="submittal.textarea"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setNewOpen(false)}
              data-ocid="submittal.cancel_button"
            >
              İptal
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={handleCreate}
              disabled={!form.malzemeAdi.trim()}
              data-ocid="submittal.submit_button"
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
