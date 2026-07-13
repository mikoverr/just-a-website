export class LinksManager {
  constructor({ logger, loader }) {
    this.logger = logger
    this.loader = loader
    
    this.config = null
    this.links = null
    this.wrapperElem = null
    this.listElem = null
  }

  async setup() {
    this.config = await this.loader.loadJson("../configs/managers/links.json")
    this.links = this.config.links
  }

  async init() {
    const { wrapperClassName, listClassName, itemClassName, iconClassName, labelClassName } = this.config.config

    this.wrapperElem = document.querySelector(`.${wrapperClassName}`)
    if (!this.wrapperElem) throw new Error(`Wrapper element ".${wrapperClassName}" not found`)

    this.wrapperElem.innerHTML = ""
    this.listElem = this.createElem(this.wrapperElem, listClassName)

    this.links.forEach(link => {
      const a = document.createElement("a")
      a.className = itemClassName
      a.href = link.url
      a.setAttribute("aria-label", link.ariaLabel)
      
      if (link.target) a.target = link.target
      if (link.rel) a.rel = link.rel

      const icon = document.createElement("i")
      icon.className = `${iconClassName} ${link.icon}`
      icon.setAttribute("aria-hidden", "true")
      
      const label = document.createElement("p")
      label.className = labelClassName
      label.textContent = link.label

      a.append(icon, label)
      this.listElem.append(a)
    })
  }

  createElem(parentElem, className) {
    const elem = document.createElement("div")
    elem.classList.add(className)
    parentElem.appendChild(elem)
    
    return elem
  }
}
