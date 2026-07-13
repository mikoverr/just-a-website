export class TypewriterManager {
  constructor({ logger, storage, loader }) {
    this.logger = logger
    this.storage = storage
    this.loader = loader

    this.config = null
    this.parentElem = null
    this.elem = null
  }

  async setup() {
    this.config = await this.loader.loadJson("../configs/managers/typewriter.json")
    
    if (this.storage.get("AreYouNewHere") === null) {
      this.storage.set("AreYouNewHere", true)
    }
  }

  async init() {
    const { parentElemClassName, elemClassName, anotherPhrase } = this.config
    
    this.parentElem = document.querySelector(`.${parentElemClassName}`)
    if (!this.parentElem) {
      throw new Error(`Parent element ".${parentElemClassName}" not found`)
    }
    
    this.elem = this.createElem(this.parentElem, elemClassName)
    
    if (this.storage.get("AreYouNewHere")) {
      await this.showPhrases()
    } else {
      this.elem.innerHTML = anotherPhrase
    }
  }

  createElem(parentElem, className) {
    const elem = document.createElement("p")
    elem.classList.add(className)
    parentElem.appendChild(elem)
    return elem
  }
  
  async showPhrases() {
    const { phraseList, phraseTypingDelay } = this.config
    
    for (const [index, phrase] of phraseList.entries()) {
      await this.typePhrase(phrase)
      
      if (index < phraseList.length - 1) {
        await this.sleep(phraseTypingDelay)
        await this.deletePhrase()
      }
    }
    
    this.storage.set("AreYouNewHere", false)
  }

  async typePhrase(phrase) {
    let currentText = ''
    for (const char of phrase) {
      currentText += char
      this.elem.textContent = currentText
      await this.sleep(this.config.letterTypingDelay)
    }
  }
  
  async deletePhrase() {
    let currentText = this.elem.textContent
    while (currentText.length > 0) {
      currentText = currentText.slice(0, -1)
      this.elem.textContent = currentText
      await this.sleep(this.config.letterDeletingDelay)
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}