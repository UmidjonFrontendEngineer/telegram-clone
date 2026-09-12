import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'github.com', pathname: '**' },
            { protocol: 'https', hostname: 'utfs.io', pathname: '**' },
        ],
    },
    transpilePackages: ['@uploadthing/react', 'uploadthing', '@uploadthing/shared', '@uploadthing/mime-types'],
}

export default nextConfig