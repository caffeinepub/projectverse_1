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
import { Switch } from "@/components/ui/switch";
import { Edit2, Plus, Trash2, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  target: string;
  active: boolean;
  createdAt: string;
}

const TRIGGER_OPTIONS = [
  { value: "invoice_limit", label: "Fatura tutarı limit aşarsa" },
  { value: "stock_critical", label: "Stok kritik seviyeye düşerse" },
  { value: "task_overdue", label: "Görev süresi geçerse" },
  { value: "approval_pending", label: "Onay 3 gün beklemede kalırsa" },
  { value: "new_employee", label: "Yeni personel eklendikçe" },
];

const ACTION_OPTIONS = [
  { value: "notify_manager", label: "Üst yöneticiye bildirim gönder" },
  { value: "email_alert", label: "E-posta uyarısı oluştur" },
  { value: "auto_approval", label: "Otomatik onay isteği başlat" },
  { value: "assign_task", label: "Görev ata" },
  { value: "webhook", label: "Slack/webhook tetikle" },
];

const EMPTY_FORM: Omit<WorkflowRule, "id" | "createdAt"> = {
  name: "",
  trigger: "",
  condition: "",
  action: "",
  target: "",
  active: true,
};

export default function WorkflowAutomation() {
  const { activeCompanyId } = useApp();
  const companyId = activeCompanyId || "default";
  const storageKey = `workflowRules_${companyId}`;

  const [rules, setRules] = useState<WorkflowRule[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(rules));
  }, [rules, storageKey]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (rule: WorkflowRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      condition: rule.condition,
      action: rule.action,
      target: rule.target,
      active: rule.active,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.trigger || !form.action) return;
    if (editingId) {
      setRules((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...form } : r)),
      );
    } else {
      const newRule: WorkflowRule = {
        ...form,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [newRule, ...prev]);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirmId(null);
  };

  const toggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    );
  };

  const getTriggerLabel = (val: string) =>
    TRIGGER_OPTIONS.find((o) => o.value === val)?.label || val;
  const getActionLabel = (val: string) =>
    ACTION_OPTIONS.find((o) => o.value === val)?.label || val;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              İş Akışı Otomasyonu
            </h1>
            <p className="text-sm text-gray-400">
              Tetikleyici kurallara göre otomatik aksiyonlar tanımlayın
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          data-ocid="workflow.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kural
        </Button>
      </div>

      {/* Stats bar */}
      {rules.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Toplam Kural", value: rules.length, color: "text-white" },
            {
              label: "Aktif",
              value: rules.filter((r) => r.active).length,
              color: "text-green-400",
            },
            {
              label: "Pasif",
              value: rules.filter((r) => !r.active).length,
              color: "text-gray-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4"
            >
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      <AnimatePresence>
        {rules.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 space-y-4"
            data-ocid="workflow.empty_state"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2.5,
                ease: "easeInOut",
              }}
              className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20"
            >
              <Zap className="w-12 h-12 text-amber-400" />
            </motion.div>
            <p className="text-xl font-semibold text-gray-300">
              Henüz kural yok
            </p>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              İlk otomasyon kuralını ekleyerek tekrarlayan işlemleri
              otomatikleştirin.
            </p>
            <Button
              onClick={openCreate}
              className="mt-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-ocid="workflow.secondary_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kural Oluştur
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules list */}
      <div className="space-y-3">
        <AnimatePresence>
          {rules.map((rule, idx) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 flex items-start gap-4"
              data-ocid={`workflow.item.${idx + 1}`}
            >
              <div
                className={`mt-1 p-2 rounded-lg shrink-0 ${
                  rule.active
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-gray-700/30 border border-white/5"
                }`}
              >
                <Zap
                  className={`w-4 h-4 ${
                    rule.active ? "text-amber-400" : "text-gray-500"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{rule.name}</span>
                  <Badge
                    className={`text-xs ${
                      rule.active
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-gray-600/30 text-gray-400 border-gray-500/30"
                    }`}
                    variant="outline"
                  >
                    {rule.active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-1 rounded-md">
                    Tetikleyici: {getTriggerLabel(rule.trigger)}
                  </span>
                  <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-1 rounded-md">
                    Aksiyon: {getActionLabel(rule.action)}
                  </span>
                  {rule.condition && (
                    <span className="bg-gray-700/40 border border-white/5 text-gray-400 px-2 py-1 rounded-md">
                      Koşul: {rule.condition}
                    </span>
                  )}
                  {rule.target && (
                    <span className="bg-gray-700/40 border border-white/5 text-gray-400 px-2 py-1 rounded-md">
                      Hedef: {rule.target}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={rule.active}
                  onCheckedChange={() => toggleActive(rule.id)}
                  data-ocid={`workflow.toggle.${idx + 1}`}
                  className="data-[state=checked]:bg-amber-500"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(rule)}
                  className="text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
                  data-ocid={`workflow.edit_button.${idx + 1}`}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirmId(rule.id)}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  data-ocid={`workflow.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-[#1a1f2e] border border-white/10 text-white max-w-md"
          data-ocid="workflow.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {editingId ? "Kuralı Düzenle" : "Yeni Otomasyon Kuralı"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Kural Adı *</Label>
              <Input
                placeholder="Örn: Yüksek fatura uyarısı"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600"
                data-ocid="workflow.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Tetikleyici *</Label>
              <Select
                value={form.trigger}
                onValueChange={(v) => setForm((f) => ({ ...f, trigger: v }))}
              >
                <SelectTrigger
                  className="bg-[#0f1117] border-white/10 text-white"
                  data-ocid="workflow.select"
                >
                  <SelectValue placeholder="Tetikleyici seçin" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {TRIGGER_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="text-white hover:bg-amber-500/10"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">
                Koşul <span className="text-gray-500">(isteğe bağlı)</span>
              </Label>
              <Input
                placeholder="Örn: 50000 TL üzeri"
                value={form.condition}
                onChange={(e) =>
                  setForm((f) => ({ ...f, condition: e.target.value }))
                }
                className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Aksiyon *</Label>
              <Select
                value={form.action}
                onValueChange={(v) => setForm((f) => ({ ...f, action: v }))}
              >
                <SelectTrigger className="bg-[#0f1117] border-white/10 text-white">
                  <SelectValue placeholder="Aksiyon seçin" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {ACTION_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="text-white hover:bg-amber-500/10"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">
                Hedef Kullanıcı/Rol
              </Label>
              <Input
                placeholder="Örn: Finans Müdürü, Proje Yöneticisi"
                value={form.target}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target: e.target.value }))
                }
                className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label className="text-gray-300 text-sm">Kural Aktif</Label>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                className="data-[state=checked]:bg-amber-500"
                data-ocid="workflow.switch"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white"
              data-ocid="workflow.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.trigger || !form.action}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-40"
              data-ocid="workflow.submit_button"
            >
              {editingId ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent
          className="bg-[#1a1f2e] border border-white/10 text-white max-w-sm"
          data-ocid="workflow.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-red-400">Kuralı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm py-2">
            Bu otomasyon kuralını silmek istediğinizden emin misiniz? Bu işlem
            geri alınamaz.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
              className="text-gray-400 hover:text-white"
              data-ocid="workflow.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-ocid="workflow.confirm_button"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
