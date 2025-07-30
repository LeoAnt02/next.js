import React from 'react'

export const dynamic = 'force-static'

export default function StaticPageWithFonts() {
  return (
    <div>
      <title>Static Page with Fonts</title>
      <h1>Static Page with Various Fonts</h1>
      <p>This page tests font preload removal for bots.</p>

      {/* Font preload links with different formats - should be removed for bots */}
      <link
        rel="preload"
        href="/fonts/roboto.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />
      <link
        rel="preload"
        href="/fonts/inter.woff"
        as="font"
        type="font/woff"
        crossOrigin=""
      />
      <link
        rel="preload"
        href="/fonts/opensans.ttf"
        as="font"
        type="font/ttf"
        crossOrigin=""
      />
      <link
        rel="preload"
        href="/fonts/arial.otf"
        as="font"
        type="font/otf"
        crossOrigin=""
      />
      <link
        rel="preload"
        href="/fonts/times.eot"
        as="font"
        type="font/eot"
        crossOrigin=""
      />

      {/* CSS links should be preserved */}
      <link rel="stylesheet" href="/styles.css" />
      <link rel="stylesheet" href="/global.css" />

      {/* Other preload links should be preserved */}
      <link rel="preload" href="/image.jpg" as="image" />

      <p>
        Font loading should be optimized for bots but preserved for browsers.
      </p>
    </div>
  )
}
