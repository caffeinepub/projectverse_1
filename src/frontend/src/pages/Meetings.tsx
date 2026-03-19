import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { CalendarCheck, CheckSquare, Clock, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

type ActionStatus = "Bekliyor" | "Devam Ediyor" | "Tamamlandı";

interface ActionItem {
  id: string;
  description: string;
  responsible: string;
  dueDate: string;
  status: ActionStatus;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string;
  meetingType: string;
  agenda: string;
  attendees: string[];
  decisions: string;
  actions: ActionItem[];
  status: "Planlandı" | "Tamamlandı";
}

const MEETING_TYPES = ["Saha", "Proje", "Yönetim", "Teknik", "Acil"];
const ACTION_STATUSES: ActionStatus[] = [
  "Bekliyor",
  "Devam Ediyor",
  "Tamamlandı",
];

const _ACTION_STATUS_COLORS: Record<ActionStatus, string> = {
  Bekliyor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Devam Ediyor": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Tamamlandı: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function Meetings() {
  const { hrPersonnel, currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "default";
  const storageKey = `pv_meetings_${companyId}`;

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [openNew, setOpenNew] = useState(false);
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    meetingType: "Proje",
    agenda: "",
    attendees: [] as string[],
    decisions: "",
  });
  const [actionForm, setActionForm] = useState({
    description: "",
    responsible: "",
    dueDate: "",
  });

  const save = (updated: Meeting[]) => {
    setMeetings(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.title || !form.date) {
      toast.error("Başlık ve tarih zorunludur");
      return;
    }
    const m: Meeting = {
      id: Date.now().toString(),
      ...form,
      actions: [],
      status: new Date(form.date) > new Date() ? "Planlandı" : "Tamamlandı",
    };
    save([m, ...meetings]);
    toast.success("Toplantı eklendi");
    setOpenNew(false);
    setForm({
      title: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      meetingType: "Proje",
      agenda: "",
      attendees: [],
      decisions: "",
    });
  };

  const handleAddAction = (meetingId: string) => {
    if (!actionForm.description) {
      toast.error("Aksiyon açıklaması zorunludur");
      return;
    }
    const action: ActionItem = {
      id: Date.now().toString(),
      ...actionForm,
      status: "Bekliyor",
    };
    const updated = meetings.map((m) =>
      m.id === meetingId ? { ...m, actions: [...m.actions, action] } : m,
    );
    save(updated);
    toast.success("Aksiyon eklendi");
    setOpenAction(null);
    setActionForm({ description: "", responsible: "", dueDate: "" });
  };

  const updateActionStatus = (
    meetingId: string,
    actionId: string,
    status: ActionStatus,
  ) => {
    const updated = meetings.map((m) =>
      m.id === meetingId
        ? {
            ...m,
            actions: m.actions.map((a) =>
              a.id === actionId ? { ...a, status } : a,
            ),
          }
        : m,
    );
    save(updated);
  };

  const now = new Date();
  const thisMonth = meetings.filter((m) => {
    const d = new Date(m.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const allActions = meetings.flatMap((m) => m.actions);
  const openActions = allActions.filter(
    (a) => a.status !== "Tamamlandı",
  ).length;
  const completedActions = allActions.filter(
    (a) => a.status === "Tamamlandı",
  ).length;

  const toggleAttendee = (name: string) => {
    setForm((f) => ({
      ...f,
      attendees: f.attendees.includes(name)
        ? f.attendees.filter((a) => a !== name)
        : [...f.attendees, name],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Toplantı Tutanakları
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Toplantı yönetimi ve aksiyon takibi
          </p>
        </div>
        <Button
          data-ocid="meetings.open_modal_button"
          onClick={() => setOpenNew(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Toplantı
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Toplantı",
            value: meetings.length,
            icon: <CalendarCheck className="w-5 h-5" />,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Açık Aksiyon",
            value: openActions,
            icon: <Clock className="w-5 h-5" />,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
          {
            label: "Bu Ay",
            value: thisMonth.length,
            icon: <Users className="w-5 h-5" />,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Tamamlanan Aksiyon",
            value: completedActions,
            icon: <CheckSquare className="w-5 h-5" />,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
        ].map((k) => (
          <Card key={k.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg} ${k.color}`}>
                {k.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {meetings.length === 0 ? (
        <div
          data-ocid="meetings.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Henüz toplantı kaydı yok
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            İlk toplantı tutanağını oluşturun
          </p>
          <Button
            onClick={() => setOpenNew(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Toplantı Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m, i) => (
            <Card
              key={m.id}
              className="bg-card border-border"
              data-ocid={`meetings.item.${i + 1}`}
            >
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base text-foreground">
                      {m.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {m.meetingType}
                    </Badge>
                    <Badge
                      className={`text-xs border ${m.status === "Tamamlandı" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}
                    >
                      {m.status}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{m.date}</div>
                    <div>{m.location}</div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>
                    <Users className="w-3 h-3 inline mr-1" />
                    {m.attendees.length} katılımcı
                  </span>
                  <span>
                    <CheckSquare className="w-3 h-3 inline mr-1" />
                    {m.actions.length} aksiyon
                  </span>
                </div>
              </CardHeader>
              {expandedId === m.id && (
                <CardContent className="pt-0">
                  {m.agenda && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        GÜNDEM
                      </p>
                      <p className="text-sm text-foreground">{m.agenda}</p>
                    </div>
                  )}
                  {m.decisions && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        KARARLAR
                      </p>
                      <p className="text-sm text-foreground">{m.decisions}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      AKSİYONLAR
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenAction(m.id)}
                      className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 h-6 text-xs"
                      data-ocid={`meetings.edit_button.${i + 1}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Aksiyon Ekle
                    </Button>
                  </div>
                  {m.actions.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-xs">Görev</TableHead>
                          <TableHead className="text-xs">Sorumlu</TableHead>
                          <TableHead className="text-xs">Termin</TableHead>
                          <TableHead className="text-xs">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {m.actions.map((a) => (
                          <TableRow key={a.id} className="border-border">
                            <TableCell className="text-sm">
                              {a.description}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.responsible}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.dueDate}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={a.status}
                                onValueChange={(v) =>
                                  updateActionStatus(
                                    m.id,
                                    a.id,
                                    v as ActionStatus,
                                  )
                                }
                              >
                                <SelectTrigger className="h-7 text-xs w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACTION_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New Meeting Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="meetings.dialog"
        >
          <DialogHeader>
            <DialogTitle>Yeni Toplantı</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            <div>
              <Label>Başlık *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Haftalık ilerleme toplantısı"
                data-ocid="meetings.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tarih *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="meetings.input"
                />
              </div>
              <div>
                <Label>Tür</Label>
                <Select
                  value={form.meetingType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, meetingType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Yer</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Ofis / Şantiye"
                data-ocid="meetings.input"
              />
            </div>
            <div>
              <Label>Gündem</Label>
              <Textarea
                rows={2}
                value={form.agenda}
                onChange={(e) =>
                  setForm((f) => ({ ...f, agenda: e.target.value }))
                }
                data-ocid="meetings.textarea"
              />
            </div>
            <div>
              <Label>Katılımcılar</Label>
              <div className="grid grid-cols-2 gap-1 mt-1 max-h-32 overflow-y-auto border border-border rounded p-2">
                {hrPersonnel.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`att-${p.id}`}
                      checked={form.attendees.includes(p.name)}
                      onCheckedChange={() => toggleAttendee(p.name)}
                      data-ocid="meetings.checkbox"
                    />
                    <label
                      htmlFor={`att-${p.id}`}
                      className="text-xs text-foreground cursor-pointer"
                    >
                      {p.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Kararlar</Label>
              <Textarea
                rows={2}
                value={form.decisions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, decisions: e.target.value }))
                }
                data-ocid="meetings.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenNew(false)}
              data-ocid="meetings.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="meetings.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog
        open={!!openAction}
        onOpenChange={(o) => !o && setOpenAction(null)}
      >
        <DialogContent
          className="max-w-md bg-card border-border"
          data-ocid="meetings.dialog"
        >
          <DialogHeader>
            <DialogTitle>Aksiyon Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Görev Açıklaması *</Label>
              <Textarea
                rows={2}
                value={actionForm.description}
                onChange={(e) =>
                  setActionForm((f) => ({ ...f, description: e.target.value }))
                }
                data-ocid="meetings.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sorumlu</Label>
                <Input
                  value={actionForm.responsible}
                  onChange={(e) =>
                    setActionForm((f) => ({
                      ...f,
                      responsible: e.target.value,
                    }))
                  }
                  data-ocid="meetings.input"
                />
              </div>
              <div>
                <Label>Termin</Label>
                <Input
                  type="date"
                  value={actionForm.dueDate}
                  onChange={(e) =>
                    setActionForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  data-ocid="meetings.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenAction(null)}
              data-ocid="meetings.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={() => openAction && handleAddAction(openAction)}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="meetings.submit_button"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
