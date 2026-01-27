import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AdminUserBody {
  action?: "delete" | "toggleAdmin";
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdminUserBody;
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: "Missing action or userId" }, { status: 400 });
    }

    // Delete user and their content
    if (action === "delete") {
      // Remove questions and related data for this user
      const { data: userQuestions } = await supabaseAdmin
        .from("questions")
        .select("id")
        .eq("author_id", userId);

      if (userQuestions && userQuestions.length > 0) {
        const questionIds = userQuestions.map(q => q.id);

        // Question attachments
        const { data: qAtt } = await supabaseAdmin
          .from("question_attachments")
          .select("file_path")
          .in("question_id", questionIds);
        if (qAtt && qAtt.length > 0) {
          await supabaseAdmin.storage.from("questions-files").remove(qAtt.map(a => a.file_path));
          await supabaseAdmin.from("question_attachments").delete().in("question_id", questionIds);
        }

        // Answers to these questions (regardless of author)
        const { data: qAnswers } = await supabaseAdmin
          .from("answers")
          .select("id")
          .in("question_id", questionIds);
        const qAnswerIds = qAnswers?.map(a => a.id) || [];
        if (qAnswerIds.length > 0) {
          const { data: aAtt } = await supabaseAdmin
            .from("answer_attachments")
            .select("file_path")
            .in("answer_id", qAnswerIds);
          if (aAtt && aAtt.length > 0) {
            await supabaseAdmin.storage.from("answer-files").remove(aAtt.map(a => a.file_path));
            await supabaseAdmin.from("answer_attachments").delete().in("answer_id", qAnswerIds);
          }
          await supabaseAdmin.from("answers").delete().in("id", qAnswerIds);
        }

        await supabaseAdmin.from("questions_tags").delete().in("question_id", questionIds);
        await supabaseAdmin.from("questions").delete().in("id", questionIds);
      }

      // Remove answers authored by this user on other questions
      const { data: userAnswers } = await supabaseAdmin
        .from("answers")
        .select("id")
        .eq("author_id", userId);
      const userAnswerIds = userAnswers?.map(a => a.id) || [];
      if (userAnswerIds.length > 0) {
        const { data: aAtt } = await supabaseAdmin
          .from("answer_attachments")
          .select("file_path")
          .in("answer_id", userAnswerIds);
        if (aAtt && aAtt.length > 0) {
          await supabaseAdmin.storage.from("answer-files").remove(aAtt.map(a => a.file_path));
          await supabaseAdmin.from("answer_attachments").delete().in("answer_id", userAnswerIds);
        }
        await supabaseAdmin.from("answers").delete().in("id", userAnswerIds);
      }

      // Delete auth user and profile row last
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

      const { error: tableError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId);

      if (tableError) return NextResponse.json({ error: tableError.message }, { status: 400 });

      return NextResponse.json({ success: true });
    }

    // Toggle admin
    if (action === "toggleAdmin") {
      const { data: userData, error: getError } = await supabaseAdmin
        .from("users")
        .select("is_admin")
        .eq("id", userId)
        .single();

      if (getError || !userData) return NextResponse.json({ error: getError?.message }, { status: 400 });

      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ is_admin: !userData.is_admin })
        .eq("id", userId);

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
