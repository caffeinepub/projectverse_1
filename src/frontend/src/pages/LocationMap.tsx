import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, MapPin, Pencil, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface ProjectLocation {
  lat: string;
  lon: string;
  address: string;
}

type LocationMap = Record<string, ProjectLocation>;

export default function LocationMap() {
  const { activeCompanyId, projects } = useApp();
  const companyId = activeCompanyId || "default";
  const storageKey = `projectLocations_${companyId}`;

  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );

  const [locations, setLocations] = useState<LocationMap>(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(locations));
  }, [locations, storageKey]);

  const [selectedId, setSelectedId] = useState<string | null>(
    companyProjects[0]?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProjectLocation>({
    lat: "",
    lon: "",
    address: "",
  });

  const filteredProjects = companyProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedProject = companyProjects.find((p) => p.id === selectedId);
  const selectedLocation = selectedId ? locations[selectedId] : null;

  const openEdit = () => {
    if (!selectedId) return;
    const loc = locations[selectedId];
    setEditForm(loc ?? { lat: "", lon: "", address: "" });
    setEditOpen(true);
  };

  const saveLocation = () => {
    if (!selectedId) return;
    if (!editForm.lat.trim() || !editForm.lon.trim()) return;
    setLocations((prev) => ({ ...prev, [selectedId]: editForm }));
    setEditOpen(false);
  };

  const hasLocation = (id: string) =>
    !!(locations[id]?.lat && locations[id]?.lon);

  const mapSrc =
    selectedLocation?.lat && selectedLocation?.lon
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedLocation.lon) - 0.01},${Number(selectedLocation.lat) - 0.01},${Number(selectedLocation.lon) + 0.01},${Number(selectedLocation.lat) + 0.01}&layer=mapnik&marker=${selectedLocation.lat},${selectedLocation.lon}`
      : null;

  const openInMaps = () => {
    if (!selectedLocation?.lat || !selectedLocation?.lon) return;
    window.open(
      `https://www.openstreetmap.org/?mlat=${selectedLocation.lat}&mlon=${selectedLocation.lon}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Harita & Konumlar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Proje şantiyelerinin coğrafi konumlarını yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol panel: Proje listesi */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="locationmap.search_input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Proje ara..."
              className="pl-9 bg-card border-border"
            />
          </div>

          {filteredProjects.length === 0 ? (
            <div
              data-ocid="locationmap.projects.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <MapPin className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {companyProjects.length === 0
                  ? "Henüz proje bulunmuyor"
                  : "Arama sonucu yok"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project, idx) => (
                <button
                  key={project.id}
                  type="button"
                  data-ocid={`locationmap.project.item.${idx + 1}`}
                  onClick={() => setSelectedId(project.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedId === project.id
                      ? "border-amber-500/60 bg-amber-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.title}
                      </p>
                      {locations[project.id]?.address && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {locations[project.id].address}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex-shrink-0 text-[10px] ${
                        hasLocation(project.id)
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {hasLocation(project.id) ? "Konum Var" : "Konum Yok"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sağ panel: Harita ve form */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedProject ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Bir proje seçin</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">
                    {selectedProject.title}
                  </h2>
                  {selectedLocation?.address && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {selectedLocation.address}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedLocation?.lat && selectedLocation?.lon && (
                    <Button
                      data-ocid="locationmap.open_maps.button"
                      variant="outline"
                      size="sm"
                      onClick={openInMaps}
                      className="border-border gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Haritada Aç
                    </Button>
                  )}
                  <Button
                    data-ocid="locationmap.edit.button"
                    size="sm"
                    onClick={openEdit}
                    className="gradient-bg text-white gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {selectedLocation?.lat ? "Konumu Düzenle" : "Konum Ekle"}
                  </Button>
                </div>
              </div>

              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardContent className="p-0">
                  {mapSrc ? (
                    <iframe
                      src={mapSrc}
                      title={`${selectedProject.title} konumu`}
                      width="100%"
                      height="380"
                      style={{ border: 0, display: "block" }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-80 text-center gap-3">
                      <MapPin className="w-12 h-12 text-muted-foreground/30" />
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Bu proje için henüz konum girilmedi
                        </p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                          Enlem ve boylam bilgisi ekleyerek haritada
                          görüntüleyin
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedLocation?.lat && selectedLocation?.lon && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Enlem
                        </p>
                        <p className="font-mono font-medium">
                          {selectedLocation.lat}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Boylam
                        </p>
                        <p className="font-mono font-medium">
                          {selectedLocation.lon}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Adres
                        </p>
                        <p className="truncate">
                          {selectedLocation.address || "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          data-ocid="locationmap.edit.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Konum Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Koordinatları Google Maps veya benzeri bir servisten
              kopyalayabilirsiniz. Örnek: Enlem 41.0082, Boylam 28.9784
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Enlem (Latitude) *</Label>
                <Input
                  data-ocid="locationmap.lat.input"
                  value={editForm.lat}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, lat: e.target.value }))
                  }
                  placeholder="41.0082"
                  className="mt-1 bg-card border-border font-mono"
                />
              </div>
              <div>
                <Label>Boylam (Longitude) *</Label>
                <Input
                  data-ocid="locationmap.lon.input"
                  value={editForm.lon}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, lon: e.target.value }))
                  }
                  placeholder="28.9784"
                  className="mt-1 bg-card border-border font-mono"
                />
              </div>
            </div>
            <div>
              <Label>Adres</Label>
              <Input
                data-ocid="locationmap.address.input"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Örn: Bağcılar, İstanbul"
                className="mt-1 bg-card border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="locationmap.cancel_button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="locationmap.save_button"
              onClick={saveLocation}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
