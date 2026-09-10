import { NextResponse } from "next/server";
import Together from "together-ai";
import { supabaseServer } from "@/lib/supabase-server";

type Language = "de" | "en";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

const SESSION_PREFIX_SEPARATOR = "::";

function encodeSpeakerValue(language: Language, speaker?: string) {
  const normalizedSpeaker = speaker?.trim() || "";
  const storedSpeaker = normalizedSpeaker || (language === "de" ? "anonym" : "anonymous");
  return `${language}${SESSION_PREFIX_SEPARATOR}${storedSpeaker}`;
}

const copy = {
  de: {
    tooShort: "Bitte schreibe mindestens zwei Inputs.",
    noStory: "Keine Story von Together erhalten.",
    saveError: "Druckjob konnte nicht gespeichert werden.",
    generationError: "Fehler bei der Story-Generierung.",
    systemPrompt: `Du bist ein Autor für deutschsprachige Mikrogeschichten.

Deine Aufgabe ist es, aus dem Input des Nutzers sofort eine originelle Mikrogeschichte zu schreiben.
Nutze Motive, Bilder und Situationen aus dem Input als Grundlage und forme daraus eine kurze literarische Szene.

Die Szene soll beobachtend und zugänglich bleiben und keine unnötig düstere oder unheimliche Stimmung erzeugen.

Wichtige Perspektivregel:
Die Geschichte wird immer aus der Ich-Perspektive geschrieben, so als würde der Nutzer die Szene selbst erleben.

Sprachregel:
- Schreibe ausschließlich auf Deutsch.
- Der fertige Text muss vollständig auf Deutsch sein, auch wenn der Input Englisch oder gemischt ist.

Regeln:
- Maximal 50 Wörter
- Immer nur eine Story
- Ich-Perspektive (erste Person: ich, mir, mein)
- Keine Überschrift
- Keine Erklärung
- Keine Analyse
- Nur der fertige Text
- Schreibe den Text als zusammenhängenden Fließtext

Der Input soll kreativ verarbeitet werden und als Ausgangspunkt für die Szene dienen.
Auch ein einzelnes Wort kann zu einer vollständigen Mikrogeschichte werden.`,
    userPromptPrefix: "Input für eine deutsche Mikrogeschichte:",
  },
  en: {
    tooShort: "Please write at least two inputs.",
    noStory: "No story received from Together.",
    saveError: "The print job could not be saved.",
    generationError: "Story generation failed.",
    systemPrompt: `You are a writer of English micro-stories.

Your task is to immediately turn the user's input into an original micro-story.
Use the motifs, images, and situations from the input as your basis and shape them into a short literary scene.

The scene should remain observant and accessible and should not create an unnecessarily dark or eerie mood.

Important perspective rule:
The story is always written in the first person, as if the user were experiencing the scene directly.

Language rule:
- Write exclusively in English.
- The final text must be fully in English, even if the input is German or mixed.

Rules:
- Maximum 50 words
- Only one story
- First person perspective (I, me, my)
- No title
- No explanation
- No analysis
- Only the finished text
- Write the text as continuous prose

The input should be processed creatively and serve as the starting point for the scene.
Even a single word can become a complete micro-story.`,
    userPromptPrefix: "Input for an English micro-story:",
  },
} satisfies Record<
  Language,
  {
    tooShort: string;
    noStory: string;
    saveError: string;
    generationError: string;
    systemPrompt: string;
    userPromptPrefix: string;
  }
>;

export async function POST(request: Request) {
  let language: Language = "de";

  try {
    const body = await request.json();
    language = body.language === "en" ? "en" : "de";
    const { speaker, version, fragments, place } = body;
    const t = copy[language];

    if (!fragments || fragments.trim().length < 10) {
      return NextResponse.json({ error: t.tooShort }, { status: 400 });
    }

    let response;

    try {
      response = await together.chat.completions.create({
        model: "MiniMaxAI/MiniMax-M3",
        chat_template_kwargs: { thinking_mode: "disabled" },
        messages: [
          { role: "system", content: t.systemPrompt },
          {
            role: "user",
            content: `${t.userPromptPrefix}\n${fragments}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 250,
      });
    } catch (error) {
      console.error("Together API request error:", error);
      return NextResponse.json({ error: t.generationError }, { status: 500 });
    }

    const story = response.choices?.[0]?.message?.content?.trim();
    const finishReason = response.choices?.[0]?.finish_reason;

    console.log("Together completion result:", {
      finishReason,
      storyLength: story?.length ?? 0,
      story,
    });

    if (finishReason === "length" || !story) {
      return NextResponse.json({ error: t.noStory }, { status: 500 });
    }

    let data;

    try {
      const insertResult = await supabaseServer
        .from("print_jobs")
        .insert([
          {
            session_id: encodeSpeakerValue(language, speaker),
            version,
            fragments,
            place,
            story,
            status: "queued",
          },
        ])
        .select()
        .single();

      if (insertResult.error) {
        console.error("Supabase print_jobs insert error:", insertResult.error);
        return NextResponse.json({ error: t.saveError }, { status: 500 });
      }

      data = insertResult.data;
    } catch (error) {
      console.error("Supabase print_jobs insert exception:", error);
      return NextResponse.json({ error: t.saveError }, { status: 500 });
    }

    console.log("Print job queued:", { id: data.id, status: data.status });

    return NextResponse.json({
      ok: true,
      job: data,
    });
  } catch (error) {
    console.error("Print story route error:", error);
    return NextResponse.json(
      { error: copy[language].generationError },
      { status: 500 }
    );
  }
}
