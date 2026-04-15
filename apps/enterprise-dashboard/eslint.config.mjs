import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = Array.isArray(nextConfig) ? nextConfig : [nextConfig];
export default config;
