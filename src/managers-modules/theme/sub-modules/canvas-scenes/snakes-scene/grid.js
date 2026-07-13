export class Grid {
  constructor(width, height, gridConfig) {
    this.width = width;
    this.height = height;
    this.gridConfig = gridConfig;
    this.cellSize = gridConfig.size + gridConfig.gap;
    this.cellsList = [];
    this.rowCount = 0;
    this.colCount = 0;
    this.createGrid();
  }

  createGrid() {
    this.cellsList = [];
    
    // Ensure width and height are positive
    if (this.width <= 0 || this.height <= 0) {
      console.warn('Grid: Invalid dimensions', { width: this.width, height: this.height });
      return;
    }

    this.rowCount = Math.floor(this.width / this.cellSize);
    this.colCount = Math.floor(this.height / this.cellSize);

    // Ensure at least 1x1 grid
    this.rowCount = Math.max(1, this.rowCount);
    this.colCount = Math.max(1, this.colCount);

    for (let i = 0; i < this.rowCount; i++) {
      for (let j = 0; j < this.colCount; j++) {
        this.cellsList.push({ x: i, y: j });
      }
    }
  }

  getCellSize() {
    return this.cellSize;
  }

  getGridDimensions() {
    return {
      rows: this.rowCount,
      cols: this.colCount,
      totalCells: this.cellsList.length
    };
  }

  getCellsList() {
    return this.cellsList;
  }

  isValidCell(x, y) {
    return x >= 0 && x < this.rowCount && y >= 0 && y < this.colCount;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.createGrid();
  }
}