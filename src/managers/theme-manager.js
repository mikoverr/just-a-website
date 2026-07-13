import { ThemeBackground } from "../managers-modules/theme/theme-background.js"
import { ThemeSelector } from "../managers-modules/theme/theme-selector.js"
import { ThemeScripts } from "../managers-modules/theme/theme-scripts.js"

export class ThemeManager {
  constructor({ logger, storage, loader }) {
    this.logger = logger
    this.storage = storage
    this.loader = loader

    this.config = null
    this.currentThemeName = null

    this.themeBackground = null
    this.themeSelector = null
    this.themeScripts = null

    this.onThemeSelect = this.onThemeSelect.bind(this)
  }

  async setup() {
    this.config = await this.loader.loadJson("../configs/managers/themes.json")
    this.currentThemeName = this.storage.get("theme")

    if (!this.currentThemeName) {
      const defaultTheme = Object.values(this.config)[0].name
      this.currentThemeName = this.storage.set("theme", defaultTheme)
    }

    const dependencies = {
      logger: this.logger,
      storage: this.storage,
      loader: this.loader,
      themesConfig: this.config,
    }

    this.themeBackground = new ThemeBackground(dependencies)
    this.themeSelector = new ThemeSelector(dependencies)
    this.themeScripts = new ThemeScripts(dependencies)

    await Promise.all([
      this.themeBackground.setup(),
      this.themeSelector.setup(),
      this.themeScripts.setup(),
    ])
  }

  async init() {
    document.addEventListener("theme:select", this.onThemeSelect)

    await this.applyTheme(this.currentThemeName)

    await Promise.all([
      this.themeBackground.init(),
      this.themeSelector.init(),
      this.themeScripts.init(),
    ])
  }

  dispatchCustomEvent(type, options) {
    document.dispatchEvent(
      new CustomEvent(type, options)
    )
  }

  async onThemeSelect(event) {
    const { themeName } = event.detail

    try {
      await this.applyTheme(themeName)
    } catch (e) {
      this.logger.error(`ThemeManager: failed to apply theme "${themeName}"\n${e}`)
    }
  }

  async applyTheme(themeName) {
    const theme = Object.values(this.config).find((t) => t.name === themeName)
    if (!theme) {
      this.dispatchCustomEvent('theme:error', { detail: { themeName } })
      throw new Error(`Theme "${themeName}" not found`)
    }

    this.currentThemeName = themeName
    this.storage.set("theme", themeName)
    document.documentElement.setAttribute("data-theme", themeName)

    this.dispatchCustomEvent('theme:change', { detail: { themeName } })
  }
}
