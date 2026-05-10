import Phaser from 'phaser';

import { BULLET_HEIGHT, BULLET_SPEED, BULLET_WIDTH, COLORS } from '../utils/constants';
import type { DynamicArcadeGameObject } from '../utils/types';

export class Bullet extends Phaser.GameObjects.Rectangle {
  private readonly speed: number;

  // 플레이어가 발사하는 단순 직선 탄환을 생성한다.
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, BULLET_WIDTH, BULLET_HEIGHT, COLORS.bullet, 1);

    this.speed = BULLET_SPEED;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setStrokeStyle(1, COLORS.bulletStroke, 0.9);

    const body = this.getBody();
    body.setAllowGravity(false);
    body.setSize(BULLET_WIDTH, BULLET_HEIGHT);
    body.setVelocityY(-this.speed);
  }

  // 화면 밖으로 나간 탄환은 즉시 제거한다.
  public update(): void {
    if (this.y < -BULLET_HEIGHT) {
      this.destroy();
    }
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return (this as DynamicArcadeGameObject).body;
  }
}
