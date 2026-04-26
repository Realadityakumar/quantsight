const { MongoClient } = require("mongodb");
require("dotenv").config();

function getSafeTarget(uri) {
  try {
    const parsed = new URL(uri);
    const host = parsed.host || "unknown-host";
    const dbName = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname.slice(1) : "(default)";
    return { host, dbName };
  } catch {
    return { host: "unknown-host", dbName: "unknown-db" };
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("[DB TEST] MONGODB_URI is missing. Set it in your environment or .env file.");
    process.exit(1);
  }

  const { host, dbName } = getSafeTarget(uri);
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  const startedAt = Date.now();

  try {
    await client.connect();
    const pingResult = await client.db("admin").command({ ping: 1 });

    if (pingResult?.ok === 1) {
      const elapsed = Date.now() - startedAt;
      console.log("[DB TEST] SUCCESS");
      console.log(`[DB TEST] Host: ${host}`);
      console.log(`[DB TEST] Database: ${dbName}`);
      console.log(`[DB TEST] Round-trip: ${elapsed}ms`);
      process.exit(0);
    }

    console.error("[DB TEST] FAILED: Ping did not return ok=1", pingResult);
    process.exit(1);
  } catch (error) {
    console.error("[DB TEST] FAILED:", error?.message || error);
    process.exit(1);
  } finally {
    await client.close().catch(() => undefined);
  }
}

main();
