import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig = {
  // Webpack configuration to handle PDF.js
  webpack: (config, { isServer }) => {
    // Exclude PDF.js worker from server-side bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist/build/pdf.worker.min.mjs': false,
      };
    }
    
    // Handle import.meta for client-side only
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    
    return config;
  },
  
  // Exclude problematic packages from server-side rendering
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
  
  // Transpile packages if needed (removed pdfjs-dist to avoid conflict)
  transpilePackages: ['react-pdf'],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
