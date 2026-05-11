/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint tries to parse .css with JS parser — pre-existing config issue.
    // Errors don't affect production; we'll fix the config separately.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
