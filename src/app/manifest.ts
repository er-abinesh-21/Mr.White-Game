import { MetadataRoute } from 'next'
 
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mr. White Game',
    short_name: 'Mr.White',
    description: 'A premium social deduction party game built for pass-and-play offline capabilities.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
    ],
  }
}
