import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Key,
  Layers,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type MemberEntry,
  type ModulePermissions,
  ROLE_HIERARCHY,
  useApp,
} from "../contexts/AppContext";

const MODULES_LIST = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projeler" },
  { id: "fieldOps", label: "Saha Operasyonları" },
  { id: "settings", label: "Ayarlar" },
];

const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projeler" },
  { id: "communication", label: "İletişim" },
  { id: "documents", label: "Dokümanlar" },
  { id: "hr", label: "İnsan Kaynakları" },
  { id: "finance", label: "Finans" },
  { id: "purchasing", label: "Satın Alma" },
  { id: "inventory", label: "Stok" },
  { id: "fieldOps", label: "Saha Operasyonları" },
  { id: "qualitySafety", label: "Kalite & Güvenlik" },
  { id: "crm", label: "CRM" },
  { id: "reports", label: "Raporlama" },
];

function emptyPermissions(): Record<string, ModulePermissions> {
  const result: Record<string, ModulePermissions> = {};
  for (const m of MODULES_LIST) {
    result[m.id] = { view: false, edit: false, delete: false };
  }
  return result;
}

function PermissionSection({
  permissions,
  onChange,
  prefix,
}: {
  permissions: Record<string, ModulePermissions>;
  onChange: (p: Record<string, ModulePermissions>) => void;
  prefix: string;
}) {
  const toggle = (modId: string, key: keyof ModulePermissions) => {
    const updated = {
      ...permissions,
      [modId]: { ...permissions[modId], [key]: !permissions[modId]?.[key] },
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {MODULES_LIST.map((mod) => (
        <div
          key={mod.id}
          className="rounded-lg p-3"
          style={{ background: "oklch(0.20 0.01 264)" }}
        >
          <p className="text-sm font-medium text-foreground mb-2">
            {mod.label}
          </p>
          <div className="flex gap-4">
            {(["view", "edit", "delete"] as (keyof ModulePermissions)[]).map(
              (perm) => {
                const checkId = `${prefix}-${mod.id}-${perm}`;
                return (
                  <div key={perm} className="flex items-center gap-1.5">
                    <Checkbox
                      id={checkId}
                      data-ocid={`${prefix}.${mod.id}_${perm}_checkbox`}
                      checked={!!permissions[mod.id]?.[perm]}
                      onCheckedChange={() => toggle(mod.id, perm)}
                    />
                    <Label
                      htmlFor={checkId}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {perm === "view"
                        ? "Görüntüle"
                        : perm === "edit"
                          ? "Düzenle"
                          : "Sil"}
                    </Label>
                  </div>
                );
              },
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddMemberDialog({
  companyId,
  onAdd,
}: {
  companyId: string;
  onAdd: (member: Omit<MemberEntry, "userId">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");
  const [permissions, setPermissions] = useState<
    Record<string, ModulePermissions>
  >(emptyPermissions());

  void companyId;

  const assignableRoles = ROLE_HIERARCHY.filter((r) => r.level > 0);
  const selectedRoleObj = assignableRoles.find((r) => r.id === selectedRole);

  const handleAdd = () => {
    if (!memberName.trim() || !loginCode.trim() || !selectedRole) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    onAdd({
      name: memberName.trim(),
      loginCode: loginCode.trim().toUpperCase(),
      roleIds: [selectedRole],
      subType: selectedSubType || undefined,
      permissions,
    });
    setOpen(false);
    setMemberName("");
    setLoginCode("");
    setSelectedRole("");
    setSelectedSubType("");
    setPermissions(emptyPermissions());
    toast.success("Personel başarıyla eklendi.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="personnel.add_button"
          className="gradient-bg text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Personel Ekle
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: "oklch(0.18 0.015 264)",
          border: "1px solid oklch(0.28 0.02 264)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Yeni Personel Ekle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label
              htmlFor="add-member-name"
              className="text-foreground text-sm"
            >
              Ad Soyad *
            </Label>
            <Input
              id="add-member-name"
              data-ocid="add_member.name_input"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Personel adı"
              className="mt-1 bg-background/50"
            />
          </div>
          <div>
            <Label
              htmlFor="add-member-code"
              className="text-foreground text-sm"
            >
              Giriş Kodu *
            </Label>
            <Input
              id="add-member-code"
              data-ocid="add_member.login_code_input"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder="16 karakterli giriş kodu"
              className="mt-1 bg-background/50 font-mono"
              maxLength={16}
            />
          </div>
          <div>
            <Label className="text-foreground text-sm">Rol *</Label>
            <RadioGroup
              data-ocid="add_member.role_select"
              value={selectedRole}
              onValueChange={(v) => {
                setSelectedRole(v);
                setSelectedSubType("");
              }}
              className="mt-2 space-y-2"
            >
              {assignableRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{
                    background:
                      selectedRole === role.id
                        ? `${role.color}22`
                        : "oklch(0.20 0.01 264)",
                    border: `1px solid ${
                      selectedRole === role.id
                        ? `${role.color}66`
                        : "transparent"
                    }`,
                  }}
                >
                  <RadioGroupItem value={role.id} id={`role-${role.id}`} />
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-medium cursor-pointer"
                    style={{
                      color: selectedRole === role.id ? role.color : undefined,
                    }}
                  >
                    {role.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedRoleObj && selectedRoleObj.subTypes.length > 0 && (
            <div>
              <Label className="text-foreground text-sm">Alt Tip</Label>
              <Select
                value={selectedSubType}
                onValueChange={setSelectedSubType}
              >
                <SelectTrigger
                  data-ocid="add_member.subtype_select"
                  className="mt-1 bg-background/50"
                >
                  <SelectValue placeholder="Alt tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRoleObj.subTypes.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-foreground text-sm mb-3 block">
              Modül İzinleri
            </Label>
            <PermissionSection
              permissions={permissions}
              onChange={setPermissions}
              prefix="add_member"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="add_member.cancel_button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            İptal
          </Button>
          <Button
            data-ocid="add_member.submit_button"
            onClick={handleAdd}
            className="gradient-bg text-white"
          >
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPermissionsDialog({
  member,
  companyId,
  index,
}: {
  member: MemberEntry;
  companyId: string;
  index: number;
}) {
  const { updateMemberPermissions } = useApp();
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState<
    Record<string, ModulePermissions>
  >(member.permissions || emptyPermissions());

  const handleSave = () => {
    updateMemberPermissions(companyId, member.userId, permissions);
    setOpen(false);
    toast.success("İzinler güncellendi.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid={`personnel.member.edit_button.${index}`}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          <Edit2 className="w-3 h-3 mr-1" />
          İzinler
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: "oklch(0.18 0.015 264)",
          border: "1px solid oklch(0.28 0.02 264)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {member.name} — İzinler
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <PermissionSection
            permissions={permissions}
            onChange={setPermissions}
            prefix="edit_member"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} className="gradient-bg text-white">
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerateInviteDialog({ companyId }: { companyId: string }) {
  const { generateInviteCode } = useApp();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const assignableRoles = ROLE_HIERARCHY.filter((r) => r.level > 0);
  const selectedRoleObj = assignableRoles.find((r) => r.id === selectedRole);

  const handleGenerate = () => {
    if (!selectedRole) {
      toast.error("Lütfen bir rol seçin.");
      return;
    }
    const code = generateInviteCode(
      companyId,
      selectedRole,
      selectedSubType || undefined,
    );
    setGeneratedCode(code);
    toast.success("Davet kodu oluşturuldu!");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Kod kopyalandı!");
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedCode("");
    setSelectedRole("");
    setSelectedSubType("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button
          data-ocid="personnel.generate_invite_button"
          variant="outline"
          className="border-primary/50 text-primary hover:bg-primary/10"
        >
          <Key className="w-4 h-4 mr-2" />
          Davet Kodu Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="invite_code.dialog"
        className="max-w-md"
        style={{
          background: "oklch(0.18 0.015 264)",
          border: "1px solid oklch(0.28 0.02 264)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Davet Kodu Oluştur
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-foreground text-sm">Rol *</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => {
                setSelectedRole(v);
                setSelectedSubType("");
                setGeneratedCode("");
              }}
            >
              <SelectTrigger
                data-ocid="invite_code.role_select"
                className="mt-1 bg-background/50"
              >
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoleObj && selectedRoleObj.subTypes.length > 0 && (
            <div>
              <Label className="text-foreground text-sm">Alt Tür</Label>
              <Select
                value={selectedSubType}
                onValueChange={(v) => {
                  setSelectedSubType(v);
                  setGeneratedCode("");
                }}
              >
                <SelectTrigger
                  data-ocid="invite_code.subtype_select"
                  className="mt-1 bg-background/50"
                >
                  <SelectValue placeholder="Alt tür seçin (isteğe bağlı)" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRoleObj.subTypes.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {generatedCode && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: "oklch(0.22 0.03 280 / 0.3)",
                border: "1px solid oklch(0.50 0.12 280 / 0.4)",
              }}
            >
              <p className="text-xs text-muted-foreground mb-2">
                Oluşturulan Kod
              </p>
              <div className="flex items-center gap-3">
                <Input
                  data-ocid="invite_code.code_input"
                  value={generatedCode}
                  readOnly
                  className="font-mono text-xl font-bold tracking-widest text-primary bg-transparent border-0 p-0 h-auto"
                />
                <Button
                  data-ocid="invite_code.copy_button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Kopyala
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Kapat
          </Button>
          {!generatedCode && (
            <Button
              data-ocid="invite_code.generate_button"
              onClick={handleGenerate}
              className="gradient-bg text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Oluştur
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PersonnelTab({ companyId }: { companyId: string }) {
  const {
    currentCompany,
    addMember,
    removeMember,
    pendingInvites,
    inviteCodes,
    approveInvite,
    rejectInvite,
  } = useApp();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [approvedCodeInfo, setApprovedCodeInfo] = useState<{
    name: string;
    code: string;
  } | null>(null);

  const members = (currentCompany?.members || []).filter(
    (m) => !m.roleIds.includes("owner"),
  );

  const companyPendingInvites = pendingInvites.filter(
    (i) => i.companyId === companyId && i.status === "pending",
  );

  const companyInviteCodes = inviteCodes.filter(
    (ic) => ic.companyId === companyId,
  );

  const getRoleInfo = (roleId: string) =>
    ROLE_HIERARCHY.find((r) => r.id === roleId);

  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Personel Yönetimi
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} personel kayıtlı
          </p>
        </div>
        <div className="flex gap-2">
          <GenerateInviteDialog companyId={companyId} />
          <AddMemberDialog
            companyId={companyId}
            onAdd={(member) => addMember(companyId, member)}
          />
        </div>
      </div>

      {/* Pending invites section */}
      {companyPendingInvites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.18 50)" }}
            />
            <h3 className="font-semibold text-foreground">Bekleyen Davetler</h3>
            <Badge
              className="text-xs"
              style={{
                background: "oklch(0.72 0.18 50 / 0.2)",
                color: "oklch(0.72 0.18 50)",
                border: "1px solid oklch(0.72 0.18 50 / 0.4)",
              }}
            >
              {companyPendingInvites.length}
            </Badge>
          </div>
          {companyPendingInvites.map((invite, idx) => {
            const roleInfo = getRoleInfo(invite.roleId);
            const itemIdx = idx + 1;
            return (
              <div
                key={invite.id}
                className="flex items-center gap-4 p-4 rounded-xl flex-wrap"
                style={{
                  background: "oklch(0.20 0.015 264)",
                  border: "1px solid oklch(0.72 0.18 50 / 0.3)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: roleInfo
                      ? `${roleInfo.color}33`
                      : "oklch(0.25 0.01 264)",
                    color: roleInfo?.color || "#888",
                  }}
                >
                  {invite.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {invite.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invite.email}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {roleInfo && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${roleInfo.color}22`,
                          color: roleInfo.color,
                        }}
                      >
                        {roleInfo.name}
                      </span>
                    )}
                    {invite.subType && (
                      <span className="text-xs text-muted-foreground">
                        {invite.subType}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {invite.createdAt}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-ocid={`pending_invite.approve_button.${itemIdx}`}
                    size="sm"
                    className="text-xs"
                    style={{
                      background: "oklch(0.45 0.14 160)",
                      color: "white",
                    }}
                    onClick={() => {
                      const code = approveInvite(invite.id);
                      toast.success(
                        `${invite.name} onaylandı ve personele eklendi.`,
                      );
                      if (code) {
                        setApprovedCodeInfo({ name: invite.name, code });
                      }
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Onayla
                  </Button>
                  <Button
                    data-ocid={`pending_invite.reject_button.${itemIdx}`}
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      rejectInvite(invite.id);
                      toast.success(`${invite.name} reddedildi.`);
                    }}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reddet
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approved Login Code Dialog */}
      {approvedCodeInfo && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm m-0 w-full h-full p-0 border-0"
          aria-labelledby="login-code-title"
        >
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl space-y-4"
            style={{
              background: "oklch(0.18 0.015 264)",
              border: "1px solid oklch(0.45 0.14 160 / 0.5)",
            }}
            data-ocid="personnel.dialog"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.45 0.14 160 / 0.2)" }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: "oklch(0.72 0.18 160)" }}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {approvedCodeInfo.name} Onaylandı
                </h3>
                <p className="text-xs text-muted-foreground">
                  Giriş kodunu bu kişiyle paylaşın
                </p>
              </div>
            </div>
            <div
              className="p-4 rounded-xl text-center space-y-2"
              style={{
                background: "oklch(0.14 0.01 264)",
                border: "1px solid oklch(0.28 0.01 264)",
              }}
            >
              <p className="text-xs text-muted-foreground">
                16 Karakterli Giriş Kodu
              </p>
              <code
                className="text-2xl font-mono font-bold tracking-widest block"
                style={{
                  color: "oklch(0.72 0.18 280)",
                  letterSpacing: "0.2em",
                }}
                data-ocid="personnel.success_state"
              >
                {approvedCodeInfo.code}
              </code>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Bu kodu kullanıcıya iletin. Giriş ekranında bu kod ile sisteme
              girebilirler.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                data-ocid="personnel.secondary_button"
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "oklch(0.22 0.015 264)",
                  color: "oklch(0.75 0.02 264)",
                  border: "1px solid oklch(0.28 0.01 264)",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(approvedCodeInfo.code);
                  toast.success("Kod kopyalandı!");
                }}
              >
                Kodu Kopyala
              </button>
              <button
                data-ocid="personnel.close_button"
                type="button"
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "oklch(0.45 0.14 160)", color: "white" }}
                onClick={() => setApprovedCodeInfo(null)}
              >
                Tamam
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Active invite codes */}
      {companyInviteCodes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            İzleme: Oluşturulan Kodlar
          </h3>
          <div className="space-y-2">
            {companyInviteCodes.map((ic) => {
              const roleInfo = getRoleInfo(ic.roleId);
              return (
                <div
                  key={ic.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg flex-wrap"
                  style={{
                    background: "oklch(0.19 0.01 264)",
                    border: "1px solid oklch(0.26 0.01 264)",
                  }}
                >
                  <code
                    className="font-mono text-sm font-bold tracking-widest"
                    style={{ color: "oklch(0.72 0.18 280)" }}
                  >
                    {ic.code}
                  </code>
                  <div className="flex-1 flex gap-2 flex-wrap items-center">
                    {roleInfo && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${roleInfo.color}22`,
                          color: roleInfo.color,
                        }}
                      >
                        {roleInfo.name}
                      </span>
                    )}
                    {ic.subType && (
                      <span className="text-xs text-muted-foreground">
                        {ic.subType}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      color: ic.isUsed
                        ? "oklch(0.60 0.05 264)"
                        : "oklch(0.72 0.18 160)",
                      borderColor: ic.isUsed
                        ? "oklch(0.30 0.02 264)"
                        : "oklch(0.45 0.14 160 / 0.5)",
                    }}
                  >
                    {ic.isUsed ? "Kullanıldı" : "Aktif"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {ic.createdAt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Kayıtlı Personel</h3>
        {members.length === 0 ? (
          <div
            data-ocid="personnel.empty_state"
            className="text-center py-16 rounded-xl"
            style={{
              background: "oklch(0.18 0.01 264)",
              border: "1px dashed oklch(0.30 0.01 264)",
            }}
          >
            <p className="text-muted-foreground">Henüz personel eklenmemiş.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Yukarıdaki butonu kullanarak personel ekleyin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, idx) => {
              const roleId = member.roleIds[0];
              const roleInfo = getRoleInfo(roleId);
              const itemIdx = idx + 1;
              return (
                <div
                  key={member.userId}
                  data-ocid={`personnel.member.item.${itemIdx}`}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{
                    background: "oklch(0.19 0.012 264)",
                    border: "1px solid oklch(0.27 0.01 264)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{
                      background: roleInfo
                        ? `${roleInfo.color}33`
                        : "oklch(0.25 0.01 264)",
                      color: roleInfo?.color || "#888",
                      border: `2px solid ${roleInfo?.color || "#888"}44`,
                    }}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {roleInfo && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: `${roleInfo.color}22`,
                            color: roleInfo.color,
                            border: `1px solid ${roleInfo.color}44`,
                          }}
                        >
                          {roleInfo.name}
                        </span>
                      )}
                      {member.subType && (
                        <span className="text-xs text-muted-foreground">
                          {member.subType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex gap-1 flex-wrap">
                    {Object.entries(member.permissions || {})
                      .filter(([, p]) => p.view)
                      .map(([modId]) => {
                        const mod = MODULES_LIST.find((m) => m.id === modId);
                        return mod ? (
                          <span
                            key={modId}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: "oklch(0.24 0.01 264)",
                              color: "oklch(0.65 0.05 264)",
                            }}
                          >
                            {mod.label}
                          </span>
                        ) : null;
                      })}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <EditPermissionsDialog
                      member={member}
                      companyId={companyId}
                      index={itemIdx}
                    />
                    <Dialog
                      open={confirmRemove === member.userId}
                      onOpenChange={(o) =>
                        setConfirmRemove(o ? member.userId : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          data-ocid={`personnel.member.remove_button.${itemIdx}`}
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        style={{
                          background: "oklch(0.18 0.015 264)",
                          border: "1px solid oklch(0.28 0.02 264)",
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle className="text-foreground">
                            Personeli Çıkar
                          </DialogTitle>
                        </DialogHeader>
                        <p className="text-muted-foreground text-sm">
                          <strong className="text-foreground">
                            {member.name}
                          </strong>{" "}
                          adlı personeli şirketten çıkarmak istediğinizden emin
                          misiniz?
                        </p>
                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setConfirmRemove(null)}
                          >
                            İptal
                          </Button>
                          <Button
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                              removeMember(companyId, member.userId);
                              setConfirmRemove(null);
                              toast.success(
                                `${member.name} şirketten çıkarıldı.`,
                              );
                            }}
                          >
                            Çıkar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface CustomField {
  id: string;
  name: string;
  type: "Metin" | "Sayı" | "Tarih" | "Açılır Liste";
  required: boolean;
  options?: string[];
}

interface CustomFieldsStore {
  projects: CustomField[];
  personnel: CustomField[];
  equipment: CustomField[];
}

function loadCustomFields(companyId: string): CustomFieldsStore {
  const raw = localStorage.getItem(`customFields_${companyId}`);
  return raw ? JSON.parse(raw) : { projects: [], personnel: [], equipment: [] };
}

function saveCustomFields(companyId: string, data: CustomFieldsStore) {
  localStorage.setItem(`customFields_${companyId}`, JSON.stringify(data));
}

type FieldSection = "projects" | "personnel" | "equipment";

const SECTION_LABELS: Record<FieldSection, string> = {
  projects: "Projeler",
  personnel: "Personel",
  equipment: "Ekipman",
};

function CustomFieldsTab({ companyId }: { companyId: string }) {
  const [store, setStore] = useState<CustomFieldsStore>(() =>
    loadCustomFields(companyId),
  );
  const [activeSection, setActiveSection] = useState<FieldSection>("projects");
  const [open, setOpen] = useState(false);
  const [editField, setEditField] = useState<CustomField | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "Metin" as CustomField["type"],
    required: false,
    options: "",
  });

  const persist = (updated: CustomFieldsStore) => {
    setStore(updated);
    saveCustomFields(companyId, updated);
  };

  const openAdd = () => {
    setEditField(null);
    setForm({ name: "", type: "Metin", required: false, options: "" });
    setOpen(true);
  };

  const openEdit = (f: CustomField) => {
    setEditField(f);
    setForm({
      name: f.name,
      type: f.type,
      required: f.required,
      options: (f.options || []).join(", "),
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      import("sonner").then(({ toast }) => toast.error("Alan adı zorunludur."));
      return;
    }
    const field: CustomField = {
      id: editField?.id || `cf_${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      required: form.required,
      options:
        form.type === "Açılır Liste"
          ? form.options
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    };
    const current = store[activeSection];
    const updated = editField
      ? current.map((f) => (f.id === editField.id ? field : f))
      : [...current, field];
    persist({ ...store, [activeSection]: updated });
    setOpen(false);
    import("sonner").then(({ toast }) =>
      toast.success(editField ? "Alan güncellendi." : "Alan eklendi."),
    );
  };

  const handleDelete = (id: string) => {
    persist({
      ...store,
      [activeSection]: store[activeSection].filter((f) => f.id !== id),
    });
    import("sonner").then(({ toast }) => toast.success("Alan silindi."));
  };

  const fields = store[activeSection];

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Özel Alanlar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Proje, personel ve ekipman formlarına özel alanlar ekleyin
          </p>
        </div>
        <Button
          data-ocid="customfields.primary_button"
          className="gradient-bg text-white"
          onClick={openAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Alan Ekle
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {(["projects", "personnel", "equipment"] as FieldSection[]).map((s) => (
          <button
            type="button"
            key={s}
            data-ocid={`customfields.${s}.tab`}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === s ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Field List */}
      {fields.length === 0 ? (
        <div data-ocid="customfields.empty_state" className="text-center py-12">
          <Layers className="w-10 h-10 mx-auto mb-3 text-amber-500/30" />
          <p className="text-muted-foreground text-sm">
            {SECTION_LABELS[activeSection]} için henüz özel alan tanımlanmamış.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              data-ocid={`customfields.item.${idx + 1}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {field.name}
                  </span>
                  {field.required && (
                    <Badge
                      variant="outline"
                      className="text-xs text-rose-400 border-rose-500/30"
                    >
                      Zorunlu
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {field.type}
                  </span>
                  {field.options && field.options.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      · {field.options.join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                data-ocid={`customfields.edit_button.${idx + 1}`}
                className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                onClick={() => openEdit(field)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                data-ocid={`customfields.delete_button.${idx + 1}`}
                className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                onClick={() => handleDelete(field.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-ocid="customfields.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle>
              {editField ? "Alanı Düzenle" : "Yeni Özel Alan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alan Adı *</Label>
              <Input
                data-ocid="customfields.name.input"
                className="mt-1 bg-background border-border"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="ör. Proje Kodu"
              />
            </div>
            <div>
              <Label>Alan Türü *</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as CustomField["type"] }))
                }
              >
                <SelectTrigger
                  data-ocid="customfields.type.select"
                  className="mt-1 bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(
                    [
                      "Metin",
                      "Sayı",
                      "Tarih",
                      "Açılır Liste",
                    ] as CustomField["type"][]
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.type === "Açılır Liste" && (
              <div>
                <Label>Seçenekler (virgülle ayırın)</Label>
                <Input
                  className="mt-1 bg-background border-border"
                  value={form.options}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, options: e.target.value }))
                  }
                  placeholder="ör. Seçenek 1, Seçenek 2"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                data-ocid="customfields.required.checkbox"
                id="cf-required"
                checked={form.required}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, required: !!v }))
                }
              />
              <Label htmlFor="cf-required" className="cursor-pointer">
                Zorunlu alan
              </Label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              data-ocid="customfields.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="customfields.save_button"
              className="gradient-bg text-white"
              onClick={handleSave}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CompanySettings() {
  const { t, currentCompany, companies, setCompanies } = useApp();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!currentCompany)
    return (
      <div className="text-muted-foreground">Lütfen önce bir şirket seçin.</div>
    );

  const activeModules = currentCompany.activeModules || [];

  const toggleModule = (modId: string) => {
    const updated = activeModules.includes(modId)
      ? activeModules.filter((m) => m !== modId)
      : [...activeModules, modId];
    const newCompanies = companies.map((c) =>
      c.id === currentCompany.id ? { ...c, activeModules: updated } : c,
    );
    setCompanies(newCompanies);
  };

  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
      const code = Array.from(
        { length: 8 },
        () =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[
            Math.floor(Math.random() * 36)
          ],
      ).join("");
      setInviteCode(code);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success(t.codeCopied);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.companySettings}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {currentCompany.name}
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger data-ocid="settings.general_tab" value="general">
            Genel
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.modules_tab" value="modules">
            Modüller
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.personnel_tab" value="personnel">
            Personel Yönetimi
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.invite_tab" value="invite">
            Davet
          </TabsTrigger>
          <TabsTrigger
            data-ocid="settings.customfields_tab"
            value="customfields"
          >
            Özel Alanlar
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.brand_tab" value="brand">
            Marka Yönetimi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Şirket Bilgileri</h2>
            <div>
              <Label>{t.companyName}</Label>
              <Input value={currentCompany.name} className="mt-1" readOnly />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                value={currentCompany.description}
                className="mt-1"
                readOnly
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">{t.activeModules}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "oklch(0.22 0.01 264)" }}
                >
                  <span className="text-sm text-foreground">{mod.label}</span>
                  <Switch
                    data-ocid={`settings.${mod.id}.switch`}
                    checked={activeModules.includes(mod.id)}
                    onCheckedChange={() => toggleModule(mod.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personnel">
          <div className="glass-card rounded-xl p-6">
            <PersonnelTab companyId={currentCompany.id} />
          </div>
        </TabsContent>

        <TabsContent value="invite">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">{t.inviteCode}</h2>
            <p className="text-sm text-muted-foreground">
              Yeni kullanıcıları şirketinize davet etmek için 8 karakterli davet
              kodu oluşturun.
            </p>
            {inviteCode && (
              <div
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{
                  background: "oklch(0.22 0.01 264)",
                  border: "1px solid oklch(0.62 0.22 280 / 0.3)",
                }}
              >
                <span className="font-mono text-xl font-bold text-primary tracking-widest flex-1">
                  {inviteCode}
                </span>
                <Button
                  data-ocid="settings.copy_button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  {t.copyCode}
                </Button>
              </div>
            )}
            <Button
              data-ocid="settings.generate_invite_button"
              onClick={handleGenerateInvite}
              disabled={loading}
              className="gradient-bg text-white"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {t.generateInvite}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="customfields">
          {currentCompany && <CustomFieldsTab companyId={currentCompany.id} />}
        </TabsContent>
        <TabsContent value="brand">
          <BrandSettingsTab companyId={currentCompany?.id || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BrandSettingsTab({ companyId }: { companyId: string }) {
  const storageKey = `pv_brand_settings_${companyId}`;

  const [brandForm, setBrandForm] = useState(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s
        ? JSON.parse(s)
        : {
            logo: "",
            color: "#f59e0b",
            taxNo: "",
            address: "",
            phone: "",
            email: "",
            website: "",
            reportHeader: "",
            reportFooter: "",
          };
    } catch {
      return {
        logo: "",
        color: "#f59e0b",
        taxNo: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        reportHeader: "",
        reportFooter: "",
      };
    }
  });
  const [saved, setSaved] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBrandForm((p: typeof brandForm) => ({
        ...p,
        logo: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(brandForm));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      <h2 className="font-semibold text-foreground">Marka Yönetimi</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo */}
        <div>
          <Label>Şirket Logosu</Label>
          {brandForm.logo && (
            <div className="mt-2 mb-3 p-3 rounded-lg bg-card border border-border inline-block">
              <img
                src={brandForm.logo}
                alt="Şirket logosu"
                className="h-16 object-contain"
              />
            </div>
          )}
          <div className="mt-2">
            <Input
              data-ocid="brand.logo.upload_button"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="bg-card border-border"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <Label>Şirket Rengi</Label>
          <div className="flex items-center gap-3 mt-2">
            <Input
              data-ocid="brand.color.input"
              type="color"
              value={brandForm.color}
              onChange={(e) =>
                setBrandForm((p: typeof brandForm) => ({
                  ...p,
                  color: e.target.value,
                }))
              }
              className="w-14 h-10 p-1 bg-card border-border rounded cursor-pointer"
            />
            <div
              className="w-10 h-10 rounded-lg border border-border"
              style={{ backgroundColor: brandForm.color }}
            />
            <span className="text-sm text-muted-foreground font-mono">
              {brandForm.color}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Vergi Numarası</Label>
          <Input
            data-ocid="brand.taxno.input"
            value={brandForm.taxNo}
            onChange={(e) =>
              setBrandForm((p: typeof brandForm) => ({
                ...p,
                taxNo: e.target.value,
              }))
            }
            className="mt-1 bg-card border-border"
            placeholder="1234567890"
          />
        </div>
        <div>
          <Label>İletişim Telefonu</Label>
          <Input
            data-ocid="brand.phone.input"
            value={brandForm.phone}
            onChange={(e) =>
              setBrandForm((p: typeof brandForm) => ({
                ...p,
                phone: e.target.value,
              }))
            }
            className="mt-1 bg-card border-border"
            placeholder="+90 212 000 00 00"
          />
        </div>
        <div>
          <Label>E-posta</Label>
          <Input
            data-ocid="brand.email.input"
            value={brandForm.email}
            onChange={(e) =>
              setBrandForm((p: typeof brandForm) => ({
                ...p,
                email: e.target.value,
              }))
            }
            className="mt-1 bg-card border-border"
            placeholder="info@sirket.com"
          />
        </div>
        <div>
          <Label>Web Sitesi</Label>
          <Input
            data-ocid="brand.website.input"
            value={brandForm.website}
            onChange={(e) =>
              setBrandForm((p: typeof brandForm) => ({
                ...p,
                website: e.target.value,
              }))
            }
            className="mt-1 bg-card border-border"
            placeholder="https://www.sirket.com"
          />
        </div>
      </div>

      <div>
        <Label>Adres</Label>
        <Textarea
          data-ocid="brand.address.textarea"
          value={brandForm.address}
          onChange={(e) =>
            setBrandForm((p: typeof brandForm) => ({
              ...p,
              address: e.target.value,
            }))
          }
          className="mt-1 bg-card border-border resize-none"
          rows={2}
          placeholder="Şirket adresi"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Rapor Başlığı</Label>
          <Input
            data-ocid="brand.report_header.input"
            value={brandForm.reportHeader}
            onChange={(e) =>
              setBrandForm((p: typeof brandForm) => ({
                ...p,
                reportHeader: e.target.value,
              }))
            }
            className="mt-1 bg-card border-border"
            placeholder="Rapor üst bilgisi"
          />
        </div>
        <div>
          <Label>Rapor Alt Bilgisi</Label>
          <Input
            data-ocid="brand.report_footer.input"
            value={brandForm.reportFooter}
            onChange={(e) =>
              setBrandForm((p: typeof brandForm) => ({
                ...p,
                reportFooter: e.target.value,
              }))
            }
            className="mt-1 bg-card border-border"
            placeholder="Rapor alt bilgisi"
          />
        </div>
      </div>

      {/* Report Preview */}
      {(brandForm.reportHeader || brandForm.reportFooter) && (
        <div>
          <Label className="mb-2 block">Rapor Önizleme</Label>
          <div className="rounded-xl border border-border overflow-hidden">
            {brandForm.reportHeader && (
              <div
                className="p-4 border-b border-border flex items-center gap-3"
                style={{ background: `${brandForm.color}22` }}
              >
                {brandForm.logo && (
                  <img
                    src={brandForm.logo}
                    alt="logo"
                    className="h-10 object-contain"
                  />
                )}
                <span className="font-semibold text-foreground">
                  {brandForm.reportHeader}
                </span>
              </div>
            )}
            <div className="p-4 bg-card min-h-[80px] flex items-center justify-center">
              <span className="text-muted-foreground text-sm italic">
                Rapor içeriği burada görünür
              </span>
            </div>
            {brandForm.reportFooter && (
              <div
                className="p-3 border-t border-border text-center text-xs text-muted-foreground"
                style={{ background: `${brandForm.color}11` }}
              >
                {brandForm.reportFooter}
              </div>
            )}
          </div>
        </div>
      )}

      <Button
        data-ocid="brand.save_button"
        onClick={handleSave}
        className="gradient-bg text-white"
      >
        {saved ? "✓ Kaydedildi" : "Kaydet"}
      </Button>
    </div>
  );
}
