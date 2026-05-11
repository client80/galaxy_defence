import Phaser from 'phaser';

import { BaseCore } from '../entities/BaseCore';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { DefenseBlock } from '../entities/DefenseBlock';
import { Player } from '../entities/Player';
import { Item } from '../entities/Item';
import { EnemyFormation } from './EnemyFormation';
import { BASE_HIT_DAMAGE } from '../utils/constants';

type CollisionManagerConfig = {
  scene: Phaser.Scene;
  player: Player;
  bullets: Phaser.Physics.Arcade.Group;
  defenseBlocks: Phaser.Physics.Arcade.Group;
  items: Phaser.Physics.Arcade.Group;
  formation: EnemyFormation;
  baseCore: BaseCore;
  isPowerBoosted: () => boolean;
  onEnemyDestroyed: (enemy: Enemy) => void;
  onBaseDamaged: () => void;
  onItemCollected: (item: Item) => void;
};

export class CollisionManager {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly bullets: Phaser.Physics.Arcade.Group;
  private readonly defenseBlocks: Phaser.Physics.Arcade.Group;
  private readonly items: Phaser.Physics.Arcade.Group;
  private readonly formation: EnemyFormation;
  private readonly baseCore: BaseCore;
  private readonly isPowerBoosted: () => boolean;
  private readonly onEnemyDestroyed: (enemy: Enemy) => void;
  private readonly onBaseDamaged: () => void;
  private readonly onItemCollected: (item: Item) => void;

  // 탄환-적, 적-기지, 적-방어블록, 플레이어-아이템 충돌을 전담한다.
  constructor(config: CollisionManagerConfig) {
    this.scene = config.scene;
    this.player = config.player;
    this.bullets = config.bullets;
    this.defenseBlocks = config.defenseBlocks;
    this.items = config.items;
    this.formation = config.formation;
    this.baseCore = config.baseCore;
    this.isPowerBoosted = config.isPowerBoosted;
    this.onEnemyDestroyed = config.onEnemyDestroyed;
    this.onBaseDamaged = config.onBaseDamaged;
    this.onItemCollected = config.onItemCollected;

    this.scene.physics.add.overlap(this.bullets, this.formation.getGroup(), this.handleBulletEnemy);
    this.scene.physics.add.overlap(this.formation.getGroup(), this.defenseBlocks, this.handleEnemyBlock);
    this.scene.physics.add.overlap(this.player, this.items, this.handlePlayerItem);
  }

  // 급강하 적이 하단 기지 라인에 닿았는지 매 프레임 확인한다.
  public update(): void {
    for (const enemy of this.formation.getDivingEnemies()) {
      if (enemy.y >= this.baseCore.getDamageLineY()) {
        this.formation.removeEnemy(enemy);
        this.baseCore.damage(BASE_HIT_DAMAGE);
        this.onBaseDamaged();
      }
    }
  }

  private readonly handleBulletEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    bulletObject,
    enemyObject,
  ) => {
    if (!(bulletObject instanceof Bullet) || !(enemyObject instanceof Enemy)) {
      return;
    }

    const hitX = enemyObject.x;
    const hitY = enemyObject.y;
    const isSpecialEnemy = enemyObject.isSpecial;

    // 무거운 블록으로만 파괴 가능한 특수 적 처리
    if (isSpecialEnemy && !bulletObject.missileType.includes('TYPE_C')) {
      // 가벼운 무기로는 파괴되지 않고 탄환만 소멸
      bulletObject.destroy();
      return;
    }

    const type = bulletObject.missileType;
    bulletObject.destroy();
    this.formation.removeEnemy(enemyObject);
    this.onEnemyDestroyed(enemyObject);

    const block = new DefenseBlock(this.scene, hitX, hitY, type, this.isPowerBoosted());
    this.defenseBlocks.add(block);
  };

  private readonly handleEnemyBlock: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    enemyObject,
    blockObject,
  ) => {
    if (!(enemyObject instanceof Enemy) || !(blockObject instanceof DefenseBlock)) {
      return;
    }

    // 급강하 중인 적만 블록과 충돌함
    if (!enemyObject.isDiving()) {
      return;
    }

    // 적 파괴, 블록 내구도 감소
    this.formation.removeEnemy(enemyObject);
    this.onEnemyDestroyed(enemyObject);
    blockObject.damage();
  };

  private readonly handlePlayerItem: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    playerObject,
    itemObject,
  ) => {
    if (!(playerObject instanceof Player) || !(itemObject instanceof Item)) {
      return;
    }

    const item = itemObject;
    item.destroy();
    this.onItemCollected(item);
  };
}
