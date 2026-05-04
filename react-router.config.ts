import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Restrict server actions to only originate from the app itself.
  // @ts-expect-error - allowedActionOrigins not yet in type definitions for this version
  allowedActionOrigins: ["*trueup-app.netlify.app"],
} satisfies Config;
