import { CanvasManager } from "./sub-modules/background-canvas.js"
import { BackgroundImage } from "./sub-modules/background-image.js"
import { BackgroundVideo } from "./sub-modules/background-video.js"

export class ThemeBackground {
  constructor({ logger, storage, loader, themesConfig }) {
    this.logger = logger
    this.storage = storage
    this.loader = loader
    this.themesConfig = themesConfig

    this.config = null
    this.parentElem = null
    this.elem = null

    this.canvasManager = null
    this.backgroundImage = new BackgroundImage()
    this.backgroundVideo = new BackgroundVideo()

    this.loadToken = 0

    this.onThemeChange = this.onThemeChange.bind(this)
  }

  async setup() {
    this.config = await this.loader.loadJson("../configs/managers-modules/theme/background.json")
  }

  async init() {
    const { parentElemClassName, elemClassName } = this.config

    this.parentElem = document.querySelector(`.${parentElemClassName}`)
    if (!this.parentElem) throw new Error(`Parent element ".${parentElemClassName}" not found`)

    this.elem = this.createElem(this.parentElem, elemClassName)

    document.addEventListener("theme:change", this.onThemeChange)

    await this.applyBackgroundByThemeName(this.storage.get("theme"))
  }

  createElem(parentElem, className) {
    const elem = document.createElement("div")
    elem.classList.add(className)
    parentElem.appendChild(elem)
    return elem
  }

  async onThemeChange(event) {
    const { themeName } = event.detail
    await this.applyBackgroundByThemeName(themeName)
  }

  findThemeByName(themeName) {
    return Object.values(this.themesConfig).find((theme) => theme.name === themeName)
  }

  async applyBackgroundByThemeName(themeName) {
    const theme = this.findThemeByName(themeName)
    if (!theme || !theme.background) {
      this.logger.warning(`ThemeBackground: no background config found for theme "${themeName}"`)
      return
    }

    try {
      await this.setBackground(theme.background)
    } catch (error) {
      this.logger.error(`ThemeBackground: failed to apply background for theme "${themeName}"\n${error}`)
    }
  }

  async setBackground(background) {
    if (!background || !background.type) throw new Error("Background config is required")

    const token = ++this.loadToken

    this.clearBackground()
    document.dispatchEvent(new CustomEvent("background:loading", { detail: { type: background.type } }))

    try {
      const node = await this.loadBackgroundNode(background)

      if (token !== this.loadToken) {
        this.disposeLoadedResource(background.type, node)
        return null
      }

      this.elem.appendChild(node)
      document.dispatchEvent(new CustomEvent("background:loaded", { detail: { type: background.type } }))

      return node
    } catch (error) {
      if (token === this.loadToken) {
        document.dispatchEvent(new CustomEvent("background:error", { detail: { type: background.type, error } }))
      }

      throw error
    }
  }

  async loadBackgroundNode(background) {
    switch (background.type) {
      case "canvas":
        return await this.loadCanvasBackground(background.src)
      case "image":
        return await this.backgroundImage.load(background.src)
      case "video":
        return await this.backgroundVideo.load(background.src)
      default:
        throw new Error(`Unsupported background type: ${background.type}`)
    }
  }

  async loadCanvasBackground(src) {
    if (!src) throw new Error("Canvas background src is required")

    const [sceneModule, sceneConfig] = await Promise.all([
      this.loader.loadScript(src.scene),
      this.loader.loadJson(src.sceneConfig),
    ])

    const SceneClass = sceneModule[src.sceneName || "Scene"]
    if (typeof SceneClass !== "function") {
      throw new Error(`Scene "${src.sceneName || "Scene"}" not found in module "${src.scene}"`)
    }

    const canvas = document.createElement("canvas")
    canvas.classList.add("background__canvas")

    this.canvasManager = new CanvasManager(canvas)
    this.canvasManager.setScene(SceneClass, sceneConfig)
    this.canvasManager.start()

    return canvas
  }

  disposeLoadedResource(type, node) {
    switch (type) {
      case "canvas":
        this.canvasManager?.destroy()
        this.canvasManager = null
        return
      case "image":
        this.backgroundImage.abort()
        return
      case "video":
        this.backgroundVideo.abort()
        return
      default:
        node?.remove()
    }
  }

  clearBackground() {
    this.backgroundImage.abort()
    this.backgroundVideo.abort()

    if (this.canvasManager) {
      this.canvasManager.destroy()
      this.canvasManager = null
    }

    while (this.elem.firstChild) {
      this.elem.removeChild(this.elem.firstChild)
    }
  }
}
