export class NotificationsManager {
  constructor({ logger, loader }) {
    this.logger = logger
    this.loader = loader
    
    this.config = null
    this.parentElemClassName = null
    this.elemClassName = null
    this.parentElem = null
    this.elem = null
    this.currentNotifications = null
    this.notificationTypes = null
    this.animationDelay = null
  }
  
  async setup() {
    this.config = await this.loader.loadJson("../configs/managers/notifications.json")
    const {
      notificationTypes,
      parentElemClassName,
      elemClassName,
      surfaceClassName,
      notificationClassName,
      notificationTypePrefix,
      hiddenOnLeftClassName,
      hiddenHeightClassName
    } = this.config
    this.notificationTypes = notificationTypes
    this.parentElemClassName = parentElemClassName      
    this.elemClassName = elemClassName
    this.surfaceClassName = surfaceClassName
    this.notificationClassName = notificationClassName
    this.notificationTypePrefix = notificationTypePrefix
    this.hiddenOnLeftClassName = hiddenOnLeftClassName
    this.hiddenHeightClassName = hiddenHeightClassName
    this.currentNotifications = []
    this.animationDelay =
      +getComputedStyle(document.documentElement)
        .getPropertyValue("--transition-duration")
        .trim()
        .slice(0, -1) * 1000 || 200;
  }

  async init() {
    this.parentElem = document.querySelector(`.${this.parentElemClassName}`)
    if (!this.parentElem) throw new Error(`Parent element ".${this.parentElemClassName}" not found`)
    this.elem = this.createElem(this.parentElem, this.elemClassName)
    
    document.addEventListener('theme:change', (event) => {
      const { themeName } = event.detail
      this.showNotification(
        'info',
        `Current theme: ${themeName}`,
        3000
      )
    })
    document.addEventListener('theme:error', (event) => {
      const { themeName } = event.detail
      this.showNotification(
        'error',
        `Theme not found: ${themeName}`,
        3000
      )
    })
  }

  createElem(parentElem, className) {
    const elem = document.createElement("div")
    elem.classList.add(className)
    parentElem.appendChild(elem)
    
    return elem
  }

  showNotification(type, message, duration = undefined) {
    if (!this.notificationTypes.includes(type)) {
      this.logger.warning(`Unsupported notification type: "${type}"`) 
      return
    }

    const notification = document.createElement("p")
    notification.className = `${this.surfaceClassName} ${this.notificationClassName} ${this.notificationTypePrefix}${type} ${this.hiddenOnLeftClassName}`
    notification.insertAdjacentText("beforeend", `${message}`)
    this.elem.append(notification)
    
    this.currentNotifications.push(notification)

    setTimeout(() => {
      notification.classList.remove(this.hiddenOnLeftClassName)
    }, this.animationDelay)

    if (duration) {
      setTimeout(() => {
        this.hideSingleNotification(notification)
      }, duration)
    }
  }

  hideSingleNotification(notification) {
    const index = this.currentNotifications.indexOf(notification)
    if (index !== -1) this.currentNotifications.splice(index, 1)

    notification.classList.add(this.hiddenOnLeftClassName)
    setTimeout(() => {
      notification.classList.add(this.hiddenHeightClassName)
    }, this.animationDelay)

    setTimeout(() => {
      notification.remove()
    }, this.animationDelay)
  }

  hideAllNotifications() {
    this.currentNotifications.forEach((notif) => this.hideSingleNotification(notif))
    this.currentNotifications = []
  }
}