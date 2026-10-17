/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    Server_API_URL: process.env.Server_API_URL,
    SERVER_API_URL: process.env.SERVER_API_URL,
    SERVER_URL: process.env.SERVER_URL,
  },
};

export default nextConfig;
