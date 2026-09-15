/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ipskill/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Google account avatars (Google sign-in) — next/image rejects any
      // remote host not explicitly allowlisted here.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
