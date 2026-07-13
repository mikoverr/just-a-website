class Food {
  constructor(gridConfig, cellsList) {
    this.gridConfig = gridConfig;
    this.color = Food.getRandomFoodColor();
    this.x = 0;
    this.y = 0;
    this.respawn(cellsList);
  }

  respawn(cellsList) {
    // Ensure cellsList has valid cells and pick one safely
    if (!cellsList || cellsList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * cellsList.length);
    const randomCell = cellsList[randomIndex];
    
    // Ensure coordinates are set
    if (randomCell) {
      this.x = randomCell.x;
      this.y = randomCell.y;
    }
  }

  static getRandomFoodColor() {
    // Different colors make food more visually interesting
    const colors = [
      'rgb(255, 100, 100)', // Red
      'rgb(100, 255, 100)', // Green
      'rgb(100, 100, 255)', // Blue
      'rgb(255, 255, 100)', // Yellow
      'rgb(255, 100, 255)', // Magenta
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  draw(canvas, context, gridConfig) {
    const size = gridConfig.size;
    const gap = gridConfig.gap;
    const x = this.x * (size + gap);
    const y = this.y * (size + gap);
    
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    context.fillStyle = this.color;
    context.fill();
  }
}

export { Food };