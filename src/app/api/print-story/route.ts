import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, version, fragments, place, tone } = body;

    const dummyStory =
      "Ich stand vor dem Kiosk, als wäre der Morgen schon weiter als ich. Jemand sprach zu laut in ein Telefon, und die Straßenbahn hielt nur kurz. Das Licht blieb an mir hängen.";

    const { data, error } = await supabaseServer
      .from("print_jobs")
      .insert([
        {
          session_id: sessionId,
          version,
          fragments,
          place,
          tone,
          story: dummyStory,
          status: "queued",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, job: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}