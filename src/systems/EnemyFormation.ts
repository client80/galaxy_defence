import Phaser from 'phaser';

import { Enemy } from '../entities/Enemy';
import {
  ENEMY_COLUMNS,
  ENEMY_DIVE_INTERVAL_MS,
  ENEMY_FORMATION_PADDING,
  ENEMY_FORMATION_SPEED,
  ENEMY_ROWS,
  ENEMY_SPACING_X,
  ENEMY_SPACING_Y,
  ENEMY_START_Y,
  GAME_WIDTH,
} from '../utils/constants';
import type { FormationDirection } from '../utils/types';

export class EnemyFormation {
  private readonly scene: Phaser.Scene;
  private readonly group: Phaser.Physics.Arcade.Group;
  private readonly stage: number;
  private horizontalOffset: number;
  private direction: FormationDirection;
  private nextDiveAt: number;

  // 격자 편대 적들을 생성하고 편대 이동 상태를 관리한다.
  constructor(scene: Phaser.Scene, stage: number) {
    this.scene = scene;
    this.group = scene.physics.add.group();
    this.stage = stage;
    this.horizontalOffset = 0;
    this.direction = 1;
    this.nextDiveAt = ENEMY_DIVE_INTERVAL_MS;

    this.createFormation();
  }

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  public getRemainingCount(): number {
    return this.getEnemies().length;
  }

  public getDivingEnemies(): Enemy[] {
    return this.getEnemies().filter((enemy) => enemy.isDiving());
  }

  public removeEnemy(enemy: Enemy): void {
    this.group.remove(enemy, true, true);
  }

  // 편대의 좌우 이동과 주기적인 급강하 출격을 갱신한다.
  public update(time: number, delta: number): void {
    this.moveFormation(delta);
    this.launchDiverIfReady(time);

    for (const enemy of this.getEnemies()) {
      if (enemy.isInFormation()) {
        enemy.moveInFormation(this.horizontalOffset);
      } else {
        enemy.updateDive(time);
      }
    }
  }

  public stopAll(): void {
    for (const enemy of this.getEnemies()) {
      enemy.getBody().setVelocity(0, 0);
    }
  }

  private createFormation(): void {
    const totalWidth = (ENEMY_COLUMNS - 1) * ENEMY_SPACING_X;
    const startX = GAME_WIDTH / 2 - totalWidth / 2;
    let index = 0;

    for (let row = 0; row < ENEMY_ROWS; row += 1) {
      for (let column = 0; column < ENEMY_COLUMNS; column += 1) {
        const x = startX + column * ENEMY_SPACING_X;
        const y = ENEMY_START_Y + row * ENEMY_SPACING_Y;
        const enemy = new Enemy(this.scene, x, y, index);

        this.group.add(enemy);
        index += 1;
      }
    }
  }

  private moveFormation(delta: number): void {
    const formationEnemies = this.getFormationEnemies();

    if (formationEnemies.length === 0) {
      return;
    }

    const speed = ENEMY_FORMATION_SPEED + (this.stage - 1) * 6;
    this.horizontalOffset += this.direction * speed * (delta / 1000);

    const leftEdge = Math.min(...formationEnemies.map((enemy) => enemy.getHomeX())) + this.horizontalOffset;
    const rightEdge = Math.max(...formationEnemies.map((enemy) => enemy.getHomeX())) + this.horizontalOffset;

    if (rightEdge > GAME_WIDTH - ENEMY_FORMATION_PADDING) {
      this.horizontalOffset -= rightEdge - (GAME_WIDTH - ENEMY_FORMATION_PADDING);
      this.direction = -1;
    }

    if (leftEdge < ENEMY_FORMATION_PADDING) {
      this.horizontalOffset += ENEMY_FORMATION_PADDING - leftEdge;
      this.direction = 1;
    }
  }

  private launchDiverIfReady(time: number): void {
    if (time < this.nextDiveAt) {
      return;
    }

    this.nextDiveAt = time + ENEMY_DIVE_INTERVAL_MS;

    const candidates = this.getFormationEnemies();

    if (candidates.length === 0) {
      return;
    }

    const index = Phaser.Math.Between(0, candidates.length - 1);
    candidates[index].startDive();
  }

  private getFormationEnemies(): Enemy[] {
    return this.getEnemies().filter((enemy) => enemy.isInFormation());
  }

  private getEnemies(): Enemy[] {
    return this.group.getChildren().filter((child): child is Enemy => child instanceof Enemy && child.active);
  }
}
