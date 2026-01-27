import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ModerationBody {
  action?: "approve" | "reject";
  questionId?: string;
}

interface AuthorRow {
  id: string;
  username: string;
  display_name: string | null;
}

interface AttachmentRow {
  file_path: string;
}

interface AnswerRow {
  id: string;
}

export async function GET() {
  try {
    const { data: questions, error: qError } = await supabaseAdmin
      .from("questions")
      .select("id, title, author_id, created_at")
      .eq("is_public", false)
      .order("created_at", { ascending: true });

    if (qError) return NextResponse.json({ error: qError.message }, { status: 400 });

    const authorIds = [...new Set((questions || []).map(q => q.author_id))];
    const authors: Record<string, { username?: string; display_name?: string }> = {};

    if (authorIds.length > 0) {
      const { data: authorRows, error: authorError } = await supabaseAdmin
        .from("users")
        .select("id, username, display_name")
        .in("id", authorIds);

      if (authorError) return NextResponse.json({ error: authorError.message }, { status: 400 });

      (authorRows as AuthorRow[] | null)?.forEach(a => {
        authors[a.id] = { username: a.username, display_name: a.display_name ?? undefined };
      });
    }

    const data = (questions || []).map(q => ({
      ...q,
      author: authors[q.author_id] || {},
    }));

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, questionId } = (await req.json()) as ModerationBody;

    if (!action || !questionId) {
      return NextResponse.json({ error: "Missing action or questionId" }, { status: 400 });
    }

    if (action === "approve") {
      const { error } = await supabaseAdmin
        .from("questions")
        .update({ is_public: true })
        .eq("id", questionId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const { data: qAttachments, error: qAttError } = await supabaseAdmin
        .from("question_attachments")
        .select("file_path")
        .eq("question_id", questionId);
      if (qAttError) return NextResponse.json({ error: qAttError.message }, { status: 400 });

      const qAttachmentRows = (qAttachments ?? []) as AttachmentRow[];
      if (qAttachmentRows.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from("questions-files")
          .remove(qAttachmentRows.map(att => att.file_path));
        if (storageError) return NextResponse.json({ error: storageError.message }, { status: 400 });

        const { error: deleteAttachmentsError } = await supabaseAdmin
          .from("question_attachments")
          .delete()
          .eq("question_id", questionId);
        if (deleteAttachmentsError) {
          return NextResponse.json({ error: deleteAttachmentsError.message }, { status: 400 });
        }
      }

      const { data: answers, error: answersError } = await supabaseAdmin
        .from("answers")
        .select("id")
        .eq("question_id", questionId);
      if (answersError) return NextResponse.json({ error: answersError.message }, { status: 400 });

      const answerIds = (answers as AnswerRow[] | null)?.map(a => a.id) || [];
      if (answerIds.length > 0) {
        const { data: answerAttachments, error: answerAttError } = await supabaseAdmin
          .from("answer_attachments")
          .select("file_path")
          .in("answer_id", answerIds);
        if (answerAttError) return NextResponse.json({ error: answerAttError.message }, { status: 400 });

        const answerAttachmentRows = (answerAttachments ?? []) as AttachmentRow[];
        if (answerAttachmentRows.length > 0) {
          const { error: answerStorageError } = await supabaseAdmin.storage
            .from("answer-files")
            .remove(answerAttachmentRows.map(att => att.file_path));
          if (answerStorageError) {
            return NextResponse.json({ error: answerStorageError.message }, { status: 400 });
          }

          const { error: deleteAnswerAttachmentsError } = await supabaseAdmin
            .from("answer_attachments")
            .delete()
            .in("answer_id", answerIds);
          if (deleteAnswerAttachmentsError) {
            return NextResponse.json({ error: deleteAnswerAttachmentsError.message }, { status: 400 });
          }
        }

        const { error: deleteAnswersError } = await supabaseAdmin
          .from("answers")
          .delete()
          .eq("question_id", questionId);
        if (deleteAnswersError) return NextResponse.json({ error: deleteAnswersError.message }, { status: 400 });
      }

      const { error: tagError } = await supabaseAdmin
        .from("questions_tags")
        .delete()
        .eq("question_id", questionId);
      if (tagError) return NextResponse.json({ error: tagError.message }, { status: 400 });

      const { error: questionError } = await supabaseAdmin.from("questions").delete().eq("id", questionId);
      if (questionError) return NextResponse.json({ error: questionError.message }, { status: 400 });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
