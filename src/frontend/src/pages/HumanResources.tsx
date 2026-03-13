import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Check,
  Clock,
  FileText,
  Plus,
  Search,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

type LeaveStatus = "Bekliyor" | "Onaylandı" | "Reddedildi";
type LeaveType = "Yıllık" | "Hastalık" | "Mazeret";

interface Personnel {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  status: "Aktif" | "Pasif";
  initials: string;
  color: string;
}

interface LeaveRequest {
  id: string;
  name: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  note: string;
}

interface ShiftAssignment {
  day: string;
  shift: string;
  personnel: string[];
}

const INITIAL_PERSONNEL: Personnel[] = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    role: "Teknik Yönetici",
    department: "Teknik",
    phone: "0532 111 2233",
    email: "ahmet@sirket.com",
    status: "Aktif",
    initials: "AY",
    color: "#7c3aed",
  },
  {
    id: "2",
    name: "Fatma Kaya",
    role: "İdari Yönetici",
    department: "İdari",
    phone: "0535 222 3344",
    email: "fatma@sirket.com",
    status: "Aktif",
    initials: "FK",
    color: "#0891b2",
  },
  {
    id: "3",
    name: "Mehmet Demir",
    role: "Saha Personeli",
    department: "Teknik",
    phone: "0537 333 4455",
    email: "mehmet@sirket.com",
    status: "Aktif",
    initials: "MD",
    color: "#059669",
  },
  {
    id: "4",
    name: "Zeynep Arslan",
    role: "Muhasebe Personeli",
    department: "İdari",
    phone: "0538 444 5566",
    email: "zeynep@sirket.com",
    status: "Aktif",
    initials: "ZA",
    color: "#d97706",
  },
  {
    id: "5",
    name: "Ali Çelik",
    role: "Proje Yöneticisi",
    department: "Teknik",
    phone: "0539 555 6677",
    email: "ali@sirket.com",
    status: "Pasif",
    initials: "AÇ",
    color: "#dc2626",
  },
  {
    id: "6",
    name: "Selin Öztürk",
    role: "İnsan Kaynakları",
    department: "İdari",
    phone: "0541 666 7788",
    email: "selin@sirket.com",
    status: "Aktif",
    initials: "SÖ",
    color: "#be185d",
  },
];

const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: "1",
    name: "Mehmet Demir",
    type: "Yıllık",
    startDate: "2026-03-20",
    endDate: "2026-03-25",
    status: "Bekliyor",
    note: "Aile ziyareti",
  },
  {
    id: "2",
    name: "Zeynep Arslan",
    type: "Hastalık",
    startDate: "2026-03-14",
    endDate: "2026-03-15",
    status: "Onaylandı",
    note: "Doktor raporu mevcut",
  },
  {
    id: "3",
    name: "Ali Çelik",
    type: "Mazeret",
    startDate: "2026-03-16",
    endDate: "2026-03-16",
    status: "Bekliyor",
    note: "Resmi işlem",
  },
  {
    id: "4",
    name: "Ahmet Yılmaz",
    type: "Yıllık",
    startDate: "2026-04-01",
    endDate: "2026-04-07",
    status: "Onaylandı",
    note: "Tatil",
  },
  {
    id: "5",
    name: "Selin Öztürk",
    type: "Hastalık",
    startDate: "2026-03-13",
    endDate: "2026-03-13",
    status: "Reddedildi",
    note: "",
  },
];

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SHIFTS = [
  { key: "sabah", label: "Sabah", time: "08:00-16:00" },
  { key: "ogleden", label: "Öğleden Sonra", time: "16:00-00:00" },
  { key: "gece", label: "Gece", time: "00:00-08:00" },
];

const INITIAL_SHIFTS: ShiftAssignment[] = [
  { day: "Pzt", shift: "sabah", personnel: ["Ahmet Y.", "Mehmet D."] },
  { day: "Pzt", shift: "ogleden", personnel: ["Fatma K."] },
  { day: "Pzt", shift: "gece", personnel: ["Ali Ç."] },
  { day: "Sal", shift: "sabah", personnel: ["Zeynep A.", "Selin Ö."] },
  { day: "Sal", shift: "ogleden", personnel: ["Mehmet D."] },
  { day: "Çar", shift: "sabah", personnel: ["Ahmet Y."] },
  { day: "Per", shift: "sabah", personnel: ["Fatma K.", "Ali Ç."] },
  { day: "Per", shift: "gece", personnel: ["Zeynep A."] },
  { day: "Cum", shift: "sabah", personnel: ["Ahmet Y.", "Selin Ö."] },
  { day: "Cum", shift: "ogleden", personnel: ["Mehmet D."] },
];

