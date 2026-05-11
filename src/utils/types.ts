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
  ammo?: Record<MissileType, number>;
  currentWeapon?: MissileType;
};

export type MissileType = 'TYPE_A' | 'TYPE_B' | 'TYPE_C';
export type ItemType = 'AMMO_RELOAD' | 'POWER_BOOST' | 'REINFORCEMENT';

