import Phaser from 'phaser';

import { COLORS, MISSILE_CONFIG } from '../utils/constants';
import type { DynamicArcadeGameObject, MissileType } from '../utils/types';

export class DefenseBlock extends Phaser.GameObjects.Rectangle {
  private health: number;
  public readonly isHeavy: boolean;

  // 미사일 명중 시 형성되는 방어 블록
  constructor(scene: Phaser.Scene, x: number, y: number, type: MissileType, isBoosted: boolean) {
    const config = MISSILE_CONFIG[type];
    const boostMultiplier = isBoosted ? 1.5 : 1;
    const width = config.blockWidth * boostMultiplier;
    const height = config.blockHeight * boostMultiplier;
    
    let color: number = COLORS.blockB;
    if (type === 'TYPE_A') color = COLORS.blockA;
    if (type === 'TYPE_C') color = COLORS.blockC;

    super(scene, x, y, width, height, color, 0.7);

    this.health = 3;
    this.isHeavy = config.heavy;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setStrokeStyle(1, 0xffffff, 1);

    const body = this.getBody();
    body.setAllowGravity(false);
    body.setSize(width, height);
    body.setImmovable(true);
  }

  // 적과 충돌 시 내구도가 감소한다.
  public damage(): void {
    this.health -= 1;
    this.alpha = Phaser.Math.Clamp(this.health / 3, 0.2, 1);
    if (this.health <= 0) {
      this.destroy();
    }
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return (this as DynamicArcadeGameObject).body;
  }
}
