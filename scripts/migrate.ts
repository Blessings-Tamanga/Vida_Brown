import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function migrate() {
  const { db } = await import("../src/lib/db");

  // Drop old tables (if any) to avoid column conflicts during development
  await db.execute("DROP TABLE IF EXISTS newsletter_subscribers");
  await db.execute("DROP TABLE IF EXISTS gallery_images");
  await db.execute("DROP TABLE IF EXISTS tracks");
  await db.execute("DROP TABLE IF EXISTS videos");
  await db.execute("DROP TABLE IF EXISTS site_content");
  await db.execute("DROP TABLE IF EXISTS artists");

  await db.batch([
    `CREATE TABLE artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      title TEXT,
      bio TEXT,
      followers INTEGER DEFAULT 0,
      hero_image_url TEXT,
      spotify_url TEXT,
      youtube_url TEXT,
      instagram_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      youtube_id TEXT UNIQUE,
      embed_url TEXT,
      category TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      duration TEXT,
      upload_date TEXT,
      description TEXT,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      show_order INTEGER DEFAULT 0,
      trending_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_number INTEGER,
      title TEXT,
      artist_name TEXT,
      featured_artist TEXT,
      year TEXT,
      streams INTEGER DEFAULT 0,
      track_type TEXT DEFAULT 'Single',
      artist_id INTEGER REFERENCES artists(id),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      alt_text TEXT,
      "order" INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE site_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT,
      subtitle TEXT,
      body TEXT,
      image_url TEXT,
      cta_primary_label TEXT,
      cta_primary_url TEXT,
      cta_secondary_label TEXT,
      cta_secondary_url TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      subscribed_at TEXT DEFAULT (datetime('now'))
    )`,
  ]);

  console.log("Migration complete: new schema ready.");
}

migrate();