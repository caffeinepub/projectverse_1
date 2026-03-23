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
import {
  BookOpen,
  Calculator,
  Edit,
  FolderOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

type BoQUnit =
  | "adet"
  | "m²"
  | "m³"
  | "ton"
  | "kg"
  | "m"
  | "gün"
  | "saat"
  | "ls";
type BoQCategory =
  | "İnşaat"
  | "Mekanik"
  | "Elektrik"
  | "Altyapı"
  | "Peyzaj"
  | "Diğer";

interface BoQItem {
  id: string;
  code: string;
  description: string;
  unit: BoQUnit;
  unitPrice: number;
  category: BoQCategory;
}

interface BoQProjectItem {
  libraryItemId: string;
  quantity: number;
}

const UNITS: BoQUnit[] = [
  "adet",
  "m²",
  "m³",
  "ton",
  "kg",
  "m",
  "gün",
  "saat",
  "ls",
];
const CATEGORIES: BoQCategory[] = [
  "İnşaat",
  "Mekanik",
  "Elektrik",
  "Altyapı",
  "Peyzaj",
  "Diğer",
];
const CAT_COLORS: Record<BoQCategory, string> = {
  İnşaat: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Mekanik: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Elektrik: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Altyapı: "bg-green-500/20 text-green-400 border-green-500/30",
  Peyzaj: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Diğer: "bg-gray-500/20 text-muted-foreground border-gray-500/30",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

export default function BoQLibrary() {
  const { currentCompany, projects } = useApp();
  const companyId = currentCompany?.id || "";
  const libKey = `boqLibrary_${companyId}`;

  const [items, setItems] = useState<BoQItem[]>(() => {
    const stored = localStorage.getItem(libKey);
    return stored ? JSON.parse(stored) : [];
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<BoQCategory | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BoQItem | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importProjectId, setImportProjectId] = useState("");
  const [importSelected, setImportSelected] = useState<string[]>([]);
  const [form, setForm] = useState({
    code: "",
    description: "",
    unit: "adet" as BoQUnit,
    unitPrice: "",
    category: "İnşaat" as BoQCategory,
  });

  useEffect(() => {
    localStorage.setItem(libKey, JSON.stringify(items));
  }, [items, libKey]);

  const companyProjects = useMemo(
    () => projects.filter((p) => p.companyId === companyId),
    [projects, companyId],
  );

  const projectBoQKey = (pid: string) => `boqProject_${companyId}_${pid}`;

  const getProjectBoQ = (pid: string): BoQProjectItem[] => {
    const stored = localStorage.getItem(projectBoQKey(pid));
    return stored ? JSON.parse(stored) : [];
  };

  const saveProjectBoQ = (pid: string, data: BoQProjectItem[]) => {
    localStorage.setItem(projectBoQKey(pid), JSON.stringify(data));
  };

  const [projectBoQ, setProjectBoQ] = useState<BoQProjectItem[]>(() =>
    selectedProjectId ? getProjectBoQ(selectedProjectId) : [],
  );

  const handleSelectProject = (pid: string) => {
    setSelectedProjectId(pid);
    setProjectBoQ(getProjectBoQ(pid));
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = catFilter === "all" || item.category === catFilter;
      const matchSearch =
        !search ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, catFilter, search]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      code: "",
      description: "",
      unit: "adet",
      unitPrice: "",
      category: "İnşaat",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: BoQItem) => {
    setEditItem(item);
    setForm({
      code: item.code,
      description: item.description,
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      category: item.category,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.description.trim()) {
      toast.error("Açıklama zorunludur.");
      return;
    }
    const newItem: BoQItem = {
      id: editItem?.id || `boq_${Date.now()}`,
      code: form.code || `BOQ-${Date.now().toString().slice(-4)}`,
      description: form.description,
      unit: form.unit,
      unitPrice: Number(form.unitPrice) || 0,
      category: form.category,
    };
    if (editItem) {
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? newItem : i)));
      toast.success("İş kalemi güncellendi.");
    } else {
      setItems((prev) => [...prev, newItem]);
      toast.success("İş kalemi eklendi.");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("İş kalemi silindi.");
  };

  // Project BoQ
  const handleQtyChange = (libraryItemId: string, qty: number) => {
    setProjectBoQ((prev) => {
      const existing = prev.find((e) => e.libraryItemId === libraryItemId);
      let next: BoQProjectItem[];
      if (existing) {
        next = prev.map((e) =>
          e.libraryItemId === libraryItemId ? { ...e, quantity: qty } : e,
        );
      } else {
        next = [...prev, { libraryItemId, quantity: qty }];
      }
      next = next.filter((e) => e.quantity > 0);
      saveProjectBoQ(selectedProjectId, next);
      return next;
    });
  };

  const getQty = (libraryItemId: string) =>
    projectBoQ.find((e) => e.libraryItemId === libraryItemId)?.quantity || 0;

  const projectBoQTotal = useMemo(() => {
    return projectBoQ.reduce((sum, entry) => {
      const libItem = items.find((i) => i.id === entry.libraryItemId);
      return sum + (libItem ? libItem.unitPrice * entry.quantity : 0);
    }, 0);
  }, [projectBoQ, items]);

  // Import to project
  const handleImport = () => {
    if (!importProjectId || importSelected.length === 0) {
      toast.error("Proje ve en az 1 kalem seçin.");
      return;
    }
    const existing = getProjectBoQ(importProjectId);
    const merged = [...existing];
    for (const id of importSelected) {
      if (!merged.find((e) => e.libraryItemId === id)) {
        merged.push({ libraryItemId: id, quantity: 1 });
      }
    }
    saveProjectBoQ(importProjectId, merged);
    if (importProjectId === selectedProjectId) {
      setProjectBoQ(merged);
    }
    toast.success(
      `${importSelected.length} kalem ${companyProjects.find((p) => p.id === importProjectId)?.title || "projeye"} aktarıldı.`,
    );
    setImportDialogOpen(false);
    setImportSelected([]);
  };

  const totalLibValue = useMemo(
    () => items.reduce((s, i) => s + i.unitPrice, 0),
    [items],
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">
            Metraj / BoQ Kütüphanesi
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-600 text-sm"
            onClick={() => {
              setImportSelected([]);
              setImportProjectId("");
              setImportDialogOpen(true);
            }}
            data-ocid="boq.open_modal_button"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Projeye Aktar
          </Button>
          <Button
            onClick={openAdd}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            data-ocid="boq.add_button"
          >
            <Plus className="w-4 h-4 mr-1" />
            Kalem Ekle
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Kütüphane Kalemi</p>
            <p className="text-2xl font-bold text-amber-400">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Toplam Birim Fiyat</p>
            <p className="text-xl font-bold text-foreground">
              {fmt(totalLibValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Seçili Proje BoQ</p>
            <p className="text-xl font-bold text-green-400">
              {fmt(projectBoQTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Kategoriler</p>
            <p className="text-2xl font-bold text-blue-400">
              {new Set(items.map((i) => i.category)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="library">
        <TabsList className="bg-gray-800/60 border border-gray-700/50">
          <TabsTrigger value="library" data-ocid="boq.library_tab">
            Kütüphane
          </TabsTrigger>
          <TabsTrigger value="project" data-ocid="boq.project_tab">
            Proje Metrajı
          </TabsTrigger>
        </TabsList>

        {/* Library Tab */}
        <TabsContent value="library" className="mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kod veya açıklama ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-600"
                data-ocid="boq.search_input"
              />
            </div>
            <Select
              value={catFilter}
              onValueChange={(v) => setCatFilter(v as BoQCategory | "all")}
            >
              <SelectTrigger
                className="w-44 bg-gray-800 border-gray-600"
                data-ocid="boq.category_select"
              >
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-gray-800/60 border-gray-700/50">
            <CardContent className="p-0">
              {filteredItems.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-14 text-muted-foreground"
                  data-ocid="boq.empty_state"
                >
                  <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Kütüphanede henüz iş kalemi yok</p>
                  <p className="text-xs mt-1">
                    "Kalem Ekle" ile ilk kalemi ekleyin
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50">
                      <TableHead className="text-xs">Kod</TableHead>
                      <TableHead className="text-xs">Açıklama</TableHead>
                      <TableHead className="text-xs">Kategori</TableHead>
                      <TableHead className="text-xs">Birim</TableHead>
                      <TableHead className="text-xs text-right">
                        Birim Fiyat
                      </TableHead>
                      <TableHead className="text-xs w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, i) => (
                      <TableRow
                        key={item.id}
                        className="border-gray-700/30"
                        data-ocid={`boq.item.${i + 1}`}
                      >
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {item.code}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${CAT_COLORS[item.category]}`}
                          >
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.unit}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-foreground">
                          {fmt(item.unitPrice)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(item)}
                              data-ocid={`boq.edit_button.${i + 1}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-400"
                              onClick={() => handleDelete(item.id)}
                              data-ocid={`boq.delete_button.${i + 1}`}
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
        </TabsContent>

        {/* Project BoQ Tab */}
        <TabsContent value="project" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={selectedProjectId}
              onValueChange={handleSelectProject}
            >
              <SelectTrigger
                className="w-64 bg-gray-800 border-gray-600"
                data-ocid="boq.project_select"
              >
                <SelectValue placeholder="Proje seçin..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {companyProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProjectId && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Calculator className="w-3 h-3 mr-1" />
                Toplam: {fmt(projectBoQTotal)}
              </Badge>
            )}
          </div>

          {!selectedProjectId ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-muted-foreground"
              data-ocid="boq.project_empty_state"
            >
              <FolderOpen className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">
                Proje seçin veya metraj listesini görmek için bir proje seçin
              </p>
            </div>
          ) : items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-muted-foreground"
              data-ocid="boq.empty_state"
            >
              <BookOpen className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Önce kütüphaneye iş kalemi ekleyin</p>
            </div>
          ) : (
            <Card className="bg-gray-800/60 border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {
                    companyProjects.find((p) => p.id === selectedProjectId)
                      ?.title
                  }{" "}
                  — Metraj
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50">
                      <TableHead className="text-xs">Kod</TableHead>
                      <TableHead className="text-xs">Açıklama</TableHead>
                      <TableHead className="text-xs">Birim</TableHead>
                      <TableHead className="text-xs text-right">
                        Birim Fiyat
                      </TableHead>
                      <TableHead className="text-xs text-center w-28">
                        Miktar
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        Toplam
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => {
                      const qty = getQty(item.id);
                      const total = item.unitPrice * qty;
                      return (
                        <TableRow
                          key={item.id}
                          className="border-gray-700/30"
                          data-ocid={`boq.project_item.${i + 1}`}
                        >
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {item.code}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.unit}
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">
                            {fmt(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={qty || ""}
                              onChange={(e) =>
                                handleQtyChange(item.id, Number(e.target.value))
                              }
                              className="bg-gray-700 border-gray-600 h-7 text-sm text-center w-24"
                              placeholder="0"
                              data-ocid="boq.quantity_input"
                            />
                          </TableCell>
                          <TableCell
                            className={`text-sm text-right font-medium ${
                              total > 0
                                ? "text-amber-300"
                                : "text-muted-foreground"
                            }`}
                          >
                            {total > 0 ? fmt(total) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t-2 border-amber-500/30">
                      <TableCell
                        colSpan={5}
                        className="text-sm font-bold text-foreground text-right pr-4"
                      >
                        Genel Toplam
                      </TableCell>
                      <TableCell className="text-sm font-bold text-right text-amber-300">
                        {fmt(projectBoQTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-gray-900 border-gray-700"
          data-ocid="boq.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editItem ? "İş Kalemi Düzenle" : "Yeni İş Kalemi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Kod</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  placeholder="BOQ-001"
                  className="bg-gray-800 border-gray-600"
                  data-ocid="boq.code_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">
                  Kategori
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v as BoQCategory }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Açıklama *
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="İş kalemi açıklaması"
                className="bg-gray-800 border-gray-600"
                data-ocid="boq.description_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Birim</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, unit: v as BoQUnit }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">
                  Birim Fiyat (₺)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitPrice: e.target.value }))
                  }
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-600"
                  data-ocid="boq.price_input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-gray-600"
              data-ocid="boq.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-ocid="boq.save_button"
            >
              {editItem ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent
          className="bg-gray-900 border-gray-700 max-w-lg"
          data-ocid="boq.import_dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">Projeye Aktar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Hedef Proje
              </Label>
              <Select
                value={importProjectId}
                onValueChange={setImportProjectId}
              >
                <SelectTrigger
                  className="bg-gray-800 border-gray-600"
                  data-ocid="boq.import_project_select"
                >
                  <SelectValue placeholder="Proje seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {companyProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Aktarılacak Kalemler ({importSelected.length} seçili)
              </Label>
              <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-700 rounded-md p-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Kütüphanede kalem yok
                  </p>
                ) : (
                  items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-700/40 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={importSelected.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setImportSelected((p) => [...p, item.id]);
                          } else {
                            setImportSelected((p) =>
                              p.filter((id) => id !== item.id),
                            );
                          }
                        }}
                        className="accent-amber-500"
                      />
                      <span className="text-sm text-foreground">
                        {item.code} — {item.description}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {item.unit}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              className="border-gray-600"
              data-ocid="boq.import_cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleImport}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-ocid="boq.import_confirm_button"
            >
              Aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
