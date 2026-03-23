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
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

type HolidayType = "Resmi Tatil" | "Şirket Tatili" | "Yarım Gün";

interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: HolidayType;
}

const TYPE_COLORS: Record<HolidayType, string> = {
  "Resmi Tatil": "bg-red-500/20 text-red-400 border-red-500/30",
  "Şirket Tatili": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Yarım Gün": "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default function HolidayCalendar() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id || "";
  const storageKey = `holidays_${companyId}`;

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Holiday | null>(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "Resmi Tatil" as HolidayType,
  });

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(holidays));
  }, [holidays, storageKey]);

  const holidayMap = useMemo(() => {
    const map: Record<string, Holiday[]> = {};
    for (const h of holidays) {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    }
    return map;
  }, [holidays]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewYear, viewMonth]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", date: "", type: "Resmi Tatil" });
    setDialogOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditItem(h);
    setForm({ name: h.name, date: h.date, type: h.type });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.date) {
      toast.error("Ad ve tarih zorunludur.");
      return;
    }
    if (editItem) {
      setHolidays((prev) =>
        prev.map((h) => (h.id === editItem.id ? { ...h, ...form } : h)),
      );
      toast.success("Tatil güncellendi.");
    } else {
      const newH: Holiday = {
        id: `h_${Date.now()}`,
        ...form,
      };
      setHolidays((prev) => [...prev, newH]);
      toast.success("Tatil eklendi.");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    toast.success("Tatil silindi.");
  };

  const sortedHolidays = [...holidays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">Tatil Takvimi</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            {holidays.length} tatil
          </Badge>
        </div>
        <Button
          onClick={openAdd}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          data-ocid="holiday.add_button"
        >
          <Plus className="w-4 h-4 mr-1" />
          Tatil Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                {MONTHS[viewMonth]} {viewYear}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear((y) => y - 1);
                    } else {
                      setViewMonth((m) => m - 1);
                    }
                  }}
                  data-ocid="holiday.pagination_prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear((y) => y + 1);
                    } else {
                      setViewMonth((m) => m + 1);
                    }
                  }}
                  data-ocid="holiday.pagination_next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-muted-foreground py-1 font-medium"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, idx) => {
                if (!day)
                  return (
                    <div key={`empty-slot-${String(idx)}`} className="h-9" />
                  );
                const dateStr = day.toISOString().split("T")[0];
                const dayHolidays = holidayMap[dateStr] || [];
                const isToday = dateStr === todayStr;
                const hasHoliday = dayHolidays.length > 0;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={dateStr}
                    className={`h-9 flex flex-col items-center justify-center rounded text-xs cursor-default
                      ${
                        hasHoliday
                          ? "bg-amber-500/20 border border-amber-500/30"
                          : isToday
                            ? "bg-blue-500/20 border border-blue-500/30"
                            : isWeekend
                              ? "bg-gray-700/30"
                              : "hover:bg-gray-700/20"
                      }`}
                    title={
                      dayHolidays
                        .map((h) => `${h.name} (${h.type})`)
                        .join(", ") || undefined
                    }
                  >
                    <span
                      className={`font-medium ${
                        hasHoliday
                          ? "text-amber-300"
                          : isToday
                            ? "text-blue-300"
                            : isWeekend
                              ? "text-muted-foreground"
                              : "text-foreground"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {hasHoliday && (
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Holiday List */}
        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Tatil Listesi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sortedHolidays.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 text-muted-foreground"
                data-ocid="holiday.empty_state"
              >
                <CalendarDays className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Henüz tatil tanımlanmamış</p>
                <p className="text-xs mt-1">
                  Tatil eklemek için "Tatil Ekle" butonunu kullanın
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700/50">
                    <TableHead className="text-xs">Ad</TableHead>
                    <TableHead className="text-xs">Tarih</TableHead>
                    <TableHead className="text-xs">Tür</TableHead>
                    <TableHead className="text-xs w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHolidays.map((h, i) => (
                    <TableRow
                      key={h.id}
                      className="border-gray-700/30"
                      data-ocid={`holiday.item.${i + 1}`}
                    >
                      <TableCell className="text-sm text-foreground">
                        {h.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {h.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${TYPE_COLORS[h.type]}`}
                        >
                          {h.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(h)}
                            data-ocid={`holiday.edit_button.${i + 1}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            onClick={() => handleDelete(h.id)}
                            data-ocid={`holiday.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-blue-300">
            <strong>Bilgi:</strong> İzin talepleri oluşturulurken, seçilen tarih
            aralığındaki resmi tatil günleri izin günü sayısından otomatik
            düşülür.
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-gray-900 border-gray-700"
          data-ocid="holiday.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editItem ? "Tatil Düzenle" : "Yeni Tatil Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Ad *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Tatil adını girin"
                className="bg-gray-800 border-gray-600"
                data-ocid="holiday.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Tarih *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="bg-gray-800 border-gray-600"
                data-ocid="holiday.date_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Tür</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as HolidayType }))
                }
              >
                <SelectTrigger
                  className="bg-gray-800 border-gray-600"
                  data-ocid="holiday.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {(
                    [
                      "Resmi Tatil",
                      "Şirket Tatili",
                      "Yarım Gün",
                    ] as HolidayType[]
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-gray-600"
              data-ocid="holiday.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-ocid="holiday.save_button"
            >
              {editItem ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
