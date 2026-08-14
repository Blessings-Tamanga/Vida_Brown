import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  const rawId = req.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return res.status(400).json({ detail: "Missing item id" });
  }

  if (req.method === "DELETE") {
    await db.execute("DELETE FROM videos WHERE id = ?", [id]);
    return res.json({ success: true });
  }

  if (req.method === "PUT") {
    const { title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured } = req.body;
    await db.execute(
      `UPDATE videos SET title=?, youtube_id=?, embed_url=?, category=?, views=?, likes=?, duration=?, upload_date=?, description=?, is_featured=? WHERE id=?`,
      [title, youtube_id, embed_url, category, views, likes, duration, upload_date, description, is_featured ? 1 : 0, id]
    );
    return res.json({ success: true });
  }

  return res.status(405).json({ detail: "Method not allowed" });
}