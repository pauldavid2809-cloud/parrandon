import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Servicios de WhatsApp aparte (Node con require y Baileys): no son parte de la app de Next.
    "whatsapp-service/**",
    "scripts/whatsapp-bot.js",
    // Herramientas de la skill de diseño (código de terceros empaquetado).
    ".claude/**",
  ]),
]);

export default eslintConfig;
