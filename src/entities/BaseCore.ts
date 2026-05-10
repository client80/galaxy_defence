import Phaser from 'phaser';

import {
  BASE_LINE_HEIGHT,
  BASE_LINE_WIDTH,
  BASE_LINE_Y,
  BASE_MAX_HP,
  COLORS,
  GAME_WIDTH,
} from '../utils/constants';

export class BaseCore extends Phaser.GameObjects.Rectangle {
  private hp: number;

  // 방어 대상이 되는 하단 기지 라인을 생성한다.
  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, BASE_LINE_Y, BASE_LINE_WIDTH, BASE_LINE_HEIGHT, COLORS.baseHealthy, 1);

    this.hp = BASE_MAX_HP;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setOrigin(0.5, 0.5);
  }

  // 적이 기지 라인에 닿으면 체력을 깎고 색상으로 위험도를 표시한다.
  public damage(amount: number): number {
    this.hp = Math.max(0, this.hp - amount);

    const ratio = this.hp / BASE_MAX_HP;
    const color = ratio > 0.6 ? COLORS.baseHealthy : ratio > 0.25 ? COLORS.baseWarning : COLORS.baseDanger;
    this.setFillStyle(color, 1);

    return this.hp;
  }

  public getHealth(): number {
    return this.hp;
  }

  public getDamageLineY(): number {
    return BASE_LINE_Y - BASE_LINE_HEIGHT / 2;
  }
}
