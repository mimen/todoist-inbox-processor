/** @type {import('next').NextConfig} */
const nextConfig = {
  // SWC minification is enabled by default in Next.js 15
  
  // Ensure proper handling of the app directory
  // Move serverComponentsExternalPackages to top level (Next.js 15)
  serverExternalPackages: ['@doist/todoist-api-typescript'],
  
  // Webpack configuration to handle build manifest issues
  webpack: (config, { isServer, dev }) => {
    // In development, ensure manifest files are generated correctly
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
}

module.exports = nextConfig