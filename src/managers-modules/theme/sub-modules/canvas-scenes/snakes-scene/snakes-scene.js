import { BaseScene } from '../base-scene/base-scene.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { Grid } from './grid.js';

export class Scene extends BaseScene {
  constructor(width, height, config) {
    super(width, height, config);
    this.canvas = null;
    this.context = null;
    this.grid = null;
    this.snakes = [];
    this.foodList = [];
    this.timeSinceLastUpdate = 0;
    
    // Track which snakes already converted to food
    this.deadSnakesProcessed = new Set();
    
    // Performance tracking
    this.stats = {
      framesSkipped: 0,
      foodSpawned: 0,
      snakesKilled: 0,
      avgFoodCount: 0,
      avgSnakeLength: 0
    };
  }

  init(ctx) {
    this.context = ctx;
    this.grid = new Grid(this.width, this.height, this.config.grid);

    const { rows, cols, totalCells } = this.grid.getGridDimensions();
    
    // Validate grid was created properly
    if (totalCells === 0) {
      console.warn('Scene init: Grid is empty, dimensions too small', { 
        width: this.width, 
        height: this.height,
        gridSize: this.config.grid.size,
        gridGap: this.config.grid.gap
      });
    }

    // Initialize snakes
    const cellsList = this.grid.getCellsList();
    for (let i = 0; i < this.config.snakeCount; i++) {
      const newSnake = new Snake(this.config.grid, cellsList, this.canvas, this.context);
      this.snakes.push(newSnake);
    }

    // Initialize food with validation
    const targetFoodCount = Math.max(this.config.snakeCount, 5);
    for (let i = 0; i < targetFoodCount; i++) {
      const newFood = new Food(this.config.grid, cellsList);
      
      // Validate food position
      if (this.grid.isValidCell(newFood.x, newFood.y)) {
        this.foodList.push(newFood);
        this.stats.foodSpawned++;
      }
    }
  }

  update(dt) {
    const targetInterval = 1 / this.config.fps;
    this.timeSinceLastUpdate += dt;

    if (this.timeSinceLastUpdate < targetInterval) {
      return;
    }

    // Prevent excessive/cascade updates if coming back from background
    if (this.timeSinceLastUpdate > targetInterval * 2) {
      this.timeSinceLastUpdate = 0;
      this.stats.framesSkipped++;
    } else {
      this.timeSinceLastUpdate -= targetInterval;
    }

    // Main game loop
    this.moveAllSnakes();
    this.handleCollisions();
    this.processDyingSnakes();
    this.maintainGameBalance();
  }

  moveAllSnakes() {
    for (const snake of this.snakes) {
      snake.move(this.snakes, this.foodList, this.width, this.height);
    }
  }

  handleCollisions() {
    this.checkSnakeToFoodCollision();
    this.checkSnakeToSnakeCollision();
  }

  checkSnakeToFoodCollision() {
    for (let i = this.foodList.length - 1; i >= 0; i--) {
      const food = this.foodList[i];
      let eaten = false;

      for (const snake of this.snakes) {
        if (snake.head.x === food.x && snake.head.y === food.y) {
          // Mark snake for growth (1 segment per food)
          snake.growthPending++;
          eaten = true;
          break;
        }
      }

      if (eaten) {
        this.foodList.splice(i, 1);
      }
    }
  }

  checkSnakeToSnakeCollision() {
    const snakesToKill = new Set();

    for (let i = 0; i < this.snakes.length; i++) {
      if (snakesToKill.has(this.snakes[i])) continue;

      for (let j = i + 1; j < this.snakes.length; j++) {
        if (snakesToKill.has(this.snakes[j])) continue;

        const snake1 = this.snakes[i];
        const snake2 = this.snakes[j];

        // Head-to-head collision (both die)
        if (snake1.head.x === snake2.head.x && snake1.head.y === snake2.head.y) {
          snakesToKill.add(snake1);
          snakesToKill.add(snake2);
          continue;
        }

        // Snake1 head hits snake2 body
        if (this.checkHeadToBodyCollision(snake1.head, snake2.segments)) {
          snakesToKill.add(snake1);
        }

        // Snake2 head hits snake1 body
        if (this.checkHeadToBodyCollision(snake2.head, snake1.segments)) {
          snakesToKill.add(snake2);
        }
      }
    }

    // Kill all collided snakes
    snakesToKill.forEach(snake => {
      snake.isAlive = false;
      this.stats.snakesKilled++;
    });
  }

