const GAME_WIDTH = 640;
const GAME_HEIGHT = 720;
const PLAYER_WIDTH = 34;
const PLAYER_HEIGHT = 36;
const PLAYER_Y = GAME_HEIGHT - 92;
const PLAYER_SPEED = 310;
const PLAYER_MARGIN = 28;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 18;
const BULLET_SPEED = 520;
const FIRE_COOLDOWN_MS = 140;
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 26;
const ENEMY_ROWS = 4;
const ENEMY_COLUMNS = 8;
const ENEMY_SPACING_X = 52;
const ENEMY_SPACING_Y = 42;
const ENEMY_START_Y = 106;
const ENEMY_FORMATION_SPEED = 42;
const ENEMY_FORMATION_PADDING = 42;
const ENEMY_DIVE_INTERVAL_MS = 2200;
const ENEMY_DIVE_SPEED = 210;
const ENEMY_DIVE_DRIFT = 86;
const BASE_MAX_HP = 5;
const BASE_LINE_Y = GAME_HEIGHT - 44;
const BASE_LINE_WIDTH = GAME_WIDTH - 64;
const BASE_LINE_HEIGHT = 8;
const SCORE_PER_ENEMY = 100;

const COLORS = {
  background: 0x070b1a,
  star: 0xd9f3ff,
  player: 0x7df9ff,
  playerStroke: 0xffffff,
  bullet: 0xfff07a,
  bulletStroke: 0xffffff,
  enemy: 0xff5c8a,
  enemyStroke: 0xffb3c5,
  enemyDiving: 0xff9f43,
  baseHealthy: 0x76ff99,
  baseWarning: 0xffd166,
  baseDanger: 0xff5c5c,
};

const PHASER_MODULE_PATHS = [
  '/node_modules/phaser/dist/phaser.esm.js',
  'https://cdn.jsdelivr.net/npm/phaser@4.1.0/dist/phaser.esm.js',
  'https://unpkg.com/phaser@4.1.0/dist/phaser.esm.js',
];

