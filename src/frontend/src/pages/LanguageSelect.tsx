import { Button } from "@/components/ui/button";
import { useApp } from "../contexts/AppContext";
import { LANGUAGES, type Lang } from "../i18n/translations";

export default function LanguageSelect({ onSelect }: { onSelect: () => void }) {
  const { lang, setLang, t } = useApp();

  const handleSelect = (code: Lang) => {
    setLang(code);
    onSelect();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.14 0.02 264), oklch(0.18 0.02 280))",
      }}
    >
      <div className="w-full max-w-2xl px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold gradient-text mb-3">
            ProjectVerse
          </h1>
          <p className="text-xl font-semibold text-foreground mb-2">
            {t.langSelectTitle}
          </p>
          <p className="text-muted-foreground">{t.langSelectSubtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {LANGUAGES.map((language, i) => (
            <button
              type="button"
              key={language.code}
              data-ocid={`lang_select.button.${i + 1}`}
              onClick={() => handleSelect(language.code)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                lang === language.code
                  ? "border-primary bg-primary/20 shadow-lg shadow-primary/20"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span className="text-3xl">{language.flag}</span>
              <span className="text-sm font-medium text-foreground">
                {language.name}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => onSelect()}
            className="gradient-bg text-white px-10 py-3 text-base font-semibold hover:opacity-90"
          >
            {t.langSelectBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}
