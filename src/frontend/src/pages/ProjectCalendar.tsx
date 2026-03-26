import {
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: "task" | "milestone" | "meeting" | "deadline";
  project?: string;
  color: string;
};

const TYPE_LABELS: Record<string, string> = {
  task: "Görev",
  milestone: "Milestone",
  meeting: "Toplantı",
  deadline: "Son Tarih",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday first
}

export default function ProjectCalendar() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id || "";

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filter, setFilter] = useState<
    "all" | "task" | "milestone" | "meeting" | "deadline"
  >("all");

  // Collect events from localStorage
  const events: CalendarEvent[] = [];

  // Tasks
  const tasks: any[] = JSON.parse(
    localStorage.getItem(`tasks_${companyId}`) || "[]",
  );
  for (const t of tasks) {
    if (t.dueDate)
      events.push({
        id: `task_${t.id}`,
        title: t.title || t.name || "Görev",
        date: t.dueDate,
        type: "task",
        project: t.projectId,
        color: "blue",
      });
  }

  // Milestones from projects
  const projects: any[] = JSON.parse(
    localStorage.getItem(`projects_${companyId}`) || "[]",
  );
  for (const p of projects) {
    for (const m of p.milestones || []) {
      if (m.date)
        events.push({
          id: `ms_${p.id}_${m.id}`,
          title: m.title || m.name || "Milestone",
          date: m.date,
          type: "milestone",
          project: p.name,
          color: "amber",
        });
    }
    if (p.endDate)
      events.push({
        id: `deadline_${p.id}`,
        title: `${p.name} - Bitiş`,
        date: p.endDate,
        type: "deadline",
        project: p.name,
        color: "red",
      });
  }

  // Meetings
  const meetings: any[] = JSON.parse(
    localStorage.getItem(`meetingMinutes_${companyId}`) || "[]",
  );
  for (const m of meetings) {
    if (m.date)
      events.push({
        id: `meet_${m.id}`,
        title: m.title || m.subject || "Toplantı",
        date: m.date,
        type: "meeting",
        project: m.projectId,
        color: "purple",
      });
  }

  const filtered =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
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
  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filtered.filter((e) => e.date?.startsWith(dateStr));
  };

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-400" /> Proje Takvimi
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Görevler, toplantılar ve milestone'lar
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "task", "milestone", "meeting", "deadline"] as const).map(
          (f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-amber-500 text-black"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "Tümü" : TYPE_LABELS[f]}
            </button>
          ),
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-white font-semibold text-lg">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d) => (
              <div
                key={d}
                className="text-center text-xs text-gray-400 font-medium py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => i).map((padKey) => (
              <div key={padKey} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay === day;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[60px] p-1 rounded-lg text-left transition-colors relative ${
                    isSelected
                      ? "bg-amber-500/20 border border-amber-500/50"
                      : isToday
                        ? "bg-amber-500/10 border border-amber-500/30"
                        : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span
                    className={`text-xs font-medium block mb-1 ${
                      isToday ? "text-amber-400" : "text-gray-300"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={`text-xs px-1 py-0.5 rounded truncate text-white ${
                          e.type === "task"
                            ? "bg-blue-600/70"
                            : e.type === "milestone"
                              ? "bg-amber-600/70"
                              : e.type === "meeting"
                                ? "bg-purple-600/70"
                                : "bg-red-600/70"
                        }`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{dayEvents.length - 3} daha
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected day events */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              {selectedDay
                ? `${selectedDay} ${monthNames[currentMonth]} Etkinlikleri`
                : "Gün Seçin"}
            </h3>
            {selectedDay && selectedEvents.length === 0 && (
              <p className="text-gray-400 text-sm">Bu gün için etkinlik yok.</p>
            )}
            {!selectedDay && (
              <p className="text-gray-400 text-sm">
                Detayları görmek için takvimde bir güne tıklayın.
              </p>
            )}
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-2 p-2 bg-white/5 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      e.type === "task"
                        ? "bg-blue-400"
                        : e.type === "milestone"
                          ? "bg-amber-400"
                          : e.type === "meeting"
                            ? "bg-purple-400"
                            : "bg-red-400"
                    }`}
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{e.title}</p>
                    <p className="text-gray-400 text-xs">
                      {TYPE_LABELS[e.type]}
                      {e.project ? ` · ${e.project}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly summary */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-3">Bu Ay Özeti</h3>
            {(
              [
                {
                  type: "task",
                  label: "Görev",
                  icon: <CheckSquare className="w-4 h-4" />,
                },
                {
                  type: "milestone",
                  label: "Milestone",
                  icon: <Flag className="w-4 h-4" />,
                },
                {
                  type: "meeting",
                  label: "Toplantı",
                  icon: <Users className="w-4 h-4" />,
                },
                {
                  type: "deadline",
                  label: "Son Tarih",
                  icon: <Clock className="w-4 h-4" />,
                },
              ] as const
            ).map((row) => {
              const count = events.filter(
                (e) =>
                  e.type === row.type &&
                  e.date?.startsWith(
                    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
                  ),
              ).length;
              return (
                <div
                  key={row.type}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="flex items-center gap-2 text-gray-300 text-sm">
                    {row.icon}
                    {row.label}
                  </span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
