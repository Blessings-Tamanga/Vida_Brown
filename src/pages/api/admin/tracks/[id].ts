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
      const { permanent } = req.body;
      if (permanent) {
        const result = await db.execute("DELETE FROM tracks WHERE id = ?", [id]);
        if (result.rowsAffected === 0) return res.status(404).json({ detail: "Track not found" });
        return res.json({ success: true });
      } else {
        const result = await db.execute("UPDATE tracks SET is_active = 0 WHERE id = ?", [id]);
        if (result.rowsAffected === 0) return res.status(404).json({ detail: "Track not found" });
        return res.json({ deactivated: true });
      }
    } catch (error) {
      return res.status(500).json({ detail: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  if (req.method === "PUT") {
    const { track_number, title, artist_name, featured_artist, year, streams, track_type, artist_id, is_active } = req.body;
    try {
      const result = await db.execute(
        `UPDATE tracks SET track_number=?, title=?, artist_name=?, featured_artist=?, year=?, streams=?, track_type=?, artist_id=?, is_active=? WHERE id=?`,
        [track_number, title, artist_name, featured_artist || null, year || null, streams || 0, track_type, artist_id || null, is_active ?? 1, id]
      );
      if (result.rowsAffected === 0) return res.status(404).json({ detail: "Track not found" });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ detail: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  return res.status(405).json({ detail: "Method not allowed" });
}