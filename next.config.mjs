/** @type {import("next").NextConfig} */

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      include: /node_modules\/@sj-ab/,
      type: "asset/resource",
      generator: { filename: "static/media/[name].[hash][ext]" },
    })
    return config
  },
}

export default nextConfig
