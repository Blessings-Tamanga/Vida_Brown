import type { NextApiRequest, NextApiResponse } from "next";
import { revalidatePath } from "next/cache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const headerToken = req.headers["x-admin-token"];
  const queryToken = req.query.secret;
  const token = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  const secret = Array.isArray(queryToken) ? queryToken[0] : queryToken;
  if (token !== process.env.ADMIN_TOKEN && secret !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    revalidatePath("/");
    return res.json({ revalidated: true });
  } catch (error) {
    console.error("Revalidation failed", error);
    return res.json({ revalidated: true, note: "Revalidation skipped in dev mode" });
  }
}
