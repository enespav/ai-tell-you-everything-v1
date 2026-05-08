"use client";

import { useEffect, useRef, useState } from "react";

type Language = "de" | "en";

const copy = {
  de: {
    placeholders: [
      "Ich stand am Mainufer, als ein Fahrrad ohne Licht vorbeizog und jemand am Kiosk sagte, heute Nacht werde nichts mehr so bleiben wie gestern.",
      "Im Hausflur roch es nach Suppe und nasser Jacke, und irgendwo über mir lachte eine Person so plötzlich, dass ich für einen Moment dachte, sie hätte auf mich gewartet.",
      "Die Straßenbahn hielt zu lange an der Haltestelle, während draußen Papier über den Gehweg strich und zwei Fremde gleichzeitig in verschiedene Richtungen auf denselben Himmel zeigten.",
      "Vor dem Späti summte das Neonlicht, ein Hund zog an der Leine, und ich merkte erst beim Kleingeldsuchen, dass ich den ganzen Rückweg über denselben Satz im Kopf getragen hatte.",
      "Am Fenster gegenüber saß jemand im blauen Licht, hob kurz die Hand gegen die Scheibe, und unten auf der Straße tat der Wind so, als könnte er verlorene Dinge zurückbringen.",
    ],
    languageName: "Deutsch",
    fragmentsLabel: "Was bewegt Dich?",
    placeLabel: "Wo spielt das?",
    placePlaceholder: "z. B. Gallus, Mainufer, Kiosk",
    speakerLabel: "Wer sagt das?",
    speakerPlaceholder: "z. B. Nina, ein Nachbar, jemand am Kiosk",
    minInputAlert: "Bitte schreibe mindestens zwei Inputs.",
    loadingStatus: "Wird generiert und gedruckt...",
    printButton: "Story drucken",
    waitingButton: "Bitte warten...",
    printedStatus: "Gedruckt - Version",
    printError: "Drucken nicht möglich. Bitte nochmal versuchen.",
    invalidJson: "API gab kein JSON zurück:",
    helper:
      "Deine Inputs bleiben erhalten. Du kannst sie verändern und erneut drucken.",
  },
  en: {
    placeholders: [
      "I was standing by the river when a bicycle without lights rolled past and someone at the kiosk said tonight would not end the way the day had begun.",
      "The hallway smelled of soup and wet coats, and somewhere above me a person laughed so suddenly that for a moment I thought they had been waiting for me.",
      "The tram stayed too long at the stop while paper dragged across the pavement outside and two strangers pointed at the same sky in different directions.",
      "Outside the corner shop the neon hummed, a dog pulled at its leash, and I only noticed while counting coins that I had carried the same sentence all the way home.",
      "In the window across the street someone sat in blue light, lifted a hand against the glass, and below on the road the wind behaved as if it could return lost things.",
    ],
    languageName: "English",
    fragmentsLabel: "What's on your mind?",
    placeLabel: "Where is this taking place?",
    placePlaceholder: "e.g. Gallus, riverside, kiosk",
    speakerLabel: "Who is saying this?",
    speakerPlaceholder: "e.g. Nina, a neighbor, someone at the kiosk",
    minInputAlert: "Please write at least two inputs.",
    loadingStatus: "Creating and printing...",
    printButton: "Print story",
    waitingButton: "One moment...",
    printedStatus: "Printed - Version",
    printError: "Printing is not possible right now. Please try again.",
    invalidJson: "API did not return JSON:",
    helper:
      "Your inputs are saved here. You can change them and print again.",
  },
} satisfies Record<
  Language,
  {
    placeholders: string[];
    languageName: string;
    fragmentsLabel: string;
    placeLabel: string;
    placePlaceholder: string;
    speakerLabel: string;
    speakerPlaceholder: string;
    minInputAlert: string;
    loadingStatus: string;
    printButton: string;
    waitingButton: string;
    printedStatus: string;
    printError: string;
    invalidJson: string;
    helper: string;
  }
>;

