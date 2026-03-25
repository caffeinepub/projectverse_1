import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Star, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";

interface SkillRatings {
  liderlik: number;
  iletisim: number;
  teknik: number;
  projYonetimi: number;
  isSagligGuv: number;
}

interface CareerPlan {
  id: string;
  personnelId: string;
  personnelName: string;
  mevcutPozisyon: string;
  hedefPozisyon: string;
  planlanmisTerfiTarihi: string;
  yetkinlikler: SkillRatings;
  bireyselHedefler: string;
  notlar: string;
}

const defaultSkills: SkillRatings = {
  liderlik: 3,
  iletisim: 3,
  teknik: 3,
  projYonetimi: 3,
  isSagligGuv: 3,
};

const empty: CareerPlan = {
  id: "",
  personnelId: "",
  personnelName: "",
  mevcutPozisyon: "",
  hedefPozisyon: "",
  planlanmisTerfiTarihi: "",
  yetkinlikler: { ...defaultSkills },
  bireyselHedefler: "",
  notlar: "",
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= value
              ? "fill-primary text-primary"
              : "fill-muted text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function CareerPlanTab() {
  const { activeCompanyId, hrPersonnel } = useApp();
  const storageKey = `pv_career_plans_${activeCompanyId}`;

  const [plans, setPlans] = useState<CareerPlan[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CareerPlan | null>(null);
  const [form, setForm] = useState<CareerPlan>(empty);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(plans));
  }, [plans, storageKey]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...empty,
      id: crypto.randomUUID(),
      yetkinlikler: { ...defaultSkills },
    });
    setDialogOpen(true);
  };

  const openEdit = (p: CareerPlan) => {
    setEditing(p);
    setForm({ ...p, yetkinlikler: { ...p.yetkinlikler } });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.personnelName || !form.mevcutPozisyon) return;
    if (editing) {
      setPlans((prev) => prev.map((p) => (p.id === form.id ? form : p)));
    } else {
      setPlans((prev) => [...prev, form]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const setSkill = (key: keyof SkillRatings, val: number) => {
    setForm((f) => ({
      ...f,
      yetkinlikler: { ...f.yetkinlikler, [key]: val },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Kariyer Planı
          </h2>
        </div>
        <Button data-ocid="career.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Plan Ekle
        </Button>
      </div>

      {plans.length === 0 ? (
        <div
          data-ocid="career.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Henüz kariyer planı oluşturulmadı.
          </p>
          <Button
            onClick={openAdd}
            variant="outline"
            className="mt-3"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" /> İlk Planı Ekle
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table data-ocid="career.table">
            <TableHeader>
              <TableRow>
                <TableHead>Personel</TableHead>
                <TableHead>Mevcut Pozisyon</TableHead>
                <TableHead>Hedef Pozisyon</TableHead>
                <TableHead>Terfi Tarihi</TableHead>
                <TableHead>Liderlik</TableHead>
                <TableHead>Teknik</TableHead>
                <TableHead>Prj.Yönetimi</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p, idx) => (
                <TableRow data-ocid={`career.item.${idx + 1}`} key={p.id}>
                  <TableCell className="font-medium">
                    {p.personnelName}
                  </TableCell>
                  <TableCell>{p.mevcutPozisyon}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.hedefPozisyon || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.planlanmisTerfiTarihi || "-"}
                  </TableCell>
                  <TableCell>
                    <StarRating value={p.yetkinlikler.liderlik} />
                  </TableCell>
                  <TableCell>
                    <StarRating value={p.yetkinlikler.teknik} />
                  </TableCell>
                  <TableCell>
                    <StarRating value={p.yetkinlikler.projYonetimi} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        data-ocid={`career.edit_button.${idx + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(p)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`career.delete_button.${idx + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="career.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Planı Düzenle" : "Yeni Kariyer Planı"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Personel *</Label>
                {hrPersonnel.length > 0 ? (
                  <Select
                    value={form.personnelId}
                    onValueChange={(v) => {
                      const p = hrPersonnel.find((x) => x.id === v);
                      setForm((f) => ({
                        ...f,
                        personnelId: v,
                        personnelName: p?.name || "",
                      }));
                    }}
                  >
                    <SelectTrigger
                      data-ocid="career.personnel.select"
                      className="bg-background border-border"
                    >
                      <SelectValue placeholder="Personel seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {hrPersonnel.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    data-ocid="career.personnelName.input"
                    value={form.personnelName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, personnelName: e.target.value }))
                    }
                    placeholder="Personel adı"
                    className="bg-background border-border"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label>Mevcut Pozisyon *</Label>
                <Input
                  data-ocid="career.mevcutPozisyon.input"
                  value={form.mevcutPozisyon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mevcutPozisyon: e.target.value }))
                  }
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1">
                <Label>Hedef Pozisyon</Label>
                <Input
                  data-ocid="career.hedefPozisyon.input"
                  value={form.hedefPozisyon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hedefPozisyon: e.target.value }))
                  }
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Planlanan Terfi Tarihi</Label>
                <Input
                  data-ocid="career.terfiTarihi.input"
                  type="date"
                  value={form.planlanmisTerfiTarihi}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      planlanmisTerfiTarihi: e.target.value,
                    }))
                  }
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Yetkinlik Değerlendirmesi (1-5)
              </Label>
              {(
                [
                  ["liderlik", "Liderlik"],
                  ["iletisim", "İletişim"],
                  ["teknik", "Teknik"],
                  ["projYonetimi", "Proje Yönetimi"],
                  ["isSagligGuv", "İş Sağlığı & Güvenliği"],
                ] as [keyof SkillRatings, string][]
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-36 flex-shrink-0">
                    {label}
                  </span>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[form.yetkinlikler[key]]}
                    onValueChange={([v]) => setSkill(key, v)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-4">
                    {form.yetkinlikler[key]}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label>Bireysel Gelişim Hedefleri</Label>
              <Textarea
                data-ocid="career.bireyselHedefler.textarea"
                value={form.bireyselHedefler}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bireyselHedefler: e.target.value }))
                }
                rows={2}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Notlar</Label>
              <Textarea
                data-ocid="career.notlar.textarea"
                value={form.notlar}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notlar: e.target.value }))
                }
                rows={2}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="career.cancel_button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button data-ocid="career.save_button" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
