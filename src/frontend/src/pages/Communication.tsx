import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCheck,
  Hash,
  Image,
  Paperclip,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Channel, Message } from "../contexts/AppContext";
import { useApp } from "../contexts/AppContext";

const AVATAR_COLORS: Record<string, string> = {
  AY: "#7c3aed",
  FK: "#0891b2",
  MD: "#059669",
  ZA: "#d97706",
  AÇ: "#dc2626",
  SÖ: "#be185d",
  BN: "#6366f1",
};

function getColor(initials: string, fallback: string) {
  return AVATAR_COLORS[initials] || fallback || "#6366f1";
}

interface FileAttachment {
  name: string;
  size: string;
  dataUrl: string;
  isImage: boolean;
}

export default function Communication() {
  const {
    activeRoleId,
    activeCompanyId,
    channels,
    setChannels,
    appMessages: messages,
    setAppMessages: setMessages,
    projects,
    user,
    hrPersonnel,
  } = useApp();

  const isSubcontractor = activeRoleId === "subcontractor";
  const visibleChannels = isSubcontractor
    ? channels.filter((c) => c.section === "Projeler")
    : channels;

  const [activeChannelId, setActiveChannelId] = useState(
    visibleChannels[0]?.id || "",
  );
  const [input, setInput] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [msgSearch, setMsgSearch] = useState("");
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelSection, setNewChannelSection] = useState<
    "Genel" | "Projeler"
  >("Genel");
  const [newChannelProject, setNewChannelProject] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Archived channels
  const archivedKey = `pv_archived_channels_${activeCompanyId}`;
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(
        `pv_archived_channels_${activeCompanyId}`,
      );
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showArchived, setShowArchived] = useState(false);

  // @Mention dropdown
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const mentionRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset to first channel and unread counts when channels list or company changes
  useEffect(() => {
    const firstChannel = visibleChannels[0]?.id || "";
    setActiveChannelId(firstChannel);
    setUnreadCounts({});
  }, [channels, isSubcontractor, activeCompanyId]);

  const activeChannel = visibleChannels.find((c) => c.id === activeChannelId);
  const channelMessages = messages
    .filter((m) => m.channelId === activeChannelId)
    .filter(
      (m) =>
        msgSearch === "" ||
        m.text.toLowerCase().includes(msgSearch.toLowerCase()),
    );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom intentionally on msg/channel change
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom on message/channel change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channelMessages.length, activeChannelId]);

  const handleSend = () => {
    if (!input.trim() && !pendingAttachment) return;
    const senderName = user?.name || "Ben";
    const initials = senderName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const newMsg: Message = {
      id: String(Date.now()),
      channelId: activeChannelId,
      sender: senderName,
      initials,
      color: "#6366f1",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      attachment: pendingAttachment?.name,
      isMine: true,
    };
    setMessages([...messages, newMsg]);
    // Increment unread counts for other channels
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      for (const ch of visibleChannels) {
        if (ch.id !== activeChannelId) {
          updated[ch.id] = (updated[ch.id] || 0) + 1;
        }
      }
      return updated;
    });
    setInput("");
    setPendingAttachment(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onload = () => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          const isImage = file.type.startsWith("image/");
          setPendingAttachment({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            dataUrl: reader.result as string,
            isImage,
          });
          setIsUploading(false);
          setUploadProgress(0);
        }
        setUploadProgress(Math.min(progress, 100));
      }, 120);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleArchive = (channelId: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      localStorage.setItem(archivedKey, JSON.stringify([...next]));
      return next;
    });
  };

  const handleAddChannel = () => {
    if (!newChannelName.trim()) return;
    const projectName =
      newChannelSection === "Projeler" && newChannelProject
        ? projects.find((p) => p.id === newChannelProject)?.title
        : undefined;
    const channelName = projectName
      ? `${projectName} — ${newChannelName.trim()}`
      : newChannelName.trim();
    const newChannel: Channel = {
      id: `ch_${Date.now()}`,
      name: channelName,
      section: newChannelSection,
      memberCount: 1,
      unread: 0,
    };
    setChannels([...channels, newChannel]);
    setActiveChannelId(newChannel.id);
    setNewChannelName("");
    setNewChannelProject("");
    setAddChannelOpen(false);
  };

  const sections = Array.from(new Set(visibleChannels.map((c) => c.section)));

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold gradient-text">İletişim</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Proje ve şirket kanalları
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden mx-6 mb-6 rounded-xl border border-border bg-card">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Kanallar
            </p>
            <Dialog open={addChannelOpen} onOpenChange={setAddChannelOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="communication.add_channel_button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="communication.add_channel_dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>Yeni Kanal Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Kanal Adı</Label>
                    <Input
                      data-ocid="communication.channel_name.input"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="örn: Genel Duyurular"
                      className="mt-1 bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label>Bölüm</Label>
                    <Select
                      value={newChannelSection}
                      onValueChange={(v) =>
                        setNewChannelSection(v as "Genel" | "Projeler")
                      }
                    >
                      <SelectTrigger
                        data-ocid="communication.channel_section.select"
                        className="mt-1 bg-background border-border"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Genel">Genel</SelectItem>
                        <SelectItem value="Projeler">Projeler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newChannelSection === "Projeler" && (
                    <div>
                      <Label>Proje (İsteğe Bağlı)</Label>
                      <Select
                        value={newChannelProject}
                        onValueChange={setNewChannelProject}
                      >
                        <SelectTrigger
                          data-ocid="communication.channel_project.select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Proje seç..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="communication.add_channel.cancel_button"
                    onClick={() => setAddChannelOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="communication.add_channel.confirm_button"
                    className="gradient-bg text-white"
                    onClick={handleAddChannel}
                    disabled={!newChannelName.trim()}
                  >
                    Oluştur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div
              data-ocid="communication.channel_list"
              className="p-2 space-y-4"
            >
              {sections.map((section) => (
                <div key={section}>
                  <p className="text-xs text-muted-foreground font-semibold px-2 py-1 uppercase tracking-wider">
                    {section}
                  </p>
                  {visibleChannels
                    .filter((c) => c.section === section)
                    .filter((c) => showArchived || !archivedIds.has(c.id))
                    .map((channel, idx) => (
                      <div key={channel.id} className="relative group mb-0.5">
                        <button
                          type="button"
                          data-ocid={`communication.channel.item.${idx + 1}`}
                          onClick={() => {
                            setActiveChannelId(channel.id);
                            setMsgSearch("");
                            setSearchOpen(false);
                            setUnreadCounts((prev) => ({
                              ...prev,
                              [channel.id]: 0,
                            }));
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            activeChannelId === channel.id
                              ? "gradient-bg text-white"
                              : archivedIds.has(channel.id)
                                ? "text-muted-foreground/50 hover:bg-white/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2 flex-1 min-w-0">
                            <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{channel.name}</span>
                          </span>
                          {(unreadCounts[channel.id] || 0) > 0 && (
                            <span className="ml-auto min-w-[18px] h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                              {unreadCounts[channel.id]}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          title={
                            archivedIds.has(channel.id)
                              ? "Arşivden Çıkar"
                              : "Arşivle"
                          }
                          onClick={() => toggleArchive(channel.id)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-foreground text-xs"
                        >
                          {archivedIds.has(channel.id) ? "↩" : "⋯"}
                        </button>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </ScrollArea>
          {archivedIds.size > 0 && (
            <div className="p-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground w-full text-left px-2 py-1"
              >
                {showArchived
                  ? "Arşivlenenleri gizle"
                  : `Arşivlenen kanalları göster (${archivedIds.size})`}
              </button>
            </div>
          )}
        </div>

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0 gap-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <h2 className="font-semibold text-foreground text-sm">
                  {activeChannel?.name || "Kanal seçin"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeChannel?.memberCount ?? 0} üye
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      data-ocid="communication.search_input"
                      autoFocus
                      value={msgSearch}
                      onChange={(e) => setMsgSearch(e.target.value)}
                      placeholder="Mesajlarda ara..."
                      className="pl-8 h-8 bg-background border-border text-sm w-48"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setSearchOpen(false);
                      setMsgSearch("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  data-ocid="communication.search_toggle"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {channelMessages.length === 0 ? (
                <div
                  data-ocid="communication.messages.empty_state"
                  className="text-center py-16 text-muted-foreground"
                >
                  <Hash className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">
                    {msgSearch
                      ? "Arama sonucu bulunamadı."
                      : "Henüz mesaj yok. İlk mesajı gönder!"}
                  </p>
                </div>
              ) : (
                channelMessages.map((msg, i) => (
                  <div
                    key={msg.id}
                    data-ocid={`communication.message.item.${i + 1}`}
                    className="flex gap-3 group"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                      <AvatarFallback
                        style={{
                          backgroundColor: `${getColor(msg.initials, msg.color)}22`,
                          color: getColor(msg.initials, msg.color),
                        }}
                        className="text-xs font-bold"
                      >
                        {msg.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {msg.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp}
                        </span>
                      </div>
                      {msg.text && (
                        <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">
                          {msg.text.split(/(@\w+)/g).map((part, i) => {
                            const k = `${msg.id}-part-${i}`;
                            return /^@\w+/.test(part) ? (
                              <span
                                key={k}
                                className="text-amber-400 font-medium"
                              >
                                {part}
                              </span>
                            ) : (
                              <span key={k}>{part}</span>
                            );
                          })}
                        </p>
                      )}
                      {msg.attachment && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs text-primary">
                          <Paperclip className="h-3 w-3" />
                          {msg.attachment}
                        </div>
                      )}
                      {msg.isMine && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCheck className="h-3 w-3 text-cyan-400" />
                          <span className="text-xs text-muted-foreground">
                            Okundu
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Upload progress */}
          {isUploading && (
            <div className="px-4 py-2 border-t border-border bg-background/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>Dosya yükleniyor...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}

          {/* Pending attachment preview */}
          {pendingAttachment && (
            <div className="px-4 py-2 border-t border-border">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                {pendingAttachment.isImage ? (
                  <Image className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <span className="text-sm text-primary flex-1 truncate">
                  {pendingAttachment.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pendingAttachment.size}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  onClick={() => setPendingAttachment(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-border flex-shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                data-ocid="communication.upload_button"
                variant="outline"
                size="icon"
                className="flex-shrink-0 h-9 w-9 border-border"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="relative flex-1">
                <Input
                  data-ocid="communication.message_input"
                  value={input}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInput(val);
                    // detect @mention trigger
                    const match = val.match(/@(\w*)$/);
                    if (match) {
                      setMentionQuery(match[1]);
                      setShowMentions(true);
                    } else {
                      setShowMentions(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowMentions(false);
                    if (e.key === "Enter" && !e.shiftKey) {
                      setShowMentions(false);
                      handleSend();
                    }
                  }}
                  placeholder={
                    activeChannel
                      ? `#${activeChannel.name} kanalına mesaj yaz...`
                      : "Kanal seçin..."
                  }
                  className="bg-background border-border flex-1"
                  disabled={!activeChannel}
                />
                {showMentions && hrPersonnel && hrPersonnel.length > 0 && (
                  <div
                    ref={mentionRef}
                    className="absolute bottom-full mb-1 left-0 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                  >
                    {hrPersonnel
                      .filter((p) =>
                        p.name
                          .toLowerCase()
                          .includes(mentionQuery.toLowerCase()),
                      )
                      .slice(0, 5)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-amber-500/10 text-foreground"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const newVal = input.replace(
                              /@\w*$/,
                              `@${p.name} `,
                            );
                            setInput(newVal);
                            setShowMentions(false);
                          }}
                        >
                          @{p.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <Button
                data-ocid="communication.send_button"
                onClick={handleSend}
                disabled={!input.trim() && !pendingAttachment}
                className="gradient-bg text-white flex-shrink-0 h-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
