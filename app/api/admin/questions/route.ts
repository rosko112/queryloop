import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AdminQuestionBody {
  action?: "delete" | "edit";
  questionId?: string;
  newTitle?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminQuestionBody;
    const { action, questionId, newTitle } = body;

    if (!action || !questionId) {
      return NextResponse.json({ error: "Missing action or questionId" }, { status: 400 });
    }

    if (action === "delete") {
      const { error } = await supabaseAdmin.from("questions").delete().eq("id", questionId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "edit") {
      if (!newTitle) return NextResponse.json({ error: "Missing newTitle" }, { status: 400 });
      const { error } = await supabaseAdmin
        .from("questions")
        .update({ title: newTitle })
        .eq("id", questionId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
