<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed } from 'vue';
import { Game, type Grid, type Direction } from '../game/core';

const size = 4;
const game = reactive(new Game(size, 2048));

const touchStartX = ref(0);
const touchStartY = ref(0);
const message = ref('');

const score = computed(() => game.score);
const best = computed(() => game.best);
const grid = computed<Grid>(() => game.grid);

function updateMessage() {
  if (game.over) {
    message.value = '游戏结束';
  } else if (game.won) {
    message.value = '达成 2048！继续挑战';
  } else {
    message.value = '';
  }
}

function act(dir: Direction) {
  game.move(dir);
  updateMessage();
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
    W: 'up',
    S: 'down',
    A: 'left',
    D: 'right',
  };
  const dir = map[e.key];
  if (dir) {
    e.preventDefault();
    act(dir);
  } else if (e.key === 'u' || e.key === 'U') {
    e.preventDefault();
    undo();
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    restart();
  }
}

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0];
  touchStartX.value = t.clientX;
  touchStartY.value = t.clientY;
}

function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX.value;
  const dy = t.clientY - touchStartY.value;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 20;

  if (absX < threshold && absY < threshold) return;

  if (absX > absY) {
    act(dx > 0 ? 'right' : 'left');
  } else {
    act(dy > 0 ? 'down' : 'up');
  }
}

function restart() {
  game.restart();
  updateMessage();
}

function undo() {
  game.undo();
  updateMessage();
}

onMounted(() => {
  window.addEventListener('keydown', onKey, { passive: false });
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
});
</script>

<template>
  <div class="g2048-root">
    <header class="g2048-header">
      <h1>2048</h1>
      <div class="g2048-stats">
        <div class="badge">
          <div class="label">分数</div>
          <div class="value">{{ score }}</div>
        </div>
        <div class="badge">
          <div class="label">最佳</div>
          <div class="value">{{ best }}</div>
        </div>
      </div>
    </header>

    <div class="g2048-controls">
      <button class="btn" @click="restart">重开</button>
      <button class="btn" @click="undo" :disabled="!game.history.length">撤销</button>
    </div>

    <div
      class="board"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
      aria-label="2048 游戏棋盘"
      role="application"
    >
      <div class="row" v-for="(row, rIdx) in grid" :key="`r-${rIdx}`">
        <div
          class="cell"
          v-for="(cell, cIdx) in row"
          :key="`c-${rIdx}-${cIdx}`"
          :class="`v${cell}`"
        >
          <span v-if="cell !== 0">{{ cell }}</span>
        </div>
      </div>
      <transition name="fade">
        <div v-if="message" class="overlay">
          <div class="overlay-card">
            <div class="msg">{{ message }}</div>
            <div class="overlay-actions">
              <button class="btn primary" @click="restart">再来一局</button>
              <button class="btn" v-if="game.over" @click="undo">撤销一步</button>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div class="hint">
      操作说明：方向键 / WASD 移动；R 重开；U 撤销；支持触摸滑动。
    </div>
  </div>
</template>

<style scoped>
.g2048-root {
  max-width: 520px;
  margin: 32px auto;
  padding: 0 16px;
  color: #2c3e50;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}

.g2048-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.g2048-header h1 {
  font-size: 44px;
  margin: 0;
  line-height: 1;
  letter-spacing: 1px;
}

.g2048-stats {
  display: flex;
  gap: 8px;
}

.badge {
  background: #bbada0;
  color: #fff;
  border-radius: 6px;
  padding: 6px 12px;
  min-width: 80px;
  text-align: center;
}

.badge .label {
  font-size: 12px;
  opacity: 0.9;
}

.badge .value {
  font-size: 20px;
  font-weight: 700;
}

.g2048-controls {
  margin: 12px 0 16px;
  display: flex;
  gap: 8px;
}

.btn {
  background: #8f7a66;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.primary {
  background: #edc22e;
  color: #fff;
}

.board {
  position: relative;
  background: #bbada0;
  padding: 10px;
  border-radius: 8px;
  user-select: none;
  touch-action: none;
}

.row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.cell {
  height: 100px;
  background: #cdc1b4;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
  color: #776e65;
}

@media (max-width: 420px) {
  .cell { height: 72px; font-size: 22px; }
}

.cell span {
  transform: translateZ(0);
}

/* 值颜色 */
.cell.v2    { background: #eee4da; color: #776e65; }
.cell.v4    { background: #ede0c8; color: #776e65; }
.cell.v8    { background: #f2b179; color: #f9f6f2; }
.cell.v16   { background: #f59563; color: #f9f6f2; }
.cell.v32   { background: #f67c5f; color: #f9f6f2; }
.cell.v64   { background: #f65e3b; color: #f9f6f2; }
.cell.v128  { background: #edcf72; color: #f9f6f2; font-size: 24px; }
.cell.v256  { background: #edcc61; color: #f9f6f2; font-size: 24px; }
.cell.v512  { background: #edc850; color: #f9f6f2; font-size: 24px; }
.cell.v1024 { background: #edc53f; color: #f9f6f2; font-size: 20px; }
.cell.v2048 { background: #edc22e; color: #f9f6f2; font-size: 20px; }

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(238, 228, 218, 0.73);
  display: grid;
  place-items: center;
  border-radius: 8px;
}

.overlay-card {
  background: #faf8ef;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  text-align: center;
}

.overlay-card .msg {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
}

.overlay-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.hint {
  opacity: 0.7;
  font-size: 13px;
  margin-top: 10px;
}
</style>