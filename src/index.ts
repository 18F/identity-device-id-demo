import { app } from "./app";

run().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});

async function run() {
  try {
    const dotEnv = await import("dotenv");
    dotEnv.config();
  } catch (err) {}

  let port: string | number | undefined = process.env["PORT"];
  port = port ? parseInt(String(port), 10) : 8000;
  port = isNaN(port) ? 8000 : port;

  app.listen(port, () => {
    console.log("Listening on port %d", port);
  });
}
