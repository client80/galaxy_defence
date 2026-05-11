import Phaser from 'phaser';
import { COLORS, ITEM_SIZE, ITEM_SPEED } from '../utils/constants';
import type { DynamicArcadeGameObject, ItemType } from '../utils/types';

export class Item extends Phaser.GameObjects.Rectangle {
  public readonly itemType: ItemType;

  constructor(scene: Phaser.Scene, x: number, y: number, type: ItemType) {
    let color: number = COLORS.itemAmmo;
    if (type === 'POWER_BOOST') color = COLORS.itemPower;
    if (type === 'REINFORCEMENT') color = COLORS.itemDrone;

    super(scene, x, y, ITEM_SIZE, ITEM_SIZE, color, 1);
    this.itemType = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setStrokeStyle(1, 0xffffff, 1);
    
    // 회전 애니메이션
    scene.tweens.add({
      targets: this,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
    });

    const body = this.getBody();
    body.setAllowGravity(false);
    body.setSize(ITEM_SIZE, ITEM_SIZE);
    body.setVelocityY(ITEM_SPEED);
  }

  public update(gameHeight: number): void {
    if (this.y > gameHeight + ITEM_SIZE) {
      this.destroy();
    }
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return (this as DynamicArcadeGameObject).body;
  }
}
