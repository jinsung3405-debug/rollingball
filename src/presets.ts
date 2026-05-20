/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Preset } from './types';

export const SIMULATION_PRESETS: Preset[] = [
  {
    id: 'preset_levers',
    name: '지레 원리 탐구 복합 코스',
    description: '가로지레(시소)와 임시 버킷식 세로지레의 원리를 함께 이해할 수 있도록 설계된 기초 학습용 코스입니다. 공이 지나가며 지레를 기울여 길을 열어줍니다.',
    elements: [
      // Spawner (시작 깔때기)
      { id: 'spawner_1', type: 'spawner', x: 120, y: 70, width: 60, height: 40, angle: 0 },
      
      // Rail 1 (우측 경사)
      { id: 'rail_1', type: 'rail_straight', x: 260, y: 150, width: 280, height: 10, angle: 18 },
      
      // Lever Horizontal 1 (가로 지레 - 시소)
      // 중간에서 공을 받아 반대로 쏠리며 떨어뜨림
      { id: 'lever_h1', type: 'lever_horizontal', x: 380, y: 240, width: 220, height: 15, angle: -8, currentAngle: -8, targetAngle: -8, pivotX: 380, pivotY: 240, tiltState: 'left' },
      
      // Rail 2 (좌측 경사)
      { id: 'rail_2', type: 'rail_straight', x: 180, y: 310, width: 200, height: 10, angle: -15 },
      
      // Lever Vertical 1 (세로 지레 - 낙하 버킷)
      { id: 'lever_v1', type: 'lever_vertical', x: 120, y: 410, width: 80, height: 100, angle: 0, currentAngle: 0, targetAngle: 0, pivotX: 100, pivotY: 440, tiltState: 'up' },
      
      // Rail 3 (최종 우측 슬라이드)
      { id: 'rail_3', type: 'rail_straight', x: 340, y: 480, width: 340, height: 10, angle: 12 },
      
      // Collector (우측 하단 수집함)
      { id: 'collector_1', type: 'collector', x: 620, y: 530, width: 140, height: 70, angle: 0, ballCount: 0 }
    ]
  },
  {
    id: 'preset_waterwheel',
    name: '회전하는 물레방아 기어 코스',
    description: '높은 위치에서 굴러 떨어진 공이 물레방아의 날개에 올라타, 공의 무게지탱 원리로 중력 회전을 일으키는 위치에너지 변환 시뮬레이션 코스입니다.',
    elements: [
      // Spawner
      { id: 'spawner_1', type: 'spawner', x: 180, y: 60, width: 60, height: 40, angle: 0 },
      
      // Rail 1 (Steep)
      { id: 'rail_1', type: 'rail_straight', x: 280, y: 130, width: 200, height: 10, angle: 25 },
      
      // Rail 2 (Curve slide - leading into wheel)
      { id: 'curve_1', type: 'rail_curve', x: 420, y: 190, width: 140, height: 60, angle: 10 },
      
      // Waterwheel (물레방아)
      // 우측 상단에 배치, 떨어지는 공을 받아 회전
      { id: 'wheel_1', type: 'waterwheel', x: 550, y: 280, width: 150, height: 150, angle: 0, wheelSpeed: 0, bucketCount: 8, ballsCaptured: [] },
      
      // Lower Rail (받침 레일)
      // 물레방아 밑에서 떨어지는 공을 받아서 좌측으로 유도
      { id: 'rail_2', type: 'rail_straight', x: 380, y: 440, width: 320, height: 10, angle: -15 },
      
      // Curve Lead to Collector
      { id: 'curve_2', type: 'rail_curve', x: 190, y: 490, width: 120, height: 50, angle: -20 },
      
      // Collector (좌측 하단 수집함)
      { id: 'collector_1', type: 'collector', x: 130, y: 530, width: 120, height: 60, angle: 0, ballCount: 0 }
    ]
  },
  {
    id: 'preset_complex',
    name: '써비쌤 추천 종합 롤링볼 메커니즘',
    description: '곡선 슬라이드, 양방향 시소 가로지레, 중력 물레방아, 상하 왕복 세로지레를 입체적으로 결합해 5개 이상의 공을 무한 재생형태로 순환 시뮬레이션할 수 있는 완벽한 설계도입니다.',
    elements: [
      // 1. Spawner
      { id: 'spawner_1', type: 'spawner', x: 150, y: 60, width: 60, height: 40, angle: 0 },
      
      // 2. High ramp
      { id: 'rail_h1', type: 'rail_straight', x: 270, y: 110, width: 200, height: 10, angle: 20 },
      
      // 3. Loop Curve
      { id: 'rail_hc', type: 'rail_curve', x: 400, y: 170, width: 150, height: 60, angle: 45 },
      
      // 4. See-saw horizontal
      { id: 'lever_h1', type: 'lever_horizontal', x: 480, y: 270, width: 200, height: 15, angle: -10, currentAngle: -10, targetAngle: -10, pivotX: 480, pivotY: 270, tiltState: 'left' },
      
      // 5. Waterwheel side capture
      { id: 'wheel_1', type: 'waterwheel', x: 650, y: 350, width: 140, height: 140, angle: 0, wheelSpeed: 0, bucketCount: 6, ballsCaptured: [] },
      
      // 6. Under-wheel slide
      { id: 'rail_under', type: 'rail_straight', x: 440, y: 440, width: 330, height: 10, angle: -10 },
      
      // 7. Left Vertical tilt bucket
      { id: 'lever_v1', type: 'lever_vertical', x: 230, y: 465, width: 70, height: 90, angle: 0, currentAngle: 0, targetAngle: 0, pivotX: 230, pivotY: 490, tiltState: 'up' },
      
      // 8. Collector
      { id: 'collector_1', type: 'collector', x: 140, y: 530, width: 130, height: 60, angle: 0, ballCount: 0 },
      
      // Side Funnel structure to make loop interesting
      { id: 'rail_v_slide', type: 'rail_straight', x: 140, y: 330, width: 160, height: 10, angle: 25 },
      { id: 'lever_h2', type: 'lever_horizontal', x: 260, y: 380, width: 140, height: 15, angle: -5, currentAngle: -5, targetAngle: -5, pivotX: 260, pivotY: 380, tiltState: 'left' }
    ]
  }
];
