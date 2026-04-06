"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [fragments, setFragments] = useState("");
  const [place, setPlace] = useState("");
  const [tone, setTone] = useState("nüchtern");
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState("");

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
    if (fragments.trim().length < 10) {
      alert("Bitte schreibe mindestens zwei Fragmente.");
      return;
    }

    setStatus("Deine Story wird gerade gedruckt…");

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
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Erstellen des Druckjobs.");
      }

      const newVersion = version + 1;
      setVersion(newVersion);
      localStorage.setItem("version", newVersion.toString());

      setStatus(`Gedruckt · Version ${String(version).padStart(2, "0")}`);
    } catch (error) {
      console.error(error);
      setStatus("Drucken nicht möglich. Bitte nochmal versuchen.");
    }
  };

  return (
    <main className="min-h-screen p-6 flex flex-col gap-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Was bewegt dich?</h1>

      <p className="text-sm text-gray-600">
        Schreibe Fragmente aus deinem Alltag oder deiner Umgebung. Daraus wird
        direkt eine kurze Geschichte gedruckt.
      </p>

      <div>
        <label className="block mb-2 font-medium">Deine Fragmente</label>
        <textarea
          className="w-full h-40 border p-3 rounded"
          placeholder={`am kiosk war noch licht\njemand telefonierte laut\nstraßenbahn kam zu früh`}
          value={fragments}
          onChange={(e) => setFragments(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Wo spielt das?</label>
        <input
          className="w-full border p-2 rounded"
          placeholder="z. B. Gallus, Bus 16, Kiosk"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Stimmung</label>
        <select
          className="w-full border p-2 rounded"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option>nüchtern</option>
          <option>warm</option>
          <option>hoffnungsvoll</option>
          <option>seltsam</option>
        </select>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="bg-black text-white py-4 rounded text-lg w-full"
      >
        Story drucken
      </button>

      <p className="text-sm text-gray-600">{status}</p>

      <p className="text-xs text-gray-400">
        Deine Fragmente bleiben erhalten. Du kannst sie verändern und erneut
        drucken.
      </p>
    </main>
  );
}