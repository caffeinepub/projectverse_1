import { CheckSquare, ClipboardList, Plus, Trash2, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useApp } from "../contexts/AppContext";

type ChecklistStatus = "Bekliyor" | "Tamamlandı" | "Geçerli Değil";
type ChecklistType = "kickoff" | "closeout";

interface ChecklistItem {
  id: string;
  type: ChecklistType;
  name: string;
  responsible: string;
  dueDate: string;
  status: ChecklistStatus;
  notes: string;
  projectId: string;
}

const DEFAULT_KICKOFF_ITEMS = [
  "İnşaat ruhsatı alındı",
  "Şantiye kurulumu tamamlandı",
  "Anahtar personel atandı",
  "Ekipman ve araçlar hazır",
  "Sigorta poliçeleri aktif",
  "İş güvenliği eğitimi verildi",
  "KKD (kişisel koruyucu donanım) dağıtıldı",
  "Şantiye güvenlik planı onaylandı",
  "Taşeron sözleşmeleri imzalandı",
  "Malzeme tedarik planı hazırlandı",
  "Proje iletişim matrisi oluşturuldu",
  "İlk hakediş takvimi belirlendi",
];

const DEFAULT_CLOSEOUT_ITEMS = [
  "Tüm imalatlar tamamlandı",
  "Punch list maddeleri kapatıldı",
  "As-built çizimler teslim edildi",
  "İşletme ve bakım kılavuzları hazırlandı",
  "Garanti belgeleri teslim edildi",
  "Kesin hakediş onaylandı",
  "Geçici kabul tutanağı imzalandı",
  "Şantiye teslimatı tamamlandı",
  "Atık ve ekipman sahadan kaldırıldı",
  "İSG kapanış raporu hazırlandı",
  "Proje kapanış raporu tamamlandı",
  "Kesin teminat mektubu alındı",
];

