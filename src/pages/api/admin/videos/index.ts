import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    try {
      const videos = await db.execute("SELECT * FROM videos ORDER BY created_at DESC");
      return res.json(videos.rows);
    } catch (error) {
      return res.status(500).json({ detail: error instanceof Error ? error.message : "Could not load videos" });
    }
  }

  if (req.method === "POST") {
    const { title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured, show_order, trending_order } = req.body;
    try {
      await db.execute(
        `INSERT INTO videos (title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured, is_active, show_order, trending_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`,
        [title, youtube_id, embed_url, category, views || 0, likes || 0, duration || null, upload_date || null, description || null, is_featured ? 1 : 0, show_order || 0, trending_order || 0]
      );
      return res.status(201).json({ success: true });
    } catch (err) {
      return res.status(500).json({ detail: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  res.status(405).json({ detail: "Method not allowed" });
}