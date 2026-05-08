import { NextResponse } from "next/server";
import Together from "together-ai";
import { supabaseServer } from "@/lib/supabase-server";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, version, fragments, place } = body;

    if (!fragments || fragments.trim().length < 10) {
      return NextResponse.json(
        { error: "Bitte schreibe mindestens zwei Inputs." },
        { status: 400 }
      );
    }

    const systemPrompt = `Du bist ein Autor für Micro-Fiction.

Deine Aufgabe ist es, aus dem Input des Nutzers sofort eine originelle Micro-Story zu schreiben. 
Nutze Motive, Bilder und Situationen aus dem Input als Grundlage und forme daraus eine kurze literarische Szene.

Die Szene soll beobachtend und zugänglich bleiben und keine unnötig düstere oder unheimliche Stimmung erzeugen.

Wichtige Perspektivregel:
Die Geschichte wird immer aus der Ich-Perspektive geschrieben, so als würde der Nutzer die Szene selbst erleben.

Regeln:
- Maximal 40 Wörter
- Immer nur eine Story
- Ich-Perspektive (erste Person: ich, mir, mein)
- Keine Überschrift
- Keine Erklärung
- Keine Analyse
- Nur der fertige Text
- Schreibe den Text als zusammenhängenden Fließtext

Der Input soll kreativ verarbeitet werden und als Ausgangspunkt für die Szene dienen.
Auch ein einzelnes Wort kann zu einer vollständigen Micro-Story werden.`;

    const userPrompt = `Input:
${fragments}

Ort:
${place || "nicht angegeben"}`;

    const response = await together.chat.completions.create({
      model: "Qwen/Qwen3.5-397B-A17B",
      reasoning: { enabled: false },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1,
      max_tokens: 120,
    });

    const story = response.choices?.[0]?.message?.content?.trim();

    if (!story) {
      return NextResponse.json(
        { error: "Keine Story von Together erhalten." },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseServer
      .from("print_jobs")
      .insert([
        {
          session_id: sessionId,
          version,
          fragments,
          place,
          story,
          status: "queued",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Druckjob konnte nicht gespeichert werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      job: data,
    });
  } catch (error) {
    console.error("Together API error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Story-Generierung." },
      { status: 500 }
    );
  }
}
