import Phaser from 'phaser';

import { BaseCore } from '../entities/BaseCore';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { EnemyFormation } from './EnemyFormation';
import { BASE_HIT_DAMAGE } from '../utils/constants';

type CollisionManagerConfig = {
  scene: Phaser.Scene;
  bullets: Phaser.Physics.Arcade.Group;
  formation: EnemyFormation;
  baseCore: BaseCore;
  onEnemyDestroyed: () => void;
  onBaseDamaged: () => void;
};

export class CollisionManager {
  private readonly bullets: Phaser.Physics.Arcade.Group;
  private readonly formation: EnemyFormation;
  private readonly baseCore: BaseCore;
  private readonly onEnemyDestroyed: () => void;
  private readonly onBaseDamaged: () => void;

  // 탄환-적 충돌과 적-기지 라인 접촉을 전담한다.
  constructor(config: CollisionManagerConfig) {
    this.bullets = config.bullets;
    this.formation = config.formation;
    this.baseCore = config.baseCore;
    this.onEnemyDestroyed = config.onEnemyDestroyed;
    this.onBaseDamaged = config.onBaseDamaged;

    config.scene.physics.add.overlap(this.bullets, this.formation.getGroup(), this.handleBulletEnemy);
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

    bulletObject.destroy();
    this.formation.removeEnemy(enemyObject);
    this.onEnemyDestroyed();
  };
}
