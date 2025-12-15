export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum BallType {
  PLASTIC = 'PLASTIC',
  RUBBER = 'RUBBER',
  LEATHER = 'LEATHER',
  TAPE = 'TAPE'
}

export interface Vector {
  x: number;
  y: number;
}

export interface BallEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  type: BallType;
  isAirborne: boolean;
}

export interface Goal {
  x: number;
  y: number;
  width: number;
  height: number;
  moving: boolean;
  speedY: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'RICKSHAW' | 'COW' | 'FAN' | 'POLE';
  speedX: number;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  combo: number;
  stylePoints: number;
}
