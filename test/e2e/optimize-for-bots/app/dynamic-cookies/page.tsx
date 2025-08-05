import React from 'react'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function DynamicCookiesPage() {
  // This should work without throwing "cookies was called outside a request scope"
  const cookieStore = await cookies()
  const token = cookieStore.get('test_token')?.value || 'no-token'

  return (
    <div>
      <h1>Dynamic Cookies Page</h1>
      <p id="token">Token: {token}</p>
      <p id="timestamp">Generated at: {new Date().toISOString()}</p>

      {/* External scripts that should be removed for bots */}
      <script src="/cookies-script.js"></script>
      <script src="https://cdn.example.com/tracker.js" async></script>

      {/* Font preloads that should be removed for bots */}
      <link
        rel="preload"
        href="/fonts/cookies-font.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />

      {/* Inline scripts that should be preserved */}
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('Cookies page script executed');`,
        }}
      />

      <p>This page uses cookies() and should work with optimizeForBots.</p>
    </div>
  )
}
