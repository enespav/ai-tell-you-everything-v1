"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [fragments, setFragments] = useState("");
  const [place, setPlace] = useState("");
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handlePrint = async () => {
    if (loading) return;

    if (fragments.trim().length < 10) {
      alert("Bitte schreibe mindestens zwei Fragmente.");
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
          <h1 className="max-w-[10ch] text-4xl font-black leading-[0.95] text-[var(--accent)] md:text-6xl">
            AI tell you everything
          </h1>
        </header>

        <section className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-[18px] font-medium text-[var(--accent)]">
              Deine Fragmente aus deinem Altag
            </label>
            <textarea
              ref={textareaRef}
              className="h-44 w-full rounded-none border border-[var(--accent)] bg-transparent p-3 text-white placeholder:text-[rgb(239,130,173,0.55)] focus:outline-none md:h-52"
              placeholder={`am kiosk war noch licht\njemand telefonierte laut\nstraßenbahn kam zu früh`}
              value={fragments}
              onChange={(e) => setFragments(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-[18px] font-medium text-[var(--accent)]">
              An welchem Ort spielt das?
            </label>
            <input
              className="w-full rounded-none border border-[var(--accent)] bg-transparent p-3 text-white placeholder:text-[rgb(239,130,173,0.55)] focus:outline-none"
              placeholder="z. B. Gallus, Mainufer, Kiosk"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="w-full bg-[var(--accent)] py-4 text-lg font-semibold text-[var(--bg)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50 md:py-5 md:text-xl"
          >
            {loading ? "Bitte warten…" : "Story drucken"}
          </button>

          {status && (
            <p className="text-center text-sm text-[var(--accent)]">
              {status}
            </p>
          )}

          <p className="text-xs leading-relaxed text-white/65">
            Deine Fragmente bleiben erhalten. Du kannst sie verändern und erneut
            drucken.
          </p>
        </section>
      </div>
    </main>
  );
}