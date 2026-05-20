/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RailType =
  | 'rail_straight'    // 직선 레일
  | 'rail_curve'       // 곡선 레일 (완만한 곡선)
  | 'lever_horizontal' // 가로지레 (시소 형태의 기울어지는 기구)
  | 'lever_vertical'   // 세로지레 (상하 수직으로 시소운동 및 물받이식 작용)
  | 'waterwheel'       // 물레방아 (공을 받아서 회전하며 떨어뜨리는 장치)
  | 'collector'        // 공이 모이는 장소 (누적 개수 저장)
  | 'spawner';         // 공이 들어오거나 낙하하는 진입구 (Funnel)

export interface RailElement {
  id: string;
  type: RailType;
  x: number;          // 중심 또는 시작 X
  y: number;          // 중심 또는 시작 Y
  width: number;      // 너비 또는 길이
  height: number;     // 높이 또는 곡선 깊이
  angle: number;      // 회전 각도 (라디안 또는 도 단위)
  
  // 가로/세로지레 전용 상태 변수들
  currentAngle?: number; // 현재 회전각 (시소나 가로지레가 기울어진 임시 각도)
  targetAngle?: number;  // 도달해야 할 각도
  pivotX?: number;       // 회전 축 X
  pivotY?: number;       // 회전 축 Y
  tiltState?: 'left' | 'right' | 'center' | 'up' | 'down'; // 지레 상태
  lastTriggered?: number; // 마지막 장치 작동 시간 (ms)
  
  // 물레방아 전용 상태 변수들
  wheelSpeed?: number;    // 현재 물레방아 회전 속도
  bucketCount?: number;   // 물레방아 버킷(날개) 개수 (보통 6~8개)
  ballsCaptured?: string[]; // 물레방아 안에 들어있는 공 ID 목록
  
  // 수집기 전용 상태 변수들
  ballCount?: number;     // 도착해서 쌓인 공 수
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  trail: { x: number; y: number }[];
  isCaptured: boolean;
  capturedBy: string | null;
  captureRelativeAngle?: number; // 기구와 상대적인 각도 또는 변량
  lastRailId?: string | null;   // 마지막으로 타고 있던 레일 ID
}

export interface SimulationConfig {
  gravity: number;       // 중력 가속도 (m/s^2 또는 프레임당 가속도)
  friction: number;      // 마찰 계수 (감쇠 비율)
  elasticity: number;    // 탄성 계수 (공간 충돌 시 튕김)
  speedFactor: number;   // 시뮬레이션 속도 배수 (1x, 2x 등)
  continuousSpawn: boolean; // 연속 생성 모드
  selectedBallMass: number; // 스폰할 공의 선택된 질량
  selectedBallColor: string; // 스폰할 공의 선택된 색상
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  elements: RailElement[];
}
