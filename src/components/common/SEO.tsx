import Head from 'next/head'

interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  structuredData?: any
}

export default function SEO({ title, description, keywords = [], image, structuredData }: SEOProps) {
  return (
    <Head>
      <title>{title} | Elynor Tours</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
    </Head>
  )
}
