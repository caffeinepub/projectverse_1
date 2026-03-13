import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, Paperclip, Search, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface Message {
  id: string;
  channelId: string;
  sender: string;
  initials: string;
  color: string;
  text: string;
  timestamp: string;
  attachment?: string;
  isMine?: boolean;
}

interface Channel {
  id: string;
  name: string;
  section: "Genel" | "Projeler";
  memberCount: number;
  unread: number;
}

const CHANNELS: Channel[] = [
  {
    id: "genel",
    name: "Şirket Geneli",
    section: "Genel",
    memberCount: 24,
    unread: 3,
  },
  {
    id: "istanbul",
    name: "İstanbul Rezidans",
    section: "Projeler",
    memberCount: 8,
    unread: 1,
  },
  {
    id: "ankara",
    name: "Ankara Plaza",
    section: "Projeler",
    memberCount: 6,
    unread: 0,
  },
  {
    id: "izmir",
    name: "İzmir Liman",
    section: "Projeler",
    memberCount: 11,
    unread: 5,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    channelId: "genel",
    sender: "Ahmet Yılmaz",
    initials: "AY",
    color: "#7c3aed",
    text: "Merhaba ekip! Bu haftaki toplantı Çarşamba saat 14:00'te yapılacak.",
    timestamp: "09:15",
  },
  {
    id: "2",
    channelId: "genel",
    sender: "Fatma Kaya",
    initials: "FK",
    color: "#0891b2",
    text: "Teşekkürler Ahmet Bey, not aldım. Gündem maddeleri paylaşılacak mı?",
    timestamp: "09:22",
  },
  {
    id: "3",
    channelId: "genel",
    sender: "Ahmet Yılmaz",
    initials: "AY",
    color: "#7c3aed",
    text: "Evet, gündem bugün öğleden sonra paylaşılacak.",
    timestamp: "09:45",
  },
  {
    id: "4",
    channelId: "genel",
    sender: "Mehmet Demir",
    initials: "MD",
    color: "#059669",
    text: "Saha raporunu paylaşıyorum.",
    timestamp: "10:30",
    attachment: "saha-raporu-mart.pdf",
  },
  {
    id: "5",
    channelId: "genel",
    sender: "Zeynep Arslan",
    initials: "ZA",
    color: "#d97706",
    text: "Raporu inceledim, harika iş çıkarmışsınız!",
    timestamp: "11:05",
  },
  {
    id: "6",
    channelId: "istanbul",
    sender: "Ali Çelik",
    initials: "AÇ",
    color: "#dc2626",
    text: "İstanbul Rezidans projesinde temel kazı tamamlandı. Fotoğraflar ekte.",
    timestamp: "08:30",
    attachment: "temel-kazilar.jpg",
  },
  {
    id: "7",
    channelId: "istanbul",
    sender: "Selin Öztürk",
    initials: "SÖ",
    color: "#be185d",
    text: "Harika haber! Beton dökümü ne zaman başlıyor?",
    timestamp: "08:45",
  },
  {
    id: "8",
    channelId: "istanbul",
    sender: "Ali Çelik",
    initials: "AÇ",
    color: "#dc2626",
    text: "Bu hafta Cuma günü başlayacağız, ekibimiz hazır.",
    timestamp: "09:00",
  },
  {
    id: "9",
    channelId: "ankara",
    sender: "Fatma Kaya",
    initials: "FK",
    color: "#0891b2",
    text: "Ankara Plaza mimari planları onaylanıp İnşaata başlayabiliriz.",
    timestamp: "14:00",
  },
  {
    id: "10",
    channelId: "ankara",
    sender: "Mehmet Demir",
    initials: "MD",
    color: "#059669",
    text: "Malzeme siparitlerini verdik, Pazartesi teslimat bekleniyor.",
    timestamp: "14:20",
  },
  {
    id: "11",
    channelId: "izmir",
    sender: "Ahmet Yılmaz",
    initials: "AY",
    color: "#7c3aed",
    text: "İzmir Liman projesi için çevre düzenlenmesi onayı alındı.",
    timestamp: "16:00",
  },
  {
    id: "12",
    channelId: "izmir",
    sender: "Ali Çelik",
    initials: "AÇ",
    color: "#dc2626",
    text: "Güzel haber! Peyzaj ekibi ne zaman gelecek?",
    timestamp: "16:30",
  },
];

