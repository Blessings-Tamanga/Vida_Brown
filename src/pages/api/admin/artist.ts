import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    const artist = await db.execute("SELECT * FROM artists LIMIT 1");
    return res.json(artist.rows[0] || null);
  }

  if (req.method === "PUT") {
    const { name, title, bio, followers, hero_image_url, spotify_url, youtube_url, instagram_url } = req.body;
    const existing = await db.execute("SELECT id FROM artists LIMIT 1");
    if (existing.rows.length > 0) {
      await db.execute(
        `UPDATE artists SET name=?, title=?, bio=?, followers=?, hero_image_url=?, spotify_url=?, youtube_url=?, instagram_url=? WHERE id=?`,
        [name || null, title || null, bio || null, followers || 0, hero_image_url || null, spotify_url || null, youtube_url || null, instagram_url || null, existing.rows[0].id]
      );
    } else {
      await db.execute(
        `INSERT INTO artists (name, title, bio, followers, hero_image_url, spotify_url, youtube_url, instagram_url) VALUES (?,?,?,?,?,?,?,?)`,
        [name || null, title || null, bio || null, followers || 0, hero_image_url || null, spotify_url || null, youtube_url || null, instagram_url || null]
      );
    }
    return res.json({ success: true });
  }

  res.status(405).json({ detail: "Method not allowed" });
}