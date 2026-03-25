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
import { BookMarked, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface Procedure {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  version: string;
  effectiveDate: string;
  status: string;
}

interface WorkInstruction {
  id: string;
  title: string;
  procedureId: string;
  steps: string;
  responsibleRole: string;
}

interface RevisionLog {
  id: string;
  docType: string;
  docTitle: string;
  change: string;
  changedBy: string;
  date: string;
}

const CATEGORIES = ["İSG", "Kalite", "Teknik", "İdari", "Çevre"];
const STATUSES = ["Aktif", "Taslak", "Geçersiz"];

const emptyProc = (): Omit<Procedure, "id"> => ({
  code: "",
  title: "",
  category: "Kalite",
  description: "",
  version: "1.0",
  effectiveDate: "",
  status: "Taslak",
});

const emptyWI = (): Omit<WorkInstruction, "id"> => ({
  title: "",
  procedureId: "",
  steps: "",
  responsibleRole: "",
});

export default function QualityManual() {
  const { activeCompanyId, user } = useApp();
  const key = `pv_qualitymanual_${activeCompanyId}`;
  const wiKey = `pv_workinstructions_${activeCompanyId}`;
  const revKey = `pv_qualityrevisions_${activeCompanyId}`;

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [workInstructions, setWorkInstructions] = useState<WorkInstruction[]>(
    [],
  );
  const [revisions, setRevisions] = useState<RevisionLog[]>([]);

  const [showProcDialog, setShowProcDialog] = useState(false);
  const [showWIDialog, setShowWIDialog] = useState(false);
  const [editingProc, setEditingProc] = useState<Procedure | null>(null);
  const [procForm, setProcForm] = useState(emptyProc());
  const [wiForm, setWIForm] = useState(emptyWI());

  useEffect(() => {
    setProcedures(JSON.parse(localStorage.getItem(key) || "[]"));
    setWorkInstructions(JSON.parse(localStorage.getItem(wiKey) || "[]"));
    setRevisions(JSON.parse(localStorage.getItem(revKey) || "[]"));
  }, [key, wiKey, revKey]);

  const saveProcs = (data: Procedure[]) => {
    setProcedures(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const saveWIs = (data: WorkInstruction[]) => {
    setWorkInstructions(data);
    localStorage.setItem(wiKey, JSON.stringify(data));
  };

  const addRevision = (docType: string, docTitle: string, change: string) => {
    const log: RevisionLog = {
      id: Date.now().toString(),
      docType,
      docTitle,
      change,
      changedBy: user?.name ?? "Sistem",
      date: new Date().toLocaleDateString("tr-TR"),
    };
    const updated = [log, ...revisions];
    setRevisions(updated);
    localStorage.setItem(revKey, JSON.stringify(updated));
  };

  const handleSaveProc = () => {
    if (!procForm.title || !procForm.code) return;
    if (editingProc) {
      const updated = procedures.map((p) =>
        p.id === editingProc.id ? { ...editingProc, ...procForm } : p,
      );
      saveProcs(updated);
      addRevision("Prosedür", procForm.title, "Prosedür güncellendi");
    } else {
      const newProc = { id: Date.now().toString(), ...procForm };
      saveProcs([...procedures, newProc]);
      addRevision("Prosedür", procForm.title, "Yeni prosedür eklendi");
    }
    setShowProcDialog(false);
    setEditingProc(null);
    setProcForm(emptyProc());
  };

  const handleDeleteProc = (id: string) => {
    const proc = procedures.find((p) => p.id === id);
    saveProcs(procedures.filter((p) => p.id !== id));
    if (proc) addRevision("Prosedür", proc.title, "Prosedür silindi");
  };

  const handleSaveWI = () => {
    if (!wiForm.title) return;
    const newWI = { id: Date.now().toString(), ...wiForm };
    saveWIs([...workInstructions, newWI]);
    addRevision("İş Talimatı", wiForm.title, "Yeni iş talimatı eklendi");
    setShowWIDialog(false);
    setWIForm(emptyWI());
  };

  const statusColor = (s: string) => {
    if (s === "Aktif")
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (s === "Taslak")
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookMarked className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Kalite El Kitabı
          </h1>
          <p className="text-muted-foreground text-sm">
            Şirket kalite prosedürleri ve iş talimatları
          </p>
        </div>
      </div>

      <Tabs defaultValue="procedures">
        <TabsList>
          <TabsTrigger value="procedures">Prosedürler</TabsTrigger>
          <TabsTrigger value="instructions">İş Talimatları</TabsTrigger>
          <TabsTrigger value="revisions">Revizyon Geçmişi</TabsTrigger>
        </TabsList>

        <TabsContent value="procedures" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Prosedürler</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingProc(null);
                  setProcForm(emptyProc());
                  setShowProcDialog(true);
                }}
                data-ocid="quality_manual.primary_button"
              >
                <Plus className="w-4 h-4 mr-1" /> Prosedür Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {procedures.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="quality_manual.empty_state"
                >
                  <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Henüz prosedür yok</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Versiyon</TableHead>
                      <TableHead>Geçerlilik</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.map((p, i) => (
                      <TableRow
                        key={p.id}
                        data-ocid={`quality_manual.item.${i + 1}`}
                      >
                        <TableCell className="font-mono text-amber-400">
                          {p.code}
                        </TableCell>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>{p.version}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.effectiveDate}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColor(p.status)}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingProc(p);
                                setProcForm({
                                  code: p.code,
                                  title: p.title,
                                  category: p.category,
                                  description: p.description,
                                  version: p.version,
                                  effectiveDate: p.effectiveDate,
                                  status: p.status,
                                });
                                setShowProcDialog(true);
                              }}
                              data-ocid={`quality_manual.edit_button.${i + 1}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProc(p.id)}
                              data-ocid={`quality_manual.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">İş Talimatları</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowWIDialog(true)}
                data-ocid="quality_manual.secondary_button"
              >
                <Plus className="w-4 h-4 mr-1" /> Talimat Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {workInstructions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Henüz iş talimatı yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workInstructions.map((wi, i) => (
                    <Card
                      key={wi.id}
                      className="border-border"
                      data-ocid={`quality_manual.instruction.item.${i + 1}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{wi.title}</p>
                            {wi.responsibleRole && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Sorumlu: {wi.responsibleRole}
                              </p>
                            )}
                            {wi.steps && (
                              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                                {wi.steps}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setWorkInstructions((prev) => {
                                const updated = prev.filter(
                                  (w) => w.id !== wi.id,
                                );
                                localStorage.setItem(
                                  wiKey,
                                  JSON.stringify(updated),
                                );
                                return updated;
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revisions" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Revizyon Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {revisions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Henüz revizyon kaydı yok
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Değişiklik</TableHead>
                      <TableHead>Değiştiren</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revisions.map((r, i) => (
                      <TableRow
                        key={r.id}
                        data-ocid={`quality_manual.revision.item.${i + 1}`}
                      >
                        <TableCell className="text-sm text-muted-foreground">
                          {r.date}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.docType}</Badge>
                        </TableCell>
                        <TableCell>{r.docTitle}</TableCell>
                        <TableCell>{r.change}</TableCell>
                        <TableCell>{r.changedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Procedure Dialog */}
      <Dialog open={showProcDialog} onOpenChange={setShowProcDialog}>
        <DialogContent className="max-w-lg" data-ocid="quality_manual.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingProc ? "Prosedür Düzenle" : "Prosedür Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kod</Label>
                <Input
                  placeholder="P-001"
                  value={procForm.code}
                  onChange={(e) =>
                    setProcForm((f) => ({ ...f, code: e.target.value }))
                  }
                  data-ocid="quality_manual.input"
                />
              </div>
              <div>
                <Label>Versiyon</Label>
                <Input
                  placeholder="1.0"
                  value={procForm.version}
                  onChange={(e) =>
                    setProcForm((f) => ({ ...f, version: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Başlık</Label>
              <Input
                placeholder="Prosedür adı"
                value={procForm.title}
                onChange={(e) =>
                  setProcForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={procForm.category}
                  onValueChange={(v) =>
                    setProcForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durum</Label>
                <Select
                  value={procForm.status}
                  onValueChange={(v) =>
                    setProcForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Geçerlilik Tarihi</Label>
              <Input
                type="date"
                value={procForm.effectiveDate}
                onChange={(e) =>
                  setProcForm((f) => ({ ...f, effectiveDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                rows={3}
                value={procForm.description}
                onChange={(e) =>
                  setProcForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcDialog(false)}
              data-ocid="quality_manual.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveProc}
              data-ocid="quality_manual.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Instruction Dialog */}
      <Dialog open={showWIDialog} onOpenChange={setShowWIDialog}>
        <DialogContent
          className="max-w-lg"
          data-ocid="quality_manual.wi_dialog"
        >
          <DialogHeader>
            <DialogTitle>İş Talimatı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Başlık</Label>
              <Input
                value={wiForm.title}
                onChange={(e) =>
                  setWIForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>İlgili Prosedür</Label>
              <Select
                value={wiForm.procedureId}
                onValueChange={(v) =>
                  setWIForm((f) => ({ ...f, procedureId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Prosedür seçin" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sorumlu Rol</Label>
              <Input
                value={wiForm.responsibleRole}
                onChange={(e) =>
                  setWIForm((f) => ({ ...f, responsibleRole: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Adımlar</Label>
              <Textarea
                rows={4}
                placeholder="Her satıra bir adım..."
                value={wiForm.steps}
                onChange={(e) =>
                  setWIForm((f) => ({ ...f, steps: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWIDialog(false)}
              data-ocid="quality_manual.wi_cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveWI}
              data-ocid="quality_manual.wi_submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
