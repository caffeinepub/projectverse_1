import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Package,
  Printer,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  paused: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  completed: "Tamamlandı",
  paused: "Duraklıyor",
  cancelled: "İptal",
};

export default function ProjectStatusReport() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id || "";

  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [reportPeriod, setReportPeriod] = useState<"weekly" | "monthly">(
    "weekly",
  );
  const [generated, setGenerated] = useState(false);

  // Load data from localStorage
  const projects: any[] = JSON.parse(
    localStorage.getItem(`projects_${companyId}`) || "[]",
  );
  const tasks: any[] = JSON.parse(
    localStorage.getItem(`tasks_${companyId}`) || "[]",
  );
  const personnel: any[] = JSON.parse(
    localStorage.getItem(`personnel_${companyId}`) || "[]",
  );
  const risks: any[] = JSON.parse(
    localStorage.getItem(`risks_${companyId}`) || "[]",
  );
  const punchList: any[] = JSON.parse(
    localStorage.getItem(`punchlist_${companyId}`) || "[]",
  );
  const incidents: any[] = JSON.parse(
    localStorage.getItem(`incidents_${companyId}`) || "[]",
  );
  const invoices: any[] = JSON.parse(
    localStorage.getItem(`invoices_${companyId}`) || "[]",
  );

  const filteredProjects =
    selectedProject === "all"
      ? projects
      : projects.filter((p) => p.id === selectedProject);

  const generateReport = () => setGenerated(true);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const rows: string[] = [];
    rows.push("ProjectVerse - Proje Durum Raporu");
    rows.push(
      `Dönem: ${reportPeriod === "weekly" ? "Haftalık" : "Aylık"} | Tarih: ${new Date().toLocaleDateString("tr-TR")}`,
    );
    rows.push("");
    for (const p of filteredProjects) {
      const ptasks = tasks.filter((t) => t.projectId === p.id);
      const done = ptasks.filter(
        (t) => t.status === "done" || t.status === "completed",
      ).length;
      rows.push(`Proje: ${p.name}`);
      rows.push(`Durum: ${STATUS_LABELS[p.status] || p.status}`);
      rows.push(`Görevler: ${done}/${ptasks.length} tamamlandı`);
      rows.push("");
    }
    const blob = new Blob([rows.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proje-durum-raporu-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            Proje Durum Raporu
          </h1>
          <p className="text-gray-400 mt-1">
            Tüm modüllerden veri çeken otomatik proje durum raporu
          </p>
        </div>
        {generated && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" /> Yazdır
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> İndir
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Rapor Ayarları</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="project-select"
              className="block text-sm text-gray-400 mb-1"
            >
              Proje
            </label>
            <select
              id="project-select"
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setGenerated(false);
              }}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tüm Projeler</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="period-select"
              className="block text-sm text-gray-400 mb-1"
            >
              Dönem
            </label>
            <select
              id="period-select"
              value={reportPeriod}
              onChange={(e) => {
                setReportPeriod(e.target.value as "weekly" | "monthly");
                setGenerated(false);
              }}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="weekly">Haftalık</option>
              <option value="monthly">Aylık</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={generateReport}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Rapor Oluştur
            </button>
          </div>
        </div>
      </div>

      {!generated && (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>
            Rapor oluşturmak için proje ve dönem seçin, ardından "Rapor Oluştur"
            butonuna tıklayın.
          </p>
        </div>
      )}

      {generated && (
        <div className="space-y-6" id="report-content">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-amber-900/30 to-gray-800 border border-amber-700/40 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {currentCompany?.name || "Şirket"} — Proje Durum Raporu
                </h2>
                <p className="text-amber-400 mt-1">
                  {reportPeriod === "weekly" ? "Haftalık" : "Aylık"} Rapor •{" "}
                  {new Date().toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-400 opacity-60" />
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <TrendingUp className="w-5 h-5" />,
                label: "Toplam Proje",
                value: filteredProjects.length,
                color: "text-amber-400",
              },
              {
                icon: <CheckCircle className="w-5 h-5" />,
                label: "Aktif Proje",
                value: filteredProjects.filter((p) => p.status === "active")
                  .length,
                color: "text-green-400",
              },
              {
                icon: <AlertTriangle className="w-5 h-5" />,
                label: "Açık Risk",
                value: risks.filter(
                  (r) =>
                    r.status !== "closed" &&
                    (!r.projectId ||
                      filteredProjects.some((p) => p.id === r.projectId)),
                ).length,
                color: "text-red-400",
              },
              {
                icon: <Users className="w-5 h-5" />,
                label: "Aktif Personel",
                value: personnel.filter((p) => p.status === "active").length,
                color: "text-blue-400",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4"
              >
                <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                <div className="text-2xl font-bold text-white">{kpi.value}</div>
                <div className="text-sm text-gray-400">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Per-Project Reports */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Seçilen kriterlere göre proje bulunamadı.</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const ptasks = tasks.filter((t) => t.projectId === project.id);
              const doneTasks = ptasks.filter(
                (t) => t.status === "done" || t.status === "completed",
              );
              const overdueTasks = ptasks.filter(
                (t) =>
                  t.dueDate &&
                  new Date(t.dueDate) < new Date() &&
                  t.status !== "done" &&
                  t.status !== "completed",
              );
              const projectRisks = risks.filter(
                (r) => r.projectId === project.id && r.status !== "closed",
              );
              const projectPunch = punchList.filter(
                (p) =>
                  p.projectId === project.id &&
                  p.status !== "closed" &&
                  p.status !== "completed",
              );
              const projectIncidents = incidents.filter(
                (i) => i.projectId === project.id,
              );
              const budget = project.budget || 0;
              const spent = invoices
                .filter((inv) => inv.projectId === project.id)
                .reduce(
                  (sum: number, inv: any) =>
                    sum + (Number.parseFloat(inv.amount) || 0),
                  0,
                );
              const budgetPct =
                budget > 0 ? Math.round((spent / budget) * 100) : 0;
              const taskPct =
                ptasks.length > 0
                  ? Math.round((doneTasks.length / ptasks.length) * 100)
                  : 0;

              return (
                <div
                  key={project.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
                >
                  {/* Project Header */}
                  <div className="bg-gray-750 border-b border-gray-700 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {project.name}
                      </h3>
                      {project.location && (
                        <p className="text-gray-400 text-sm">
                          {project.location}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[project.status] || "bg-gray-700 text-gray-300"}`}
                    >
                      {STATUS_LABELS[project.status] || project.status}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Progress Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Görev İlerlemesi
                          </span>
                          <span className="text-white font-medium">
                            {doneTasks.length}/{ptasks.length} ({taskPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${taskPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Bütçe Kullanımı
                          </span>
                          <span
                            className={`font-medium ${budgetPct > 90 ? "text-red-400" : budgetPct > 75 ? "text-yellow-400" : "text-white"}`}
                          >
                            {budgetPct}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 75 ? "bg-yellow-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(budgetPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Clock className="w-3 h-3" /> Geciken Görev
                        </div>
                        <div
                          className={`text-lg font-bold ${overdueTasks.length > 0 ? "text-red-400" : "text-green-400"}`}
                        >
                          {overdueTasks.length}
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <AlertTriangle className="w-3 h-3" /> Açık Risk
                        </div>
                        <div
                          className={`text-lg font-bold ${projectRisks.length > 0 ? "text-yellow-400" : "text-green-400"}`}
                        >
                          {projectRisks.length}
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Package className="w-3 h-3" /> Açık Punch
                        </div>
                        <div
                          className={`text-lg font-bold ${projectPunch.length > 0 ? "text-orange-400" : "text-green-400"}`}
                        >
                          {projectPunch.length}
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Shield className="w-3 h-3" /> İSG Olayı
                        </div>
                        <div
                          className={`text-lg font-bold ${projectIncidents.length > 0 ? "text-red-400" : "text-green-400"}`}
                        >
                          {projectIncidents.length}
                        </div>
                      </div>
                    </div>

                    {/* Overdue Tasks List */}
                    {overdueTasks.length > 0 && (
                      <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
                        <p className="text-red-400 text-sm font-medium mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Geciken Görevler
                        </p>
                        <ul className="space-y-1">
                          {overdueTasks.slice(0, 5).map((t: any) => (
                            <li
                              key={t.id}
                              className="text-gray-300 text-sm flex justify-between"
                            >
                              <span>{t.title || t.name}</span>
                              <span className="text-red-400 text-xs">
                                {t.dueDate
                                  ? new Date(t.dueDate).toLocaleDateString(
                                      "tr-TR",
                                    )
                                  : ""}
                              </span>
                            </li>
                          ))}
                          {overdueTasks.length > 5 && (
                            <li className="text-gray-500 text-xs">
                              +{overdueTasks.length - 5} daha...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Notes field */}
                    {project.description && (
                      <div className="text-sm text-gray-400 border-t border-gray-700 pt-3">
                        <span className="text-gray-500 font-medium">
                          Açıklama:{" "}
                        </span>
                        {project.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 pt-2">
            Bu rapor {new Date().toLocaleString("tr-TR")} tarihinde ProjectVerse
            tarafından oluşturulmuştur.
          </div>
        </div>
      )}
    </div>
  );
}
