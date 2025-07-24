import { parse } from 'next/dist/compiled/node-html-parser'

export function removeJavaScriptFromHTML(html: string): string {
  try {
    const root = parse(html)

    const scriptTags = root.querySelectorAll('script')
    scriptTags.forEach((script: any) => {
      const rawAttrs = script.rawAttrs || ''

      if (rawAttrs.includes('src=') && rawAttrs.includes('.js')) {
        script.remove()
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
