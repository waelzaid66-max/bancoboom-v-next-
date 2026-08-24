import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/build/**",
      "**/.next/**",
      "**/next-env.d.ts",
      "lib/api-client-react/**",
      "lib/api-zod/**",
      // Vendored third-party browser bundles, ignored by path and by name so
      // the exclusion cannot widen into product source. VNX-LINT-03 measured
      // 878 of 1,080 errors in these two files alone — 474
      // `no-unused-expressions`, 384 `no-undef` and 126 `no-redeclare`, which
      // is the signature of a minified bundle, not of a defect. Linting them
      // reports nothing anyone can act on and hides the source debt behind it.
      "artifacts/banco-mobile/assets/map-vendor/leaflet.js",
      "artifacts/banco-mobile/assets/map-vendor/leaflet.markercluster.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-namespace": [
        "error",
        { allowDeclarations: true, allowDefinitionFiles: true },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  // Node/tooling scope. VNX-LINT-01 gave `scripts/**/*.mjs` its Node globals;
  // the same treatment was never extended to the CommonJS build and server
  // tooling inside the workspaces, so `no-undef` fired on `require`, `module`
  // and `__dirname` — 129 errors that describe the config, not the code.
  {
    files: [
      "artifacts/*/scripts/**/*.js",
      "artifacts/*/server/**/*.js",
      "artifacts/*/*.config.js",
      "artifacts/*/*.config.cjs",
    ],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  // The guard packs and their helpers are Node ESM, executed by `node --test`.
  // They were reported for using `process` and `URL` — Node built-ins the
  // default browser globals do not carry. Same treatment `scripts/**/*.mjs`
  // already had; it simply never reached inside the workspaces.
  {
    files: [
      "artifacts/*/tests/**/*.mjs",
      "artifacts/*/lib/**/*.mjs",
      "lib/*/src/**/*.mjs",
    ],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  // Jest setup runs in CommonJS with the Jest globals injected by the runner.
  {
    files: ["artifacts/*/tests/**/jest.setup.js", "artifacts/*/jest.setup.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2022,
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // React Native asset scope. RN resolves images, fonts and vendored HTML
  // through `require()` at the bundler level — there is no ESM equivalent that
  // Metro understands. The rule stays ON everywhere else in the app, so a
  // `require()` of a MODULE is still an error; only the asset form is allowed.
  {
    files: ["artifacts/banco-mobile/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-require-imports": [
        "error",
        {
          allow: [
            "\\.(png|jpe?g|gif|svg|webp)$",
            "\\.(ttf|otf|woff2?)$",
            "\\.(wav|mp3|m4a|aac)$",
            "\\.(html|json)$",
          ],
        },
      ],
    },
  },
);
