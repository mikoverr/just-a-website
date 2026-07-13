class Snake {
  constructor(gridConfig, cellsList, canvas, context) {
    this.gridConfig = gridConfig;
    this.cellsList = cellsList;
    this.canvas = canvas;
    this.context = context;
    this.isAlive = true;
    this.segments = [];
    this.minSegmentsCount = 3;
    this.growthPending = 0; // How many segments to add without removing tail
    const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    const randomDirectionIndex = Math.floor(Math.random() * directions.length);
    this.direction = directions[randomDirectionIndex];
    this.color = this.getRandomRGBColor();
    this.create();
  }

  getRandomRGBColor() {
    const getRandomInt = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  create() {
    let maxCol = 0;
    let maxRow = 0;
    this.cellsList.forEach(cell => {
      if (cell.x > maxCol) maxCol = cell.x;
      if (cell.y > maxRow) maxRow = cell.y;
    });

    const dx = this.direction.x;
    const dy = this.direction.y;
    const span = this.minSegmentsCount - 1;

    // Filter cellsList for valid start positions where the whole body fits
    const validHeadCells = this.cellsList.filter(cell => {
      const tailX = cell.x - span * dx;
      const tailY = cell.y - span * dy;
      return tailX >= 0 && tailX <= maxCol && tailY >= 0 && tailY <= maxRow;
    });

    const sourceList = validHeadCells.length > 0 ? validHeadCells : this.cellsList;
    const randomIndex = Math.floor(Math.random() * sourceList.length);
    const headCell = sourceList[randomIndex];

    for (let i = 0; i < this.minSegmentsCount; i++) {
      this.segments.push({
        x: headCell.x - i * dx,
        y: headCell.y - i * dy
      });
    }
  }

  get head() {
    return this.segments[0];
  }

  checkCollisionOfSelf() {
    // Check collision with body (skip head and last segment which will be removed)
    for (let i = 1; i < this.segments.length - 1; i++) {
      if (this.head.x === this.segments[i].x && this.head.y === this.segments[i].y) {
        return true;
      }
    }
    return false;
  }

  isPositionBlocked(x, y, snakeList, width, height) {
    const cellSize = this.gridConfig.size + this.gridConfig.gap;
    const maxX = Math.floor(width / cellSize);
    const maxY = Math.floor(height / cellSize);

    if (x < 0 || x >= maxX || y < 0 || y >= maxY) return true;

    for (let i = 1; i < this.segments.length - 1; i++) {
      if (this.segments[i].x === x && this.segments[i].y === y) return true;
    }

    for (const otherSnake of snakeList) {
      if (otherSnake === this) continue;
      for (const segment of otherSnake.segments) {
        if (segment.x === x && segment.y === y) return true;
      }
    }
    return false;
  }

  move(snakeList, foodList, width, height) {
    if (!this.isAlive) return;

    const nextX = this.head.x + this.direction.x;
    const nextY = this.head.y + this.direction.y;

    if (this.isPositionBlocked(nextX, nextY, snakeList, width, height)) {
      const possibleDirs = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
      ].filter(dir => {
        const tx = this.head.x + dir.x;
        const ty = this.head.y + dir.y;
        return !this.isPositionBlocked(tx, ty, snakeList, width, height);
      });

      if (possibleDirs.length > 0) {
        this.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
      } else {
        // Trapped: only die if absolutely no move possible
        this.isAlive = false;
        return;
      }
    }

    const closestFood = this.findClosestFood(foodList);
    if (closestFood) {
      this.gotoClosestFood(closestFood, snakeList, width, height);
    }

    const head = {
      x: this.head.x + this.direction.x,
      y: this.head.y + this.direction.y
    };

    // Final safety check (should be covered by isPositionBlocked)
    const cellSize = this.gridConfig.size + this.gridConfig.gap;
    if (head.x < 0 || head.x >= Math.floor(width / cellSize) || head.y < 0 || head.y >= Math.floor(height / cellSize)) {
      return; 
    }

    this.segments.unshift(head);
    
    if (this.growthPending > 0) {
      this.growthPending--;
    } else {
      this.segments.pop();
    }

    if (this.checkCollisionOfSelf()) {
      this.isAlive = false;
    }
  }

  gotoClosestFood(food, snakeList, width, height) {
    const dx = food.x - this.head.x;
    const dy = food.y - this.head.y;

    const nextX = this.head.x + this.direction.x;
    const nextY = this.head.y + this.direction.y;
    
    if (this.isPositionBlocked(nextX, nextY, snakeList, width, height)) {
      const altX = this.head.x + Math.sign(dx);
      const altY = this.head.y + Math.sign(dy);
      
      if (this.direction.x !== 0 && !this.isPositionBlocked(this.head.x, altY, snakeList, width, height)) {
        this.direction = { x: 0, y: Math.sign(dy) };
        return;
      } else if (this.direction.y !== 0 && !this.isPositionBlocked(altX, this.head.y, snakeList, width, height)) {
        this.direction = { x: Math.sign(dx), y: 0 };
        return;
      }
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      const newX = this.head.x + Math.sign(dx);
      if (!this.isPositionBlocked(newX, this.head.y, snakeList, width, height)) {
        this.direction = { x: Math.sign(dx), y: 0 };
      }
    } else if (dy !== 0) {
      const newY = this.head.y + Math.sign(dy);
      if (!this.isPositionBlocked(this.head.x, newY, snakeList, width, height)) {
        this.direction = { x: 0, y: Math.sign(dy) };
      }
    }
  }

  draw() {
    if (!this.isAlive) return;

    this.context.fillStyle = this.color;
    this.segments.forEach(segment => {
      this.context.fillRect(
          segment.x * (this.gridConfig.size + this.gridConfig.gap),
          segment.y * (this.gridConfig.size + this.gridConfig.gap),
          this.gridConfig.size,
          this.gridConfig.size
      );
    });
  }

  findClosestFood(foodList) {
    let closestFood = null;
    let minDistance = Infinity;
    for (const food of foodList) {
      const dx = food.x - this.head.x;
      const dy = food.y - this.head.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestFood = food;
      }
    }
    return closestFood;
  }
}

export { Snake };