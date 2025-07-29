import React from 'react'
import Head from 'next/head'

export default function WithFontsPage() {
  return (
    <>
      <Head>
        <title>Page with Various Fonts</title>

        {/* Font preload links with as="font" */}
        <link
          rel="preload"
          href="/fonts/inter-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/roboto-bold.woff"
          as="font"
          type="font/woff"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/openSans.ttf"
          as="font"
          type="font/ttf"
          crossOrigin=""
        />

        {/* Direct font file links */}
        <link href="/fonts/custom-font.otf" rel="stylesheet" type="font/otf" />
        <link href="/fonts/legacy-font.eot" rel="stylesheet" />

        {/* Font links with different quote styles */}
        <link
          rel="preload"
          href="/fonts/mixed-quotes.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />

        {/* CSS links that should be preserved */}
        <link rel="stylesheet" href="/styles/main.css" />
        <link rel="stylesheet" href="/styles/fonts.css" />

        {/* Other preload links that should be preserved */}
        <link rel="preload" href="/images/hero.jpg" as="image" />
      </Head>

      <div>
        <h1>Page with Various Fonts</h1>
        <p>
          This page contains various font preload links and direct font file
          references
        </p>

        <div style={{ fontFamily: 'Inter, sans-serif' }}>
          <p>Text using Inter font</p>
        </div>

        <div style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}>
          <p>Bold text using Roboto font</p>
        </div>

        <div style={{ fontFamily: 'Open Sans, sans-serif' }}>
          <p>Text using Open Sans font</p>
        </div>
      </div>
    </>
  )
}
