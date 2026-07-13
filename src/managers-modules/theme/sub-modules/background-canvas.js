export class CanvasManager {
  constructor(canvasElem, options = {}) {
    this.canvas = canvasElem;
    this.ctx = this.canvas.getContext('2d');
    this.currentScene = null;
    
    this.animationId = null;
    this.lastTime = 0;

    // Margin settings (in pixels)
    this.margin = {
      top: options.marginTop ?? 20,
      right: options.marginRight ?? 20,
      bottom: options.marginBottom ?? 20,
      left: options.marginLeft ?? 20
    };

    // Store actual available dimensions (without DPR)
    this.availableWidth = 0;
    this.availableHeight = 0;

    this.init();
  }

  resize = () => {
    const dpr = window.devicePixelRatio || 1;

    // Calculate available space with margins
    this.availableWidth = window.innerWidth - this.margin.left - this.margin.right;
    this.availableHeight = window.innerHeight - this.margin.top - this.margin.bottom;

    // Real size (canvas internal resolution with DPR)
    this.canvas.width = this.availableWidth * dpr;
    this.canvas.height = this.availableHeight * dpr;

    // Visual size (CSS)
    this.canvas.style.width = `${this.availableWidth}px`;
    this.canvas.style.height = `${this.availableHeight}px`;
    
    // Position with margins
    this.canvas.style.marginTop = `${this.margin.top}px`;
    this.canvas.style.marginRight = `${this.margin.right}px`;
    this.canvas.style.marginBottom = `${this.margin.bottom}px`;
    this.canvas.style.marginLeft = `${this.margin.left}px`;

    this.ctx.scale(dpr, dpr);

    if (this.currentScene && typeof this.currentScene.resize === 'function') {
      this.currentScene.resize(this.availableWidth, this.availableHeight);
    }
  }

  loop = (timestamp) => {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (this.currentScene) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (typeof this.currentScene.update === 'function') {
        this.currentScene.update(deltaTime);
      }

      if (typeof this.currentScene.draw === 'function') {
        this.currentScene.draw(this.ctx);
      }
    }

    this.animationId = requestAnimationFrame(this.loop);
  }

  init() {
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  setScene(SceneClass, config = {}) {
    if (this.currentScene && typeof this.currentScene.destroy === 'function') {
      this.currentScene.destroy();
    }

    // Pass available dimensions (without DPR) to the scene
    this.currentScene = new SceneClass(this.availableWidth, this.availableHeight, config);

    if (typeof this.currentScene.init === 'function') {
      this.currentScene.init(this.ctx);
    }
  }

  start() {
    if (!this.animationId) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }    

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    if (this.currentScene && typeof this.currentScene.destroy === 'function') {
      this.currentScene.destroy();
    }
    this.canvas.remove();
  }

  // Update margins dynamically
  setMargins(top, right, bottom, left) {
    this.margin = { top, right, bottom, left };
    this.resize();
  }
}
