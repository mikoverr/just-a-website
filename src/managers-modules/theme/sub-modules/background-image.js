export class BackgroundImage {
  constructor(className = "background__image") {
    this.className = className
    this.currentImage = null
  }

  load(src) {
    if (!src) return Promise.reject(new Error("Image src is required"))

    this.abort()

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.classList.add(this.className)
      img.alt = "Background image"

      img.onload = () => {
        this.currentImage = img
        resolve(img)
      }
      img.onerror = () => {
        reject(new Error(`Failed to load background image: ${src}`))
      }

      img.src = src
    })
  }

  abort() {
    if (!this.currentImage) return

    this.currentImage.onload = null
    this.currentImage.onerror = null
    this.currentImage.src = ""
    this.currentImage = null
  }
}