// Cloudflare Pages가 원본 index.html을 서빙할 때도 기본 화면이 뜨도록 Phaser를 동적으로 불러온다.
const loadPhaser = async () => {
  if (window.Phaser) {
    return window.Phaser;
  }

  let lastError = null;

  for (const path of PHASER_MODULE_PATHS) {
    try {
      const module = await import(path);
      return module.default ?? module;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Phaser module could not be loaded.');
};

// Vite CSS가 로드되지 않는 잘못된 정적 배포에서도 canvas가 보이도록 최소 스타일을 주입한다.
const applyFallbackStyles = () => {
  document.documentElement.style.width = '100%';
  document.documentElement.style.minHeight = '100%';
  document.documentElement.style.margin = '0';
  document.body.style.width = '100%';
  document.body.style.minHeight = '100%';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#050813';

  const app = document.querySelector('#app');

  if (app instanceof HTMLElement) {
    app.style.width = '100vw';
    app.style.height = '100vh';
    app.style.display = 'grid';
    app.style.placeItems = 'center';
    app.style.background = '#050813';
  }
};

class StaticFallbackSceneFactory {
  constructor(Phaser) {
    this.Phaser = Phaser;
  }

  createSceneClass() {
    const Phaser = this.Phaser;

    return class StaticFallbackScene extends Phaser.Scene {
      constructor() {
        super('StaticFallbackScene');
        this.score = 0;
        this.baseHp = BASE_MAX_HP;
        this.stage = 1;
        this.status = 'playing';
        this.lastFireAt = 0;
        this.formationOffset = 0;
        this.formationDirection = 1;
        this.nextDiveAt = ENEMY_DIVE_INTERVAL_MS;
      }

      // 번들 진입점이 실패했을 때만 사용하는 최소 게임 씬을 만든다.
      create() {
        console.log('[Galaxy Defence] Static fallback scene loaded');
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.cameras.main.setBackgroundColor(COLORS.background);

        this.createStarField();
        this.createPlayer();
        // 정적 fallback에서도 충돌 등록 전에 탄환 그룹을 먼저 준비한다.
        this.bullets = this.physics.add.group();
        this.createEnemies();
        this.createBaseLine();
        this.createHud();

        const keyboard = this.input.keyboard;

        if (keyboard === null) {
          throw new Error('Keyboard input is required for Galaxy Defence.');
        }

        this.cursors = keyboard.createCursorKeys();
        this.fireKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.physics.add.overlap(this.bullets, this.enemies, (bulletObject, enemyObject) => {
          bulletObject.destroy();
          this.enemies.remove(enemyObject, true, true);
          this.score += SCORE_PER_ENEMY;
          this.updateHud();
          this.checkStageClear();
        });
      }

      // 플레이어, 탄환, 편대 이동, 급강하, 기지 피해를 한 프레임씩 갱신한다.
      update(time, delta) {
        if (this.status !== 'playing') {
          return;
        }

        this.updatePlayer(delta);
        this.updateShooting(time);
        this.updateBullets();
        this.updateFormation(time, delta);
        this.updateBaseHits();
        this.checkStageClear();
      }

      createStarField() {
        for (let index = 0; index < 90; index += 1) {
          const x = Phaser.Math.Between(12, GAME_WIDTH - 12);
          const y = Phaser.Math.Between(54, GAME_HEIGHT - 78);
          const size = Phaser.Math.Between(1, 2);
          const alpha = Phaser.Math.FloatBetween(0.25, 0.85);
          this.add.rectangle(x, y, size, size, COLORS.star, alpha).setDepth(-1);
        }
      }

      createPlayer() {
        this.player = this.add.triangle(
          GAME_WIDTH / 2,
          PLAYER_Y,
          0,
          PLAYER_HEIGHT,
          PLAYER_WIDTH / 2,
          0,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          COLORS.player,
          1,
        );
        this.player.setOrigin(0.5, 0.5);
        this.player.setStrokeStyle(2, COLORS.playerStroke, 0.95);
        this.physics.add.existing(this.player);
        this.player.body.setAllowGravity(false);
        this.player.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
        this.player.body.setCollideWorldBounds(true);
      }

      createEnemies() {
        this.enemies = this.physics.add.group();
        const totalWidth = (ENEMY_COLUMNS - 1) * ENEMY_SPACING_X;
        const startX = GAME_WIDTH / 2 - totalWidth / 2;
        let index = 0;

        for (let row = 0; row < ENEMY_ROWS; row += 1) {
          for (let column = 0; column < ENEMY_COLUMNS; column += 1) {
            const x = startX + column * ENEMY_SPACING_X;
            const y = ENEMY_START_Y + row * ENEMY_SPACING_Y;
            const enemy = this.add.triangle(
              x,
              y,
              0,
              0,
              ENEMY_WIDTH,
              0,
              ENEMY_WIDTH / 2,
              ENEMY_HEIGHT,
              COLORS.enemy,
              1,
            );

            enemy.setOrigin(0.5, 0.5);
            enemy.setStrokeStyle(2, COLORS.enemyStroke, 0.9);
            enemy.setData('homeX', x);
            enemy.setData('homeY', y);
            enemy.setData('state', 'formation');
            enemy.setData('phase', index * 0.73);
            this.physics.add.existing(enemy);
            enemy.body.setAllowGravity(false);
            enemy.body.setSize(ENEMY_WIDTH, ENEMY_HEIGHT);
            enemy.body.setImmovable(true);
            this.enemies.add(enemy);
            index += 1;
          }
        }
      }

      createBaseLine() {
        this.baseLine = this.add.rectangle(
          GAME_WIDTH / 2,
          BASE_LINE_Y,
          BASE_LINE_WIDTH,
          BASE_LINE_HEIGHT,
          COLORS.baseHealthy,
          1,
        );
        this.physics.add.existing(this.baseLine, true);
      }

      createHud() {
        const style = {
          fontFamily: 'Consolas, ui-monospace, monospace',
          fontSize: '18px',
          color: '#e8fbff',
        };

        this.scoreText = this.add.text(18, 18, '', style).setDepth(10);
        this.hpText = this.add.text(GAME_WIDTH / 2, 18, '', style).setOrigin(0.5, 0).setDepth(10);
        this.stageText = this.add.text(GAME_WIDTH - 18, 18, '', style).setOrigin(1, 0).setDepth(10);
        this.centerText = this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
            fontFamily: 'Consolas, ui-monospace, monospace',
            fontSize: '44px',
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setDepth(20)
          .setVisible(false);

        this.add
          .text(12, 52, 'Galaxy Defence MVP Loaded', {
            fontFamily: 'Consolas, ui-monospace, monospace',
            fontSize: '12px',
            color: '#7df9ff',
          })
          .setDepth(30);

        this.updateHud();
      }

      updatePlayer(delta) {
        const leftPressed = Boolean(this.cursors.left?.isDown);
        const rightPressed = Boolean(this.cursors.right?.isDown);
        const direction = Number(rightPressed) - Number(leftPressed);
        const nextX = this.player.x + direction * PLAYER_SPEED * (delta / 1000);
        this.player.x = Phaser.Math.Clamp(
          nextX,
          PLAYER_MARGIN + PLAYER_WIDTH / 2,
          GAME_WIDTH - PLAYER_MARGIN - PLAYER_WIDTH / 2,
        );
        this.player.body.reset(this.player.x, this.player.y);
      }

      updateShooting(time) {
        if (time - this.lastFireAt < FIRE_COOLDOWN_MS || !Phaser.Input.Keyboard.JustDown(this.fireKey)) {
          return;
        }

        const bullet = this.add.rectangle(
          this.player.x,
          this.player.y - PLAYER_HEIGHT / 2 - BULLET_HEIGHT / 2,
          BULLET_WIDTH,
          BULLET_HEIGHT,
          COLORS.bullet,
          1,
        );
        bullet.setStrokeStyle(1, COLORS.bulletStroke, 0.9);
        this.physics.add.existing(bullet);
        bullet.body.setAllowGravity(false);
        bullet.body.setSize(BULLET_WIDTH, BULLET_HEIGHT);
        bullet.body.setVelocityY(-BULLET_SPEED);
        this.bullets.add(bullet);
        this.lastFireAt = time;
      }

      updateBullets() {
        for (const bullet of this.bullets.getChildren()) {
          if (bullet.y < -BULLET_HEIGHT) {
            bullet.destroy();
          }
        }
      }

      updateFormation(time, delta) {
        const activeEnemies = this.getActiveEnemies();
        const formationEnemies = activeEnemies.filter((enemy) => enemy.getData('state') === 'formation');

        if (formationEnemies.length > 0) {
          this.formationOffset += this.formationDirection * ENEMY_FORMATION_SPEED * (delta / 1000);

          const leftEdge = Math.min(...formationEnemies.map((enemy) => enemy.getData('homeX'))) + this.formationOffset;
          const rightEdge = Math.max(...formationEnemies.map((enemy) => enemy.getData('homeX'))) + this.formationOffset;

          if (rightEdge > GAME_WIDTH - ENEMY_FORMATION_PADDING) {
            this.formationOffset -= rightEdge - (GAME_WIDTH - ENEMY_FORMATION_PADDING);
            this.formationDirection = -1;
          }

          if (leftEdge < ENEMY_FORMATION_PADDING) {
            this.formationOffset += ENEMY_FORMATION_PADDING - leftEdge;
            this.formationDirection = 1;
          }
        }

        if (time >= this.nextDiveAt && formationEnemies.length > 0) {
          this.nextDiveAt = time + ENEMY_DIVE_INTERVAL_MS;
          const diver = formationEnemies[Phaser.Math.Between(0, formationEnemies.length - 1)];
          diver.setData('state', 'diving');
          diver.setFillStyle(COLORS.enemyDiving, 1);
          diver.body.setImmovable(false);
        }

        for (const enemy of activeEnemies) {
          if (enemy.getData('state') === 'formation') {
            enemy.setPosition(enemy.getData('homeX') + this.formationOffset, enemy.getData('homeY'));
            enemy.rotation = 0;
            enemy.body.reset(enemy.x, enemy.y);
          } else {
            const drift = Math.sin(time / 260 + enemy.getData('phase')) * ENEMY_DIVE_DRIFT;
            enemy.rotation = Phaser.Math.DegToRad(drift * 0.09);
            enemy.body.setVelocity(drift, ENEMY_DIVE_SPEED);
          }
        }
      }

      updateBaseHits() {
        for (const enemy of this.getActiveEnemies()) {
          if (enemy.getData('state') !== 'diving' || enemy.y < BASE_LINE_Y - BASE_LINE_HEIGHT / 2) {
            continue;
          }

          this.enemies.remove(enemy, true, true);
          this.baseHp = Math.max(0, this.baseHp - 1);
          const ratio = this.baseHp / BASE_MAX_HP;
          const color = ratio > 0.6 ? COLORS.baseHealthy : ratio > 0.25 ? COLORS.baseWarning : COLORS.baseDanger;
          this.baseLine.setFillStyle(color, 1);
          this.cameras.main.shake(120, 0.006);
          this.updateHud();

          if (this.baseHp <= 0) {
            this.finish('GAME OVER', '#ff5c5c');
          }
        }
      }

      updateHud() {
        this.scoreText.setText(`Score ${this.score}`);
        this.hpText.setText(`Base HP ${this.baseHp}`);
        this.stageText.setText(`Stage ${this.stage}`);
      }

      checkStageClear() {
        if (this.status === 'playing' && this.getActiveEnemies().length === 0) {
          this.finish('STAGE CLEAR', '#76ff99');
        }
      }

      finish(message, color) {
        this.status = message === 'GAME OVER' ? 'game-over' : 'stage-clear';
        this.physics.pause();
        this.centerText.setText(message).setColor(color).setVisible(true);
      }

      getActiveEnemies() {
        return this.enemies.getChildren().filter((enemy) => enemy.active);
      }
    };
  }
}

if (!window.__GALAXY_DEFENCE_BOOTED__ && !window.__GALAXY_DEFENCE_STATIC_FALLBACK__) {
  window.__GALAXY_DEFENCE_STATIC_FALLBACK__ = true;
  applyFallbackStyles();

  const app = document.querySelector('#app');

  if (app) {
    app.textContent = '';
  }

  const Phaser = await loadPhaser();
  const sceneFactory = new StaticFallbackSceneFactory(Phaser);

  console.log('[Galaxy Defence] Static fallback loaded');

  new Phaser.Game({
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
    scene: [sceneFactory.createSceneClass()],
  });
}
