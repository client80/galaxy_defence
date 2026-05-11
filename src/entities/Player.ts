import Phaser from 'phaser';

import { Bullet } from './Bullet';
import {
  COLORS,
  GAME_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_MARGIN,
  PLAYER_SPEED,
  PLAYER_WIDTH,
  MISSILE_CONFIG,
} from '../utils/constants';
import type { DynamicArcadeGameObject, MissileType } from '../utils/types';

export class Player extends Phaser.GameObjects.Triangle {
  private currentWeapon: MissileType = 'TYPE_A';
  private ammo: Record<MissileType, number>;

  // 플레이어 전투기를 Phaser 도형으로 만든다.
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(
      scene,
      x,
      y,
      0,
      PLAYER_HEIGHT,
      PLAYER_WIDTH / 2,
      0,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
      COLORS.player,
      1,
    );

    this.ammo = {
      TYPE_A: MISSILE_CONFIG.TYPE_A.maxAmmo,
      TYPE_B: MISSILE_CONFIG.TYPE_B.maxAmmo,
      TYPE_C: MISSILE_CONFIG.TYPE_C.maxAmmo,
    };

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setStrokeStyle(2, COLORS.playerStroke, 0.95);

    const body = this.getBody();
    body.setAllowGravity(false);
    body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
    body.setCollideWorldBounds(true);
  }

  // 방향키 또는 A/D 입력으로 하단 라인에서 좌우 이동한다.
  public update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number): void {
    const leftPressed = Boolean(cursors.left?.isDown);
    const rightPressed = Boolean(cursors.right?.isDown);
    const direction = Number(rightPressed) - Number(leftPressed);
    const nextX = this.x + direction * PLAYER_SPEED * (delta / 1000);

    this.x = Phaser.Math.Clamp(
      nextX,
      PLAYER_MARGIN + PLAYER_WIDTH / 2,
      GAME_WIDTH - PLAYER_MARGIN - PLAYER_WIDTH / 2,
    );

    this.getBody().reset(this.x, this.y);
  }

  public switchWeapon(type: MissileType): void {
    this.currentWeapon = type;
  }

  // 현재 전투기 위치에서 위쪽으로 나가는 탄환을 만든다.
  public shoot(): Bullet | null {
    if (this.ammo[this.currentWeapon] <= 0) {
      return null;
    }
    this.ammo[this.currentWeapon] -= 1;
    
    // 무기 타입에 맞게 색상을 잠깐 변경해주는 시각적 피드백
    this.setFillStyle(MISSILE_CONFIG[this.currentWeapon].color, 1);
    this.scene.time.delayedCall(100, () => {
      this.setFillStyle(COLORS.player, 1);
    });

    return new Bullet(this.scene, this.x, this.y - PLAYER_HEIGHT / 2 - MISSILE_CONFIG[this.currentWeapon].height / 2, this.currentWeapon);
  }

  public reloadAmmo(): void {
    this.ammo.TYPE_A = MISSILE_CONFIG.TYPE_A.maxAmmo;
    this.ammo.TYPE_B = MISSILE_CONFIG.TYPE_B.maxAmmo;
    this.ammo.TYPE_C = MISSILE_CONFIG.TYPE_C.maxAmmo;
  }

  public getAmmo(): Record<MissileType, number> {
    return { ...this.ammo };
  }

  public getCurrentWeapon(): MissileType {
    return this.currentWeapon;
  }

  public stop(): void {
    this.getBody().setVelocity(0, 0);
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return (this as DynamicArcadeGameObject).body;
  }
}
