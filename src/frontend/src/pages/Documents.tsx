import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

interface DocFile {
  id: string;
  name: string;
  type: "PDF" | "DOC" | "IMG" | "XLS";
  size: string;
  uploadedBy: string;
  date: string;
  folderId: string;
}

interface DocFolder {
  id: string;
  name: string;
  section: "Genel" | string;
  fileCount: number;
}

const FOLDERS: DocFolder[] = [
  { id: "genel", name: "Genel Belgeler", section: "Genel", fileCount: 4 },
  { id: "p1", name: "İstanbul Rezidans", section: "Projeler", fileCount: 3 },
  { id: "p2", name: "Ankara Plaza", section: "Projeler", fileCount: 4 },
  { id: "p3", name: "İzmir Liman", section: "Projeler", fileCount: 3 },
  { id: "p4", name: "Bursa Konutları", section: "Projeler", fileCount: 2 },
];

const ALL_FILES: DocFile[] = [
  // Genel
  {
    id: "f1",
    name: "Şirket Ana Sözleşmesi.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedBy: "Ahmet Yılmaz",
    date: "2025-12-01",
    folderId: "genel",
  },
  {
    id: "f2",
    name: "İSG Prosedürleri.pdf",
    type: "PDF",
    size: "1.8 MB",
    uploadedBy: "Fatma Kaya",
    date: "2026-01-15",
    folderId: "genel",
  },
  {
    id: "f3",
    name: "Personel El Kitabı.doc",
    type: "DOC",
    size: "980 KB",
    uploadedBy: "Selin Öztürk",
    date: "2026-02-10",
    folderId: "genel",
  },
  {
    id: "f4",
    name: "Bütçe Şablonu 2026.xls",
    type: "XLS",
    size: "540 KB",
    uploadedBy: "Zeynep Arslan",
    date: "2026-01-05",
    folderId: "genel",
  },
  // İstanbul Rezidans
  {
    id: "f5",
    name: "İstanbul Proje Planı.pdf",
    type: "PDF",
    size: "5.2 MB",
    uploadedBy: "Ali Çelik",
    date: "2026-02-20",
    folderId: "p1",
  },
  {
    id: "f6",
    name: "Saha Fotoğrafları.img",
    type: "IMG",
    size: "18.4 MB",
    uploadedBy: "Mehmet Demir",
    date: "2026-03-05",
    folderId: "p1",
  },
  {
    id: "f7",
    name: "Hakediş Raporu Şubat.xls",
    type: "XLS",
    size: "320 KB",
    uploadedBy: "Zeynep Arslan",
    date: "2026-03-01",
    folderId: "p1",
  },
  // Ankara Plaza
  {
    id: "f8",
    name: "Ankara Mimari Proje.pdf",
    type: "PDF",
    size: "8.7 MB",
    uploadedBy: "Ali Çelik",
    date: "2025-11-10",
    folderId: "p2",
  },
  {
    id: "f9",
    name: "Zemin Etüd Raporu.pdf",
    type: "PDF",
    size: "3.1 MB",
    uploadedBy: "Mehmet Demir",
    date: "2025-12-20",
    folderId: "p2",
  },
  {
    id: "f10",
    name: "Proje Takvimi.xls",
    type: "XLS",
    size: "210 KB",
    uploadedBy: "Ahmet Yılmaz",
    date: "2026-01-18",
    folderId: "p2",
  },
  {
    id: "f11",
    name: "Toplantı Notları.doc",
    type: "DOC",
    size: "120 KB",
    uploadedBy: "Fatma Kaya",
    date: "2026-02-28",
    folderId: "p2",
  },
  // İzmir Liman
  {
    id: "f12",
    name: "Liman İzin Belgesi.pdf",
    type: "PDF",
    size: "1.2 MB",
    uploadedBy: "Ahmet Yılmaz",
    date: "2026-01-30",
    folderId: "p3",
  },
  {
    id: "f13",
    name: "Deniz Yapısı Teknik Şartname.pdf",
    type: "PDF",
    size: "4.8 MB",
    uploadedBy: "Ali Çelik",
    date: "2026-02-14",
    folderId: "p3",
  },
  {
    id: "f14",
    name: "Konteyner Planı.img",
    type: "IMG",
    size: "7.2 MB",
    uploadedBy: "Mehmet Demir",
    date: "2026-03-08",
    folderId: "p3",
  },
  // Bursa
  {
    id: "f15",
    name: "Bursa Ruhsat Belgesi.pdf",
    type: "PDF",
    size: "890 KB",
    uploadedBy: "Fatma Kaya",
    date: "2026-02-05",
    folderId: "p4",
  },
  {
    id: "f16",
    name: "Konut Planları.img",
    type: "IMG",
    size: "12.1 MB",
    uploadedBy: "Ali Çelik",
    date: "2026-03-02",
    folderId: "p4",
  },
];

