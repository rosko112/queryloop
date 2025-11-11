import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs"; // install with npm i bcryptjs

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body || {};

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "username, email and password required" },
        { status: 400 }
      );
    }

    // Hash the password before storing anywhere
    const hashedPassword = await bcrypt.hash(password, 10);

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create user in Supabase Auth
    const { data: createdUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password, // Supabase needs the raw password here
        user_metadata: { username },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = createdUser?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Failed to create auth user" },
        { status: 500 }
      );
    }

    // Insert profile in your `users` table WITHOUT storing plaintext password
    const { data: profile, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          username,
          email,
          password: hashedPassword, // optional: hashed password only
          display_name: username,
          reputation: 0,
        },
      ]);

    if (insertError) {
      // rollback Supabase Auth user if profile insert fails
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      { user: createdUser.user, profile: profile?.[0] },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "server error" },
      { status: 500 }
    );
  }
}
