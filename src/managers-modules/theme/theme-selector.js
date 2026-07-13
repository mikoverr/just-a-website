const TOGGLE_ICON_CLASS = "fa-solid fa-chevron-down"
const ITEM_ICON_CLASS = "fa-solid fa-circle-check"

export class ThemeSelector {
  constructor({ logger, storage, loader, themesConfig }) {
    this.logger = logger
    this.storage = storage
    this.loader = loader
    this.themesConfig = themesConfig

    this.config = null
    this.parentElem = null
    this.wrapperElem = null
    this.toggleElem = null
    this.toggleLabelElem = null
    this.listElem = null

    this.onDocumentThemeChange = this.onDocumentThemeChange.bind(this)
  }

  async setup() {
    this.config = await this.loader.loadJson("../configs/managers-modules/theme/selector.json")
  }

  async init() {
    const { parentElemClassName } = this.config

    this.parentElem = document.querySelector(`.${parentElemClassName}`)
    if (!this.parentElem) throw new Error(`Parent element ".${parentElemClassName}" not found`)

    this.buildMarkup()
    this.renderThemesList()
    this.setActiveTheme(this.getCurrentThemeName(), { animate: false })

    this.setToggleHandler()
    this.setItemsHandler()

    document.addEventListener("theme:change", this.onDocumentThemeChange)
  }

  getCurrentThemeName() {
    const themeName = this.storage.get("theme")
    const themes = Object.values(this.themesConfig)

    const theme = themes.find((t) => t.name === themeName)
    return theme ? theme.name : themes[0]?.name
  }

  buildMarkup() {
    const {
      wrapperClassName,
      toggleClassName,
      toggleLabelClassName,
      toggleIconClassName,
      listClassName,
    } = this.config

    this.parentElem.innerHTML = `
      <div class="${wrapperClassName}">
        <p class="${toggleClassName} surface" role="button" tabindex="0" aria-label="Change theme">
          <i class="${toggleIconClassName} ${TOGGLE_ICON_CLASS}" aria-hidden="true"></i>
          <span class="${toggleLabelClassName}"></span>
        </p>
        <div class="${listClassName} surface"></div>
      </div>
    `

    this.wrapperElem = this.parentElem.querySelector(`.${wrapperClassName}`)
    this.toggleElem = this.parentElem.querySelector(`.${toggleClassName}`)
    this.toggleLabelElem = this.parentElem.querySelector(`.${toggleLabelClassName}`)
    this.listElem = this.parentElem.querySelector(`.${listClassName}`)
  }

  renderThemesList() {
    const { itemClassName, itemLabelClassName, itemIconClassName } = this.config

    this.listElem.innerHTML = ""

    for (const [themeKey, theme] of Object.entries(this.themesConfig)) {
      const itemElem = document.createElement("p")
      itemElem.classList.add(itemClassName)
      itemElem.dataset.themeKey = themeKey
      itemElem.setAttribute("role", "button")
      itemElem.setAttribute("tabindex", "0")

      const itemLabelElem = document.createElement("span")
      itemLabelElem.classList.add(itemLabelClassName)
      itemLabelElem.textContent = theme.name

      itemElem.insertAdjacentHTML(
        "afterbegin",
        `<i class="${itemIconClassName} ${ITEM_ICON_CLASS}" aria-hidden="true"></i>`,
      )
      itemElem.appendChild(itemLabelElem)

      this.listElem.appendChild(itemElem)
    }
  }

  setToggleHandler() {
    this.toggleElem.addEventListener("click", () => this.toggleList())
    this.toggleElem.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return
      event.preventDefault()
      this.toggleList()
    })
  }

  toggleList() {
    const isOpen = this.listElem.classList.contains(this.config.activeClassName)
    isOpen ? this.hideList() : this.showList()
  }

  setItemsHandler() {
    this.listElem.addEventListener("click", (event) => {
      const itemElem = event.target.closest(`.${this.config.itemClassName}`)
      this.selectItem(itemElem)
    })

    this.listElem.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return

      const itemElem = event.target.closest(`.${this.config.itemClassName}`)
      if (!itemElem) return

      event.preventDefault()
      this.selectItem(itemElem)
    })
  }

  selectItem(itemElem) {
    const { activeClassName, animationDuration } = this.config

    if (!itemElem || itemElem.classList.contains(activeClassName)) return

    const theme = this.themesConfig[itemElem.dataset.themeKey]
    if (!theme) return

    this.setActiveTheme(theme.name)
    setTimeout(() => this.hideList(), animationDuration)

    document.dispatchEvent(new CustomEvent("theme:select", { detail: { themeName: theme.name } }))
  }

  showList() {
    const { activeClassName } = this.config
    this.listElem.classList.add(activeClassName)
    this.toggleElem.classList.add(activeClassName)
  }

  hideList() {
    const { activeClassName } = this.config
    this.listElem.classList.remove(activeClassName)
    this.toggleElem.classList.remove(activeClassName)
  }

  setActiveTheme(themeName, { animate = true } = {}) {
    if (!themeName) return

    const { hiddenClassName, itemClassName, itemLabelClassName, activeClassName, animationDuration } = this.config

    const updateLabel = () => {
      this.toggleLabelElem.textContent = themeName
      this.toggleElem.classList.remove(hiddenClassName)
    }

    if (animate) {
      this.toggleElem.classList.add(hiddenClassName)
      setTimeout(updateLabel, animationDuration)
    } else {
      updateLabel()
    }

    this.listElem.querySelectorAll(`.${itemClassName}`).forEach((itemElem) => {
      const labelElem = itemElem.querySelector(`.${itemLabelClassName}`)
      itemElem.classList.toggle(activeClassName, labelElem?.textContent === themeName)
    })
  }

  onDocumentThemeChange(event) {
    this.setActiveTheme(event.detail.themeName)
  }
}
