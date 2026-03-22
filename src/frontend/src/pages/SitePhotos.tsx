import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface SitePhoto {
  id: string;
  projectId: string;
  date: string;
  tag: "ilerleme" | "sorun" | "genel";
  location: string;
  description: string;
  uploadedBy: string;
  dataUrl: string;
  fileName: string;
}

const TAG_LABELS: Record<string, string> = {
  ilerleme: "İlerleme",
  sorun: "Sorun",
  genel: "Genel",
};

const TAG_COLORS: Record<string, string> = {
  ilerleme: "bg-green-500/15 text-green-400 border-green-500/30",
  sorun: "bg-red-500/15 text-red-400 border-red-500/30",
  genel: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export default function SitePhotos() {
  const { activeCompanyId, projects, user } = useApp();

  const storageKey = `pv_site_photos_${activeCompanyId}`;

  const [photos, setPhotos] = useState<SitePhoto[]>(() => {
    try {
      const s = localStorage.getItem(`pv_site_photos_${activeCompanyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(photos));
    } catch {
      // storage full
    }
  }, [photos, storageKey]);

  const [filterProject, setFilterProject] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    projectId: "",
    tag: "genel" as SitePhoto["tag"],
    location: "",
    description: "",
    dataUrl: "",
    fileName: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );

  const filteredPhotos = photos.filter((ph) => {
    if (filterProject !== "all" && ph.projectId !== filterProject) return false;
    if (filterTag !== "all" && ph.tag !== filterTag) return false;
    if (filterDateFrom && ph.date < filterDateFrom) return false;
    if (filterDateTo && ph.date > filterDateTo) return false;
    if (
      searchText &&
      !ph.description.toLowerCase().includes(searchText.toLowerCase()) &&
      !ph.location.toLowerCase().includes(searchText.toLowerCase())
    )
      return false;
    return true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewPhoto((prev) => ({
        ...prev,
        dataUrl: ev.target?.result as string,
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!newPhoto.dataUrl || !newPhoto.projectId) return;
    const photo: SitePhoto = {
      id: Date.now().toString(),
      projectId: newPhoto.projectId,
      date: new Date().toISOString().slice(0, 10),
      tag: newPhoto.tag,
      location: newPhoto.location,
      description: newPhoto.description,
      uploadedBy: user?.name || "Kullanıcı",
      dataUrl: newPhoto.dataUrl,
      fileName: newPhoto.fileName,
    };
    setPhotos((prev) => [photo, ...prev]);
    setNewPhoto({
      projectId: "",
      tag: "genel",
      location: "",
      description: "",
      dataUrl: "",
      fileName: "",
    });
    setUploadOpen(false);
  };

  const handleDelete = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const getProjectName = (id: string) =>
    companyProjects.find((p) => p.id === id)?.title || id;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Şantiye Fotoğrafları
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proje bazlı fotoğraf galerisi ve dokümantasyon
          </p>
        </div>
        <Button
          data-ocid="sitephotos.upload_button"
          onClick={() => setUploadOpen(true)}
          className="gradient-bg text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Fotoğraf Yükle
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtreler</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="sitephotos.search_input"
              placeholder="Ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger
              data-ocid="sitephotos.project.select"
              className="bg-background border-border"
            >
              <SelectValue placeholder="Tüm Projeler" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Tüm Projeler</SelectItem>
              {companyProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger
              data-ocid="sitephotos.tag.select"
              className="bg-background border-border"
            >
              <SelectValue placeholder="Tüm Etiketler" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Tüm Etiketler</SelectItem>
              <SelectItem value="ilerleme">İlerleme</SelectItem>
              <SelectItem value="sorun">Sorun</SelectItem>
              <SelectItem value="genel">Genel</SelectItem>
            </SelectContent>
          </Select>
          <Input
            data-ocid="sitephotos.date_from.input"
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="bg-background border-border"
          />
          <Input
            data-ocid="sitephotos.date_to.input"
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="bg-background border-border"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Fotoğraf",
            value: photos.length,
            color: "text-amber-400",
          },
          {
            label: "İlerleme",
            value: photos.filter((p) => p.tag === "ilerleme").length,
            color: "text-green-400",
          },
          {
            label: "Sorun",
            value: photos.filter((p) => p.tag === "sorun").length,
            color: "text-red-400",
          },
          {
            label: "Filtrelenen",
            value: filteredPhotos.length,
            color: "text-blue-400",
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div
          data-ocid="sitephotos.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Camera className="w-10 h-10 text-amber-400/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Fotoğraf Yok
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Şantiye fotoğraflarını yükleyerek dokümantasyona başlayın
          </p>
          <Button
            onClick={() => setUploadOpen(true)}
            className="gradient-bg text-white gap-2"
          >
            <Upload className="w-4 h-4" />
            İlk Fotoğrafı Yükle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPhotos.map((photo, idx) => (
            <button
              type="button"
              key={photo.id}
              data-ocid={`sitephotos.item.${idx + 1}`}
              className="group relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer hover:border-amber-500/50 transition-all text-left w-full"
              onClick={() =>
                openLightbox(filteredPhotos.findIndex((p) => p.id === photo.id))
              }
            >
              <div className="aspect-square bg-muted">
                <img
                  src={photo.dataUrl}
                  alt={photo.description || "Şantiye fotoğrafı"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <Badge
                  className={`text-[10px] px-1.5 py-0 border ${TAG_COLORS[photo.tag]}`}
                >
                  {TAG_LABELS[photo.tag]}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {getProjectName(photo.projectId)}
                </p>
                {photo.location && (
                  <p className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {photo.location}
                  </p>
                )}
              </div>
              <button
                type="button"
                data-ocid={`sitephotos.delete_button.${idx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          data-ocid="sitephotos.dialog"
          className="bg-card border-border max-w-3xl"
        >
          {filteredPhotos[lightboxIndex] && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  {filteredPhotos[lightboxIndex].description ||
                    "Fotoğraf Detayı"}
                </DialogTitle>
              </DialogHeader>
              <div className="relative">
                <img
                  src={filteredPhotos[lightboxIndex].dataUrl}
                  alt="Şantiye"
                  className="w-full rounded-lg object-contain max-h-[60vh]"
                />
                {lightboxIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((i) => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {lightboxIndex < filteredPhotos.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((i) => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Proje: </span>
                  <span className="text-foreground">
                    {getProjectName(filteredPhotos[lightboxIndex].projectId)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tarih: </span>
                  <span className="text-foreground">
                    {filteredPhotos[lightboxIndex].date}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Etiket: </span>
                  <Badge
                    className={`text-xs border ${TAG_COLORS[filteredPhotos[lightboxIndex].tag]}`}
                  >
                    {TAG_LABELS[filteredPhotos[lightboxIndex].tag]}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Yükleyen: </span>
                  <span className="text-foreground">
                    {filteredPhotos[lightboxIndex].uploadedBy}
                  </span>
                </div>
                {filteredPhotos[lightboxIndex].location && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Konum: </span>
                    <span className="text-foreground">
                      {filteredPhotos[lightboxIndex].location}
                    </span>
                  </div>
                )}
                {filteredPhotos[lightboxIndex].description && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Açıklama: </span>
                    <span className="text-foreground">
                      {filteredPhotos[lightboxIndex].description}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {lightboxIndex + 1} / {filteredPhotos.length}
                </span>
                <Button
                  data-ocid="sitephotos.close_button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLightboxOpen(false)}
                  className="border-border"
                >
                  <X className="w-3 h-3 mr-1" /> Kapat
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent
          data-ocid="sitephotos.upload.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Fotoğraf Yükle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File Drop */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              {newPhoto.dataUrl ? (
                <img
                  src={newPhoto.dataUrl}
                  alt="Önizleme"
                  className="max-h-40 mx-auto rounded object-contain"
                />
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Fotoğraf seçmek için tıklayın
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </button>
            <div>
              <Label>Proje *</Label>
              <Select
                value={newPhoto.projectId}
                onValueChange={(v) =>
                  setNewPhoto((prev) => ({ ...prev, projectId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="sitephotos.upload.project_select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companyProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Etiket</Label>
              <Select
                value={newPhoto.tag}
                onValueChange={(v) =>
                  setNewPhoto((prev) => ({
                    ...prev,
                    tag: v as SitePhoto["tag"],
                  }))
                }
              >
                <SelectTrigger
                  data-ocid="sitephotos.upload.tag_select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="ilerleme">İlerleme</SelectItem>
                  <SelectItem value="sorun">Sorun</SelectItem>
                  <SelectItem value="genel">Genel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Konum</Label>
              <Input
                data-ocid="sitephotos.upload.location_input"
                value={newPhoto.location}
                onChange={(e) =>
                  setNewPhoto((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Ör: Zemin kat, Blok A"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="sitephotos.upload.textarea"
                value={newPhoto.description}
                onChange={(e) =>
                  setNewPhoto((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Fotoğraf hakkında kısa açıklama"
                className="bg-background border-border mt-1 resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                data-ocid="sitephotos.upload.cancel_button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                className="border-border"
              >
                İptal
              </Button>
              <Button
                data-ocid="sitephotos.upload.submit_button"
                onClick={handleUpload}
                disabled={!newPhoto.dataUrl || !newPhoto.projectId}
                className="gradient-bg text-white"
              >
                Yükle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
