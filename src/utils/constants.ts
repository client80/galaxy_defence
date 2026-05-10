// 게임 화면과 플레이 규칙의 기준값을 한곳에서 관리한다.
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 720;

export const STAGE_START = 1;
export const SCORE_PER_ENEMY = 100;

export const PLAYER_WIDTH = 34;
export const PLAYER_HEIGHT = 36;
export const PLAYER_SPEED = 310;
export const PLAYER_Y = GAME_HEIGHT - 92;
export const PLAYER_MARGIN = 28;

export const BULLET_WIDTH = 5;
export const BULLET_HEIGHT = 18;
export const BULLET_SPEED = 520;
export const FIRE_COOLDOWN_MS = 140;

export const ENEMY_WIDTH = 30;
export const ENEMY_HEIGHT = 26;
export const ENEMY_ROWS = 4;
export const ENEMY_COLUMNS = 8;
export const ENEMY_SPACING_X = 52;
export const ENEMY_SPACING_Y = 42;
export const ENEMY_START_Y = 106;
export const ENEMY_FORMATION_SPEED = 42;
export const ENEMY_FORMATION_PADDING = 42;
export const ENEMY_DIVE_INTERVAL_MS = 2200;
export const ENEMY_DIVE_SPEED = 210;
export const ENEMY_DIVE_DRIFT = 86;

export const BASE_MAX_HP = 5;
export const BASE_HIT_DAMAGE = 1;
export const BASE_LINE_Y = GAME_HEIGHT - 44;
export const BASE_LINE_WIDTH = GAME_WIDTH - 64;
export const BASE_LINE_HEIGHT = 8;

export const HUD_TOP = 18;
export const HUD_FONT_SIZE = 18;

export const COLORS = {
  background: 0x070b1a,
  star: 0xd9f3ff,
  player: 0x7df9ff,
  playerStroke: 0xffffff,
  bullet: 0xfff07a,
  bulletStroke: 0xffffff,
  enemy: 0xff5c8a,
  enemyStroke: 0xffb3c5,
  enemyDiving: 0xff9f43,
  baseHealthy: 0x76ff99,
  baseWarning: 0xffd166,
  baseDanger: 0xff5c5c,
} as const;
