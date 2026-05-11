import Phaser from 'phaser';

import {
  COLORS,
  ENEMY_DIVE_DRIFT,
  ENEMY_DIVE_SPEED,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
} from '../utils/constants';
import type { DynamicArcadeGameObject, EnemyState } from '../utils/types';

export class Enemy extends Phaser.GameObjects.Triangle {
  private readonly homeX: number;
  private readonly homeY: number;
  private readonly divePhase: number;
  private enemyState: EnemyState;
  public isSpecial: boolean;
  public hp: number;

  // 편대에 배치되는 적 기체를 Phaser 도형으로 만든다.
  constructor(scene: Phaser.Scene, x: number, y: number, index: number, isSpecial: boolean = false, hp: number = 1) {
    super(
      scene,
      x,
      y,
      0,
      0,
      ENEMY_WIDTH,
      0,
      ENEMY_WIDTH / 2,
      ENEMY_HEIGHT,
      isSpecial ? COLORS.specialEnemy : COLORS.enemy,
      1,
    );

    this.homeX = x;
    this.homeY = y;
    this.divePhase = index * 0.73;
    this.enemyState = 'formation';
    this.isSpecial = isSpecial;
    this.hp = hp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setStrokeStyle(2, COLORS.enemyStroke, 0.9);

    const body = this.getBody();
    body.setAllowGravity(false);
    body.setSize(ENEMY_WIDTH, ENEMY_HEIGHT);
    body.setImmovable(true);
  }

  public isInFormation(): boolean {
    return this.enemyState === 'formation';
  }

  public isDiving(): boolean {
    return this.enemyState === 'diving';
  }

  public getHomeX(): number {
    return this.homeX;
  }

  // 편대 전체 오프셋에 맞춰 적의 위치를 갱신한다.
  public moveInFormation(offsetX: number): void {
    if (!this.isInFormation()) {
      return;
    }

    this.setPosition(this.homeX + offsetX, this.homeY);
    this.rotation = 0;
    this.getBody().reset(this.x, this.y);
  }

  // 편대에서 이탈해 아래로 급강하하도록 상태를 바꾼다.
  public startDive(): void {
    if (!this.isInFormation()) {
      return;
    }

    this.enemyState = 'diving';
    this.setFillStyle(COLORS.enemyDiving, 1);
    this.getBody().setImmovable(false);
    this.getBody().setVelocity(0, ENEMY_DIVE_SPEED + (this.isSpecial ? -50 : 0)); // 특수 적은 약간 느림
  }

  // 급강하 중인 적에게 가벼운 좌우 흔들림을 준다.
  public updateDive(time: number): void {
    if (!this.isDiving()) {
      return;
    }

    const drift = Math.sin(time / 260 + this.divePhase) * ENEMY_DIVE_DRIFT;
    this.rotation = Phaser.Math.DegToRad(drift * 0.09);
    this.getBody().setVelocity(drift, this.getBody().velocity.y);
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return (this as DynamicArcadeGameObject).body;
  }
}
