import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function GET() {
  try {
    const { data: jobs, error: selectError } = await supabaseServer
      .from("print_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);

    if (selectError) {
      console.error("Select error:", selectError);
      return NextResponse.json({ error: "Select failed" }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ job: null });
    }

    const job = jobs[0];
    console.log("Next queued print job found:", { id: job.id });

    const { data: updatedJob, error: updateError } = await supabaseServer
      .from("print_jobs")
      .update({
        status: "printing",
        assigned_printer: "printer-1",
      })
      .eq("id", job.id)
      .eq("status", "queued")
      .select()
      .single();

    if (updateError) {
      console.error("Print job claim update error:", {
        id: job.id,
        error: updateError,
      });
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    console.log("Print job claimed:", {
      id: updatedJob.id,
      status: updatedJob.status,
    });
    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error("GET next job error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
