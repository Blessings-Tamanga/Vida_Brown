import type { NextApiRequest, NextApiResponse } from "next";
import { isAdmin } from "@/lib/adminAuth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "3mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const { dataUrl, filename } = req.body;

    if (!dataUrl || !filename) {
      return res.status(400).json({ detail: "Missing dataUrl or filename" });
    }

    if (!dataUrl.startsWith("data:image/")) {
      return res.status(400).json({ detail: "Invalid file: only images are allowed" });
    }

    const matches = dataUrl.match(/^data:([^;]+);base64,/);
    if (!matches) {
      return res.status(400).json({ detail: "Invalid data URL format" });
    }

    const mimeType = matches[1];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({ detail: `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP, GIF` });
    }

    const base64 = dataUrl.split(",")[1];
    if (!base64) {
      return res.status(400).json({ detail: "Invalid data URL: missing base64 data" });
    }

    const buffer = Buffer.from(base64, "base64");
    const maxSize = 2 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ detail: `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum size is 2MB` });
    }

    if (buffer.length === 0) {
      return res.status(400).json({ detail: "Empty file" });
    }

    return res.status(200).json({ url: dataUrl });
  } catch (error) {
    return res.status(500).json({ detail: error instanceof Error ? error.message : "Upload failed" });
  }
}
