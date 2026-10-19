/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/dev/outbox", destination: "/outbox", permanent: false }];
  },
};

export default nextConfig;
