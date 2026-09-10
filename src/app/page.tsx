"use client";

import { useEffect, useRef, useState } from "react";

type Language = "de" | "en";

const copy = {
  de: {
    placeholders: [
      "Heute Morgen am Main lag Nebel über dem Wasser, und als die Sonne langsam durchkam, erzählte jemand neben mir, dass die Bäume dieses Jahr viel zu früh blühen würden.",
      "Ich blieb kurz vor einer alten Hauswand stehen, weil jemand sagte, hier habe früher einmal die Grenze zwischen zwei ganz unterschiedlichen Städten begonnen.",
      "Vor dem Kiosk diskutierten zwei Menschen über die letzte Wahl, während hinter ihnen neue Wahlplakate im Wind gegen die Laterne schlugen.",
      "Im Park versuchte ein Junge minutenlang denselben Trick mit dem Fußball, und jedes Mal applaudierte jemand auf der Bank ein kleines bisschen lauter.",
      "Als ich im Supermarkt bezahlen wollte, sprach die Kassiererin mit der Person vor mir über steigende Preise und darüber, dass früher alles länger gehalten habe.",
      "Die Straßenbahn hielt heute ungewöhnlich lange an der Haltestelle, während draußen Fahrräder zwischen Lieferwagen und regennassen Schienen vorbeizogen.",
      "Im Zug leuchteten fast alle Gesichter im blauen Licht ihrer Smartphones, und für einen Moment wirkte es, als würde niemand mehr aus dem Fenster schauen.",
      "Vor dem Museum standen Menschen mit Programmen und halb geleerten Kaffeebechern, während aus einem offenen Fenster leise Musik auf die Straße fiel.",
      "Heute Nachmittag sammelte sich Regenwasser zwischen den Pflastersteinen am Mainufer, und Möwen liefen hindurch, als gehöre ihnen die ganze Stadt.",
      "Im Treppenhaus erzählte mir jemand, dass dieses Gebäude früher einmal eine Druckerei gewesen sei, und seitdem achte ich auf jedes Geräusch der alten Rohre.",
      "An der Haltestelle stritten zwei Fremde über neue Gesetze, während hinter ihnen jemand schweigend kostenlose Zeitungen verteilte.",
      "Ich lief am Bolzplatz vorbei, als plötzlich alle gleichzeitig zum Himmel sahen, weil der Ball viel zu hoch über den Zaun geflogen war.",
      "Heute im Café sprach die Person am Nebentisch gleichzeitig über Mietpreise, Überstunden und die Hoffnung, nächsten Monat endlich verreisen zu können.",
      "Als ich an der roten Ampel wartete, zog ein Motorrad zwischen den Autos hindurch und jemand murmelte, die Stadt werde jedes Jahr lauter.",
      "Im Bus fiel plötzlich das WLAN aus, und für einen kurzen Moment schauten alle gleichzeitig auf, als hätten sie denselben Gedanken verloren.",
      "Neben dem Theater lagen noch zerknitterte Programmhefte auf dem Boden, während jemand im Vorbeigehen eine Szene aus dem Stück zitierte.",
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
      "This morning the river was covered in fog, and as the sun slowly came through, someone beside me said the trees would bloom far too early this year.",
      "I stopped for a moment in front of an old wall because someone told me this used to be where the border between two completely different cities began.",
      "In front of the kiosk, two people were discussing the last election while new campaign posters kept hitting the streetlight behind them in the wind.",
      "In the park, a boy kept trying the same football trick over and over again, and each time someone on the bench applauded a little louder.",
      "At the supermarket checkout, the cashier was talking to the person in front of me about rising prices and how things used to last much longer.",
      "The tram stopped unusually long at the station today while bicycles moved between delivery vans and rain-soaked tracks outside.",
      "On the train, almost every face glowed in the blue light of a smartphone, and for a moment it felt as if nobody was looking out the window anymore.",
      "Outside the museum, people stood holding programs and half-empty coffee cups while quiet music drifted onto the street from an open window.",
      "This afternoon rainwater gathered between the stones along the riverbank, and seagulls walked through it as if the whole city belonged to them.",
      "Someone in the stairwell told me this building used to be a printing house, and ever since then I notice every sound the old pipes make.",
      "At the tram stop, two strangers argued about new laws while someone behind them silently handed out free newspapers.",
      "I walked past the football court just as everyone suddenly looked up at the same time because the ball had flown far too high over the fence.",
      "Today at the café, the person at the next table spoke at the same time about rent prices, overtime, and the hope of finally traveling next month.",
      "While I waited at the red light, a motorcycle slipped between the cars and someone nearby murmured that the city gets louder every year.",
      "The Wi-Fi suddenly stopped working on the bus, and for a brief moment everyone looked up as if they had all lost the same thought.",
      "Crumpled theater programs were still lying on the ground beside the venue while someone walking past quietly quoted a scene from the play.",
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
      console.log("/api/print-story response:", {
        status: response.status,
        statusText: response.statusText,
        body: rawText,
      });

      let data: { error?: string } = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`${t.invalidJson} ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        console.error("/api/print-story error:", {
          status: response.status,
          statusText: response.statusText,
          error: data.error || t.printError,
        });
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
      console.error("Print request failed:", error);
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
              className="h-44 w-full rounded-none border border-[rgb(231,134,181,0.62)] bg-transparent p-3 text-white transition-[border-color,box-shadow] duration-150 placeholder:text-[rgb(231,134,181,0.55)] hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_rgba(231,134,181,0.14)] focus:border-[var(--accent)] focus:shadow-none focus:outline-none md:h-52"
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
              className="w-full rounded-none border border-[rgb(231,134,181,0.62)] bg-transparent p-3 text-white transition-[border-color,box-shadow] duration-150 placeholder:text-[rgb(231,134,181,0.55)] hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_rgba(231,134,181,0.14)] focus:border-[var(--accent)] focus:shadow-none focus:outline-none"
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
              className="w-full rounded-none border border-[rgb(231,134,181,0.62)] bg-transparent p-3 text-white transition-[border-color,box-shadow] duration-150 placeholder:text-[rgb(231,134,181,0.55)] hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_rgba(231,134,181,0.14)] focus:border-[var(--accent)] focus:shadow-none focus:outline-none"
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
