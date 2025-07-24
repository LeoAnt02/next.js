import Head from 'next/head'
import Script from 'next/script'

export default function WithScriptsPage() {
  return (
    <>
      <Head>
        <title>Page with Scripts</title>
        {/* JavaScript scripts that SHOULD be removed */}
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log('Head script executed');`,
          }}
        />

        {/* Script preloads that SHOULD be removed */}
        <link
          rel="preload"
          as="script"
          href="/_next/static/chunks/webpack-123.js"
        />
        <link
          rel="preload"
          href="https://www.googletagmanager.com/gtm.js?id=GTM-123"
          as="script"
        />

        {/* Non-JavaScript scripts that SHOULD be preserved */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Page with Scripts',
              description: 'A test page with various script types',
            }),
          }}
        />

        <script
          type="application/json"
          id="config-data"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              theme: 'light',
              language: 'en',
            }),
          }}
        />

        {/* CSS and other links that SHOULD be preserved */}
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="preload"
          href="/fonts/font.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
      </Head>

      <div>
        <h1>Page with Scripts</h1>
        <p id="content">This page contains various script tags</p>

        {/* More JavaScript scripts that SHOULD be removed */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('Inline script executed');
              document.getElementById('content').textContent = 'Scripts loaded successfully';
            `,
          }}
        />

        <script src="/test-script.js"></script>
        <script
          src="https://connect.facebook.net/en_US/fbevents.js"
          async
        ></script>

        <script
          type="text/javascript"
          async
          defer
          dangerouslySetInnerHTML={{
            __html: `console.log('Attributed script executed');`,
          }}
        />

        <script type="module" src="/module-script.js"></script>

        {/* Another non-JavaScript script that SHOULD be preserved */}
        <script
          type="text/template"
          id="template-script"
          dangerouslySetInnerHTML={{
            __html: `<div class="template">{{content}}</div>`,
          }}
        />
      </div>

      <Script id="nextjs-script" strategy="afterInteractive">
        {`console.log('Next.js Script component executed');`}
      </Script>
    </>
  )
}
