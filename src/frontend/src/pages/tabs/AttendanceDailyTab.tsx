import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";

type DayStatus = "Geldi" | "Gelmedi" | "İzinli" | "Geç Kaldı" | "";

interface AttendanceRecord {
  personnelId: string;
  date: string; // YYYY-MM-DD
  status: DayStatus;
}

const STATUS_STYLE: Record<string, string> = {
  Geldi: "bg-green-500/20 text-green-400 border-green-500/30",
  Gelmedi: "bg-red-500/20 text-red-400 border-red-500/30",
  İzinli: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Geç Kaldı": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "": "bg-muted text-muted-foreground border-border",
};

export default function AttendanceDailyTab({
  companyId,
}: { companyId: string }) {
  const { hrPersonnel: allPersonnel } = useApp();
  const key = `attendance_daily_${companyId}`;

  const load = (): AttendanceRecord[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const [records, setRecords] = useState<AttendanceRecord[]>(load);

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear().toString());
  const [selMonth, setSelMonth] = useState(
    (now.getMonth() + 1).toString().padStart(2, "0"),
  );

  const save = (data: AttendanceRecord[]) => {
    setRecords(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const companyPersonnel = allPersonnel;

  const daysInMonth = new Date(Number(selYear), Number(selMonth), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatus = (pId: string, day: number): DayStatus => {
    const dateStr = `${selYear}-${selMonth}-${String(day).padStart(2, "0")}`;
    return (
      records.find((r) => r.personnelId === pId && r.date === dateStr)
        ?.status || ""
    );
  };

  const setStatus = (pId: string, day: number, status: DayStatus) => {
    const dateStr = `${selYear}-${selMonth}-${String(day).padStart(2, "0")}`;
    const filtered = records.filter(
      (r) => !(r.personnelId === pId && r.date === dateStr),
    );
    if (status) {
      save([...filtered, { personnelId: pId, date: dateStr, status }]);
    } else {
      save(filtered);
    }
  };

  const monthRecords = records.filter((r) =>
    r.date.startsWith(`${selYear}-${selMonth}`),
  );
  const totalWorkDays = monthRecords.filter(
    (r) => r.status === "Geldi" || r.status === "Geç Kaldı",
  ).length;
  const absentDays = monthRecords.filter((r) => r.status === "Gelmedi").length;
  const leaveDays = monthRecords.filter((r) => r.status === "İzinli").length;
  const totalEntries = monthRecords.length;
  const absentRate =
    totalEntries > 0 ? Math.round((absentDays / totalEntries) * 100) : 0;

  const months = [
    { v: "01", l: "Ocak" },
    { v: "02", l: "Şubat" },
    { v: "03", l: "Mart" },
    { v: "04", l: "Nisan" },
    { v: "05", l: "Mayıs" },
    { v: "06", l: "Haziran" },
    { v: "07", l: "Temmuz" },
    { v: "08", l: "Ağustos" },
    { v: "09", l: "Eylül" },
    { v: "10", l: "Ekim" },
    { v: "11", l: "Kasım" },
    { v: "12", l: "Aralık" },
  ];

  const years = ["2023", "2024", "2025", "2026"];

  const statusCycles: DayStatus[] = [
    "",
    "Geldi",
    "Gelmedi",
    "İzinli",
    "Geç Kaldı",
  ];

  const cycleStatus = (pId: string, day: number) => {
    const current = getStatus(pId, day);
    const idx = statusCycles.indexOf(current);
    const next = statusCycles[(idx + 1) % statusCycles.length];
    setStatus(pId, day, next);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Çalışma Günü</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {totalWorkDays}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Devamsızlık Oranı</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              %{absentRate}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">İzinli Gün</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {leaveDays}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Gelmedi</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">
              {absentDays}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_STYLE)
          .filter(([k]) => k)
          .map(([s, cls]) => (
            <Badge key={s} className={`text-xs border ${cls}`}>
              {s}
            </Badge>
          ))}
        <span className="text-xs text-muted-foreground self-center ml-2">
          Hücreye tıklayarak durum değiştirin
        </span>
      </div>

      {/* Month/Year filter */}
      <div className="flex gap-3">
        <Select value={selYear} onValueChange={setSelYear}>
          <SelectTrigger className="bg-background border-border w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selMonth} onValueChange={setSelMonth}>
          <SelectTrigger className="bg-background border-border w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {months.map((m) => (
              <SelectItem key={m.v} value={m.v}>
                {m.l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {companyPersonnel.length === 0 ? (
        <div
          data-ocid="attendance_daily.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Devam takibi için önce personel ekleyin</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium w-40 sticky left-0 bg-card z-10">
                  Personel
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className="text-center px-1 py-2 text-muted-foreground font-medium min-w-[32px]"
                  >
                    {d}
                  </th>
                ))}
                <th className="text-center px-2 py-2 text-muted-foreground font-medium">
                  Özet
                </th>
              </tr>
            </thead>
            <tbody>
              {companyPersonnel.map(
                (p: { id: string; name: string; position?: string }) => {
                  const pWorkDays = days.filter(
                    (d) =>
                      getStatus(p.id, d) === "Geldi" ||
                      getStatus(p.id, d) === "Geç Kaldı",
                  ).length;
                  const pAbsent = days.filter(
                    (d) => getStatus(p.id, d) === "Gelmedi",
                  ).length;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border hover:bg-muted/20"
                    >
                      <td className="px-3 py-2 sticky left-0 bg-card z-10">
                        <div className="font-medium text-foreground">
                          {p.name}
                        </div>
                        {p.position && (
                          <div className="text-muted-foreground">
                            {p.position}
                          </div>
                        )}
                      </td>
                      {days.map((d) => {
                        const st = getStatus(p.id, d);
                        const shortLabel: Record<string, string> = {
                          Geldi: "G",
                          Gelmedi: "X",
                          İzinli: "İ",
                          "Geç Kaldı": "G!",
                          "": "·",
                        };
                        return (
                          <td key={d} className="text-center px-1 py-1.5">
                            <button
                              type="button"
                              onClick={() => cycleStatus(p.id, d)}
                              className={`w-7 h-6 rounded text-xs font-bold border transition-colors ${STATUS_STYLE[st]}`}
                              title={st || "Belirtilmedi"}
                            >
                              {shortLabel[st]}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center">
                        <span className="text-green-400 font-semibold">
                          {pWorkDays}G
                        </span>
                        {pAbsent > 0 && (
                          <span className="text-red-400 ml-1">{pAbsent}X</span>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk mark section */}
      {companyPersonnel.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            Bugün toplu işaretle:
          </span>
          {(["Geldi", "Gelmedi", "İzinli"] as DayStatus[]).map((st) => (
            <Button
              key={st}
              size="sm"
              variant="outline"
              className={`border text-xs ${STATUS_STYLE[st]}`}
              onClick={() => {
                const today = new Date();
                const dd = today.getDate();
                const mm = String(today.getMonth() + 1).padStart(2, "0");
                const yy = today.getFullYear().toString();
                if (yy !== selYear || mm !== selMonth) return;
                for (const p of companyPersonnel as { id: string }[]) {
                  setStatus(p.id, dd, st);
                }
              }}
            >
              Tümünü {st}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
