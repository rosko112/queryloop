import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Fetch user by email
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, username, email, password") // password is hashed
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare provided password with hashed password
    const isValid = await bcrypt.compare(password, user.password as string);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Success: return user info (never return password)
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
