import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabaseServer
      .from("print_jobs")
      .update({
        status: "printed",
        printed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Printed update error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, job: data });
  } catch (error) {
    console.error("Printed route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}