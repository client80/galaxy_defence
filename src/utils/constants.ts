// 게임 화면과 플레이 규칙의 기준값을 한곳에서 관리한다.
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 720;

export const STAGE_START = 1;
export const MAX_STAGE = 5;
export const SCORE_PER_ENEMY = 100;

// 나중에 교체하기 쉬운 이미지 경로 변수 (현재는 도형으로 그려지거나 없는 경우 폴백됨)
export const ASSETS = {
  background: 'background.png',
  player: 'player.png',
  enemy: 'enemy.png',
  specialEnemy: 'special_enemy.png',
  deathStar: 'deathstar.png',
};

export const PLAYER_WIDTH = 34;
export const PLAYER_HEIGHT = 36;
export const PLAYER_SPEED = 310;
export const PLAYER_Y = GAME_HEIGHT - 92;
export const PLAYER_MARGIN = 28;

// 미사일 및 방어 블록 시스템
export const FIRE_COOLDOWN_MS = 140;

export const MISSILE_CONFIG = {
  TYPE_A: {
    width: 4,
    height: 18,
    speed: 580,
    color: 0x7df9ff,
    maxAmmo: 30, // 잔여 개수
    blockWidth: 10, // 좁고 높은 방어 블록
    blockHeight: 60,
    heavy: false,
  },
  TYPE_B: {
    width: 6,
    height: 14,
    speed: 480,
    color: 0xfff07a,
    maxAmmo: 20,
    blockWidth: 30, // 중간 크기 블록
    blockHeight: 30,
    heavy: false,
  },
  TYPE_C: {
    width: 12,
    height: 10,
    speed: 380,
    color: 0xff5c8a,
    maxAmmo: 10,
    blockWidth: 60, // 짧고 넓은 방어 블록
    blockHeight: 15,
    heavy: true, // 특수 적을 부술 수 있음
  },
};

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

// 아이템 설정
export const ITEM_SIZE = 16;
export const ITEM_SPEED = 100;
export const DROP_CHANCE = 0.15; // 15% 확률로 아이템 드롭
export const POWER_BOOST_DURATION = 10000; // 10초
export const DRONE_DURATION = 15000; // 15초

export const COLORS = {
  background: 0x070b1a,
  star: 0xd9f3ff,
  player: 0x7df9ff,
  playerStroke: 0xffffff,
  bullet: 0xfff07a,
  bulletStroke: 0xffffff,
  enemy: 0xff5c8a,
  enemyStroke: 0xffb3c5,
  specialEnemy: 0x9b59b6, // 특수 적 (무거운 블록으로만 파괴 가능)
  enemyDiving: 0xff9f43,
  baseHealthy: 0x76ff99,
  baseWarning: 0xffd166,
  baseDanger: 0xff5c5c,
  blockA: 0x7df9ff,
  blockB: 0xfff07a,
  blockC: 0xff5c8a,
  itemAmmo: 0x00ff00,
  itemPower: 0xff00ff,
  itemDrone: 0x00ffff,
} as const;