  checkHeadToBodyCollision(head, segments) {
    // Check collision with body (skip head segment)
    for (let i = 1; i < segments.length; i++) {
      if (head.x === segments[i].x && head.y === segments[i].y) {
        return true;
      }
    }
    return false;
  }

  processDyingSnakes() {
    const deadSnakes = this.snakes.filter(snake => !snake.isAlive);
    
    // Convert dead snake segments to food (only once per snake)
    const cellsList = this.grid.getCellsList();
    
    for (const snake of deadSnakes) {
      // Skip if already processed
      if (this.deadSnakesProcessed.has(snake)) continue;
      
      // Mark as processed
      this.deadSnakesProcessed.add(snake);
      
      // Only spawn food from longer snakes (minimum 5 segments)
      if (snake.segments.length > 5) {
        // Only spawn SOME food, not all segments (max 3-5 items)
        const foodCount = Math.min(3, Math.floor(snake.segments.length / 3));
        for (let i = 0; i < foodCount; i++) {
          const randomSegmentIndex = Math.floor(Math.random() * snake.segments.length);
          const segment = snake.segments[randomSegmentIndex];
          
          if (this.grid.isValidCell(segment.x, segment.y)) {
            const food = new Food(this.config.grid, cellsList);
            food.x = segment.x;
            food.y = segment.y;
            this.foodList.push(food);
            this.stats.foodSpawned++;
          }
        }
      }
    }

    // Remove dead snakes
    this.snakes = this.snakes.filter(snake => snake.isAlive);
    
    // Clean up processed markers for dead snakes
    for (const snake of deadSnakes) {
      this.deadSnakesProcessed.delete(snake);
    }
  }

  maintainGameBalance() {
    // Respawn snakes to maintain count
    while (this.snakes.length < this.config.snakeCount) {
      const newSnake = new Snake(this.config.grid, this.grid.getCellsList(), this.canvas, this.context);
      this.snakes.push(newSnake);
    }

    // Maintain food-to-snake ratio BUT WITH A CAP
    // Max food = 1.5x snake count, minimum 3, maximum 20
    const targetFoodCount = Math.max(
      3,
      Math.min(20, Math.ceil(this.snakes.length * 1.5))
    );
    
    // Only add food if below target
    if (this.foodList.length < targetFoodCount) {
      const cellsList = this.grid.getCellsList();
      if (cellsList && cellsList.length > 0) {
        const newFood = new Food(this.config.grid, cellsList);
        
        // Validate food position is within grid bounds
        if (this.grid.isValidCell(newFood.x, newFood.y)) {
          this.foodList.push(newFood);
          this.stats.foodSpawned++;
        }
      }
    }
    
    // If too much food, remove excess (keep target count)
    while (this.foodList.length > targetFoodCount) {
      this.foodList.pop();
    }
    
    // Update stats
    this.stats.avgFoodCount = this.foodList.length;
    const totalLength = this.snakes.reduce((sum, snake) => sum + snake.segments.length, 0);
    this.stats.avgSnakeLength = this.snakes.length > 0 ? Math.round(totalLength / this.snakes.length) : 0;
  }

  draw(ctx) {
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw food
    for (const food of this.foodList) {
      food.draw(this.canvas, ctx, this.config.grid);
    }

    // Draw snakes
    for (const snake of this.snakes) {
      snake.draw();
    }

    // Show debug if needed
    if (this.config.isDebugMode) this.showDebug(ctx);
  }

