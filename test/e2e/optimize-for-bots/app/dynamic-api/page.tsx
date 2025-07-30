import React from 'react'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function DynamicApiPage() {
  // Access headers to force dynamic rendering
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'Unknown'

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100))

  return (
    <div>
      <h1>Dynamic API Page</h1>
      <p id="user-agent">User Agent: {userAgent}</p>
      <p id="timestamp">Generated at: {new Date().toISOString()}</p>

      {/* External scripts that should be removed for bots */}
      <script src="/api-script.js"></script>
      <script src="https://cdn.example.com/tracker.js" async></script>

      {/* Font preloads that should be removed for bots */}
      <link
        rel="preload"
        href="/fonts/api-font.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />

      {/* Script preloads that should be removed for bots */}
      <link
        rel="preload"
        as="script"
        href="/_next/static/chunks/api-chunk.js"
      />

      {/* Inline scripts that should be preserved */}
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('API page script executed');`,
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Dynamic API Page',
            description: 'A dynamic page with API calls',
          }),
        }}
      />

      <p>This page makes dynamic API calls and is streamed.</p>
    </div>
  )
}
