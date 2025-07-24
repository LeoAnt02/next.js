import { nextTestSetup } from 'e2e-utils'

describe('disableJavaScriptForBots', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  // Test with a known bot user agent
  const botUserAgent = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
  // Test with a regular browser user agent
  const browserUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

  describe('Basic Functionality', () => {
    it('should remove JavaScript elements for bot requests', async () => {
      const html = await next
        .fetch('/', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Should not contain external JavaScript script tags
      expect(html).not.toMatch(/<script\s+src=[^>]*\.js[^>]*>/gi)

      // Should not contain script preload links
      expect(html).not.toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)
      expect(html).not.toMatch(
        /<link[^>]*rel=["']preload["'][^>]*href=[^>]*\.js[^>]*>/gi
      )

      // Should still contain the page content
      expect(html).toContain('hello world')
    })

    it('should preserve JavaScript elements for regular browser requests', async () => {
      const html = await next
        .fetch('/', {
          headers: { 'User-Agent': browserUserAgent },
        })
        .then((res) => res.text())

      // Should preserve content for browsers
      expect(html).toContain('hello world')
    })

    it('should handle requests without user agent header', async () => {
      const html = await next.fetch('/').then((res) => res.text())

      // Without user agent, should not be considered a bot
      expect(html).toContain('hello world')
    })

    it('should handle empty user agent', async () => {
      const html = await next
        .fetch('/', {
          headers: { 'User-Agent': '' },
        })
        .then((res) => res.text())

      // Empty user agent should not be considered a bot
      expect(html).toContain('hello world')
    })
  })

  describe('Selective Script Removal', () => {
    it('should remove external JavaScript scripts but preserve inline scripts for bots', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Should NOT contain external JavaScript scripts
      expect(html).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)

      // Should NOT contain script preload links
      expect(html).not.toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)
      expect(html).not.toMatch(/<link[^>]*href=[^>]*\.js[^>]*>/gi)

      // Should PRESERVE ALL inline scripts (including JavaScript ones)
      expect(html).toContain('console.log') // Inline JS should be preserved
      expect(html).toContain('application/ld+json')
      expect(html).toContain('"@context":"https://schema.org"')
      expect(html).toContain('"@type":"WebPage"')
      expect(html).toContain('application/json')
      expect(html).toContain('"theme":"light"')
      expect(html).toContain('text/template')
      expect(html).toContain('class="template"')

      // Should PRESERVE CSS and other non-script links
      expect(html).toMatch(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi)
      expect(html).toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)

      // Should preserve page content
      expect(html).toContain('Page with Scripts')
      expect(html).toContain('This page contains various script tags')
      expect(html).toContain('<h1>Page with Scripts</h1>')
    })

    it('should preserve all scripts for browsers', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': browserUserAgent },
        })
        .then((res) => res.text())

      // Should contain JavaScript scripts
      expect(html).toMatch(/<script[^>]*>/gi)
      expect(html).toContain('console.log')

      // Should contain preload links
      expect(html).toMatch(/<link[^>]*as=["']script["'][^>]*>/gi)

      // Should contain non-JavaScript scripts
      expect(html).toContain('application/ld+json')
      expect(html).toContain('application/json')
      expect(html).toContain('text/template')

      expect(html).toContain('Page with Scripts')
    })

    it('should maintain HTML structure when selectively removing external scripts', async () => {
      const html = await next
        .fetch('/with-scripts', {
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
      expect(html).toMatch(/<title[^>]*>Page with Scripts<\/title>/)
      expect(html).toContain('<h1>Page with Scripts</h1>')

      // Should have preserved ALL inline scripts (including JS ones)
      const scriptMatches = html.match(/<script[^>]*>/gi) || []
      const externalScriptMatches = scriptMatches.filter((script) =>
        script.includes('src=')
      )

      // Should have no external JavaScript scripts
      expect(externalScriptMatches.length).toBe(0)

      // Should still have inline scripts
      expect(html).toMatch(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi
      )
      expect(html).toMatch(/<script[^>]*type=["']application\/json["'][^>]*>/gi)
      expect(html).toMatch(/<script[^>]*type=["']text\/template["'][^>]*>/gi)
      expect(html).toContain('console.log') // Inline JS preserved
    })
  })

  describe('Server-Side Rendering', () => {
    it('should remove external JavaScript scripts from SSR pages for bots', async () => {
      const html = await next
        .fetch('/server-side', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Should not contain external JavaScript scripts
      expect(html).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)

      // Should preserve inline scripts
      expect(html).toContain('SSR page script executed')

      // Should preserve content
      expect(html).toContain('Server Side Rendered Page')
      expect(html).toContain('Generated at:')
    })

    it('should preserve scripts from SSR pages for browsers', async () => {
      const html = await next
        .fetch('/server-side', {
          headers: { 'User-Agent': browserUserAgent },
        })
        .then((res) => res.text())

      expect(html).toMatch(/<script[^>]*>/gi)
      expect(html).toContain('Server Side Rendered Page')
    })
  })

  describe('Content Type Specificity', () => {
    it('should only affect HTML content type', async () => {
      const apiRes = await next.fetch('/api/test', {
        headers: { 'User-Agent': botUserAgent },
      })

      const data = await apiRes.json()
      expect(data.message).toBe('API endpoint')
      expect(apiRes.headers.get('content-type')).toContain('application/json')
    })

    it('should maintain proper HTML content type for bot requests', async () => {
      const res = await next.fetch('/', {
        headers: { 'User-Agent': botUserAgent },
      })

      expect(res.headers.get('content-type')).toContain('text/html')
      expect(res.status).toBe(200)
    })
  })

  describe('Browser Functionality', () => {
    it('should work correctly in browser environment for non-bots', async () => {
      const browser = await next.browser('/with-scripts')

      // In browser, scripts should execute normally
      await browser.waitForElementByCss('#content')
      const content = await browser.elementByCss('#content').text()

      // If scripts execute, content should be modified
      expect(content).toBeTruthy()

      await browser.close()
    })

    it('should preserve SEO and structured data for bots', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // SEO and structured data should be preserved
      expect(html).toMatch(/<title[^>]*>Page with Scripts<\/title>/)
      expect(html).toContain('<h1>Page with Scripts</h1>')
      expect(html).toContain('This page contains various script tags')

      // Structured data should be intact
      expect(html).toContain('"@context":"https://schema.org"')
      expect(html).toContain('"@type":"WebPage"')
      expect(html).toContain('"name":"Page with Scripts"')

      // Inline JavaScript should be preserved (only external .js removed)
      expect(html).toContain('console.log')
      expect(html).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
    })
  })

  describe('Feature Configuration', () => {
    it('should be properly enabled via experimental.disableJavaScriptForBots', async () => {
      // Test that the feature is working as expected
      const botHtml = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      const browserHtml = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': browserUserAgent },
        })
        .then((res) => res.text())

      // Bot should have external JS scripts removed but preserve inline scripts and structured data
      expect(botHtml).not.toMatch(/<script[^>]*src=[^>]*\.js[^>]*>/gi)
      expect(botHtml).toContain('console.log') // Inline scripts preserved
      expect(botHtml).toContain('"@context":"https://schema.org"')

      // Browser should have all scripts preserved
      expect(browserHtml).toMatch(/<script[^>]*>/gi)
      expect(browserHtml).toContain('console.log')
      expect(browserHtml).toContain('"@context":"https://schema.org"')
    })
  })

  describe('Script Type Edge Cases', () => {
    it('should handle mixed script types correctly', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Count different types of scripts
      const allScriptTags = html.match(/<script[^>]*>/gi) || []

      // Should contain ALL inline scripts (both JS and non-JS)
      const inlineScripts = allScriptTags.filter(
        (script) => !script.includes('src=')
      )

      // Should have some inline scripts
      expect(inlineScripts.length).toBeGreaterThan(0)

      // Should not have any external scripts
      const externalScripts = allScriptTags.filter((script) =>
        script.includes('src=')
      )
      expect(externalScripts.length).toBe(0)

      // Verify specific content preservation
      expect(html).toContain('application/ld+json')
      expect(html).toContain('application/json')
      expect(html).toContain('text/template')
      expect(html).toContain('"theme":"light"')
      expect(html).toContain('{{content}}')
      expect(html).toContain('console.log') // Inline JS preserved
    })
  })
})
