import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Restrict server actions to only originate from the app itself.
  allowedActionOrigins: ["*trueup-app.netlify.app"],
} satisfies Config;