export default function Home() {
  const [language, setLanguage] = useState<Language>("de");
  const [fragments, setFragments] = useState("");
  const [place, setPlace] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = copy[language];
  const nextLanguage: Language = language === "de" ? "en" : "de";

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    const savedSpeaker = localStorage.getItem("speaker");
    const savedVersion = localStorage.getItem("version");

    if (savedLanguage === "de" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }

    if (savedSpeaker) {
      setSpeaker(savedSpeaker);
    }

    if (savedVersion) {
      setVersion(parseInt(savedVersion, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    setStatus("");
  }, [language]);

  useEffect(() => {
    let placeholderIndex = 0;
    let charIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    const placeholders = copy[language].placeholders;

    setTypedPlaceholder("");

    const tick = () => {
      const current = placeholders[placeholderIndex];
      charIndex += 1;
      setTypedPlaceholder(current.slice(0, charIndex));

      if (charIndex === current.length) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        charIndex = 0;
        timeoutId = setTimeout(() => {
          setTypedPlaceholder("");
          tick();
        }, 2600);
        return;
      }

      timeoutId = setTimeout(tick, 45);
    };

    timeoutId = setTimeout(tick, 500);

    return () => clearTimeout(timeoutId);
  }, [language]);

  const handlePrint = async () => {
    if (loading) return;

    if (fragments.trim().length < 10) {
      alert(t.minInputAlert);
      return;
    }

    setLoading(true);
    setStatus(t.loadingStatus);

    const normalizedSpeaker = speaker.trim();

    try {
      const response = await fetch("/api/print-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          speaker: normalizedSpeaker,
          version,
          fragments,
          place,
        }),
      });

      const rawText = await response.text();
      console.log("API raw response:", rawText);

      let data: { error?: string } = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`${t.invalidJson} ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || t.printError);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const newVersion = version + 1;
      setVersion(newVersion);
      localStorage.setItem("speaker", normalizedSpeaker);
      localStorage.setItem("version", newVersion.toString());

      setStatus(`${t.printedStatus} ${String(version).padStart(2, "0")}`);
      textareaRef.current?.focus();
    } catch (error) {
      console.error(error);
      setStatus(t.printError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-5 py-6 text-white md:px-8 md:py-10">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <img
            src="/logo-web.svg"
            alt="AI Tell You Everything"
            className="w-full max-w-lg md:max-w-xl"
          />
        </header>

        <section className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-[18px] font-medium text-[var(--accent)]">
              {t.fragmentsLabel}
            </label>
            <textarea
              ref={textareaRef}
              className="h-44 w-full rounded-none border border-[var(--accent)] bg-transparent p-3 text-white placeholder:text-[rgb(231,134,181,0.55)] focus:outline-none md:h-52"
              placeholder={typedPlaceholder}
              value={fragments}
              onChange={(e) => setFragments(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-[18px] font-medium text-[var(--accent)]">
              {t.placeLabel}
            </label>
            <input
              className="w-full rounded-none border border-[var(--accent)] bg-transparent p-3 text-white placeholder:text-[rgb(231,134,181,0.55)] focus:outline-none"
              placeholder={t.placePlaceholder}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-[18px] font-medium text-[var(--accent)]">
              {t.speakerLabel}
            </label>
            <input
              className="w-full rounded-none border border-[var(--accent)] bg-transparent p-3 text-white placeholder:text-[rgb(231,134,181,0.55)] focus:outline-none"
              placeholder={t.speakerPlaceholder}
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="w-full bg-[var(--accent)] py-4 text-lg font-semibold text-[var(--bg)] transition-transform transition-opacity duration-150 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 md:py-5 md:text-xl"
          >
            {loading ? t.waitingButton : t.printButton}
          </button>

          {status && (
            <p className="text-center text-sm text-[var(--accent)]">{status}</p>
          )}

          <div className="flex flex-col items-start gap-3">
            <p className="text-[14px] leading-relaxed text-white">{t.helper}</p>

            <button
              type="button"
              onClick={() => setLanguage(nextLanguage)}
              className="self-end border border-[var(--accent)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg)]"
              aria-label={`Switch language to ${copy[nextLanguage].languageName}`}
            >
              {language.toUpperCase()}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
