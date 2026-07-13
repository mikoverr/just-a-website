export class Loader {
  constructor({ logger }) {
    this.logger = logger
  }

  setup() {
    return true
  }

  async loadJson(url) {
    if (!url) throw new Error("JSON url is null")
    
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    
    return await response.json()
  }

  async loadScript(url) {
    if (!url) throw new Error("Script url is null")
    
    return await import(url)
  }
}