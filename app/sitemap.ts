import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://lycho.vercel.app', lastModified: new Date() },
    { url: 'https://lycho.vercel.app/demo', lastModified: new Date() },
    { url: 'https://lycho.vercel.app/developers', lastModified: new Date() },
    { url: 'https://lycho.vercel.app/login', lastModified: new Date() },
    { url: 'https://lycho.vercel.app/signup', lastModified: new Date() },
  ]
}
