import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    const videos = await db.execute("SELECT * FROM videos ORDER BY created_at DESC");
    return res.json(videos.rows);
  }

  if (req.method === "POST") {
    const { title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured } = req.body;
    try {
      await db.execute(
        `INSERT INTO videos (title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
        [title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured ? 1 : 0]
      );
      return res.status(201).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ detail: err.message });
    }
  }

  res.status(405).json({ detail: "Method not allowed" });
}