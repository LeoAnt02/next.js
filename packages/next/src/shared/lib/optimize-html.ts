import { parse } from 'next/dist/compiled/node-html-parser'

export function removeJavaScriptFromHTML(html: string): string {
  try {
    const root = parse(html)

    const scriptTags = root.querySelectorAll('script')
    scriptTags.forEach((script: any) => {
      const rawAttrs = script.rawAttrs || ''
      const innerHTML = script.innerHTML || ''

      // Remove scripts with .js in src attribute
      if (rawAttrs.includes('src=') && rawAttrs.includes('.js')) {
        script.remove()
        return
      }

      // Remove scripts that contain .js file references in their content
      if (innerHTML.includes('.js')) {
        script.remove()
        return
      }
    })

    const scriptLinks = root.querySelectorAll('link')
    scriptLinks.forEach((link: any) => {
      const rawAttrs = link.rawAttrs || ''
      if (
        rawAttrs.includes('as="script"') ||
        rawAttrs.includes("as='script'")
      ) {
        link.remove()
      }
    })

    const preloadLinks = root.querySelectorAll('link')
    preloadLinks.forEach((link: any) => {
      const rawAttrs = link.rawAttrs || ''
      if (
        rawAttrs.includes('rel="preload"') ||
        rawAttrs.includes("rel='preload'")
      ) {
        if (rawAttrs.includes('.js')) {
          link.remove()
        }
      }
    })

    return root.toString()
  } catch (error) {
    console.warn('Failed to parse HTML for JavaScript removal:', error)
    return html
  }
}

export function removeFontFilesFromHTML(html: string): string {
  try {
    const root = parse(html)

    // Remove script tags that contain font file references in their content
    const scriptTags = root.querySelectorAll('script')
    scriptTags.forEach((script: any) => {
      const innerHTML = script.innerHTML || ''

      if (
        innerHTML.includes('.woff2') ||
        innerHTML.includes('.woff') ||
        innerHTML.includes('.otf') ||
        innerHTML.includes('.ttf') ||
        innerHTML.includes('.eot')
      ) {
        script.remove()
      }
    })

    // Remove preload links with as="font"
    const preloadFontLinks = root.querySelectorAll('link')
    preloadFontLinks.forEach((link: any) => {
      const rawAttrs = link.rawAttrs || ''
      if (
        (rawAttrs.includes('rel="preload"') ||
          rawAttrs.includes("rel='preload'")) &&
        (rawAttrs.includes('as="font"') || rawAttrs.includes("as='font'"))
      ) {
        link.remove()
      }
    })

    // Remove any link tags that reference font files directly
    const fontFileLinks = root.querySelectorAll('link')
    fontFileLinks.forEach((link: any) => {
      const rawAttrs = link.rawAttrs || ''
      if (
        rawAttrs.includes('.woff2') ||
        rawAttrs.includes('.woff') ||
        rawAttrs.includes('.otf') ||
        rawAttrs.includes('.ttf') ||
        rawAttrs.includes('.eot')
      ) {
        link.remove()
      }
    })

    return root.toString()
  } catch (error) {
    console.warn('Failed to parse HTML for font removal:', error)
    return html
  }
}

export function removeFontFacesFromCSS(cssContent: string): string {
  try {
    // Remove @font-face declarations and their entire blocks
    // This regex handles multi-line @font-face blocks properly
    return cssContent.replace(/@font-face\s*\{[^}]*\}/gs, '').trim()
  } catch (err) {
    return cssContent
  }
}
