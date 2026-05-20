/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Atom, 
  Settings, 
  HelpCircle, 
  Compass, 
  DraftingCompass, 
  GraduationCap, 
  Briefcase,
  PlayCircle,
  Sparkles
} from 'lucide-react';
import RollingBallCanvas from './components/RollingBallCanvas';
import TeacherGuide from './components/TeacherGuide';
import { SIMULATION_PRESETS } from './presets';
import { RailElement, SimulationConfig } from './types';

export default function App() {
  const [activePresetId, setActivePresetId] = useState<string>('preset_levers');
  
  // Elements state loaded in App and synced to Canvas
  const [elements, setElements] = useState<RailElement[]>([]);
  
  // Custom physics config state
  const [config, setConfig] = useState<SimulationConfig>({
    gravity: 9.8,
    friction: 0.1,
    elasticity: 0.55,
    speedFactor: 1.0,
    continuousSpawn: false,
    selectedBallMass: 1.0,
    selectedBallColor: '#cbd5e1' // default silver iron ball
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="main-app-container">
      {/* Blackboard-Styled Main Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-5 px-6 shadow-md select-none relative overflow-hidden" id="app-header">
        
        {/* Subtle schematic background lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-emerald-950 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <GraduationCap className="w-3 h-3" /> 중학교 기술교과수업
              </span>
              <span className="text-xs text-slate-400 font-medium font-mono">Unit: 기계요소와 운동전환 원리</span>
            </div>
            
            <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              <DraftingCompass className="w-6 h-6 text-emerald-400 animate-spin-slow" />
              롤링볼 장치 설계 & 역학 시뮬레이터
              <span className="text-xs font-normal text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded">Ver 1.2</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              가상 환경에서 직선/곡선 레일을 가공하고 가로지레, 세로지레, 중력 물레방아를 설치하여 5개 이상의 공이 부드럽게 흐르는 무한 기계장치를 디버깅해 봅시다.
            </p>
          </div>

          {/* Quick Stats Requirements Checklist Summary */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 max-w-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block w-full mb-1">💡 수행 과제 확인란 (체크리스트):</span>
            <div className="flex gap-2 text-[10px] text-slate-300">
              <span className="flex items-center gap-1 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-900 font-semibold text-indigo-300">
                ✓ 가로지레
              </span>
              <span className="flex items-center gap-1 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900 font-semibold text-blue-300">
                ✓ 세로지레
              </span>
              <span className="flex items-center gap-1 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-900 font-semibold text-purple-300">
                ✓ 물레방아
              </span>
              <span className="flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900 font-semibold text-emerald-300">
                ✓ 공 5개+
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: Workspace Left + Education Guide Right */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="app-workspace-grid">
        
        {/* Left Side: Physics Sandbox (7 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full" id="left-workspace-column">
          <div className="flex-1 flex flex-col h-full">
            <RollingBallCanvas
              presets={SIMULATION_PRESETS}
              activePresetId={activePresetId}
              onPresetChange={(id) => setActivePresetId(id)}
              elements={elements}
              setElements={setElements}
              config={config}
              setConfig={setConfig}
            />
          </div>
          
          {/* Quick learning tips beneath canvas */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 items-start shadow-sm" id="tech-tip-banner">
            <div className="bg-emerald-500 text-white rounded-lg p-1.5 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-emerald-900">기술선생님이 전하는 조언: "오류를 찾아가는 과정이 진짜 배움이란다!"</h4>
              <p className="text-[11px] text-emerald-700/90 mt-1 leading-relaxed">
                시소식 지레나 물레방아 중간에 구슬이 멈춰 선다면, <b>레일의 경사 각도(수평 slider)를 늘려주거나</b>, 구슬을 투입할 때 <b>무거운 구슬 (Brass 4.5kg)</b>을 선택해 중력 회전 모멘텀 토크를 획득해보길 권장한다!
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Teacher Guide & Classroom interactive panels (4 columns) */}
        <div className="lg:col-span-4 flex flex-col h-full" id="right-workspace-column">
          <div className="h-full">
            <TeacherGuide />
          </div>
        </div>

      </main>

      {/* Footer copyright section */}
      <footer className="mt-auto py-4 bg-slate-100 border-t border-slate-200 text-center text-slate-400 text-xs select-none">
        <p>© 2026 중학교 기술과 롤링볼 역학 설계 융합 프로젝트 가상 랩. All Rights Reserved.</p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">Built for Interactive Classroom Learning | Gravity: 9.8m/s² Standard Model</p>
      </footer>
    </div>
  );
}
