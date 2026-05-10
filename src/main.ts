import Phaser from 'phaser';

import './style.css';
import { GameScene } from './scenes/GameScene';
import { GAME_HEIGHT, GAME_WIDTH } from './utils/constants';

declare global {
  interface Window {
    __GALAXY_DEFENCE_BOOTED__?: boolean;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#070b1a',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

let game: Phaser.Game | null = null;

// DOM 컨테이너가 준비된 뒤 Phaser를 부팅해 정적 호스팅 환경의 타이밍 문제를 피한다.
const bootGame = (): void => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app === null) {
    throw new Error('[Galaxy Defence] #app container was not found.');
  }

  // TODO: Cloudflare 배포 확인 후 제거 가능한 임시 부팅 로그.
  console.log('[Galaxy Defence] Booting Phaser');
  game = new Phaser.Game(config);
  window.__GALAXY_DEFENCE_BOOTED__ = true;
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootGame, { once: true });
} else {
  bootGame();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game?.destroy(true);
    game = null;
  });
}
