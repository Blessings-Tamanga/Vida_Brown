import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method === "GET") {
    try {
      const tracks = await db.execute("SELECT * FROM tracks ORDER BY track_number");
      return res.json(tracks.rows);
    } catch (error) {
      return res.status(500).json({ detail: error instanceof Error ? error.message : "Could not load tracks" });
    }
  }

  if (req.method === "POST") {
    const { track_number, title, artist_name, featured_artist, year, streams, track_type, artist_id } = req.body;
    if (!title || !artist_name || !track_number) {
      return res.status(400).json({ detail: "Missing required fields" });
    }
    try {
      await db.execute(
        `INSERT INTO tracks (track_number, title, artist_name, featured_artist, year, streams, track_type, artist_id)
         VALUES (?,?,?,?,?,?,?,?)`,
        [track_number, title, artist_name, featured_artist || null, year || null, streams || 0, track_type, artist_id || null]
      );
      return res.status(201).json({ success: true });
    } catch (error) {
      return res.status(500).json({ detail: error instanceof Error ? error.message : "Could not create track" });
    }
  }

  return res.status(405).json({ detail: "Method not allowed" });
}