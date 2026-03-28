import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardEdit,
  FileText,
  Hash,
  ImageIcon,
  List,
  PenLine,
  PlusCircle,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

type FieldType =
  | "text"
  | "number"
  | "date"
  | "checkbox"
  | "dropdown"
  | "photo"
  | "signature";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  helpText: string;
  options: string[]; // for dropdown
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  createdBy: string;
}

interface FormResponse {
  id: string;
  templateId: string;
  templateName: string;
  submittedBy: string;
  submittedAt: string;
  values: Record<string, string | boolean | string[]>;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Metin",
  number: "Sayı",
  date: "Tarih",
  checkbox: "Onay Kutusu",
  dropdown: "Açılır Liste",
  photo: "Fotoğraf",
  signature: "İmza",
};

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  date: <CalendarDays className="w-4 h-4" />,
  checkbox: <CheckSquare className="w-4 h-4" />,
  dropdown: <List className="w-4 h-4" />,
  photo: <ImageIcon className="w-4 h-4" />,
  signature: <PenLine className="w-4 h-4" />,
};

function generateId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function useCustomFormStorage(companyId: string | undefined) {
  const templateKey = `customForms_${companyId}`;
  const responseKey = `customFormResponses_${companyId}`;

  const loadTemplates = (): FormTemplate[] => {
    if (!companyId) return [];
    try {
      return JSON.parse(localStorage.getItem(templateKey) || "[]");
    } catch {
      return [];
    }
  };

  const saveTemplates = (templates: FormTemplate[]) => {
    if (!companyId) return;
    localStorage.setItem(templateKey, JSON.stringify(templates));
  };

  const loadResponses = (): FormResponse[] => {
    if (!companyId) return [];
    try {
      return JSON.parse(localStorage.getItem(responseKey) || "[]");
    } catch {
      return [];
    }
  };

  const saveResponses = (responses: FormResponse[]) => {
    if (!companyId) return;
    localStorage.setItem(responseKey, JSON.stringify(responses));
  };

  return { loadTemplates, saveTemplates, loadResponses, saveResponses };
}

const EMPTY_FIELD = (): FormField => ({
  id: generateId(),
  type: "text",
  label: "",
  required: false,
  helpText: "",
  options: [],
});

