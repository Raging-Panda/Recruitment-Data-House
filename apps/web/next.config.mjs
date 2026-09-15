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
      // LinkedIn profile pictures (LinkedIn sign-in). Added preemptively,
      // same lesson as the Google host above — unverified against a real
      // LinkedIn login yet, since that needs a real LinkedIn OAuth app.
      { protocol: "https", hostname: "media.licdn.com" },
    ],
  },
};

export default nextConfig;
