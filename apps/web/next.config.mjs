/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ipskill/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
