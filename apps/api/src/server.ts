import { createApp } from "./app.js";
import { env } from "./shared/config/env.js";
import { connectMongo } from "./shared/lib/mongoose.js";

async function main() {
  await connectMongo();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`api listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
