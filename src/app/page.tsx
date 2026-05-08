"use client";

import { useEffect, useRef, useState } from "react";

const fragmentPlaceholders = [
  "Ich stand am Mainufer, als ein Fahrrad ohne Licht vorbeizog und jemand am Kiosk sagte, heute Nacht werde nichts mehr so bleiben wie gestern.",
  "Im Hausflur roch es nach Suppe und nasser Jacke, und irgendwo über mir lachte eine Person so plötzlich, dass ich für einen Moment dachte, sie hätte auf mich gewartet.",
  "Die Straßenbahn hielt zu lange an der Haltestelle, während draußen Papier über den Gehweg strich und zwei Fremde gleichzeitig in verschiedene Richtungen auf denselben Himmel zeigten.",
  "Vor dem Späti summte das Neonlicht, ein Hund zog an der Leine, und ich merkte erst beim Kleingeldsuchen, dass ich den ganzen Rückweg über denselben Satz im Kopf getragen hatte.",
  "Am Fenster gegenüber saß jemand im blauen Licht, hob kurz die Hand gegen die Scheibe, und unten auf der Straße tat der Wind so, als könnte er verlorene Dinge zurückbringen.",
];

export default function Home() {
  const [fragments, setFragments] = useState("");
  const [place, setPlace] = useState("");
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem("sessionId");
    const savedVersion = localStorage.getItem("version");

    if (!savedSession) {
      const newSession = Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem("sessionId", newSession);
    }

    if (savedVersion) {
      setVersion(parseInt(savedVersion, 10));
    }
  }, []);

  useEffect(() => {
    let placeholderIndex = 0;
    let charIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = fragmentPlaceholders[placeholderIndex];
      charIndex += 1;
      setTypedPlaceholder(current.slice(0, charIndex));

      if (charIndex === current.length) {
        placeholderIndex = (placeholderIndex + 1) % fragmentPlaceholders.length;
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
  }, []);

  const handlePrint = async () => {
    if (loading) return;

    if (fragments.trim().length < 10) {
      alert("Bitte schreibe mindestens zwei Inputs.");
      return;
    }

    setLoading(true);
    setStatus("Wird generiert & gedruckt…");

    const sessionId = localStorage.getItem("sessionId");

    try {
      const response = await fetch("/api/print-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          version,
          fragments,
          place,
        }),
      });

      const rawText = await response.text();
      console.log("API raw response:", rawText);

      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`API gab kein JSON zurück: ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Erstellen des Druckjobs.");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const newVersion = version + 1;
      setVersion(newVersion);
      localStorage.setItem("version", newVersion.toString());

      setStatus(`Gedruckt ✓ · Version ${String(version).padStart(2, "0")}`);
      textareaRef.current?.focus();
    } catch (error) {
      console.error(error);
      setStatus("Drucken nicht möglich. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white px-5 py-6 md:px-8 md:py-10">
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
              Was bewegt Dich?
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
              Wo spielt das?
            </label>
            <input
              className="w-full rounded-none border border-[var(--accent)] bg-transparent p-3 text-white placeholder:text-[rgb(231,134,181,0.55)] focus:outline-none"
              placeholder="z. B. Gallus, Mainufer, Kiosk"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="w-full bg-[var(--accent)] py-4 text-lg font-semibold text-[var(--bg)] transition-transform transition-opacity duration-150 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 md:py-5 md:text-xl"
          >
            {loading ? "Bitte warten…" : "Story drucken"}
          </button>

          {status && (
            <p className="text-center text-sm text-[var(--accent)]">
              {status}
            </p>
          )}

          <p className="text-[14px] leading-relaxed text-white">
            Deine Inputs bleiben erhalten. Du kannst sie verändern und erneut
            drucken.
          </p>
        </section>
      </div>
    </main>
  );
}
