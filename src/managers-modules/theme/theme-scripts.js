export class ThemeScripts {
  constructor({ logger, storage, loader, themesConfig }) {
    this.logger = logger
    this.storage = storage
    this.loader = loader
    this.themesConfig = themesConfig

    this.cleanupFns = []

    this.onThemeChange = this.onThemeChange.bind(this)
  }

  async setup() {}

  async init() {
    document.addEventListener("theme:change", this.onThemeChange)

    await this.applyScriptsByThemeName(this.storage.get("theme"))
  }

  findThemeByName(themeName) {
    return Object.values(this.themesConfig).find((theme) => theme.name === themeName)
  }

  async onThemeChange(event) {
    await this.applyScriptsByThemeName(event.detail.themeName)
  }

  async applyScriptsByThemeName(themeName) {
    const theme = this.findThemeByName(themeName)
    if (!theme) {
      this.logger.warning(`ThemeScripts: no config found for theme "${themeName}"`)
      return
    }

    this.runCleanup()
    await this.runScripts(theme.additionalScripts)
  }

  runCleanup() {
    this.cleanupFns.forEach((cleanup) => cleanup())
    this.cleanupFns = []
  }

  async runScripts(scripts) {
    if (!scripts || !Array.isArray(scripts)) return

    for (const script of scripts) {
      try {
        const cleanup = await this.runScript(script)
        if (typeof cleanup === "function") this.cleanupFns.push(cleanup)
      } catch (error) {
        this.logger.error(`ThemeScripts: failed to run script "${script}"\n${error}`)
      }
    }
  }

  async runScript(script) {
    if (typeof script === "function") return script()
    if (typeof script !== "string") return null

    const module = await this.loader.loadScript(script)
    const run = module?.default ?? module

    return typeof run === "function" ? run() : null
  }
}
