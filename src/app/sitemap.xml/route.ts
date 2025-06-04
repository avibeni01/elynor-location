export async function GET() {
  const urls = ['/', '/location-voiture', '/hotels']
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}${u}</loc></url>`).join('')}</urlset>`
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
