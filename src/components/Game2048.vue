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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding-top: 40px;
  padding-bottom: 40px;
}

.g2048-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.g2048-header h1 {
  font-size: 44px;
  margin: 0;
  line-height: 1;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}

.g2048-stats {
  display: flex;
  gap: 8px;
}

.badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 12px;
  padding: 8px 16px;
  min-width: 80px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transform: translateY(0);
  transition: all 0.3s ease;
}

.badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
  gap: 12px;
  justify-content: center;
}

.btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
  transition: all 0.3s ease;
  transform: translateY(0);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}

.btn:disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}
.btn.primary {
  background: linear-gradient(135deg, #ffd89b, #19547b);
  color: #fff;
  box-shadow: 0 4px 16px rgba(255, 216, 155, 0.4);
}

.btn.primary:hover {
  box-shadow: 0 6px 20px rgba(255, 216, 155, 0.5);
}

.board {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 20px;
  user-select: none;
  touch-action: none;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
}

.row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.row:last-child {
  margin-bottom: 0;
}

.cell {
  height: 100px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
  color: #776e65;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform: scale(1);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.1);
}

@media (max-width: 420px) {
  .cell { height: 72px; font-size: 22px; }
}

.cell span {
  transform: translateZ(0);
  animation: cellAppear 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes cellAppear {
  0% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) rotate(90deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.cell:hover {
  transform: scale(1.02);
}

/* 值颜色 - 现代化渐变配色 */
.cell.v2    { 
  background: linear-gradient(135deg, #fff5f5, #fed8d8); 
  color: #2d3748; 
  box-shadow: 0 4px 12px rgba(254, 216, 216, 0.4);
}
.cell.v4    { 
  background: linear-gradient(135deg, #fef5e7, #fed7aa); 
  color: #2d3748; 
  box-shadow: 0 4px 12px rgba(254, 215, 170, 0.4);
}
.cell.v8    { 
  background: linear-gradient(135deg, #ffb366, #ff8c42); 
  color: #fff; 
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.5);
}
.cell.v16   { 
  background: linear-gradient(135deg, #ff7979, #eb4d4b); 
  color: #fff; 
  box-shadow: 0 4px 12px rgba(235, 77, 75, 0.5);
}
.cell.v32   { 
  background: linear-gradient(135deg, #fd79a8, #e84393); 
  color: #fff; 
  box-shadow: 0 4px 12px rgba(232, 67, 147, 0.5);
}
.cell.v64   { 
  background: linear-gradient(135deg, #a29bfe, #6c5ce7); 
  color: #fff; 
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.5);
}
.cell.v128  { 
  background: linear-gradient(135deg, #74b9ff, #0984e3); 
  color: #fff; 
  font-size: 24px; 
  box-shadow: 0 4px 12px rgba(9, 132, 227, 0.5);
}
.cell.v256  { 
  background: linear-gradient(135deg, #00cec9, #00b894); 
  color: #fff; 
  font-size: 24px; 
  box-shadow: 0 4px 12px rgba(0, 184, 148, 0.5);
}
.cell.v512  { 
  background: linear-gradient(135deg, #55a3ff, #2e86de); 
  color: #fff; 
  font-size: 24px; 
  box-shadow: 0 4px 12px rgba(46, 134, 222, 0.5);
}
.cell.v1024 { 
  background: linear-gradient(135deg, #feca57, #ff9ff3); 
  color: #fff; 
  font-size: 20px; 
  box-shadow: 0 4px 12px rgba(255, 159, 243, 0.5);
}
.cell.v2048 { 
  background: linear-gradient(135deg, #ff6348, #ff3838); 
  color: #fff; 
  font-size: 20px; 
  box-shadow: 0 4px 12px rgba(255, 56, 56, 0.6);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  display: grid;
  place-items: center;
  border-radius: 20px;
}

.overlay-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  padding: 32px 40px;
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.overlay-card .msg {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.overlay-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.hint {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #4a5568;
  font-size: 14px;
  margin-top: 0;
  padding: 16px 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>