const senderColors: Record<string, string> = {
  AY: "#7c3aed",
  FK: "#0891b2",
  MD: "#059669",
  ZA: "#d97706",
  AÇ: "#dc2626",
  SÖ: "#be185d",
};

export default function Communication() {
  const { activeRoleId } = useApp();
  const isSubcontractor = activeRoleId === "subcontractor";

  const visibleChannels = isSubcontractor
    ? CHANNELS.filter((c) => c.section === "Projeler")
    : CHANNELS;

  const [activeChannelId, setActiveChannelId] = useState(
    visibleChannels[0]?.id || "genel",
  );
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>(
    Object.fromEntries(CHANNELS.map((c) => [c.id, c.unread])),
  );
  const [input, setInput] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChannel = visibleChannels.find((c) => c.id === activeChannelId);
  const channelMessages = messages
    .filter((m) => m.channelId === activeChannelId)
    .filter(
      (m) =>
        msgSearch === "" ||
        m.text.toLowerCase().includes(msgSearch.toLowerCase()),
    );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    setUnreadMap((prev) => ({ ...prev, [activeChannelId]: 0 }));
  }, [activeChannelId]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: String(Date.now()),
      channelId: activeChannelId,
      sender: "Ben",
      initials: "BN",
      color: "#7c3aed",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMine: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
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
        <div className="w-60 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Kanallar
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-4">
              {sections.map((section) => (
                <div key={section}>
                  <p className="text-xs text-muted-foreground font-semibold px-2 py-1 uppercase tracking-wider">
                    {section}
                  </p>
                  {visibleChannels
                    .filter((c) => c.section === section)
                    .map((channel) => (
                      <button
                        type="button"
                        key={channel.id}
                        data-ocid={`comm.${channel.id}.tab`}
                        onClick={() => {
                          setActiveChannelId(channel.id);
                          setMsgSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                          activeChannelId === channel.id
                            ? "gradient-bg text-white"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">#</span>
                          <span className="truncate">{channel.name}</span>
                        </span>
                        {unreadMap[channel.id] > 0 && (
                          <Badge className="bg-primary text-white text-xs h-4 px-1.5 ml-1">
                            {unreadMap[channel.id]}
                          </Badge>
                        )}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0 gap-3">
            <div>
              <h2 className="font-semibold text-foreground">
                # {activeChannel?.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeChannel?.memberCount} üye
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="comm.search_input"
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                placeholder="Mesajlarda ara..."
                className="pl-8 h-8 bg-background border-border text-sm w-44"
              />
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {channelMessages.length === 0 ? (
                <div
                  data-ocid="comm.messages.empty_state"
                  className="text-center py-16 text-muted-foreground"
                >
                  <p>
                    {msgSearch
                      ? "Arama sonucu bulunamadı."
                      : "Henüz mesaj yok. İlk mesajı gönder!"}
                  </p>
                </div>
              ) : (
                channelMessages.map((msg, i) => (
                  <div
                    key={msg.id}
                    data-ocid={`comm.message.item.${i + 1}`}
                    className="flex gap-3 group"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                      <AvatarFallback
                        style={{
                          backgroundColor: `${senderColors[msg.initials] || msg.color}33`,
                          color: senderColors[msg.initials] || msg.color,
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
                      <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">
                        {msg.text}
                      </p>
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

          {/* Input area */}
          <div className="p-3 border-t border-border flex-shrink-0">
            <div className="flex gap-2 items-center">
              <Button
                data-ocid="comm.upload_button"
                variant="outline"
                size="icon"
                className="flex-shrink-0 h-9 w-9 border-border"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                data-ocid="comm.message.input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`#${activeChannel?.name} kanalına mesaj yaz...`}
                className="bg-background border-border flex-1"
              />
              <Button
                data-ocid="comm.message.primary_button"
                onClick={handleSend}
                disabled={!input.trim()}
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
