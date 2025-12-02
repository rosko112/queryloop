// Simple demo seeder for local/dev. Creates a few users, tags, questions, and tag links.
// Tries to read NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from process.env,
// or falls back to .env.local in the project root.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvLocalIfNeeded() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim();
    if (key && value && !process.env[key]) {
      process.env[key] = value.replace(/^"|"$/g, "");
    }
  });
}

loadEnvLocalIfNeeded();

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env or .env.local.");
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const seedUsers = [
  { email: "alice@example.com", password: "Password123!", username: "alice", display_name: "Alice Morgan", bio: "Frontend tinkerer and CSS nerd.", reputation: 120 },
  { email: "bob@example.com", password: "Password123!", username: "bob", display_name: "Bob Taylor", bio: "Backend enthusiast who loves Postgres.", reputation: 340 },
  { email: "carol@example.com", password: "Password123!", username: "carol", display_name: "Carol Lee", bio: "Mobile dev dabbling in web.", reputation: 85 },
  { email: "dan@example.com", password: "Password123!", username: "dan", display_name: "Dan Ortiz", bio: "Cloud + DevOps enjoyer.", reputation: 210 },
  { email: "eve@example.com", password: "Password123!", username: "eve", display_name: "Eve Summers", bio: "Data viz & UI polish.", reputation: 60 },
];

const seedTags = ["frontend", "backend", "database", "react", "nextjs", "devops"];

const seedQuestions = [
  {
    title: "How to share state between nested components in Next.js?",
    body: "I'm lifting state up but still end up with prop drilling. Is there a clean pattern besides context for a small tree?",
    author: "alice",
    tagNames: ["react", "nextjs", "frontend"],
  },
  {
    title: "Best way to index JSONB payloads in Postgres?",
    body: "I have nested JSONB data and need fast lookups on a few keys. Should I use GIN with jsonb_path_ops or generated columns?",
    author: "bob",
    tagNames: ["database", "backend"],
  },
  {
    title: "Preview environment deploys with GitHub Actions",
    body: "Looking for a simple pattern to spin up preview deployments per PR for a Next app. Anyone doing this with Vercel + Actions?",
    author: "dan",
    tagNames: ["nextjs", "devops"],
  },
  {
    title: "Optimizing bundle size for a small marketing page",
    body: "Tree shaking works but my bundle is still chunky. What are the biggest wins for a mostly static page in Next 16?",
    author: "eve",
    tagNames: ["frontend", "nextjs"],
  },
  {
    title: "Handling optimistic UI with Supabase mutations",
    body: "I want optimistic updates for likes without race conditions. Any patterns with Supabase and React server components?",
    author: "carol",
    tagNames: ["react", "backend"],
  },
  {
    title: "Zero-downtime schema migrations",
    body: "How do you handle long-running migrations (adding NOT NULL columns) without downtime on Postgres?",
    author: "bob",
    tagNames: ["database", "devops"],
  },
  {
    title: "Is getServerSideProps still relevant in Next 16?",
    body: "When should I still reach for SSR over RSC + caching for data-heavy pages?",
    author: "alice",
    tagNames: ["nextjs", "backend"],
  },
  {
    title: "Rate limiting API routes in Next.js",
    body: "Need a lightweight rate limiter for a couple of API routes without Redis. Any in-memory approaches that are good enough?",
    author: "dan",
    tagNames: ["backend", "devops"],
  },
];

async function ensureUser(user) {
  // Try to create auth user; if already exists, we'll reuse the profile row.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { username: user.username, display_name: user.display_name },
  });

  let userId = created?.user?.id;

  if (createError) {
    if (!createError.message?.includes("already registered")) {
      throw createError;
    }
    const { data: existingProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!existingProfile) {
      console.error(`User ${user.email} already exists in auth but not in users table; skipping.`);
      return null;
    }
    userId = existingProfile.id;
  }

  const { error: upsertError } = await supabase.from("users").upsert({
    id: userId,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    bio: user.bio,
    reputation: user.reputation,
  });
  if (upsertError) throw upsertError;

  return userId;
}

async function main() {
  console.log("Seeding demo data...");

  const userIdMap = {};
  for (const user of seedUsers) {
    const id = await ensureUser(user);
    if (id) {
      userIdMap[user.username] = id;
      console.log(`Ready user ${user.username} (${id})`);
    }
  }

  const { data: tagData, error: tagError } = await supabase
    .from("tags")
    .upsert(seedTags.map(name => ({ name })))
    .select();
  if (tagError) throw tagError;

  const tagMap = {};
  (tagData || []).forEach(tag => {
    tagMap[tag.name] = tag.id;
  });
  console.log("Tags inserted:", Object.keys(tagMap).join(", "));

  const now = Date.now();
  const targetTitles = seedQuestions.map(q => q.title);

  // Avoid duplicating questions on repeated runs by skipping existing titles.
  const { data: existingQs, error: existingQError } = await supabase
    .from("questions")
    .select("id, title");
  if (existingQError) throw existingQError;

  const existingTitleSet = new Set((existingQs || []).map(q => q.title));

  const questionRows = seedQuestions
    .filter(q => !existingTitleSet.has(q.title))
    .map((q, idx) => ({
      title: q.title,
      body: q.body,
      author_id: userIdMap[q.author],
      is_public: true,
      created_at: new Date(now - (idx + 1) * 3600 * 1000).toISOString(),
      updated_at: new Date(now - (idx + 1) * 3500 * 1000).toISOString(),
    }))
    .filter(q => q.author_id);

  if (questionRows.length === 0) {
    console.log("No new questions to insert (all titles already exist or missing authors).");
    return;
  }

  const { data: insertedQuestions, error: qError } = await supabase
    .from("questions")
    .insert(questionRows)
    .select();
  if (qError) {
    console.error("Question insert error:", qError.message, qError.details || "");
    throw qError;
  }

  console.log(`Inserted ${insertedQuestions?.length || 0} questions.`);

  // Link tags
  const tagLinks = [];
  insertedQuestions?.forEach(q => {
    const matching = seedQuestions.find(sq => sq.title === q.title);
    matching?.tagNames?.forEach(name => {
      const tagId = tagMap[name];
      if (tagId) {
        tagLinks.push({ question_id: q.id, tag_id: tagId });
      }
    });
  });

  if (tagLinks.length > 0) {
    const { error: qtError } = await supabase.from("questions_tags").upsert(tagLinks);
    if (qtError) throw qtError;
    console.log(`Linked ${tagLinks.length} tags to questions.`);
  }

  console.log("Done. Log in with the demo emails/passwords (Password123!) to view as real users.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
