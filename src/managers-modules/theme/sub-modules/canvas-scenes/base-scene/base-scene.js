export class BaseScene {
  constructor(width, height, config) {
    this.width = width;
    this.height = height;
    this.config = config;
  }

  init(ctx) {}

  update(dt) {}

  draw(ctx) {}

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  destroy() {}
}