const statusColors: Record<ChecklistStatus, string> = {
  Bekliyor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Tamamlandı: "bg-green-500/20 text-green-400 border-green-500/30",
  "Geçerli Değil": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function KickoffChecklist() {
  const { activeCompanyId: companyId } = useApp();
  const storageKey = `kickoff_checklists_${companyId}`;

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  });

  const [projects] = useState<{ id: string; name: string }[]>(() => {
    return JSON.parse(localStorage.getItem(`projects_${companyId}`) || "[]");
  });

  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [activeTab, setActiveTab] = useState<ChecklistType>("kickoff");

  const [form, setForm] = useState({
    name: "",
    responsible: "",
    dueDate: "",
    status: "Bekliyor" as ChecklistStatus,
    notes: "",
    projectId: "",
    type: "kickoff" as ChecklistType,
  });

  const save = (updated: ChecklistItem[]) => {
    setItems(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const openAdd = (type: ChecklistType) => {
    setEditItem(null);
    setForm({
      name: "",
      responsible: "",
      dueDate: "",
      status: "Bekliyor",
      notes: "",
      projectId:
        selectedProjectId === "all" ? projects[0]?.id || "" : selectedProjectId,
      type,
    });
    setShowDialog(true);
  };

  const openEdit = (item: ChecklistItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      responsible: item.responsible,
      dueDate: item.dueDate,
      status: item.status,
      notes: item.notes,
      projectId: item.projectId,
      type: item.type,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editItem) {
      save(
        items.map((i) => (i.id === editItem.id ? { ...editItem, ...form } : i)),
      );
    } else {
      save([...items, { id: Date.now().toString(), ...form }]);
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    save(items.filter((i) => i.id !== id));
  };

  const handleStatusChange = (id: string, status: ChecklistStatus) => {
    save(items.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const addDefaults = (type: ChecklistType) => {
    const defaults =
      type === "kickoff" ? DEFAULT_KICKOFF_ITEMS : DEFAULT_CLOSEOUT_ITEMS;
    const projId =
      selectedProjectId === "all" ? projects[0]?.id || "" : selectedProjectId;
    const newItems: ChecklistItem[] = defaults.map((name, idx) => ({
      id: `${Date.now()}_${idx}`,
      type,
      name,
      responsible: "",
      dueDate: "",
      status: "Bekliyor",
      notes: "",
      projectId: projId,
    }));
    save([...items, ...newItems]);
  };

  const filtered = items.filter((i) => {
    if (selectedProjectId !== "all" && i.projectId !== selectedProjectId)
      return false;
    return true;
  });

  const kickoffItems = filtered.filter((i) => i.type === "kickoff");
  const closeoutItems = filtered.filter((i) => i.type === "closeout");

  const getProgress = (list: ChecklistItem[]) => {
    if (list.length === 0) return 0;
    const done = list.filter((i) => i.status === "Tamamlandı").length;
    return Math.round((done / list.length) * 100);
  };

  const renderList = (list: ChecklistItem[], type: ChecklistType) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="w-14 h-14 text-amber-500/30 mb-4" />
          <p className="text-gray-400 mb-2">
            {type === "kickoff"
              ? "Açılış kontrol listesi boş"
              : "Kapanış kontrol listesi boş"}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Hazır şablonu kullanabilir veya manuel madde ekleyebilirsiniz.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => addDefaults(type)}
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              data-ocid="kickoff.secondary_button"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Şablonu Yükle
            </Button>
            <Button
              onClick={() => openAdd(type)}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="kickoff.primary_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Madde Ekle
            </Button>
          </div>
        </div>
      );
    }

    const done = list.filter((i) => i.status === "Tamamlandı").length;
    const progress = getProgress(list);

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {done}/{list.length} tamamlandı
            </span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-amber-400 font-medium">
              %{progress}
            </span>
          </div>
          <Button
            onClick={() => openAdd(type)}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black"
            data-ocid="kickoff.add_button"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ekle
          </Button>
        </div>

        <div className="space-y-2">
          {list.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-amber-500/30 transition-colors group"
              data-ocid={`kickoff.item.${idx + 1}`}
            >
              <button
                type="button"
                className="mt-0.5 flex-shrink-0"
                onClick={() =>
                  handleStatusChange(
                    item.id,
                    item.status === "Tamamlandı" ? "Bekliyor" : "Tamamlandı",
                  )
                }
              >
                <CheckSquare
                  className={`w-5 h-5 transition-colors ${
                    item.status === "Tamamlandı"
                      ? "text-green-400"
                      : "text-gray-500"
                  }`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-medium text-sm ${
                      item.status === "Tamamlandı"
                        ? "line-through text-gray-500"
                        : "text-white"
                    }`}
                  >
                    {item.name}
                  </span>
                  <Badge
                    className={`text-xs border ${statusColors[item.status]}`}
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  {item.responsible && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <User className="w-3 h-3" />
                      {item.responsible}
                    </span>
                  )}
                  {item.dueDate && (
                    <span className="text-xs text-gray-400">
                      {item.dueDate}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-xs text-gray-500 truncate max-w-xs">
                      {item.notes}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Select
                  value={item.status}
                  onValueChange={(v) =>
                    handleStatusChange(item.id, v as ChecklistStatus)
                  }
                >
                  <SelectTrigger className="h-7 w-32 text-xs bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                    <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                    <SelectItem value="Geçerli Değil">Geçerli Değil</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:text-amber-400"
                  onClick={() => openEdit(item)}
                  data-ocid={`kickoff.edit_button.${idx + 1}`}
                >
                  <ClipboardList className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:text-red-400"
                  onClick={() => handleDelete(item.id)}
                  data-ocid={`kickoff.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            Açılış & Kapanış Kontrol Listesi
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Proje kick-off ve kapanış süreçlerini sistematik olarak takip edin
          </p>
        </div>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger
            className="w-56 bg-gray-800 border-gray-700 text-white"
            data-ocid="kickoff.select"
          >
            <SelectValue placeholder="Proje seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Projeler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gray-800/50 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">
              Açılış İlerlemesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              %{getProgress(kickoffItems)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {kickoffItems.filter((i) => i.status === "Tamamlandı").length}/
              {kickoffItems.length} madde
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">
              Kapanış İlerlemesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              %{getProgress(closeoutItems)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {closeoutItems.filter((i) => i.status === "Tamamlandı").length}/
              {closeoutItems.length} madde
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ChecklistType)}
      >
        <TabsList className="bg-gray-800 border border-gray-700 mb-6">
          <TabsTrigger
            value="kickoff"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
            data-ocid="kickoff.tab"
          >
            Proje Açılışı (Kick-off)
          </TabsTrigger>
          <TabsTrigger
            value="closeout"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
            data-ocid="kickoff.closeout.tab"
          >
            Proje Kapanışı (Closeout)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kickoff">
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="pt-6">
              {renderList(kickoffItems, "kickoff")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closeout">
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="pt-6">
              {renderList(closeoutItems, "closeout")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-gray-900 border-gray-700 text-white max-w-md"
          data-ocid="kickoff.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Maddeyi Düzenle" : "Yeni Madde Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Madde Adı *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Kontrol listesi maddesi..."
                className="bg-gray-800 border-gray-700 text-white mt-1"
                data-ocid="kickoff.input"
              />
            </div>
            <div>
              <Label className="text-gray-300">Sorumlu Kişi</Label>
              <Input
                value={form.responsible}
                onChange={(e) =>
                  setForm({ ...form, responsible: e.target.value })
                }
                placeholder="Ad Soyad..."
                className="bg-gray-800 border-gray-700 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Son Tarih</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Durum</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as ChecklistStatus })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                    <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                    <SelectItem value="Geçerli Değil">Geçerli Değil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editItem && (
              <div>
                <Label className="text-gray-300">Proje</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(v) => setForm({ ...form, projectId: v })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                    <SelectValue placeholder="Proje seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-gray-300">Notlar</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ek açıklamalar..."
                className="bg-gray-800 border-gray-700 text-white mt-1"
                rows={3}
                data-ocid="kickoff.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-gray-600 text-gray-300"
              data-ocid="kickoff.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="kickoff.confirm_button"
            >
              {editItem ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