const TYPE_ICONS = {
  PDF: <FileText className="h-4 w-4 text-rose-400" />,
  DOC: <File className="h-4 w-4 text-blue-400" />,
  IMG: <FileImage className="h-4 w-4 text-emerald-400" />,
  XLS: <FileSpreadsheet className="h-4 w-4 text-amber-400" />,
};

const TYPE_BADGE: Record<string, string> = {
  PDF: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  DOC: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  IMG: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  XLS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function Documents() {
  const { activeRoleId, checkPermission } = useApp();
  const canView =
    checkPermission("documents", "view") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";
  const canEdit =
    checkPermission("documents", "edit") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";

  const [selectedFolder, setSelectedFolder] = useState("genel");
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<DocFile[]>(ALL_FILES);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");

  if (!canView) return <AccessDenied />;

  const sections = Array.from(new Set(FOLDERS.map((f) => f.section)));

  const folderFiles = files.filter(
    (f) =>
      f.folderId === selectedFolder &&
      (search === "" || f.name.toLowerCase().includes(search.toLowerCase())),
  );

  const selectedFolderObj = FOLDERS.find((f) => f.id === selectedFolder);

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = () => {
    if (!uploadName) return;
    const ext = uploadName.split(".").pop()?.toUpperCase() || "DOC";
    const type = ["PDF", "DOC", "IMG", "XLS"].includes(ext)
      ? (ext as DocFile["type"])
      : "DOC";
    const newFile: DocFile = {
      id: `f${Date.now()}`,
      name: uploadName,
      type,
      size: "—",
      uploadedBy: "Ben",
      date: new Date().toISOString().split("T")[0],
      folderId: selectedFolder,
    };
    setFiles((prev) => [newFile, ...prev]);
    setUploadName("");
    setUploadOpen(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Belgeler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Şirket ve proje belge arşivi
          </p>
        </div>
        {canEdit && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="documents.upload_button"
                className="gradient-bg text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Dosya Yükle
              </Button>
            </DialogTrigger>
            <DialogContent
              data-ocid="documents.dialog"
              className="bg-card border-border"
            >
              <DialogHeader>
                <DialogTitle>Dosya Yükle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Dosya Adı</Label>
                  <Input
                    data-ocid="documents.input"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="bg-background border-border mt-1"
                    placeholder="belge.pdf"
                  />
                </div>
                <div
                  data-ocid="documents.dropzone"
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Dosyayı buraya sürükle veya tıkla</p>
                  <p className="text-xs mt-1">PDF, DOC, XLS, IMG desteklenir</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hedef klasör:{" "}
                  <span className="text-primary font-medium">
                    {selectedFolderObj?.name}
                  </span>
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="documents.cancel_button"
                  onClick={() => setUploadOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  data-ocid="documents.submit_button"
                  className="gradient-bg text-white"
                  onClick={handleUpload}
                >
                  Yükle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Folder Sidebar */}
        <div className="w-56 flex-shrink-0 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Klasörler
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-3">
              {sections.map((section) => (
                <div key={section}>
                  <p className="text-xs text-muted-foreground font-medium px-2 py-1 uppercase tracking-wider">
                    {section}
                  </p>
                  {FOLDERS.filter((f) => f.section === section).map(
                    (folder) => (
                      <button
                        type="button"
                        key={folder.id}
                        data-ocid={`documents.${folder.id}.tab`}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                          selectedFolder === folder.id
                            ? "gradient-bg text-white"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`}
                      >
                        {selectedFolder === folder.id ? (
                          <FolderOpen className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <Folder className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="truncate flex-1 text-left">
                          {folder.name}
                        </span>
                        <span className="text-xs opacity-60">
                          {folder.fileCount}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* File List */}
        <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <FolderOpen className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                {selectedFolderObj?.name}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="documents.search_input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Dosya ara..."
                className="pl-7 h-8 bg-background border-border text-sm w-48"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {folderFiles.length === 0 ? (
              <div
                data-ocid="documents.empty_state"
                className="text-center py-16 text-muted-foreground"
              >
                <File className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">
                  {search
                    ? "Arama sonucu bulunamadı."
                    : "Bu klasörde belge yok."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Ad</TableHead>
                    <TableHead className="text-muted-foreground">Tür</TableHead>
                    <TableHead className="text-muted-foreground">
                      Boyut
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Yükleyen
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Tarih
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Aksiyonlar
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folderFiles.map((file, i) => (
                    <TableRow
                      key={file.id}
                      data-ocid={`documents.file.row.${i + 1}`}
                      className="border-border hover:bg-white/5"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {TYPE_ICONS[file.type]}
                          <span className="text-sm font-medium">
                            {file.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${TYPE_BADGE[file.type]}`}
                        >
                          {file.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {file.size}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {file.uploadedBy}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {file.date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`documents.file.secondary_button.${i + 1}`}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-ocid={`documents.file.delete_button.${i + 1}`}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                              onClick={() => handleDelete(file.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
