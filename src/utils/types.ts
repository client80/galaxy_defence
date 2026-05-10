import type Phaser from 'phaser';

export type EnemyState = 'formation' | 'diving';

export type GameStatus = 'playing' | 'game-over' | 'stage-clear';

export type FormationDirection = -1 | 1;

export type DynamicArcadeGameObject = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body;
};

export type HudValues = {
  score: number;
  baseHp: number;
  stage: number;
};
