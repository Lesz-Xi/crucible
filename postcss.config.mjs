import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function hasPackage(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

const config = {
  plugins: hasPackage("@tailwindcss/postcss")
    ? {
        "@tailwindcss/postcss": {},
      }
    : {
        tailwindcss: {},
        autoprefixer: {},
      },
};

export default config;
