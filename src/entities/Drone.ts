import Phaser from 'phaser';
import { Bullet } from './Bullet';
import { COLORS, PLAYER_WIDTH } from '../utils/constants';
import type { DynamicArcadeGameObject } from '../utils/types';

export class Drone extends Phaser.GameObjects.Triangle {
  private targetPlayer: Phaser.GameObjects.GameObject;
  private lastFireAt: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, player: Phaser.GameObjects.GameObject) {
    super(
      scene, x, y, 0, 16, 8, 0, 16, 16, COLORS.itemDrone, 1
    );
    this.targetPlayer = player;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setStrokeStyle(1, 0xffffff, 1);

    const body = this.getBody();
    body.setAllowGravity(false);
    body.setSize(16, 16);
  }

  public update(time: number, _delta: number): Bullet | null {
    if (!this.active) return null;

    // 플레이어의 약간 오른쪽 위를 따라다님
    const px = (this.targetPlayer as any).x;
    const py = (this.targetPlayer as any).y;
    
    const targetX = px + PLAYER_WIDTH;
    const targetY = py - 10;
    
    this.x += (targetX - this.x) * 0.1;
    this.y += (targetY - this.y) * 0.1;
    this.getBody().reset(this.x, this.y);

    // 자동 사격 (TYPE_A 미사일 사용)
    if (time - this.lastFireAt > 600) {
      this.lastFireAt = time;
      return new Bullet(this.scene, this.x, this.y - 10, 'TYPE_A');
    }
    return null;
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return (this as DynamicArcadeGameObject).body;
  }
}
