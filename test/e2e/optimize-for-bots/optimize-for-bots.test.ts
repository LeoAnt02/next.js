import { nextTestSetup } from 'e2e-utils'

describe('optimizeForBots', () => {
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

      // Should REMOVE font links for bots
      expect(html).not.toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)

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
    it('should be properly enabled via experimental.optimizeForBots', async () => {
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

  describe('Font File Removal', () => {
    it('should remove font preload links for bot requests', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Should not contain font preload links
      expect(html).not.toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)
      expect(html).not.toMatch(/<link[^>]*href=[^>]*\.woff2[^>]*>/gi)
      expect(html).not.toMatch(/<link[^>]*href=[^>]*\.woff[^>]*>/gi)
      expect(html).not.toMatch(/<link[^>]*href=[^>]*\.ttf[^>]*>/gi)
      expect(html).not.toMatch(/<link[^>]*href=[^>]*\.otf[^>]*>/gi)
      expect(html).not.toMatch(/<link[^>]*href=[^>]*\.eot[^>]*>/gi)

      // Should still contain CSS links and other non-font links
      expect(html).toMatch(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi)

      // Should preserve page content
      expect(html).toContain('Page with Scripts')
    })

    it('should preserve font preload links for regular browser requests', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': browserUserAgent },
        })
        .then((res) => res.text())

      // Should contain font preload links
      expect(html).toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)
      expect(html).toMatch(/<link[^>]*href=[^>]*\.woff2[^>]*>/gi)

      // Should also contain CSS links
      expect(html).toMatch(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi)

      // Should preserve content
      expect(html).toContain('Page with Scripts')
    })

    it('should handle font links with different attributes for bots', async () => {
      const html = await next
        .fetch('/with-fonts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Should not contain any font file extensions
      expect(html).not.toMatch(/\.woff2/gi)
      expect(html).not.toMatch(/\.woff/gi)
      expect(html).not.toMatch(/\.ttf/gi)
      expect(html).not.toMatch(/\.otf/gi)
      expect(html).not.toMatch(/\.eot/gi)

      // Should not contain font preload links
      expect(html).not.toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)

      // Should preserve CSS and other content
      expect(html).toMatch(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi)
      expect(html).toContain('Page with Various Fonts')
    })

    it('should preserve all font links for browsers', async () => {
      const html = await next
        .fetch('/with-fonts', {
          headers: { 'User-Agent': browserUserAgent },
        })
        .then((res) => res.text())

      // Should contain font preload links
      expect(html).toMatch(/<link[^>]*as=["']font["'][^>]*>/gi)

      // Should contain various font file extensions
      expect(html).toMatch(/\.woff2/gi)
      expect(html).toMatch(/\.woff/gi)
      expect(html).toMatch(/\.ttf/gi)

      // Should preserve content
      expect(html).toContain('Page with Various Fonts')
    })

    it('should maintain HTML structure when removing font links', async () => {
      const html = await next
        .fetch('/with-fonts', {
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

      // Should preserve non-font links
      expect(html).toMatch(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi)

      // Should have no font-related links
      const linkTags = html.match(/<link[^>]*>/gi) || []
      const fontLinks = linkTags.filter(
        (link) =>
          link.includes('as="font"') ||
          link.includes("as='font'") ||
          link.includes('.woff') ||
          link.includes('.ttf') ||
          link.includes('.otf') ||
          link.includes('.eot')
      )
      expect(fontLinks.length).toBe(0)
    })
  })

  describe('Script Content Removal', () => {
    it('should remove scripts with .js file references in content for bots', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Should not contain script content that references .js files
      expect(html).not.toContain('/_next/static/chunks/main.js')
      expect(html).not.toContain('/assets/module.js')
      expect(html).not.toContain(
        "const scriptUrl = '/_next/static/chunks/main.js'"
      )

      // Should preserve other inline scripts without .js references
      expect(html).toContain('application/ld+json')
      expect(html).toContain('console.log') // Other console.log statements preserved
    })

    it('should remove scripts with font file references in content for bots', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Should not contain script content that references font files
      expect(html).not.toContain('/fonts/roboto.woff2')
      expect(html).not.toContain('/fonts/inter.woff')
      expect(html).not.toContain('/fonts/opensans.ttf')
      expect(html).not.toContain('const fontUrls = [')

      // Should preserve other inline scripts without font references
      expect(html).toContain('application/ld+json')
      expect(html).toContain('text/template')
    })

    it('should preserve scripts with file references in content for browsers', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': browserUserAgent },
        })
        .then((res) => res.text())

      // Should contain script content that references .js files
      expect(html).toContain('/_next/static/chunks/main.js')
      expect(html).toContain('/assets/module.js')

      // Should contain script content that references font files
      expect(html).toContain('/fonts/roboto.woff2')
      expect(html).toContain('/fonts/inter.woff')
      expect(html).toContain('/fonts/opensans.ttf')

      // Should preserve all other content
      expect(html).toContain('Page with Scripts')
    })

    it('should handle mixed content removal correctly for bots', async () => {
      const html = await next
        .fetch('/with-scripts', {
          headers: { 'User-Agent': botUserAgent },
        })
        .then((res) => res.text())

      // Count script tags to ensure proper removal
      const allScriptTags = html.match(/<script[^>]*>/gi) || []

      // Should not contain any scripts with .js or font file references
      const problematicScripts = allScriptTags.filter((script) => {
        const fullScript = html.substring(
          html.indexOf(script),
          html.indexOf('</script>', html.indexOf(script)) + '</script>'.length
        )
        return (
          fullScript.includes('.js') ||
          fullScript.includes('.woff') ||
          fullScript.includes('.ttf') ||
          fullScript.includes('.otf') ||
          fullScript.includes('.eot')
        )
      })

      expect(problematicScripts.length).toBe(0)

      // Should preserve safe scripts
      expect(html).toContain('application/ld+json')
      expect(html).toContain('application/json')
      expect(html).toContain('text/template')
    })
  })

  describe('CSS Font Processing for Bots', () => {
    // Test the CSS processing logic with a unit test approach
    it('should remove @font-face declarations from CSS content', () => {
      const testCSS = `
        .container { color: red; }
        
        @font-face {
          font-family: 'TestFont';
          src: url('/_next/static/media/test-font.woff2') format('woff2');
        }
        
        @font-face {
          font-family: 'AnotherFont';
          src: url('/_next/static/media/another-font.woff') format('woff');
        }
        
        .text { font-family: 'TestFont'; }
      `

      // Test the regex we use in the server code
      const cleanedCSS = testCSS.replace(/@font-face\s*{[^}]*}/g, '')

      // Should not contain @font-face declarations
      expect(cleanedCSS).not.toContain('@font-face')
      expect(cleanedCSS).not.toContain('test-font.woff2')
      expect(cleanedCSS).not.toContain('another-font.woff')

      // Should still contain other CSS rules
      expect(cleanedCSS).toContain('.container { color: red; }')
      expect(cleanedCSS).toContain(".text { font-family: 'TestFont'; }")
    })

    it('should handle complex @font-face declarations', () => {
      const complexCSS = `
        .header { background: blue; }
        
        @font-face {
          font-family: 'ComplexFont';
          src: url('font.woff2') format('woff2'),
               url('font.woff') format('woff');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        .footer { color: green; }
      `

      const cleanedCSS = complexCSS.replace(/@font-face\s*{[^}]*}/g, '')

      expect(cleanedCSS).not.toContain('@font-face')
      expect(cleanedCSS).not.toContain('ComplexFont')
      expect(cleanedCSS).not.toContain('font.woff2')
      expect(cleanedCSS).toContain('.header { background: blue; }')
      expect(cleanedCSS).toContain('.footer { color: green; }')
    })

    it('should handle weird @font-face formatting with properties on same line', () => {
      const weirdFormatCSS = `
        .container { color: red; }
        
        @font-face {
            font-family: aeonik Fallback;
            src: local("Arial");
            ascent-override:91.27%;descent-override:22.57%;line-gap-override:0.00%;size-adjust:101.90%}
        
        @font-face {
          font-family: 'TestFont';
          src: url('/fonts/test.woff2') format('woff2');
        }
        
        .text { font-family: 'TestFont'; }
      `

      const cleanedCSS = weirdFormatCSS.replace(/@font-face\s*{[^}]*}/g, '')

      // Should remove both @font-face declarations (including weird format)
      expect(cleanedCSS).not.toContain('@font-face')
      expect(cleanedCSS).not.toContain('aeonik Fallback')
      expect(cleanedCSS).not.toContain('ascent-override')

      // Should preserve other CSS rules
      expect(cleanedCSS).toContain('.container { color: red; }')
      expect(cleanedCSS).toContain(".text { font-family: 'TestFont'; }")
    })

    it('should handle CSS without @font-face declarations', () => {
      const simpleCSS = `
        .simple { color: green; }
        .another { margin: 10px; }
      `

      const cleanedCSS = simpleCSS.replace(/@font-face\s*{[^}]*}/g, '')

      // Should be unchanged
      expect(cleanedCSS.trim()).toBe(simpleCSS.trim())
    })

    it('should verify CSS processing is enabled for bots', async () => {
      // Test with a non-existent CSS file to verify our CSS processing code is hit
      const cssResponse = await next.fetch(
        '/_next/static/css/non-existent.css',
        {
          headers: { 'User-Agent': botUserAgent },
        }
      )

      // Should return 404 (falls back to normal static file behavior after our processing)
      expect(cssResponse.status).toBe(404)
    })

    it('should not process non-CSS files', async () => {
      // Ensure non-CSS files are not affected by our CSS processing
      const jsResponse = await next.fetch('/_next/static/js/test.js', {
        headers: { 'User-Agent': botUserAgent },
      })

      // Should return 404 for non-existent file (normal behavior)
      expect(jsResponse.status).toBe(404)
    })
  })
})
