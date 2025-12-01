import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: "Missing action or userId" }, { status: 400 });
    }

    // Delete user
    if (action === "delete") {
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
