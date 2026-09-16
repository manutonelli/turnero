import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { ensureHeaders } from "../lib/sheets";

async function main() {
  console.log("Creando pestanas y encabezados en la planilla...");
  await ensureHeaders();
  console.log("Listo. La planilla ya tiene las pestanas: Config, Horarios, Excepciones, Turnos.");
}

main().catch((error) => {
  console.error("Error inicializando la planilla:", error);
  process.exit(1);
});
