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
  ClipboardCheck,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface SurveyQuestion {
  id: string;
  text: string;
  type: "metin" | "çoktan-seçmeli" | "puan";
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  deadline: string;
  anonymous: boolean;
  targetGroup: string;
  status: string;
  responseCount: number;
  createdAt: string;
}

interface QuickFeedback {
  id: string;
  text: string;
  date: string;
}

const emptySurvey = (): Omit<Survey, "id" | "responseCount" | "createdAt"> => ({
  title: "",
  description: "",
  questions: [],
  deadline: "",
  anonymous: true,
  targetGroup: "Tüm Personel",
  status: "Taslak",
});

function statusBadgeColor(s: string): string {
  if (s === "Aktif")
    return "bg-green-500/20 text-green-400 border-green-500/30";
  if (s === "Tamamlandı")
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
}

export default function EmployeeSurveys() {
  const { activeCompanyId } = useApp();
  const surveysKey = `pv_surveys_${activeCompanyId}`;
  const feedbackKey = `pv_quickfeedback_${activeCompanyId}`;

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [feedbacks, setFeedbacks] = useState<QuickFeedback[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptySurvey());
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionType, setNewQuestionType] =
    useState<SurveyQuestion["type"]>("metin");
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    setSurveys(JSON.parse(localStorage.getItem(surveysKey) || "[]"));
    setFeedbacks(JSON.parse(localStorage.getItem(feedbackKey) || "[]"));
  }, [surveysKey, feedbackKey]);

  const saveSurveys = (data: Survey[]) => {
    setSurveys(data);
    localStorage.setItem(surveysKey, JSON.stringify(data));
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    const q: SurveyQuestion = {
      id: Date.now().toString(),
      text: newQuestion,
      type: newQuestionType,
    };
    setForm((f) => ({ ...f, questions: [...f.questions, q] }));
    setNewQuestion("");
  };

  const removeQuestion = (id: string) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((q) => q.id !== id),
    }));
  };

  const handleSaveSurvey = () => {
    if (!form.title) return;
    const survey: Survey = {
      id: Date.now().toString(),
      ...form,
      responseCount: 0,
      createdAt: new Date().toLocaleDateString("tr-TR"),
    };
    saveSurveys([...surveys, survey]);
    setShowDialog(false);
    setForm(emptySurvey());
  };

  const handleDeleteSurvey = (id: string) => {
    saveSurveys(surveys.filter((s) => s.id !== id));
  };

  const handleStatusChange = (id: string, status: string) => {
    saveSurveys(surveys.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    const fb: QuickFeedback = {
      id: Date.now().toString(),
      text: feedbackText,
      date: new Date().toLocaleDateString("tr-TR"),
    };
    const updated = [fb, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem(feedbackKey, JSON.stringify(updated));
    setFeedbackText("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Anket & Geri Bildirim
          </h1>
          <p className="text-muted-foreground text-sm">
            Çalışan anketleri ve anlık geri bildirim sistemi
          </p>
        </div>
      </div>

      {/* Quick Feedback Box */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-1">
            <MessageSquare className="w-4 h-4" /> Hızlı Geri Bildirim
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Anonim geri bildiriminizi yazın..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
              data-ocid="surveys.input"
            />
            <Button
              onClick={handleSendFeedback}
              data-ocid="surveys.primary_button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="surveys">
        <TabsList>
          <TabsTrigger value="surveys">Anketler</TabsTrigger>
          <TabsTrigger value="results">Sonuçlar</TabsTrigger>
          <TabsTrigger value="feedback">Geri Bildirimler</TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Anketler</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowDialog(true)}
                data-ocid="surveys.open_modal_button"
              >
                <Plus className="w-4 h-4 mr-1" /> Anket Oluştur
              </Button>
            </CardHeader>
            <CardContent>
              {surveys.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="surveys.empty_state"
                >
                  <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Henüz anket yok</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Hedef Grup</TableHead>
                      <TableHead>Son Tarih</TableHead>
                      <TableHead>Anonim</TableHead>
                      <TableHead>Yanıt</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveys.map((s, i) => (
                      <TableRow key={s.id} data-ocid={`surveys.item.${i + 1}`}>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell>{s.targetGroup}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.deadline}
                        </TableCell>
                        <TableCell>{s.anonymous ? "Evet" : "Hayır"}</TableCell>
                        <TableCell>{s.responseCount}</TableCell>
                        <TableCell>
                          <Select
                            value={s.status}
                            onValueChange={(v) => handleStatusChange(s.id, v)}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Taslak">Taslak</SelectItem>
                              <SelectItem value="Aktif">Aktif</SelectItem>
                              <SelectItem value="Tamamlandı">
                                Tamamlandı
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSurvey(s.id)}
                            data-ocid={`surveys.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <div className="space-y-4">
            {surveys.filter(
              (s) => s.status === "Tamamlandı" || s.responseCount > 0,
            ).length === 0 ? (
              <Card className="border-border">
                <CardContent className="text-center py-12 text-muted-foreground">
                  <p>Sonuç görüntülemek için tamamlanmış anket gerekli</p>
                </CardContent>
              </Card>
            ) : (
              surveys
                .filter((s) => s.responseCount > 0 || s.status === "Tamamlandı")
                .map((s) => (
                  <Card key={s.id} className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {s.responseCount} yanıt &bull;{" "}
                        <Badge className={statusBadgeColor(s.status)}>
                          {s.status}
                        </Badge>
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {s.questions.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-center justify-between py-2 border-b border-border"
                          >
                            <p className="text-sm">{q.text}</p>
                            <Badge variant="outline">{q.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">
                Anonim Geri Bildirimler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Henüz geri bildirim yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((fb, i) => (
                    <div
                      key={fb.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border"
                      data-ocid={`surveys.feedback.item.${i + 1}`}
                    >
                      <MessageSquare className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">{fb.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fb.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Survey Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-w-lg max-h-[85vh] overflow-y-auto"
          data-ocid="surveys.dialog"
        >
          <DialogHeader>
            <DialogTitle>Anket Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                data-ocid="surveys.search_input"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Son Tarih</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deadline: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Hedef Grup</Label>
                <Select
                  value={form.targetGroup}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, targetGroup: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tüm Personel">Tüm Personel</SelectItem>
                    <SelectItem value="Saha">Saha</SelectItem>
                    <SelectItem value="Ofis">Ofis</SelectItem>
                    <SelectItem value="Yönetim">Yönetim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.anonymous}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, anonymous: v }))
                }
                data-ocid="surveys.switch"
              />
              <Label>Anonim</Label>
            </div>
            <div>
              <Label className="mb-2 block">Sorular</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Soru metni"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                />
                <Select
                  value={newQuestionType}
                  onValueChange={(v) =>
                    setNewQuestionType(v as SurveyQuestion["type"])
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metin">Metin</SelectItem>
                    <SelectItem value="çoktan-seçmeli">
                      Çoktan Seçmeli
                    </SelectItem>
                    <SelectItem value="puan">Puan (1-5)</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={addQuestion}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {form.questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <span className="text-sm">{q.text}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {q.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-ocid="surveys.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveSurvey}
              data-ocid="surveys.submit_button"
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