export default function CustomFormBuilder() {
  const { currentCompany, user } = useApp();
  const { loadTemplates, saveTemplates, loadResponses, saveResponses } =
    useCustomFormStorage(currentCompany?.id);

  const [templates, setTemplates] = useState<FormTemplate[]>(loadTemplates);
  const [responses, setResponses] = useState<FormResponse[]>(loadResponses);

  // Builder modal state
  const [showBuilder, setShowBuilder] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([EMPTY_FIELD()]);
  const [newOption, setNewOption] = useState<Record<string, string>>({});

  // Fill form modal state
  const [fillTemplate, setFillTemplate] = useState<FormTemplate | null>(null);
  const [fillValues, setFillValues] = useState<
    Record<string, string | boolean | string[]>
  >({});
  const [fillBy, setFillBy] = useState("");

  const updateTemplates = (updated: FormTemplate[]) => {
    setTemplates(updated);
    saveTemplates(updated);
  };

  const updateResponses = (updated: FormResponse[]) => {
    setResponses(updated);
    saveResponses(updated);
  };

  // --- Field builder helpers ---
  const addField = () => {
    setFields((prev) => [...prev, EMPTY_FIELD()]);
  };

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const moveField = (id: string, dir: "up" | "down") => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const next = dir === "up" ? idx - 1 : idx + 1;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const addOption = (fieldId: string) => {
    const opt = (newOption[fieldId] || "").trim();
    if (!opt) return;
    updateField(fieldId, {
      options: [...(fields.find((f) => f.id === fieldId)?.options || []), opt],
    });
    setNewOption((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const removeOption = (fieldId: string, optIdx: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, {
      options: field.options.filter((_, i) => i !== optIdx),
    });
  };

  const saveTemplate = () => {
    if (!templateName.trim() || fields.length === 0) return;
    const template: FormTemplate = {
      id: generateId(),
      name: templateName.trim(),
      description: templateDescription.trim(),
      fields: fields.filter((f) => f.label.trim()),
      createdAt: new Date().toISOString(),
      createdBy: user?.name || "Bilinmiyor",
    };
    updateTemplates([...templates, template]);
    setShowBuilder(false);
    setTemplateName("");
    setTemplateDescription("");
    setFields([EMPTY_FIELD()]);
  };

  const deleteTemplate = (id: string) => {
    updateTemplates(templates.filter((t) => t.id !== id));
  };

  // --- Fill form helpers ---
  const openFillForm = (template: FormTemplate) => {
    setFillTemplate(template);
    const initial: Record<string, string | boolean | string[]> = {};
    for (const f of template.fields) {
      initial[f.id] =
        f.type === "checkbox"
          ? false
          : f.type === "dropdown"
            ? f.options[0] || ""
            : "";
    }
    setFillValues(initial);
    setFillBy(user?.name || "");
  };

  const submitFillForm = () => {
    if (!fillTemplate || !fillBy.trim()) return;
    const response: FormResponse = {
      id: generateId(),
      templateId: fillTemplate.id,
      templateName: fillTemplate.name,
      submittedBy: fillBy.trim(),
      submittedAt: new Date().toISOString(),
      values: fillValues,
    };
    updateResponses([...responses, response]);
    setFillTemplate(null);
  };

  return (
    <div className="p-6 space-y-6" data-ocid="custom_form.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <ClipboardEdit className="w-6 h-6" />
            Özel Form Şablonları
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Şirketinize özel saha ve denetim formu şablonları oluşturun
          </p>
        </div>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => setShowBuilder(true)}
          data-ocid="custom_form.open_modal_button"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Yeni Şablon Oluştur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(
          [
            {
              label: "Toplam Şablon",
              value: templates.length,
              color: "text-amber-400",
            },
            {
              label: "Gönderilen Yanıt",
              value: responses.length,
              color: "text-blue-400",
            },
            {
              label: "Toplam Alan",
              value: templates.reduce((s, t) => s + t.fields.length, 0),
              color: "text-green-400",
            },
          ] as const
        ).map((s) => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-xs">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            data-ocid="custom_form.tab"
          >
            Şablonlar
          </TabsTrigger>
          <TabsTrigger
            value="responses"
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            data-ocid="custom_form.tab"
          >
            Yanıtlar
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-400 text-base">
                Form Şablonları
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div
                  className="text-center py-16 text-zinc-500"
                  data-ocid="custom_form.empty_state"
                >
                  <ClipboardEdit className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Henüz form şablonu oluşturulmadı</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    "Yeni Şablon Oluştur" butonuyla özel saha formunuzu
                    tasarlayın
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">
                        Şablon Adı
                      </TableHead>
                      <TableHead className="text-zinc-400">Açıklama</TableHead>
                      <TableHead className="text-zinc-400">
                        Alan Sayısı
                      </TableHead>
                      <TableHead className="text-zinc-400">Oluşturan</TableHead>
                      <TableHead className="text-zinc-400">Tarih</TableHead>
                      <TableHead className="text-zinc-400" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((t, idx) => (
                      <TableRow
                        key={t.id}
                        className="border-zinc-800"
                        data-ocid={`custom_form.item.${idx + 1}`}
                      >
                        <TableCell className="text-zinc-200 font-medium">
                          {t.name}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm max-w-xs truncate">
                          {t.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-amber-900/40 text-amber-300 border-0">
                            {t.fields.length} alan
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-sm">
                          {t.createdBy}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm">
                          {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 h-7 text-xs"
                              onClick={() => openFillForm(t)}
                              data-ocid={`custom_form.primary_button.${idx + 1}`}
                            >
                              <ChevronRight className="w-3 h-3 mr-1" /> Formu
                              Kullan
                            </Button>
                            <button
                              type="button"
                              onClick={() => deleteTemplate(t.id)}
                              className="text-zinc-600 hover:text-red-400 transition-colors"
                              data-ocid={`custom_form.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* Responses Tab */}
        <TabsContent value="responses" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-400 text-base">
                Gönderilen Yanıtlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <div
                  className="text-center py-16 text-zinc-500"
                  data-ocid="custom_form.empty_state"
                >
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Henüz yanıt gönderilmedi</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Şablonlardan birini kullanarak form doldurun
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Şablon</TableHead>
                      <TableHead className="text-zinc-400">Gönderen</TableHead>
                      <TableHead className="text-zinc-400">
                        Gönderim Tarihi
                      </TableHead>
                      <TableHead className="text-zinc-400">Özet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((r, idx) => (
                      <TableRow
                        key={r.id}
                        className="border-zinc-800"
                        data-ocid={`custom_form.row.${idx + 1}`}
                      >
                        <TableCell className="text-zinc-200 font-medium">
                          {r.templateName}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {r.submittedBy}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm">
                          {new Date(r.submittedAt).toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-sm">
                          {Object.keys(r.values).length} alan dolduruldu
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== Builder Modal ===== */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent
          className="bg-zinc-900 border-zinc-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="custom_form.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <ClipboardEdit className="w-5 h-5" /> Yeni Form Şablonu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Name + Description */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">
                  Şablon Adı <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Örn: Günlük İSG Kontrol Listesi"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-ocid="custom_form.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Açıklama</Label>
                <Textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Bu formun amacını kısaca açıklayın..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={2}
                  data-ocid="custom_form.textarea"
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 text-sm font-semibold">
                  Form Alanları
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-600 h-7 text-xs"
                  onClick={addField}
                  data-ocid="custom_form.secondary_button"
                >
                  <PlusCircle className="w-3 h-3 mr-1" /> Alan Ekle
                </Button>
              </div>

              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-3"
                >
                  {/* Field header */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-xs font-mono">
                      Alan {idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "up")}
                        disabled={idx === 0}
                        className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 p-1"
                        data-ocid="custom_form.toggle"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "down")}
                        disabled={idx === fields.length - 1}
                        className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 p-1"
                        data-ocid="custom_form.toggle"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-1 ml-1"
                        data-ocid="custom_form.delete_button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Type + Label row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs">Alan Türü</Label>
                      <Select
                        value={field.type}
                        onValueChange={(v) =>
                          updateField(field.id, {
                            type: v as FieldType,
                            options: [],
                          })
                        }
                      >
                        <SelectTrigger
                          className="bg-zinc-900 border-zinc-600 text-white text-sm h-8"
                          data-ocid="custom_form.select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map(
                            (ft) => (
                              <SelectItem key={ft} value={ft}>
                                <span className="flex items-center gap-2">
                                  {FIELD_TYPE_ICONS[ft]}
                                  {FIELD_TYPE_LABELS[ft]}
                                </span>
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs">
                        Alan Etiketi
                      </Label>
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                        placeholder="Örn: Tarih, Notlar..."
                        className="bg-zinc-900 border-zinc-600 text-white text-sm h-8"
                        data-ocid="custom_form.input"
                      />
                    </div>
                  </div>

                  {/* Help text */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">
                      Yardım Metni (opsiyonel)
                    </Label>
                    <Input
                      value={field.helpText}
                      onChange={(e) =>
                        updateField(field.id, { helpText: e.target.value })
                      }
                      placeholder="Kullanıcıya gösterilecek açıklama..."
                      className="bg-zinc-900 border-zinc-600 text-white text-sm h-8"
                      data-ocid="custom_form.input"
                    />
                  </div>

                  {/* Dropdown options */}
                  {field.type === "dropdown" && (
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">
                        Seçenekler
                      </Label>
                      {field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {field.options.map((opt, oi) => (
                            <span
                              key={`option-${opt}`}
                              className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded"
                            >
                              {opt}
                              <button
                                type="button"
                                onClick={() => removeOption(field.id, oi)}
                                className="text-zinc-500 hover:text-red-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={newOption[field.id] || ""}
                          onChange={(e) =>
                            setNewOption((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addOption(field.id);
                            }
                          }}
                          placeholder="Seçenek ekle..."
                          className="bg-zinc-900 border-zinc-600 text-white text-sm h-8 flex-1"
                          data-ocid="custom_form.input"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-600 text-zinc-300 h-8"
                          onClick={() => addOption(field.id)}
                          data-ocid="custom_form.secondary_button"
                        >
                          Ekle
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Required toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(v) =>
                        updateField(field.id, { required: v })
                      }
                      className="data-[state=checked]:bg-amber-600"
                      data-ocid="custom_form.switch"
                    />
                    <Label className="text-zinc-400 text-xs">
                      Zorunlu alan
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowBuilder(false)}
              className="text-zinc-400"
              data-ocid="custom_form.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={saveTemplate}
              disabled={
                !templateName.trim() ||
                fields.filter((f) => f.label.trim()).length === 0
              }
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-ocid="custom_form.submit_button"
            >
              Şablonu Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Fill Form Modal ===== */}
      {fillTemplate && (
        <Dialog
          open={!!fillTemplate}
          onOpenChange={() => setFillTemplate(null)}
        >
          <DialogContent
            className="bg-zinc-900 border-zinc-700 text-white max-w-xl max-h-[90vh] overflow-y-auto"
            data-ocid="custom_form.modal"
          >
            <DialogHeader>
              <DialogTitle className="text-amber-400">
                {fillTemplate.name}
              </DialogTitle>
              {fillTemplate.description && (
                <p className="text-zinc-400 text-sm">
                  {fillTemplate.description}
                </p>
              )}
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">
                  Dolduran Kişi <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={fillBy}
                  onChange={(e) => setFillBy(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-ocid="custom_form.input"
                />
              </div>

              {fillTemplate.fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label className="text-zinc-300">
                    {field.label}
                    {field.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </Label>
                  {field.helpText && (
                    <p className="text-zinc-500 text-xs">{field.helpText}</p>
                  )}

                  {field.type === "text" && (
                    <Input
                      value={(fillValues[field.id] as string) || ""}
                      onChange={(e) =>
                        setFillValues((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                      className="bg-zinc-800 border-zinc-700 text-white"
                      data-ocid="custom_form.input"
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      type="number"
                      value={(fillValues[field.id] as string) || ""}
                      onChange={(e) =>
                        setFillValues((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                      className="bg-zinc-800 border-zinc-700 text-white"
                      data-ocid="custom_form.input"
                    />
                  )}

                  {field.type === "date" && (
                    <Input
                      type="date"
                      value={(fillValues[field.id] as string) || ""}
                      onChange={(e) =>
                        setFillValues((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!(fillValues[field.id] as boolean)}
                        onCheckedChange={(v) =>
                          setFillValues((prev) => ({
                            ...prev,
                            [field.id]: !!v,
                          }))
                        }
                        className="border-zinc-600 data-[state=checked]:bg-amber-600"
                        data-ocid="custom_form.checkbox"
                      />
                      <span className="text-zinc-300 text-sm">
                        {field.label}
                      </span>
                    </div>
                  )}

                  {field.type === "dropdown" && (
                    <Select
                      value={(fillValues[field.id] as string) || ""}
                      onValueChange={(v) =>
                        setFillValues((prev) => ({ ...prev, [field.id]: v }))
                      }
                    >
                      <SelectTrigger
                        className="bg-zinc-800 border-zinc-700 text-white"
                        data-ocid="custom_form.select"
                      >
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        {field.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "photo" && (
                    <div className="bg-zinc-800 border border-dashed border-zinc-600 rounded-lg p-4 text-center">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
                      <p className="text-zinc-500 text-xs">
                        Fotoğraf notu (saha uygulamasında kamera ile doldurulur)
                      </p>
                    </div>
                  )}

                  {field.type === "signature" && (
                    <div className="bg-zinc-800 border border-dashed border-zinc-600 rounded-lg p-4 text-center">
                      <PenLine className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
                      <p className="text-zinc-500 text-xs">
                        İmza notu (mobil uygulamada el imzası alınır)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setFillTemplate(null)}
                className="text-zinc-400"
                data-ocid="custom_form.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={submitFillForm}
                disabled={!fillBy.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                data-ocid="custom_form.submit_button"
              >
                Formu Gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
