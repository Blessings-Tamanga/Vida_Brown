import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function seed() {
  const { db } = await import("../src/lib/db");

  // Artist
  await db.execute(
    `INSERT INTO artists (id, name, title, bio, followers, hero_image_url, spotify_url, youtube_url, instagram_url)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Vida Brown",
      "Singer • Songwriter • Producer",
      "Born Vida Ezra Gérmaño, known as Vida (Veeda) - a Malawian artist creating music, arts, and culture content.",
      82,
      "/Image Jul 22, 2026, 12_54_27 AM.png",
      "https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL",
      "https://www.youtube.com/@VidaBrownOfficial",
      "https://www.instagram.com/vidabrownofficial",
    ]
  );

  // Videos
  const videos = [
    ["Diamond Platnumz - Happy", "nWA4D9U-q48", "https://www.youtube.com/embed/nWA4D9U-q48", "HIT OR MISS", 10700, 330, "5:26", "Mar 2026", "VIDEO REVIEW", 1],
    ["Adekunle Gold ft Davido", "JqEXp4EJjlw", "https://www.youtube.com/embed/JqEXp4EJjlw", "HIT OR MISS", 210, 48, "5:06", "Feb 2026", "Reviewing collaboration", 0],
    ["AYRA STARR - ALL THE LOVE", "UujBzYu6z0E", "https://www.youtube.com/embed/UujBzYu6z0E", "REACTION", 4600, 92, "5:03", "Feb 2025", "Fresh reaction", 0],
  ];
  for (const v of videos) {
    await db.execute(
      "INSERT INTO videos (title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,1)",
      v
    );
  }

  // Tracks
  const tracks = [
    [1, "Umbrella", "Vida Brown", null, "2024", 12400, "Single", 1],
    [2, "PON ME (Everything)", "Vida Brown", null, "2025", 8200, "Single", 1],
  ];
  for (const t of tracks) {
    await db.execute(
      "INSERT INTO tracks (track_number, title, artist_name, featured_artist, year, streams, track_type, artist_id, is_active) VALUES (?,?,?,?,?,?,?,?,1)",
      t
    );
  }

  // Gallery
  await db.execute(
    'INSERT INTO gallery_images (url, alt_text, "order", is_active) VALUES (?,?,?,1)',
    ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900", "Vida Brown on stage", 1]
  );
  await db.execute(
    'INSERT INTO gallery_images (url, alt_text, "order", is_active) VALUES (?,?,?,1)',
    ["https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=900", "Studio session", 2]
  );

  // Site content
  await db.execute(
    `INSERT INTO site_content (slug, title, subtitle, body, image_url, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url)
     VALUES ('hero', 'Vida Brown', 'Singer • Songwriter • Producer', 'Born Vida Ezra Gérmaño...', '/Image Jul 22, 2026, 12_54_27 AM.png', 'Listen on Spotify', 'https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL', 'YouTube Channel', 'https://www.youtube.com/@VidaBrownOfficial')`
  );
  await db.execute(
    `INSERT INTO site_content (slug, title, body)
     VALUES ('about', 'About', 'Malawian artist creating music, arts, and culture content.')`
  );

  console.log("Seeding complete.");
}

seed();