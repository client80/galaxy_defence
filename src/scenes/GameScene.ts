import Phaser from 'phaser';

import { BaseCore } from '../entities/BaseCore';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Item } from '../entities/Item';
import { Drone } from '../entities/Drone';
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
  MAX_STAGE,
  DROP_CHANCE,
  POWER_BOOST_DURATION,
  DRONE_DURATION,
} from '../utils/constants';
import type { GameStatus, ItemType } from '../utils/types';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private bullets!: Phaser.Physics.Arcade.Group;
  private defenseBlocks!: Phaser.Physics.Arcade.Group;
  private items!: Phaser.Physics.Arcade.Group;
  private formation!: EnemyFormation;
  private collisionManager!: CollisionManager;
  private baseCore!: BaseCore;
  private hud!: Hud;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private weaponKeys!: Record<string, Phaser.Input.Keyboard.Key>;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private score: number;
  private stage: number;
  private status: GameStatus;
  private lastFireAt: number;
  
  // 상태 버프
  private powerBoosted: boolean = false;
  private activeDrone: Drone | null = null;

  constructor() {
    super('GameScene');

    this.score = 0;
    this.stage = STAGE_START;
    this.status = 'playing';
    this.lastFireAt = 0;
  }

  // MVP 게임 오브젝트와 시스템을 초기화한다.
  public create(): void {
    // TODO: Cloudflare 배포 확인 후 제거 가능한 임시 로드 로그.
    console.log('[Galaxy Defence] GameScene loaded');

    this.score = 0;
    this.stage = STAGE_START;
    this.status = 'playing';
    this.lastFireAt = 0;
    this.powerBoosted = false;
    this.activeDrone = null;

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.createStarField();

    this.player = new Player(this, GAME_WIDTH / 2, PLAYER_Y);
    this.bullets = this.physics.add.group();
    this.defenseBlocks = this.physics.add.group();
    this.items = this.physics.add.group();
    this.formation = new EnemyFormation(this, this.stage);
    this.baseCore = new BaseCore(this);
    this.hud = new Hud(this);

    const keyboard = this.input.keyboard;

    if (keyboard === null) {
      throw new Error('Keyboard input is required for Galaxy Defence.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.fireKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.weaponKeys = {
      one: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      two: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      three: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    };

    // Cloudflare 배포 화면에서 Phaser 씬 시작 여부를 즉시 확인하는 임시 표시다.
    this.add
      .text(12, 52, 'Galaxy Defence MVP Loaded', {
        fontFamily: 'Consolas, ui-monospace, monospace',
        fontSize: '12px',
        color: '#7df9ff',
      })
      .setDepth(30);

    this.initCollisionManager();

    this.updateHud();
  }

  private initCollisionManager(): void {
    this.collisionManager = new CollisionManager({
      scene: this,
      player: this.player,
      bullets: this.bullets,
      defenseBlocks: this.defenseBlocks,
      items: this.items,
      formation: this.formation,
      baseCore: this.baseCore,
      isPowerBoosted: () => this.powerBoosted,
      onEnemyDestroyed: (enemy) => this.handleEnemyDestroyed(enemy),
      onBaseDamaged: () => this.handleBaseDamaged(),
      onItemCollected: (item) => this.handleItemCollected(item),
    });
  }

  // 입력, 탄환, 적 편대, 충돌을 한 프레임씩 진행한다.
  public update(time: number, delta: number): void {
    if (this.status !== 'playing') {
      return;
    }

    // 무기 변경 입력 처리
    if (Phaser.Input.Keyboard.JustDown(this.weaponKeys.one)) this.player.switchWeapon('TYPE_A');
    if (Phaser.Input.Keyboard.JustDown(this.weaponKeys.two)) this.player.switchWeapon('TYPE_B');
    if (Phaser.Input.Keyboard.JustDown(this.weaponKeys.three)) this.player.switchWeapon('TYPE_C');

    this.player.update(this.cursors, delta);
    this.handleShooting(time);
    
    if (this.activeDrone) {
      const bullet = this.activeDrone.update(time, delta);
      if (bullet) this.bullets.add(bullet);
    }

    this.updateBullets();
    this.updateItems();
    this.formation.update(time, delta);
    this.collisionManager.update();

    this.updateHud();

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
    if (bullet) {
      this.bullets.add(bullet);
      this.lastFireAt = time;
    }
  }

  private updateBullets(): void {
    for (const child of this.bullets.getChildren()) {
      if (child instanceof Bullet) {
        child.update();
      }
    }
  }

  private updateItems(): void {
    for (const child of this.items.getChildren()) {
      if (child instanceof Item) {
        child.update(GAME_HEIGHT);
      }
    }
  }

  private handleEnemyDestroyed(enemy: Enemy): void {
    this.score += SCORE_PER_ENEMY;
    
    // 아이템 드롭 확률 처리
    if (Phaser.Math.FloatBetween(0, 1) < DROP_CHANCE) {
      const itemTypes: ItemType[] = ['AMMO_RELOAD', 'POWER_BOOST', 'REINFORCEMENT'];
      const randomType = itemTypes[Phaser.Math.Between(0, itemTypes.length - 1)];
      const item = new Item(this, enemy.x, enemy.y, randomType);
      this.items.add(item);
    }

    this.updateHud();
    this.checkStageClear();
  }

  private handleItemCollected(item: Item): void {
    const type = item.itemType;
    
    if (type === 'AMMO_RELOAD') {
      this.player.reloadAmmo();
      this.hud.showCenterMessage('AMMO RELOADED!', COLORS.itemAmmo.toString(16));
      this.time.delayedCall(1000, () => this.hud.hideCenterMessage());
    } else if (type === 'POWER_BOOST') {
      this.powerBoosted = true;
      this.hud.showCenterMessage('POWER BOOST!', COLORS.itemPower.toString(16));
      this.time.delayedCall(1000, () => this.hud.hideCenterMessage());
      this.time.delayedCall(POWER_BOOST_DURATION, () => {
        this.powerBoosted = false;
      });
    } else if (type === 'REINFORCEMENT') {
      if (!this.activeDrone) {
        this.activeDrone = new Drone(this, this.player.x, this.player.y, this.player);
        this.hud.showCenterMessage('DRONE ACTIVATED!', COLORS.itemDrone.toString(16));
        this.time.delayedCall(1000, () => this.hud.hideCenterMessage());
        this.time.delayedCall(DRONE_DURATION, () => {
          if (this.activeDrone) {
            this.activeDrone.destroy();
            this.activeDrone = null;
          }
        });
      }
    }
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
      if (this.stage < MAX_STAGE) {
        // 다음 스테이지로
        this.stage++;
        this.formation = new EnemyFormation(this, this.stage);
        
        // 충돌 매니저 재설정
        this.initCollisionManager();
        
        this.hud.showCenterMessage(`STAGE ${this.stage}`, '#7df9ff');
        this.time.delayedCall(2000, () => {
          this.hud.hideCenterMessage();
        });
      } else {
        this.finish('stage-clear');
      }
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
      this.hud.showCenterMessage('STAGE CLEAR\nYOU SAVED THE GALAXY!', '#76ff99');
      return;
    }

    this.hud.showCenterMessage('GAME OVER', '#ff5c5c');
  }

  private updateHud(): void {
    this.hud.update({
      score: this.score,
      baseHp: this.baseCore?.getHealth() ?? BASE_MAX_HP,
      stage: this.stage,
      ammo: this.player.getAmmo(),
      currentWeapon: this.player.getCurrentWeapon(),
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
