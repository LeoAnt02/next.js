import React from 'react'

export const dynamic = 'force-static'

export default function StaticPageWithScripts() {
  return (
    <div>
      <title>Static Page with Scripts</title>
      <h1>Static App Router Page</h1>
      <p id="content">This page is statically generated with force-static.</p>

      {/* External scripts that should be removed for bots */}
      <script src="/test-script.js"></script>
      <script src="https://example.com/analytics.js"></script>

      {/* Script preload links that should be removed for bots */}
      <link rel="preload" as="script" href="/_next/static/chunks/main.js" />
      <link rel="preload" as="script" href="/assets/module.js" />

      {/* Font preload links that should be removed for bots */}
      <link
        rel="preload"
        href="/fonts/static-font.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />

      {/* Inline scripts that should be preserved */}
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('Static page script executed');`,
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Static Page with Scripts',
            description: 'A static app router page with various scripts',
          }),
        }}
      />

      {/* Script with .js references that should be removed for bots */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const scriptUrl = '/_next/static/chunks/main.js';
            const moduleUrl = '/assets/module.js';
            console.log('Loading scripts:', scriptUrl, moduleUrl);
          `,
        }}
      />

      <p>This content should always be visible to both bots and browsers.</p>
    </div>
  )
}
