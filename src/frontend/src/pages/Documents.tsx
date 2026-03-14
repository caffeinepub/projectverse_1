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
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
  Clock,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import AccessDenied from "../components/AccessDenied";
import type { DocFile, DocFolder } from "../contexts/AppContext";
import { useApp } from "../contexts/AppContext";

const TYPE_ICONS: Record<string, React.ReactNode> = {
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

interface FileVersion {
  version: number;
  date: string;
  uploadedBy: string;
  size: string;
}

const STORAGE_KEY = (companyId: string | null) => `${companyId}_doc_versions`;

function loadVersions(companyId: string | null): Record<string, FileVersion[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(companyId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVersions(
  companyId: string | null,
  versions: Record<string, FileVersion[]>,
) {
  localStorage.setItem(STORAGE_KEY(companyId), JSON.stringify(versions));
}

export default function Documents() {
  const {
    activeRoleId,
    activeCompanyId,
    checkPermission,
    docFolders,
    docFiles,
    addDocFile,
    deleteDocFile,
    addDocFolder,
    user,
  } = useApp();

  const canView =
    checkPermission("documents", "view") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";
  const canEdit =
    checkPermission("documents", "edit") ||
    activeRoleId === "owner" ||
    activeRoleId === "manager";

  const [selectedFolder, setSelectedFolder] = useState(docFolders[0]?.id || "");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderSection, setNewFolderSection] = useState("Şirket");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [versions, setVersions] = useState<Record<string, FileVersion[]>>(() =>
    loadVersions(activeCompanyId),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFileData, setPendingFileData] = useState<{
    name: string;
    size: string;
    type: DocFile["type"];
    dataUrl: string;
  } | null>(null);

  if (!canView) return <AccessDenied />;

  const sections = Array.from(new Set(docFolders.map((f) => f.section)));
  const folderFiles = docFiles.filter(
    (f) =>
      f.folderId === selectedFolder &&
      (search === "" || f.name.toLowerCase().includes(search.toLowerCase())),
  );
  const selectedFolderObj = docFolders.find((f) => f.id === selectedFolder);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onload = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          const ext = file.name.split(".").pop()?.toUpperCase() || "DOC";
          const typeMap: Record<string, DocFile["type"]> = {
            PDF: "PDF",
            DOC: "DOC",
            DOCX: "DOC",
            JPG: "IMG",
            JPEG: "IMG",
            PNG: "IMG",
            GIF: "IMG",
            XLS: "XLS",
            XLSX: "XLS",
          };
          const docType: DocFile["type"] = typeMap[ext] || "DOC";
          setPendingFileData({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: docType,
            dataUrl: reader.result as string,
          });
          setIsUploading(false);
          setUploadProgress(0);
        }
        setUploadProgress(Math.min(progress, 100));
      }, 100);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!pendingFileData) return;
    const uploaderName = user?.name || "Ben";
    const newFile: DocFile = {
      id: `f${Date.now()}`,
      name: pendingFileData.name,
      type: pendingFileData.type,
      size: pendingFileData.size,
      uploadedBy: uploaderName,
      date: new Date().toISOString().split("T")[0],
      folderId: selectedFolder,
    };
    addDocFile(newFile);
    // Add version history
    const newVersions = { ...versions };
    newVersions[newFile.id] = [
      {
        version: 1,
        date: newFile.date,
        uploadedBy: uploaderName,
        size: pendingFileData.size,
      },
    ];
    setVersions(newVersions);
    saveVersions(activeCompanyId, newVersions);
    setPendingFileData(null);
    setUploadOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteDocFile(id);
    if (selectedFile?.id === id) setSelectedFile(null);
    const newVersions = { ...versions };
    delete newVersions[id];
    setVersions(newVersions);
    saveVersions(activeCompanyId, newVersions);
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: DocFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      section: newFolderSection,
      fileCount: 0,
    };
    addDocFolder(newFolder);
    setSelectedFolder(newFolder.id);
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  const fileVersions = selectedFile ? versions[selectedFile.id] || [] : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Belgeler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Şirket ve proje belge arşivi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* New Folder */}
          <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="documents.new_folder_button"
                variant="outline"
                className="border-border"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Yeni Klasör
              </Button>
            </DialogTrigger>
            <DialogContent
              data-ocid="documents.new_folder_dialog"
              className="bg-card border-border"
            >
              <DialogHeader>
                <DialogTitle>Yeni Klasör Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Klasör Adı</Label>
                  <Input
                    data-ocid="documents.folder_name.input"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="mt-1 bg-background border-border"
                    placeholder="örn: Sözleşmeler"
                  />
                </div>
                <div>
                  <Label>Bölüm</Label>
                  <Input
                    data-ocid="documents.folder_section.input"
                    value={newFolderSection}
                    onChange={(e) => setNewFolderSection(e.target.value)}
                    className="mt-1 bg-background border-border"
                    placeholder="örn: Şirket"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="documents.new_folder.cancel_button"
                  onClick={() => setNewFolderOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  data-ocid="documents.new_folder.confirm_button"
                  className="gradient-bg text-white"
                  onClick={handleAddFolder}
                  disabled={!newFolderName.trim()}
                >
                  Oluştur
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Upload */}
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
                data-ocid="documents.upload_dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>Dosya Yükle</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  {!pendingFileData && !isUploading && (
                    <button
                      type="button"
                      data-ocid="documents.dropzone"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">
                        Dosyayı buraya sürükle veya tıkla
                      </p>
                      <p className="text-xs mt-1">
                        PDF, DOC, XLS, IMG desteklenir
                      </p>
                    </button>
                  )}
                  {isUploading && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Yükleniyor... {Math.round(uploadProgress)}%
                      </p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  {pendingFileData && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg p-3">
                        {TYPE_ICONS[pendingFileData.type]}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {pendingFileData.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pendingFileData.size}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setPendingFileData(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Hedef klasör:{" "}
                        <span className="text-primary font-medium">
                          {selectedFolderObj?.name}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="documents.upload.cancel_button"
                    onClick={() => {
                      setUploadOpen(false);
                      setPendingFileData(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="documents.upload.submit_button"
                    className="gradient-bg text-white"
                    onClick={handleUpload}
                    disabled={!pendingFileData}
                  >
                    Yükle
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
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
                  {docFolders
                    .filter((f) => f.section === section)
                    .map((folder, idx) => (
                      <button
                        type="button"
                        key={folder.id}
                        data-ocid={`documents.folder.item.${idx + 1}`}
                        onClick={() => {
                          setSelectedFolder(folder.id);
                          setSelectedFile(null);
                        }}
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
                    ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* File List */}
        <div
          className={`flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col transition-all ${
            selectedFile ? "mr-0" : ""
          }`}
        >
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <FolderOpen className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                {selectedFolderObj?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({folderFiles.length} dosya)
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
              <Table data-ocid="documents.file.table">
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
                      Versiyon
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      İşlemler
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folderFiles.map((file, i) => (
                    <TableRow
                      key={file.id}
                      data-ocid={`documents.file.row.${i + 1}`}
                      className={`border-border hover:bg-white/5 cursor-pointer ${
                        selectedFile?.id === file.id ? "bg-primary/5" : ""
                      }`}
                      onClick={() =>
                        setSelectedFile(
                          selectedFile?.id === file.id ? null : file,
                        )
                      }
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
                        <Badge variant="outline" className="text-xs">
                          v{versions[file.id]?.length || 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`documents.file.secondary_button.${i + 1}`}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-ocid={`documents.file.delete_button.${i + 1}`}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
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

        {/* Version History Panel */}
        {selectedFile && (
          <div
            data-ocid="documents.version_panel"
            className="w-64 flex-shrink-0 bg-card border border-border rounded-xl flex flex-col"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Versiyon Geçmişi</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                {TYPE_ICONS[selectedFile.type]}
                <span className="text-sm font-medium truncate">
                  {selectedFile.name}
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {fileVersions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs">Versiyon geçmişi bulunamadı.</p>
                  </div>
                ) : (
                  fileVersions
                    .slice()
                    .reverse()
                    .map((ver) => (
                      <div
                        key={ver.version}
                        className="bg-background/50 border border-border rounded-lg p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/20"
                          >
                            v{ver.version}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ver.size}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ver.date}
                        </p>
                        <p className="text-xs text-foreground/80">
                          {ver.uploadedBy}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                <span>Toplam {fileVersions.length || 1} versiyon</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
