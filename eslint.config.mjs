import nextConfig from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";

const eslintConfig = [...nextConfig, prettier];

export default eslintConfig;
