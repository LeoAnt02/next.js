import { nextTestSetup } from 'e2e-utils'

describe('optimizeForBots - App Router', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  // Test with a known bot user agent
  const botUserAgent = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
  // Test with a regular browser user agent
  const browserUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

  describe('Given a static page with JavaScript and font resources', () => {
    describe('When a bot requests the page', () => {
      it('should remove external JavaScript script tags', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        // Should not contain external JavaScript script tags
        expect(html).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
        expect(html).not.toMatch(
          /<script[^>]*src=["'][^"']*analytics\.js["'][^>]*>/gi
        )
      })

      it('should remove script preload links', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).not.toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)
        expect(html).not.toMatch(/<link[^>]*href=[^>]*\.js[^>]*>/gi)
      })

      it('should remove font preload links', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).not.toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)
        expect(html).not.toMatch(/<link[^>]*href=[^>]*\.woff2[^>]*>/gi)
      })

      it('should preserve inline JavaScript and structured data', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        // Should preserve inline scripts
        expect(html).toContain('console.log')
        expect(html).toContain('application/ld+json')
        expect(html).toContain('"@context":"https://schema.org"')
        expect(html).toContain('"@type":"WebPage"')
      })

      it('should preserve page content and structure', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).toContain('Static App Router Page')
        expect(html).toContain('This content should always be visible')
        expect(html).toContain('<h1>Static App Router Page</h1>')
      })

      it('should remove scripts containing JavaScript file references', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).not.toContain('/_next/static/chunks/main.js')
        expect(html).not.toContain('/assets/module.js')
        expect(html).not.toContain(
          "const scriptUrl = '/_next/static/chunks/main.js'"
        )
      })
    })

    describe('When a browser requests the page', () => {
      it('should preserve all JavaScript and font resources', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': browserUserAgent },
          })
          .then((res) => res.text())

        // Should contain JavaScript scripts for browsers
        expect(html).toMatch(/<script[^>]*>/gi)
        expect(html).toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)
        expect(html).toContain('Static App Router Page')
      })
    })
  })

  describe('Given a static page with various font formats', () => {
    describe('When a bot requests the page', () => {
      it('should remove all font preload links regardless of format', async () => {
        const html = await next
          .fetch('/static-with-fonts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        // Should not contain any font file extensions
        expect(html).not.toMatch(/\.woff2/gi)
        expect(html).not.toMatch(/\.woff/gi)
        expect(html).not.toMatch(/\.ttf/gi)
        expect(html).not.toMatch(/\.otf/gi)
        expect(html).not.toMatch(/\.eot/gi)
        expect(html).not.toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)
      })

      it('should preserve CSS and other non-font resources', async () => {
        const html = await next
          .fetch('/static-with-fonts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).toMatch(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi)
        expect(html).toMatch(
          /<link[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*>/gi
        )
        expect(html).toContain('Static Page with Various Fonts')
      })
    })

    describe('When a browser requests the page', () => {
      it('should preserve all font preload links', async () => {
        const html = await next
          .fetch('/static-with-fonts', {
            headers: { 'User-Agent': browserUserAgent },
          })
          .then((res) => res.text())

        expect(html).toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)
        expect(html).toMatch(/\.woff2/gi)
        expect(html).toMatch(/\.woff/gi)
        expect(html).toMatch(/\.ttf/gi)
      })
    })
  })

  describe('Given a dynamic page with JavaScript and font resources', () => {
    describe('When a bot requests the page', () => {
      it('should remove external JavaScript script tags', async () => {
        const html = await next
          .fetch('/dynamic-page', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
        expect(html).not.toMatch(
          /<script[^>]*src=["'][^"']*analytics\.js["'][^>]*>/gi
        )
      })

      it('should remove script and font preload links', async () => {
        const html = await next
          .fetch('/dynamic-page', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).not.toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)
        expect(html).not.toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)
        expect(html).not.toMatch(/<link[^>]*href=[^>]*\.woff2[^>]*>/gi)
      })

      it('should preserve inline scripts and structured data', async () => {
        const html = await next
          .fetch('/dynamic-page', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).toContain('console.log')
        expect(html).toContain('application/ld+json')
        expect(html).toContain('"@context":"https://schema.org"')
        expect(html).toContain('"@type":"WebPage"')
      })

      it('should preserve dynamic content and timestamps', async () => {
        const html = await next
          .fetch('/dynamic-page', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).toContain('Dynamic App Router Page')
        expect(html).toContain('Generated at:')
        expect(html).toContain(
          'This page is dynamically rendered on each request'
        )
      })

      it('should remove scripts containing JavaScript file references', async () => {
        const html = await next
          .fetch('/dynamic-page', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).not.toContain('/_next/static/chunks/dynamic.js')
        expect(html).not.toContain(
          "const dynamicScript = '/_next/static/chunks/dynamic.js'"
        )
      })
    })

    describe('When a browser requests the page', () => {
      it('should preserve all JavaScript and font resources', async () => {
        const html = await next
          .fetch('/dynamic-page', {
            headers: { 'User-Agent': browserUserAgent },
          })
          .then((res) => res.text())

        expect(html).toContain('Dynamic App Router Page')
        expect(html).toContain('Generated at:')
        expect(html).toMatch(/<script[^>]*src=[^>]*>/gi)
        expect(html).toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)
      })
    })
  })

  describe('Given a dynamic page with streaming and API calls', () => {
    describe('When a bot requests the page', () => {
      it('should remove JavaScript from streamed content', async () => {
        const html = await next
          .fetch('/dynamic-api', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
        expect(html).not.toMatch(
          /<script[^>]*src=["'][^"']*tracker\.js["'][^>]*>/gi
        )
        expect(html).not.toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)
        expect(html).not.toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)
      })

      it('should preserve API data and inline content', async () => {
        const html = await next
          .fetch('/dynamic-api', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).toContain('Dynamic API Page')
        expect(html).toContain('User Agent:')
        expect(html).toContain('Generated at:')
        expect(html).toContain('console.log')
        expect(html).toContain('application/ld+json')
        expect(html).toContain('"Dynamic API Page"')
      })

      it('should handle streaming correctly with reasonable response time', async () => {
        const startTime = Date.now()

        const response = await next.fetch('/dynamic-api', {
          headers: { 'User-Agent': botUserAgent },
        })

        const endTime = Date.now()
        const responseTime = endTime - startTime

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('text/html')
        expect(responseTime).toBeLessThan(5000)

        const html = await response.text()
        expect(html).toContain('Dynamic API Page')
      })
    })

    describe('When a browser requests the page', () => {
      it('should preserve all scripts and API functionality', async () => {
        const html = await next
          .fetch('/dynamic-api', {
            headers: { 'User-Agent': browserUserAgent },
          })
          .then((res) => res.text())

        expect(html).toMatch(/<script[^>]*>/gi)
        expect(html).toContain('Dynamic API Page')
        expect(html).toContain('User Agent:')
      })
    })
  })

  describe('Given multiple dynamic requests with force-dynamic directive', () => {
    describe('When bots make concurrent requests', () => {
      it('should optimize each request independently', async () => {
        const [response1, response2] = await Promise.all([
          next.fetch('/dynamic-page', {
            headers: { 'User-Agent': botUserAgent },
          }),
          next.fetch('/dynamic-page', {
            headers: { 'User-Agent': botUserAgent },
          }),
        ])

        const [html1, html2] = await Promise.all([
          response1.text(),
          response2.text(),
        ])

        // Both should have different timestamps (proving dynamic rendering)
        const timestamp1 = html1.match(/Generated at: ([^<]+)/)?.[1]
        const timestamp2 = html2.match(/Generated at: ([^<]+)/)?.[1]

        expect(timestamp1).toBeTruthy()
        expect(timestamp2).toBeTruthy()
        expect(timestamp1).not.toBe(timestamp2)

        // Both should have bot optimizations applied
        expect(html1).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
        expect(html2).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)

        // Both should preserve inline content
        expect(html1).toContain('console.log')
        expect(html2).toContain('console.log')
      })
    })
  })

  describe('Given basic pages and API routes', () => {
    describe('When a bot requests the home page', () => {
      it('should preserve content and remove JavaScript resources', async () => {
        const html = await next
          .fetch('/static-home', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        expect(html).toContain('hello world')
        expect(html).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
      })
    })

    describe('When a bot requests an API endpoint', () => {
      it('should not affect JSON responses', async () => {
        const response = await next.fetch('/api/test', {
          headers: { 'User-Agent': botUserAgent },
        })

        const data = await response.json()
        expect(data.message).toBe('API endpoint')
        expect(response.headers.get('content-type')).toContain(
          'application/json'
        )
      })
    })

    describe('When requests have no user agent header', () => {
      it('should treat as browser request and preserve resources', async () => {
        const html = await next.fetch('/static-home').then((res) => res.text())
        expect(html).toContain('hello world')
      })
    })

    describe('When requests have empty user agent', () => {
      it('should treat as browser request and preserve resources', async () => {
        const html = await next
          .fetch('/static-home', {
            headers: { 'User-Agent': '' },
          })
          .then((res) => res.text())

        expect(html).toContain('hello world')
      })
    })
  })

  describe('Given pages with proper HTML structure', () => {
    describe('When bots request pages', () => {
      it('should maintain valid HTML structure after optimization', async () => {
        const html = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        // Should maintain valid HTML structure
        expect(html).toContain('<html')
        expect(html).toContain('</html>')
        expect(html).toContain('<head')
        expect(html).toContain('</head>')
        expect(html).toContain('<body')
        expect(html).toContain('</body>')
        expect(html).toMatch(/<title[^>]*>Static Page with Scripts<\/title>/)
        expect(html).toContain('<h1>Static App Router Page</h1>')
      })

      it('should maintain proper HTTP response headers', async () => {
        const response = await next.fetch('/static-with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })

        expect(response.headers.get('content-type')).toContain('text/html')
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Given the experimental.optimizeForBots configuration', () => {
    describe('When the feature is enabled', () => {
      it('should apply different optimizations for bots vs browsers', async () => {
        const botHtml = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': botUserAgent },
          })
          .then((res) => res.text())

        const browserHtml = await next
          .fetch('/static-with-scripts', {
            headers: { 'User-Agent': browserUserAgent },
          })
          .then((res) => res.text())

        // Bot should have external JS scripts removed but preserve inline scripts and structured data
        expect(botHtml).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
        expect(botHtml).toContain('console.log')
        expect(botHtml).toContain('"@context":"https://schema.org"')

        // Browser should have all scripts preserved
        expect(browserHtml).toMatch(/<script[^>]*>/gi)
        expect(browserHtml).toContain('console.log')
        expect(browserHtml).toContain('"@context":"https://schema.org"')
      })

      it('should work with dynamic pages that use cookies()', async () => {
        // Test with bot user agent - should not throw "cookies was called outside a request scope"
        const botResponse = await next.fetch('/dynamic-cookies', {
          headers: {
            'User-Agent': botUserAgent,
            Cookie: 'test_token=bot-token-123',
          },
        })
        expect(botResponse.status).toBe(200)

        const botHtml = await botResponse.text()
        expect(botHtml).toMatch(/Token:\s*(?:<!--\s*-->)?bot-token-123/i)
        expect(botHtml).toContain('Dynamic Cookies Page')

        // Should still optimize for bots (remove external scripts)
        expect(botHtml).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
        expect(botHtml).toContain('console.log') // preserve inline scripts

        // Test with browser user agent
        const browserResponse = await next.fetch('/dynamic-cookies', {
          headers: {
            'User-Agent': browserUserAgent,
            Cookie: 'test_token=browser-token-456',
          },
        })
        expect(browserResponse.status).toBe(200)

        const browserHtml = await browserResponse.text()
        expect(browserHtml).toMatch(
          /Token:\s*(?:<!--\s*-->)?browser-token-456/i
        )
        expect(browserHtml).toContain('Dynamic Cookies Page')

        // Should preserve all scripts for browsers
        expect(browserHtml).toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
        expect(browserHtml).toContain('console.log')
      })

      it('should optimize CSS files by removing @font-face for bots', async () => {
        // Test bot user agent - should get CSS without @font-face declarations
        const botResponse = await next.fetch('/fonts.css', {
          headers: { 'User-Agent': botUserAgent },
        })
        expect(botResponse.status).toBe(200)
        expect(botResponse.headers.get('content-type')).toContain('text/css')

        const botCSS = await botResponse.text()
        // Should not contain @font-face declarations
        expect(botCSS).not.toContain('@font-face')
        expect(botCSS).not.toContain('src: url')
        expect(botCSS).not.toContain('font-display: swap')
        expect(botCSS).not.toContain('/fonts/custom.woff2')

        // Should still contain regular CSS
        expect(botCSS).toContain('.container')
        expect(botCSS).toContain('margin: 0 auto')
        expect(botCSS).toContain('.header')
        expect(botCSS).toContain('color: #333')

        // Test browser user agent - should get original CSS with @font-face
        const browserResponse = await next.fetch('/fonts.css', {
          headers: { 'User-Agent': browserUserAgent },
        })
        expect(browserResponse.status).toBe(200)
        expect(browserResponse.headers.get('content-type')).toContain(
          'text/css'
        )

        const browserCSS = await browserResponse.text()
        // Should contain @font-face declarations
        expect(browserCSS).toContain('@font-face')
        expect(browserCSS).toContain("font-family: 'CustomFont'")
        expect(browserCSS).toContain('src: url')
        expect(browserCSS).toContain('/fonts/custom.woff2')

        // Should also contain regular CSS
        expect(browserCSS).toContain('.container')
        expect(browserCSS).toContain('margin: 0 auto')
        expect(browserCSS).toContain('.header')
        expect(browserCSS).toContain('color: #333')
      })
    })
  })
})