export default function HumanResources() {
  const { activeRoleId } = useApp();
  const isManager =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "manager_teknik" ||
    activeRoleId === "manager_idari";

  const [personnel, setPersonnel] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [shifts, setShifts] = useState<ShiftAssignment[]>(INITIAL_SHIFTS);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Tümü");
  const [newPersonnel, setNewPersonnel] = useState({
    name: "",
    role: "",
    department: "Teknik",
    phone: "",
    email: "",
  });
  const [newLeave, setNewLeave] = useState({
    type: "Yıllık" as LeaveType,
    startDate: "",
    endDate: "",
    note: "",
  });
  const [addPersonnelOpen, setAddPersonnelOpen] = useState(false);
  const [addLeaveOpen, setAddLeaveOpen] = useState(false);
  const [shiftModal, setShiftModal] = useState<{
    day: string;
    shift: string;
  } | null>(null);
  const [shiftInput, setShiftInput] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(
    null,
  );
  const [personnelDocs] = useState<
    Record<string, { id: string; name: string; type: string; date: string }[]>
  >({
    "1": [
      { id: "d1", name: "İş Sözleşmesi.pdf", type: "PDF", date: "2024-01-10" },
      {
        id: "d2",
        name: "Kimlik Fotokopisi.pdf",
        type: "PDF",
        date: "2024-01-10",
      },
      {
        id: "d3",
        name: "İSG Sertifikası.pdf",
        type: "PDF",
        date: "2024-03-15",
      },
    ],
    "2": [
      { id: "d4", name: "İş Sözleşmesi.pdf", type: "PDF", date: "2024-02-01" },
      { id: "d5", name: "Diploma.pdf", type: "PDF", date: "2024-02-01" },
    ],
    "3": [
      { id: "d6", name: "İş Sözleşmesi.pdf", type: "PDF", date: "2024-06-01" },
      { id: "d7", name: "Sağlık Raporu.pdf", type: "PDF", date: "2025-01-20" },
    ],
  });
  const [calendarView, setCalendarView] = useState(false);

  const pendingCount = leaves.filter((l) => l.status === "Bekliyor").length;

  const filteredPersonnel = personnel.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "Tümü" || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  const handleApprove = (id: string) => {
    setLeaves(
      leaves.map((l) => (l.id === id ? { ...l, status: "Onaylandı" } : l)),
    );
  };

  const handleReject = (id: string) => {
    setLeaves(
      leaves.map((l) => (l.id === id ? { ...l, status: "Reddedildi" } : l)),
    );
  };

  const handleAddPersonnel = () => {
    if (!newPersonnel.name) return;
    const initials = newPersonnel.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colors = [
      "#7c3aed",
      "#0891b2",
      "#059669",
      "#d97706",
      "#dc2626",
      "#be185d",
    ];
    const color = colors[personnel.length % colors.length];
    setPersonnel([
      ...personnel,
      {
        ...newPersonnel,
        id: String(Date.now()),
        status: "Aktif",
        initials,
        color,
      },
    ]);
    setNewPersonnel({
      name: "",
      role: "",
      department: "Teknik",
      phone: "",
      email: "",
    });
    setAddPersonnelOpen(false);
  };

  const handleAddLeave = () => {
    if (!newLeave.startDate || !newLeave.endDate) return;
    setLeaves([
      ...leaves,
      { ...newLeave, id: String(Date.now()), name: "Ben", status: "Bekliyor" },
    ]);
    setNewLeave({ type: "Yıllık", startDate: "", endDate: "", note: "" });
    setAddLeaveOpen(false);
  };

  const getShiftPersonnel = (day: string, shift: string) => {
    return (
      shifts.find((s) => s.day === day && s.shift === shift)?.personnel || []
    );
  };

  const handleAddToShift = () => {
    if (!shiftModal || !shiftInput.trim()) return;
    setShifts((prev) => {
      const exists = prev.find(
        (s) => s.day === shiftModal.day && s.shift === shiftModal.shift,
      );
      if (exists) {
        return prev.map((s) =>
          s.day === shiftModal.day && s.shift === shiftModal.shift
            ? { ...s, personnel: [...s.personnel, shiftInput.trim()] }
            : s,
        );
      }
      return [
        ...prev,
        {
          day: shiftModal.day,
          shift: shiftModal.shift,
          personnel: [shiftInput.trim()],
        },
      ];
    });
    setShiftInput("");
  };

  const handleRemoveFromShift = (day: string, shift: string, name: string) => {
    setShifts((prev) =>
      prev.map((s) =>
        s.day === day && s.shift === shift
          ? { ...s, personnel: s.personnel.filter((p) => p !== name) }
          : s,
      ),
    );
  };

  const statusColor: Record<LeaveStatus, string> = {
    Bekliyor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Onaylandı: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Reddedildi: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">İnsan Kaynakları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personel yönetimi, izinler ve vardiya planlaması
          </p>
        </div>
      </div>

      <Tabs defaultValue="personnel" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="personnel"
            data-ocid="hr.personnel.tab"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Personel Kartları
          </TabsTrigger>
          <TabsTrigger
            value="leaves"
            data-ocid="hr.leaves.tab"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            İzin Yönetimi
            {pendingCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs font-bold rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="shifts"
            data-ocid="hr.shifts.tab"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            Vardiya Planı
          </TabsTrigger>
        </TabsList>

        {/* PERSONNEL TAB */}
        <TabsContent value="personnel" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-ocid="hr.personnel.search_input"
                  placeholder="Personel ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-card border-border"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger
                  data-ocid="hr.personnel.select"
                  className="w-36 bg-card border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tümü">Tüm Departmanlar</SelectItem>
                  <SelectItem value="Teknik">Teknik</SelectItem>
                  <SelectItem value="İdari">İdari</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isManager && (
              <Dialog
                open={addPersonnelOpen}
                onOpenChange={setAddPersonnelOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    data-ocid="hr.personnel.primary_button"
                    className="gradient-bg text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Yeni Personel
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="hr.personnel.dialog"
                  className="bg-card border-border"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Personel Ekle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Ad Soyad</Label>
                      <Input
                        data-ocid="hr.personnel.input"
                        value={newPersonnel.name}
                        onChange={(e) =>
                          setNewPersonnel({
                            ...newPersonnel,
                            name: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label>Unvan / Rol</Label>
                      <Input
                        value={newPersonnel.role}
                        onChange={(e) =>
                          setNewPersonnel({
                            ...newPersonnel,
                            role: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label>Departman</Label>
                      <Select
                        value={newPersonnel.department}
                        onValueChange={(v) =>
                          setNewPersonnel({ ...newPersonnel, department: v })
                        }
                      >
                        <SelectTrigger className="bg-background border-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Teknik">Teknik</SelectItem>
                          <SelectItem value="İdari">İdari</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        value={newPersonnel.phone}
                        onChange={(e) =>
                          setNewPersonnel({
                            ...newPersonnel,
                            phone: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                        placeholder="0500 000 0000"
                      />
                    </div>
                    <div>
                      <Label>E-posta</Label>
                      <Input
                        value={newPersonnel.email}
                        onChange={(e) =>
                          setNewPersonnel({
                            ...newPersonnel,
                            email: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                        placeholder="ad@sirket.com"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      data-ocid="hr.personnel.cancel_button"
                      onClick={() => setAddPersonnelOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="hr.personnel.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddPersonnel}
                    >
                      Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {filteredPersonnel.length === 0 ? (
            <div
              data-ocid="hr.personnel.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <p>Personel bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPersonnel.map((p, i) => (
                <Card
                  key={p.id}
                  data-ocid={`hr.personnel.card.${i + 1}`}
                  className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedPersonnel(p)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback
                          style={{
                            backgroundColor: `${p.color}33`,
                            color: p.color,
                          }}
                          className="text-sm font-bold"
                        >
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {p.name}
                          </h3>
                          <Badge
                            className={
                              p.status === "Aktif"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                                : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30 text-xs"
                            }
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-primary mt-0.5">{p.role}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.department}
                        </p>
                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs text-muted-foreground">
                            {p.phone}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* LEAVES TAB */}
        <TabsContent value="leaves" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {pendingCount} bekleyen talep
              </p>
              <button
                type="button"
                data-ocid="hr.leave.toggle"
                onClick={() => setCalendarView((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${calendarView ? "gradient-bg text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Takvim
              </button>
            </div>
            <Dialog open={addLeaveOpen} onOpenChange={setAddLeaveOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="hr.leave.primary_button"
                  className="gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İzin Talebi Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="hr.leave.dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>İzin Talebi</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>İzin Türü</Label>
                    <Select
                      value={newLeave.type}
                      onValueChange={(v) =>
                        setNewLeave({ ...newLeave, type: v as LeaveType })
                      }
                    >
                      <SelectTrigger
                        data-ocid="hr.leave.select"
                        className="bg-background border-border mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yıllık">Yıllık İzin</SelectItem>
                        <SelectItem value="Hastalık">Hastalık İzni</SelectItem>
                        <SelectItem value="Mazeret">Mazeret İzni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Başlangıç</Label>
                      <Input
                        data-ocid="hr.leave.input"
                        type="date"
                        value={newLeave.startDate}
                        onChange={(e) =>
                          setNewLeave({
                            ...newLeave,
                            startDate: e.target.value,
                          })
                        }
                        className="bg-background border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label>Bitiş</Label>
                      <Input
                        type="date"
                        value={newLeave.endDate}
                        onChange={(e) =>
                          setNewLeave({ ...newLeave, endDate: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Not</Label>
                    <Textarea
                      data-ocid="hr.leave.textarea"
                      value={newLeave.note}
                      onChange={(e) =>
                        setNewLeave({ ...newLeave, note: e.target.value })
                      }
                      className="bg-background border-border mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="hr.leave.cancel_button"
                    onClick={() => setAddLeaveOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="hr.leave.submit_button"
                    className="gradient-bg text-white"
                    onClick={handleAddLeave}
                  >
                    Gönder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {leaves.length === 0 ? (
              <div
                data-ocid="hr.leave.empty_state"
                className="text-center py-16 text-muted-foreground"
              >
                İzin talebi yok.
              </div>
            ) : (
              leaves.map((l, i) => (
                <Card
                  key={l.id}
                  data-ocid={`hr.leave.item.${i + 1}`}
                  className="bg-card border-border"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {l.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{l.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.type} • {l.startDate} – {l.endDate}
                          </p>
                          {l.note && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              "{l.note}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs border ${statusColor[l.status]}`}
                        >
                          {l.status === "Bekliyor" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {l.status === "Onaylandı" && (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {l.status === "Reddedildi" && (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {l.status}
                        </Badge>
                        {isManager && l.status === "Bekliyor" && (
                          <>
                            <Button
                              size="sm"
                              data-ocid={`hr.leave.confirm_button.${i + 1}`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 text-xs"
                              onClick={() => handleApprove(l.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              data-ocid={`hr.leave.delete_button.${i + 1}`}
                              className="h-7 px-2 text-xs"
                              onClick={() => handleReject(l.id)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reddet
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Calendar view */}
          {calendarView && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold">Mart 2026 — İzin Takvimi</p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                  <div key={d} className="font-semibold py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* March 2026 starts on Sunday => offset 6 */}
                {["e0", "e1", "e2", "e3", "e4", "e5"].map((k) => (
                  <div key={k} />
                ))}
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `2026-03-${String(day).padStart(2, "0")}`;
                  const approved = leaves.filter(
                    (l) =>
                      l.status === "Onaylandı" &&
                      l.startDate <= dateStr &&
                      l.endDate >= dateStr,
                  );
                  return (
                    <div
                      key={day}
                      className={`rounded p-1 min-h-[2.5rem] text-xs relative ${
                        approved.length > 0
                          ? "bg-primary/15 border border-primary/30"
                          : "bg-background hover:bg-white/5"
                      }`}
                      title={approved.map((l) => l.name).join(", ")}
                    >
                      <span
                        className={`font-medium ${approved.length > 0 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {day}
                      </span>
                      {approved.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {approved.slice(0, 2).map((l) => (
                            <div
                              key={l.id}
                              className="truncate text-[10px] text-primary/80 leading-none"
                            >
                              {l.name.split(" ")[0]}
                            </div>
                          ))}
                          {approved.length > 2 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{approved.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* SHIFTS TAB */}
        <TabsContent value="shifts" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Haftalık vardiya planı
            </p>
            <Button
              data-ocid="hr.shifts.save_button"
              className="gradient-bg text-white"
            >
              Bu Haftayı Kaydet
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-8 gap-1.5 mb-1.5">
                <div className="text-xs text-muted-foreground font-medium px-2 py-1">
                  Vardiya
                </div>
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-xs text-muted-foreground font-medium text-center px-2 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {SHIFTS.map((shift) => (
                <div
                  key={shift.key}
                  className="grid grid-cols-8 gap-1.5 mb-1.5"
                >
                  <div className="bg-card border border-border rounded-lg p-2">
                    <p className="text-xs font-semibold text-foreground">
                      {shift.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shift.time}
                    </p>
                  </div>
                  {DAYS.map((day) => {
                    const cellPersonnel = getShiftPersonnel(day, shift.key);
                    return (
                      <button
                        type="button"
                        key={day}
                        data-ocid="hr.shifts.canvas_target"
                        onClick={() => setShiftModal({ day, shift: shift.key })}
                        className="bg-card border border-border rounded-lg p-2 min-h-[64px] text-left hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-wrap gap-1">
                          {cellPersonnel.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-0.5 bg-primary/20 text-primary text-xs rounded px-1.5 py-0.5"
                            >
                              {name}
                              <X
                                className="h-2.5 w-2.5 cursor-pointer hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromShift(day, shift.key, name);
                                }}
                              />
                            </span>
                          ))}
                          {cellPersonnel.length === 0 && (
                            <span className="text-xs text-muted-foreground/50">
                              +
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Shift assign modal */}
          <Dialog
            open={!!shiftModal}
            onOpenChange={(o) => !o && setShiftModal(null)}
          >
            <DialogContent
              data-ocid="hr.shifts.dialog"
              className="bg-card border-border"
            >
              <DialogHeader>
                <DialogTitle>
                  {shiftModal?.day} —{" "}
                  {SHIFTS.find((s) => s.key === shiftModal?.shift)?.label}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {shiftModal &&
                    getShiftPersonnel(shiftModal.day, shiftModal.shift).map(
                      (name) => (
                        <Badge
                          key={name}
                          className="bg-primary/20 text-primary border-primary/30"
                        >
                          {name}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              handleRemoveFromShift(
                                shiftModal.day,
                                shiftModal.shift,
                                name,
                              )
                            }
                          />
                        </Badge>
                      ),
                    )}
                </div>
                <div className="flex gap-2">
                  <Input
                    data-ocid="hr.shifts.input"
                    value={shiftInput}
                    onChange={(e) => setShiftInput(e.target.value)}
                    placeholder="Personel adı..."
                    className="bg-background border-border"
                    onKeyDown={(e) => e.key === "Enter" && handleAddToShift()}
                  />
                  <Button
                    data-ocid="hr.shifts.primary_button"
                    className="gradient-bg text-white"
                    onClick={handleAddToShift}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  data-ocid="hr.shifts.close_button"
                  variant="outline"
                  onClick={() => setShiftModal(null)}
                >
                  Kapat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Personnel Detail Sheet */}
      <Sheet
        open={!!selectedPersonnel}
        onOpenChange={(open) => !open && setSelectedPersonnel(null)}
      >
        <SheetContent className="bg-card border-border w-80 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: `${selectedPersonnel?.color}33`,
                  color: selectedPersonnel?.color,
                }}
              >
                {selectedPersonnel?.initials}
              </div>
              <div>
                <p className="font-semibold">{selectedPersonnel?.name}</p>
                <p className="text-xs text-primary font-normal">
                  {selectedPersonnel?.role}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>
          {selectedPersonnel && (
            <div className="mt-6 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {selectedPersonnel.phone}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedPersonnel.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedPersonnel.department} Departmanı
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Belgeler
                  </p>
                  <button
                    type="button"
                    data-ocid="hr.personnel.upload_button"
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Yükle
                  </button>
                </div>
                <div className="space-y-2">
                  {(personnelDocs[selectedPersonnel.id] || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belge yok.</p>
                  ) : (
                    (personnelDocs[selectedPersonnel.id] || []).map(
                      (doc, i) => (
                        <div
                          key={doc.id}
                          data-ocid={`hr.personnel.documents.item.${i + 1}`}
                          className="flex items-center gap-2 p-2 rounded-lg bg-background hover:bg-white/5 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-rose-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.date}
                            </p>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
