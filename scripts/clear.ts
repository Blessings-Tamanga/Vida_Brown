import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function clear() {
  const { db } = await import("../src/lib/db");

  await db.execute("DELETE FROM newsletter_subscribers");
  await db.execute("DELETE FROM gallery_images");
  await db.execute("DELETE FROM tracks");
  await db.execute("DELETE FROM videos");
  await db.execute("DELETE FROM site_content");
  await db.execute("DELETE FROM artists");

  console.log("All data cleared. Schema preserved.");
}

clear();
