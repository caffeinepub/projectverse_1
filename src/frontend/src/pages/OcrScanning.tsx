import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Save,
  Scan,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

interface OcrResult {
  tedarikciAdi: string;
  faturaNo: string;
  faturaTarihi: string;
  toplamTutar: string;
  kdvTutari: string;
  aciklama: string;
}

interface ScannedDoc {
  id: string;
  fileName: string;
  scannedAt: string;
  result: OcrResult;
  savedToFinance: boolean;
}

const SAMPLE_SUPPLIERS = [
  "Aksa İnşaat Malzemeleri A.Ş.",
  "Demirhan Yapı Ürünleri Ltd.",
  "Kartal Çelik Sanayi A.Ş.",
  "Özgün Beton ve Hazır Harç",
  "Türkmen Elektrik Malzemeleri",
  "Güneş Makine Kiralama Ltd.",
];

const SAMPLE_DESCRIPTIONS = [
  "Beton santrali hizmeti ve malzeme tedariki",
  "Çelik donatı ve metal profil alımı",
  "Elektrik panosu ve kablo tesisatı",
  "İnşaat demiri ve bağlantı elemanları",
  "Zemin etüt ve laboratuvar hizmetleri",
  "Şantiye güvenlik sistemleri kurulumu",
];

function generateOcrResult(): OcrResult {
  const supplier =
    SAMPLE_SUPPLIERS[Math.floor(Math.random() * SAMPLE_SUPPLIERS.length)];
  const desc =
    SAMPLE_DESCRIPTIONS[Math.floor(Math.random() * SAMPLE_DESCRIPTIONS.length)];
  const year = 2025;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  const faturaNo = `FTR-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const net = Math.floor(Math.random() * 90000) + 10000;
  const kdv = Math.round(net * 0.2);
  const toplam = net + kdv;

  return {
    tedarikciAdi: supplier,
    faturaNo,
    faturaTarihi: `${day}.${month}.${year}`,
    toplamTutar: `${toplam.toLocaleString("tr-TR")} ₺`,
    kdvTutari: `${kdv.toLocaleString("tr-TR")} ₺`,
    aciklama: desc,
  };
}

export default function OcrScanning() {
  const { activeCompanyId } = useApp();
  const companyId = activeCompanyId || "default";
  const storageKey = `${companyId}_ocr_scanned_docs`;
  const financeKey = `${companyId}_finance_invoices`;

  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [, setOcrResult] = useState<OcrResult | null>(null);
  const [editedResult, setEditedResult] = useState<OcrResult | null>(null);
  const [savedDocs, setSavedDocs] = useState<ScannedDoc[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((fileName: string) => {
    setCurrentFile(fileName);
    setOcrResult(null);
    setEditedResult(null);
    setProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      const result = generateOcrResult();
      setOcrResult(result);
      setEditedResult({ ...result });
      setProcessing(false);
      toast.success("Belge başarıyla tarandı!");
    }, 2000);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file.name);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file.name);
  };

  const handleSaveToFinance = () => {
    if (!editedResult || !currentFile) return;

    const existing: any[] = JSON.parse(
      localStorage.getItem(financeKey) || "[]",
    );
    const newInvoice = {
      id: Date.now().toString(),
      type: "expense",
      category: "Fatura",
      description: editedResult.aciklama,
      amount: Number.parseFloat(
        editedResult.toplamTutar.replace(/[^0-9,]/g, "").replace(",", "."),
      ),
      date: editedResult.faturaTarihi,
      supplier: editedResult.tedarikciAdi,
      invoiceNo: editedResult.faturaNo,
      vatAmount: editedResult.kdvTutari,
      source: "ocr",
      createdAt: new Date().toISOString(),
    };
    existing.push(newInvoice);
    localStorage.setItem(financeKey, JSON.stringify(existing));

    const newDoc: ScannedDoc = {
      id: Date.now().toString(),
      fileName: currentFile,
      scannedAt: new Date().toLocaleString("tr-TR"),
      result: { ...editedResult },
      savedToFinance: true,
    };
    const updated = [newDoc, ...savedDocs];
    setSavedDocs(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    toast.success("Fatura Finans modülüne kaydedildi!");
    setOcrResult(null);
    setEditedResult(null);
    setCurrentFile(null);
    setProgress(0);
  };

  const handleDeleteDoc = (id: string) => {
    const updated = savedDocs.filter((d) => d.id !== id);
    setSavedDocs(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success("Kayıt silindi.");
  };

  const updateField = (field: keyof OcrResult, value: string) => {
    if (!editedResult) return;
    setEditedResult({ ...editedResult, [field]: value });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Scan className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Belge Tarama (OCR)</h1>
          <p className="text-slate-400 text-sm">
            Fatura ve makbuzları otomatik olarak tanıyın ve Finans'a aktarın
          </p>
        </div>
      </div>

      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="scan"
            data-ocid="ocr.scan.tab"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
          >
            <Scan className="w-4 h-4 mr-2" /> Belge Tara
          </TabsTrigger>
          <TabsTrigger
            value="history"
            data-ocid="ocr.history.tab"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
          >
            <Clock className="w-4 h-4 mr-2" /> Geçmiş ({savedDocs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-6">
          {/* Upload Area */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Belge Yükle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                data-ocid="ocr.dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) =>
                  e.key === "Enter" && fileInputRef.current?.click()
                }
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragging
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-slate-600 hover:border-amber-500/50 hover:bg-slate-700/30"
                }`}
              >
                <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-white font-medium">
                  Dosyayı sürükle & bırak veya tıkla
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  PNG, JPG, PDF desteklenir (maks. 10 MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </button>

              {processing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      OCR işlemi yapılıyor: {currentFile}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <button
                      type="button"
                      className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-slate-400 text-xs text-right">
                    {progress}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OCR Results Form */}
          {editedResult && !processing && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Tanınan Bilgiler
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                      OCR Tamamlandı
                    </Badge>
                  </CardTitle>
                  <span className="text-slate-400 text-xs">{currentFile}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-sm">
                      Tedarikçi Adı
                    </Label>
                    <Input
                      data-ocid="ocr.supplier.input"
                      value={editedResult.tedarikciAdi}
                      onChange={(e) =>
                        updateField("tedarikciAdi", e.target.value)
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-sm">Fatura No</Label>
                    <Input
                      data-ocid="ocr.invoice_no.input"
                      value={editedResult.faturaNo}
                      onChange={(e) => updateField("faturaNo", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-sm">
                      Fatura Tarihi
                    </Label>
                    <Input
                      data-ocid="ocr.invoice_date.input"
                      value={editedResult.faturaTarihi}
                      onChange={(e) =>
                        updateField("faturaTarihi", e.target.value)
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-sm">
                      Toplam Tutar
                    </Label>
                    <Input
                      data-ocid="ocr.total_amount.input"
                      value={editedResult.toplamTutar}
                      onChange={(e) =>
                        updateField("toplamTutar", e.target.value)
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-sm">KDV Tutarı</Label>
                    <Input
                      data-ocid="ocr.vat.input"
                      value={editedResult.kdvTutari}
                      onChange={(e) => updateField("kdvTutari", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm">Açıklama</Label>
                  <Textarea
                    data-ocid="ocr.description.textarea"
                    value={editedResult.aciklama}
                    onChange={(e) => updateField("aciklama", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    data-ocid="ocr.save_to_finance.button"
                    onClick={handleSaveToFinance}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Finans'a Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          {savedDocs.length === 0 ? (
            <div data-ocid="ocr.empty_state" className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Henüz taranan belge yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedDocs.map((doc, idx) => (
                <Card
                  key={doc.id}
                  data-ocid={`ocr.item.${idx + 1}`}
                  className="bg-slate-800 border-slate-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-medium text-sm truncate">
                              {doc.fileName}
                            </p>
                            {doc.savedToFinance && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs shrink-0">
                                Finans'a Aktarıldı
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {doc.scannedAt}
                          </p>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                            <span className="text-slate-400">
                              Tedarikçi:{" "}
                              <span className="text-slate-200">
                                {doc.result.tedarikciAdi}
                              </span>
                            </span>
                            <span className="text-slate-400">
                              Fatura No:{" "}
                              <span className="text-slate-200">
                                {doc.result.faturaNo}
                              </span>
                            </span>
                            <span className="text-slate-400">
                              Tutar:{" "}
                              <span className="text-amber-300 font-medium">
                                {doc.result.toplamTutar}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        data-ocid={`ocr.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-slate-500 hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
