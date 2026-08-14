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
    try {
      await db.execute("DELETE FROM tracks WHERE id = ?", [id]);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ detail: error.message });
    }
  }

  if (req.method === "PUT") {
    const { track_number, title, artist_name, featured_artist, year, streams, track_type, artist_id, is_active } = req.body;
    try {
      await db.execute(
        `UPDATE tracks SET track_number=?, title=?, artist_name=?, featured_artist=?, year=?, streams=?, track_type=?, artist_id=?, is_active=? WHERE id=?`,
        [track_number, title, artist_name, featured_artist || null, year || null, streams, track_type, artist_id, is_active, id]
      );
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ detail: error.message });
    }
  }

  return res.status(405).json({ detail: "Method not allowed" });
}