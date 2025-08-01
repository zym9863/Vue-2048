/**
 * 2048 核心逻辑（TypeScript）
 * 提供纯函数与可测试的 Game 类
 */

export type Cell = number; // 0 为空
export type Grid = Cell[][];
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MoveResult {
  grid: Grid;
  scoreGained: number;
  moved: boolean;
  merged: boolean;
}

export interface GameStateSnapshot {
  grid: Grid;
  score: number;
  best: number;
  over: boolean;
  won: boolean;
}

function cloneGrid(g: Grid): Grid {
  return g.map(row => row.slice());
}

function emptyCells(g: Grid): { r: number; c: number }[] {
  const res: { r: number; c: number }[] = [];
  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < g[r].length; c++) {
      if (g[r][c] === 0) res.push({ r, c });
    }
  }
  return res;
}

export function createGrid(size = 4): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

export function addRandomTile(g: Grid, rng: () => number = Math.random): Grid {
  const cells = emptyCells(g);
  if (cells.length === 0) return g;
  const pick = cells[Math.floor(rng() * cells.length)];
  // 90% 2, 10% 4
  g[pick.r][pick.c] = rng() < 0.9 ? 2 : 4;
  return g;
}

function rotateGridRight(g: Grid): Grid {
  const size = g.length;
  const res = createGrid(size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      res[c][size - 1 - r] = g[r][c];
    }
  }
  return res;
}

function rotateGridLeft(g: Grid): Grid {
  // three times right
  return rotateGridRight(rotateGridRight(rotateGridRight(g)));
}

function reverseRows(g: Grid): Grid {
  return g.map(row => row.slice().reverse());
}

function compress(row: number[]): { line: number[]; merged: boolean; score: number } {
  const filtered = row.filter(v => v !== 0);
  const res: number[] = [];
  let merged = false;
  let score = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const v = filtered[i] * 2;
      res.push(v);
      score += v;
      merged = true;
      i++;
    } else {
      res.push(filtered[i]);
    }
  }
  while (res.length < row.length) res.push(0);
  return { line: res, merged, score };
}

export function moveGrid(g: Grid, dir: Direction): MoveResult {
  let work = cloneGrid(g);
  let rotatedBack = (x: Grid) => x;

  if (dir === 'up') {
    work = rotateGridLeft(work);
    rotatedBack = rotateGridRight;
  } else if (dir === 'down') {
    work = rotateGridRight(work);
    rotatedBack = rotateGridLeft;
  } else if (dir === 'right') {
    work = reverseRows(work);
    rotatedBack = reverseRows;
  }

  let moved = false;
  let mergedFlag = false;
  let gained = 0;
  const newGrid = work.map(row => {
    const before = row.slice();
    const { line, merged, score } = compress(row);
    if (!arraysEqual(before, line)) moved = true;
    if (merged) mergedFlag = true;
    gained += score;
    return line;
  });

  const finalGrid = rotatedBack(newGrid);
  return {
    grid: finalGrid,
    scoreGained: gained,
    moved,
    merged: mergedFlag,
  };
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function hasMoves(g: Grid): boolean {
  if (emptyCells(g).length > 0) return true;
  const size = g.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = g[r][c];
      if (r + 1 < size && g[r + 1][c] === v) return true;
      if (c + 1 < size && g[r][c + 1] === v) return true;
    }
  }
  return false;
}

export function getMaxTile(g: Grid): number {
  return Math.max(...g.flat());
}

export class Game {
  size: number;
  grid: Grid;
  score = 0;
  best = 0;
  over = false;
  won = false;
  history: GameStateSnapshot[] = [];
  winValue: number;

  constructor(size = 4, winValue = 2048) {
    this.size = size;
    this.winValue = winValue;
    this.grid = createGrid(size);
    this.grid = addRandomTile(this.grid);
    this.grid = addRandomTile(this.grid);
  }

  snapshot(): GameStateSnapshot {
    return {
      grid: cloneGrid(this.grid),
      score: this.score,
      best: this.best,
      over: this.over,
      won: this.won,
    };
  }

  load(snapshot: GameStateSnapshot) {
    this.grid = cloneGrid(snapshot.grid);
    this.score = snapshot.score;
    this.best = snapshot.best;
    this.over = snapshot.over;
    this.won = snapshot.won;
  }

  move(dir: Direction, rng: () => number = Math.random): MoveResult {
    if (this.over) return { grid: this.grid, scoreGained: 0, moved: false, merged: false };
    // save undo snapshot
    this.history.push(this.snapshot());
    const result = moveGrid(this.grid, dir);
    if (result.moved) {
      this.grid = addRandomTile(cloneGrid(result.grid), rng);
      this.score += result.scoreGained;
      if (this.score > this.best) this.best = this.score;
      if (getMaxTile(this.grid) >= this.winValue) this.won = true;
      if (!hasMoves(this.grid)) this.over = true;
    } else {
      // no move; discard history entry
      this.history.pop();
    }
    return { ...result, grid: cloneGrid(this.grid) };
  }

  restart() {
    this.grid = createGrid(this.size);
    this.grid = addRandomTile(this.grid);
    this.grid = addRandomTile(this.grid);
    this.score = 0;
    this.over = false;
    this.won = false;
    this.history = [];
  }

  undo() {
    const last = this.history.pop();
    if (last) this.load(last);
  }
}