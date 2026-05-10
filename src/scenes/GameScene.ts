import Phaser from 'phaser';

import { BaseCore } from '../entities/BaseCore';
import { Bullet } from '../entities/Bullet';
import { Player } from '../entities/Player';
import { CollisionManager } from '../systems/CollisionManager';
import { EnemyFormation } from '../systems/EnemyFormation';
import { Hud } from '../ui/Hud';
import {
  BASE_MAX_HP,
  COLORS,
  FIRE_COOLDOWN_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_Y,
  SCORE_PER_ENEMY,
  STAGE_START,
} from '../utils/constants';
import type { GameStatus } from '../utils/types';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private bullets!: Phaser.Physics.Arcade.Group;
  private formation!: EnemyFormation;
  private collisionManager!: CollisionManager;
  private baseCore!: BaseCore;
  private hud!: Hud;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private score: number;
  private stage: number;
  private status: GameStatus;
  private lastFireAt: number;

  constructor() {
    super('GameScene');

    this.score = 0;
    this.stage = STAGE_START;
    this.status = 'playing';
    this.lastFireAt = 0;
  }

  // MVP 게임 오브젝트와 시스템을 초기화한다.
  public create(): void {
    this.score = 0;
    this.stage = STAGE_START;
    this.status = 'playing';
    this.lastFireAt = 0;

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.createStarField();

    this.player = new Player(this, GAME_WIDTH / 2, PLAYER_Y);
    this.bullets = this.physics.add.group();
    this.formation = new EnemyFormation(this, this.stage);
    this.baseCore = new BaseCore(this);
    this.hud = new Hud(this);

    const keyboard = this.input.keyboard;

    if (keyboard === null) {
      throw new Error('Keyboard input is required for Galaxy Defence.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.fireKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // TODO: 포탑, 방어막, 업그레이드, 보스는 MVP 이후 별도 시스템으로 추가한다.
    this.collisionManager = new CollisionManager({
      scene: this,
      bullets: this.bullets,
      formation: this.formation,
      baseCore: this.baseCore,
      onEnemyDestroyed: () => this.handleEnemyDestroyed(),
      onBaseDamaged: () => this.handleBaseDamaged(),
    });

    this.updateHud();
  }

  // 입력, 탄환, 적 편대, 충돌을 한 프레임씩 진행한다.
  public update(time: number, delta: number): void {
    if (this.status !== 'playing') {
      return;
    }

    this.player.update(this.cursors, delta);
    this.handleShooting(time);
    this.updateBullets();
    this.formation.update(time, delta);
    this.collisionManager.update();

    if (this.status === 'playing') {
      this.checkStageClear();
    }
  }

  private handleShooting(time: number): void {
    const canFire = time - this.lastFireAt >= FIRE_COOLDOWN_MS;

    if (!canFire || !Phaser.Input.Keyboard.JustDown(this.fireKey)) {
      return;
    }

    const bullet = this.player.shoot();
    this.bullets.add(bullet);
    this.lastFireAt = time;
  }

  private updateBullets(): void {
    for (const child of this.bullets.getChildren()) {
      if (child instanceof Bullet) {
        child.update();
      }
    }
  }

  private handleEnemyDestroyed(): void {
    this.score += SCORE_PER_ENEMY;
    this.updateHud();
    this.checkStageClear();
  }

  private handleBaseDamaged(): void {
    this.cameras.main.shake(120, 0.006);
    this.updateHud();

    if (this.baseCore.getHealth() <= 0) {
      this.finish('game-over');
    }
  }

  private checkStageClear(): void {
    if (this.formation.getRemainingCount() === 0) {
      this.finish('stage-clear');
    }
  }

  private finish(nextStatus: GameStatus): void {
    if (this.status !== 'playing') {
      return;
    }

    this.status = nextStatus;
    this.player.stop();
    this.formation.stopAll();
    this.physics.pause();

    if (nextStatus === 'stage-clear') {
      this.hud.showCenterMessage('STAGE CLEAR', '#76ff99');
      return;
    }

    this.hud.showCenterMessage('GAME OVER', '#ff5c5c');
  }

  private updateHud(): void {
    this.hud.update({
      score: this.score,
      baseHp: this.baseCore?.getHealth() ?? BASE_MAX_HP,
      stage: this.stage,
    });
  }

  private createStarField(): void {
    for (let index = 0; index < 90; index += 1) {
      const x = Phaser.Math.Between(12, GAME_WIDTH - 12);
      const y = Phaser.Math.Between(54, GAME_HEIGHT - 78);
      const size = Phaser.Math.Between(1, 2);
      const alpha = Phaser.Math.FloatBetween(0.25, 0.85);

      this.add.rectangle(x, y, size, size, COLORS.star, alpha).setDepth(-1);
    }
  }
}
