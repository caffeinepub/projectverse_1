import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";

type CSVType = "personnel" | "inventory" | "crm";

const FIELDS: Record<CSVType, string[]> = {
  personnel: ["ad", "soyad", "pozisyon", "departman", "telefon", "email"],
  inventory: ["ad", "kod", "kategori", "birim", "miktar", "birimFiyat"],
  crm: ["firmaAdı", "ilgiliKişi", "email", "telefon", "sektör"],
};

const LABELS: Record<CSVType, string> = {
  personnel: "Personel",
  inventory: "Malzeme / Stok",
  crm: "Müşteri / İletişim",
};

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
  type: CSVType;
  companyId: string;
  onImport: (rows: Record<string, string>[]) => void;
}

export default function CSVImportModal({
  open,
  onClose,
  type,
  companyId: _companyId,
  onImport,
}: CSVImportModalProps) {
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const fields = FIELDS[type];

  const downloadTemplate = () => {
    const header = fields.join(",");
    const example = fields
      .map((f) => {
        const examples: Record<string, string> = {
          ad: "Ahmet",
          soyad: "Yılmaz",
          pozisyon: "Mühendis",
          departman: "Teknik",
          telefon: "05XX",
          email: "a@b.com",
          kod: "STK-001",
          kategori: "Beton",
          birim: "m³",
          miktar: "100",
          birimFiyat: "250",
          firmaAdı: "ABC İnşaat",
          ilgiliKişi: "Mehmet Kaya",
          sektör: "İnşaat",
        };
        return examples[f] || f;
      })
      .join(",");
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_sablon.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setError("CSV dosyası boş veya geçersiz.");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = vals[i] || "";
        });
        return obj;
      });
      setParsedRows(rows);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows);
    setParsedRows([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  const previewRows = parsedRows.slice(0, 5);
  const previewHeaders =
    previewRows.length > 0 ? Object.keys(previewRows[0]) : fields;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" />
            CSV İçeri Aktar — {LABELS[type]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Şablon İndir
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sütunlar: {fields.join(", ")}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1"
              data-ocid="csv_import.download_button"
              onClick={downloadTemplate}
            >
              <Download className="w-3.5 h-3.5" /> Şablon İndir
            </Button>
          </div>

          {/* File upload */}
          <div className="p-3 rounded-lg bg-background border border-dashed border-border">
            <div className="flex items-center gap-3">
              <FileUp className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  data-ocid="csv_import.upload_button"
                  className="bg-transparent border-0 p-0 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-amber-500/20 file:text-amber-400 cursor-pointer"
                  onChange={handleFile}
                />
              </div>
              {fileName && (
                <span className="text-xs text-muted-foreground truncate max-w-32">
                  {fileName}
                </span>
              )}
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          {/* Preview */}
          {previewRows.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Önizleme (ilk 5 satır):
              </p>
              <div className="rounded-lg border border-border overflow-auto max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      {previewHeaders.map((h) => (
                        <TableHead
                          key={h}
                          className="text-muted-foreground text-xs py-2"
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow
                        key={`${i}-${Object.values(row).join("-").slice(0, 20)}`}
                        className="border-border hover:bg-muted/20"
                      >
                        {previewHeaders.map((h) => (
                          <TableCell
                            key={h}
                            className="text-xs py-2 text-foreground"
                          >
                            {row[h] || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {parsedRows.length} satır hazır
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-border" onClick={onClose}>
            İptal
          </Button>
          <Button
            className="gradient-bg text-white"
            disabled={parsedRows.length === 0}
            data-ocid="csv_import.submit_button"
            onClick={handleImport}
          >
            {parsedRows.length > 0
              ? `${parsedRows.length} Kayıt İçeri Aktar`
              : "İçeri Aktar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
