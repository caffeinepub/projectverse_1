import {
  Briefcase,
  Building2,
  ChevronRight,
  HardHat,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import type { AccountType } from "../contexts/AppContext";

interface AccountCard {
  type: AccountType;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  border: string;
}

const CARDS: AccountCard[] = [
  {
    type: "owner",
    title: "Şirket Sahibi",
    description: "Şirket kurun, yönetin ve tüm operasyonları denetleyin.",
    icon: <Building2 className="w-10 h-10" />,
    gradient:
      "linear-gradient(135deg, oklch(0.55 0.28 295), oklch(0.45 0.26 280))",
    glow: "oklch(0.55 0.28 295 / 0.35)",
    border: "oklch(0.62 0.28 295 / 0.5)",
  },
  {
    type: "manager",
    title: "Şirket Yöneticisi",
    description: "Şirket bünyesinde yönetici olarak projelerinizi yönetin.",
    icon: <Briefcase className="w-10 h-10" />,
    gradient:
      "linear-gradient(135deg, oklch(0.55 0.22 240), oklch(0.45 0.20 225))",
    glow: "oklch(0.55 0.22 240 / 0.35)",
    border: "oklch(0.62 0.22 240 / 0.5)",
  },
  {
    type: "personnel",
    title: "Şirket Personeli",
    description: "şirketinizde personel olarak görevlerinizi tamamlayın.",
    icon: <User className="w-10 h-10" />,
    gradient:
      "linear-gradient(135deg, oklch(0.60 0.20 210), oklch(0.50 0.18 200))",
    glow: "oklch(0.60 0.20 210 / 0.35)",
    border: "oklch(0.65 0.20 210 / 0.5)",
  },
  {
    type: "subcontractor",
    title: "Taşeron",
    description:
      "Alt yüklenici olarak projelere katılın ve iş emirlerini yürütün.",
    icon: <HardHat className="w-10 h-10" />,
    gradient:
      "linear-gradient(135deg, oklch(0.70 0.20 60), oklch(0.60 0.18 50))",
    glow: "oklch(0.70 0.20 60 / 0.35)",
    border: "oklch(0.72 0.20 60 / 0.5)",
  },
];

export default function AccountTypeSelect({
  onSelect,
}: {
  onSelect: (type: AccountType) => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.12 0.02 264), oklch(0.16 0.02 280), oklch(0.14 0.02 240))",
      }}
    >
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <span className="text-white font-bold text-base">PV</span>
          </div>
          <span className="text-2xl font-bold gradient-text">ProjectVerse</span>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Hesap Tipini Seçin
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Platforma nasıl katılmak istediğinizi belirleyin.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
        {CARDS.map((card, i) => (
          <motion.button
            key={card.type}
            type="button"
            data-ocid={`account_type_select.${card.type}_card`}
            onClick={() => onSelect(card.type)}
            className="group relative text-left rounded-2xl p-6 min-h-[200px] flex flex-col gap-4 cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: "oklch(0.18 0.015 264 / 0.8)",
              border: `1px solid ${card.border}`,
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
              style={{
                boxShadow: `inset 0 0 30px ${card.glow}, 0 8px 32px ${card.glow}`,
              }}
            />
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ background: card.gradient }}
            />
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: card.gradient }}
            >
              <span className="text-white">{card.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                {card.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {card.description}
              </p>
            </div>
            <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: card.gradient }}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.p
        className="mt-10 text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Zaten hesabınız var mı?{" "}
        <button
          type="button"
          onClick={() => onSelect("owner")}
          className="text-primary hover:underline"
        >
          Giriş yapın
        </button>
      </motion.p>
    </div>
  );
}
