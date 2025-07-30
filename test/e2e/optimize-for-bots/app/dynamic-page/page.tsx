import React from 'react'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export default function DynamicPage() {
  // Force dynamic rendering
  noStore()

  const timestamp = new Date().toISOString()

  return (
    <div>
      <title>Dynamic Page with Scripts</title>
      <h1>Dynamic App Router Page</h1>
      <p id="timestamp">Generated at: {timestamp}</p>

      {/* External script that should be removed for bots */}
      <script src="/external-script.js"></script>
      <script src="https://example.com/analytics.js"></script>

      {/* Preload links that should be removed for bots */}
      <link
        rel="preload"
        as="script"
        href="/_next/static/chunks/dynamic-123.js"
      />
      <link
        rel="preload"
        href="/fonts/dynamic-font.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />

      {/* Inline scripts that should be preserved */}
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('Dynamic page script executed');`,
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Dynamic Page',
            description: 'A dynamic app router page',
          }),
        }}
      />

      {/* Script with .js references that should be removed for bots */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const dynamicScript = '/_next/static/chunks/dynamic.js';
            console.log('Loading dynamic script:', dynamicScript);
          `,
        }}
      />

      <p>This page is dynamically rendered on each request.</p>
    </div>
  )
}