  showDebug(ctx) {
    const margin = 20;
    const panelWidth = 320;
    const panelHeight = this.height - (margin * 2);
    const panelX = margin;
    const panelY = margin;
    const headerHeight = 35;

    ctx.font = "13px 'Consolas', monospace";
    let yOffset = panelY + headerHeight + 15;
    const lineHeight = 18;
    const sectionSpacing = 5;
    const indent = 25;

    // Draw panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Draw header background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(panelX, panelY, panelWidth, headerHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(panelX, panelY + headerHeight);
    ctx.lineTo(panelX + panelWidth, panelY + headerHeight);
    ctx.stroke();

    // Draw title
    ctx.font = "bold 16px 'Consolas', monospace";
    ctx.fillStyle = '#4CAF50';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEBUG CONSOLE', panelX + panelWidth / 2, panelY + headerHeight / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const drawSectionHeader = (text) => {
      ctx.fillStyle = '#4CAF50';
      ctx.font = "bold 14px 'Consolas', monospace";
      ctx.fillText(text, panelX + 15, yOffset);
      ctx.font = "13px 'Consolas', monospace";
      yOffset += 25;
    };

    const drawText = (text, color = '#fff', indented = false) => {
      if (yOffset > panelY + panelHeight - lineHeight) return false;
      ctx.fillStyle = color;
      ctx.fillText(text, panelX + (indented ? indent : 15), yOffset);
      yOffset += lineHeight;
      return true;
    };

    // Game Performance
    drawSectionHeader('Performance');
    const fps = this.config.fps;
    const fpsColor = fps >= 30 ? '#4CAF50' : fps >= 15 ? '#FFC107' : '#F44336';
    drawText(`FPS: ${fps}`, fpsColor);
    drawText(`Frame time: ${(1000 / fps).toFixed(1)}ms`);
    drawText(`Skipped frames: ${this.stats.framesSkipped}`);
    if (performance.memory) {
      const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const memoryColor = memoryMB > 100 ? '#F44336' : memoryMB > 50 ? '#FFC107' : '#4CAF50';
      drawText(`Memory: ${memoryMB}MB`, memoryColor);
    }
    yOffset += sectionSpacing;

    // Game State
    drawSectionHeader('Game State');
    drawText(`Snakes: ${this.snakes.length} alive`);
    drawText(`Killed: ${this.stats.snakesKilled}`);
    drawText(`Food: ${this.foodList.length} items`);
    drawText(`Food spawned: ${this.stats.foodSpawned}`);
    yOffset += sectionSpacing;

    // Canvas Info
    drawSectionHeader('Canvas Info');
    const { rows, cols } = this.grid.getGridDimensions();
    drawText(`Size: ${this.width}x${this.height}`);
    drawText(`Cell size: ${this.grid.getCellSize()}px`);
    drawText(`Grid: ${rows}x${cols} (${rows * cols} cells)`);
    yOffset += sectionSpacing;

    // All Snakes Status
    drawSectionHeader('Snakes Status');
    if (this.snakes.length > 0) {
      for (let i = 0; i < this.snakes.length; i++) {
        const snake = this.snakes[i];
        const head = snake.head;
        const length = snake.segments.length;
        const direction = `${snake.direction.x > 0 ? '→' : snake.direction.x < 0 ? '←' : ''}${snake.direction.y > 0 ? '↓' : snake.direction.y < 0 ? '↑' : ''}`;

        const snakeInfo = `#${i + 1}: pos(${head.x},${head.y}) len=${length} ${direction}`;
        if (!drawText(snakeInfo, snake.color, true)) {
          if (i < this.snakes.length - 1) {
            drawText(`... and ${this.snakes.length - i} more snakes`, '#FFC107', true);
          }
          break;
        }
      }
      yOffset += sectionSpacing;
    }

    // Food Status
    if (this.foodList.length > 0 && this.foodList.length <= 15) {
      drawSectionHeader('Food Positions');
      for (let i = 0; i < this.foodList.length; i++) {
        const food = this.foodList[i];
        const foodInfo = `#${i + 1}: (${food.x},${food.y})`;
        if (!drawText(foodInfo, food.color, true)) {
          if (i < this.foodList.length - 1) {
            drawText(`... and ${this.foodList.length - i} more`, '#FFC107', true);
          }
          break;
        }
      }
    }
  }

  resize(width, height) {
    super.resize(width, height);
    if (this.grid) {
      this.grid.resize(width, height);
    }
  }

  destroy() {
    this.snakes = [];
    this.foodList = [];
    this.stats = { framesSkipped: 0, foodSpawned: 0, snakesKilled: 0 };
  }

  setCanvas(canvas) {
    this.canvas = canvas;
  }
}