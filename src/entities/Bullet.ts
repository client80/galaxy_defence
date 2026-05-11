import Phaser from 'phaser';

import { MISSILE_CONFIG } from '../utils/constants';
import type { DynamicArcadeGameObject, MissileType } from '../utils/types';

export class Bullet extends Phaser.GameObjects.Rectangle {
  private readonly speed: number;
  public readonly missileType: MissileType;

  // 선택된 미사일 타입에 따라 탄환을 생성한다.
  constructor(scene: Phaser.Scene, x: number, y: number, type: MissileType) {
    const config = MISSILE_CONFIG[type];
    super(scene, x, y, config.width, config.height, config.color, 1);

    this.missileType = type;
    this.speed = config.speed;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setStrokeStyle(1, 0xffffff, 0.9);

    const body = this.getBody();
    body.setAllowGravity(false);
    body.setSize(config.width, config.height);
    body.setVelocityY(-this.speed);
  }

  // 화면 밖으로 나간 탄환은 즉시 제거한다.
  public update(): void {
    if (this.y < -this.height) {
      this.destroy();
    }
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return (this as DynamicArcadeGameObject).body;
  }
}
