import type { NextApiRequest, NextApiResponse } from "next";
import { revalidatePath } from "next/cache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.secret !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    revalidatePath("/");
    return res.json({ revalidated: true });
  } catch (error) {
    console.error("Revalidation failed", error);
    return res.status(500).json({ detail: "Error revalidating" });
  }
}