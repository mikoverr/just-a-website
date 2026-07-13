export class BackgroundVideo {
  constructor(className = "background__video") {
    this.className = className
    this.currentVideo = null
  }

  load(src) {
    if (!src) return Promise.reject(new Error("Video src is required"))

    this.abort()

    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.classList.add(this.className)
      video.innerHTML = "<p>Your browser does not support video</p>"
      video.preload = "auto"
      video.playsInline = true
      video.disableRemotePlayback = true
      video.controls = false
      video.autoplay = true
      video.loop = true
      video.muted = true

      video.onloadedmetadata = async () => {
        this.currentVideo = video

        try {
          await video.play()
        } catch {
          // Autoplay can be rejected by the browser, this isn't fatal
        }

        resolve(video)
      }
      video.onerror = () => {
        reject(new Error(`Failed to load background video: ${src}`))
      }

      video.src = src
    })
  }

  abort() {
    if (!this.currentVideo) return

    this.currentVideo.pause()
    this.currentVideo.onloadedmetadata = null
    this.currentVideo.onerror = null
    this.currentVideo.src = ""
    this.currentVideo = null
  }
}
