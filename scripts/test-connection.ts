process.loadEnvFile(".env.local");

async function test() {
  const { db } = await import("../src/lib/db");
  const result = await db.execute("SELECT 1 AS test");
  console.log("Connected:", result.rows[0]);
}

test();