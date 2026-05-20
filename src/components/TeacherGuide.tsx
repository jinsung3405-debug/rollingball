/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckSquare, 
  Award, 
  HelpCircle, 
  Info, 
  Sparkles, 
  FileText, 
  Download, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "롤링볼에서 지레(Lever) 장치가 한쪽으로 기울어지게 만드는 핵심적인 물리학적 물리량은 무엇인가요?",
    options: ["운동량 (Momentum)", "돌림힘 (Torque / 회전력)", "마찰력 (Friction)", "탄성력 (Elasticity)"],
    answer: 1,
    explanation: "회전축에서 힘의 작용점까지의 거리와 수직으로 가해진 힘(공의 무게)의 곱인 '돌림힘(토크)'이 작용하여 지레가 회전하게 됩니다."
  },
  {
    id: 2,
    question: "높은 곳에 있던 공이 굴러 내려와 물레방아를 돌리고 하단으로 이동합니다. 이 과정에서 일어나는 가장 주된 에너지 전환 과정은 무엇입니까?",
    options: [
      "위치에너지 → 회전 운동에너지 → 소리 에너지",
      "전기 에너지 → 화학 에너지 → 운동 에너지",
      "탄성 위치에너지 → 자기 에너지 → 열 에너지",
      "중력 위치에너지 → 물레방아의 회전 및 공의 운동에너지"
    ],
    answer: 3,
    explanation: "높은 곳의 공이 가졌던 '중력 위치에너지'가 경사면과 물레방아를 거치며 '회전 및 병진 운동에너지'로 효율적으로 전환됩니다."
  },
  {
    id: 3,
    question: "세로지레(버킷식 수직 지레)가 작동한 후 공이 빠져나가면 다시 원래 위치로 돌아오게 설계해야 합니다. 중학교 기술 수업 제작 시 어떤 방법이 가장 적절할까요?",
    options: [
      "다음 공이 밀어줄 때까지 기다린다.",
      "회전축 반대편에 적절한 '상쇄 무게(카운터웨이트)'를 달거나 복원 장치를 설계한다.",
      "마찰력을 극도로 높인다.",
      "센서와 모터를 부착해 강제 작동시킨다."
    ],
    answer: 1,
    explanation: "공이 떠난 뒤 스스로 복원되도록 회전축 건너편에 카운터웨이트(무게추)를 배치하거나 복원 스프링을 부착하는 것이 기계적 자동화의 기본입니다."
  }
];

export default function TeacherGuide() {
  const [activeTab, setActiveTab] = useState<'requirements' | 'physics' | 'quiz' | 'planner'>('requirements');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [plannerData, setPlannerData] = useState({
    studentName: '',
    studentId: '',
    projectName: '슬기로운 중력 롤링볼',
    hypothesis: '가로지레와 세로지레의 복합 토크를 조절하여 공이 연속적으로 걸림 없이 굴러가도록 설계한다.',
    materials: '우드락 5T, 글루건, 쇠구슬, 플라스틱 빨대, 아크릴 파이프, 나무 젓가락',
    troubleNotes: '물레방아 각도가 맞지 않아 공이 중간에 끼는 현상이 예상됨. 진입 경사각을 15도 이하로 완화하여 충격을 줄일 예정.'
  });

  const handleSelectAnswer = (qId: number, idx: number) => {
    if (showResults) return;
    setQuizAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.answer) score++;
    });
    return score;
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setShowResults(false);
  };

  const downloadPlanner = () => {
    const text = `
=========================================
      [중학교 기술교과] 롤링볼 제작 계획서
=========================================
학번: ${plannerData.studentId || '미입력'}
이름: ${plannerData.studentName || '미입력'}
작품명: ${plannerData.projectName}

1. 제작 설계 가설 및 목표:
   ${plannerData.hypothesis}

2. 주요 사용 재료 목록:
   ${plannerData.materials}

3. 시뮬레이션을 통해 발견한 문제점 및 해결 방안 (보완점):
   ${plannerData.troubleNotes}

-----------------------------------------
써비쌤 한마디: 시뮬레이션에서 가로지레(시소)와 물레방아가 원활히 도는지 확인하였습니다.
실제 제작 시 마찰과 관성을 감안해 여유 각도를 확보하세요! 참 잘했습니다.
=========================================
    `;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${plannerData.studentName || '학생'}_롤링볼_제작계획서.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full" id="teacher-guide-card">
      {/* Teacher Profile Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-lg select-none">
            👨‍🏫
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/50 px-2 py-0.5 rounded-full font-medium tracking-wide">👨‍🎨 기술 교과</span>
              <span className="text-xs bg-teal-500 text-white font-semibold px-2 py-0.5 rounded-full">수행평가 완벽대비</span>
            </div>
            <h3 className="font-sans font-bold text-lg tracking-tight mt-0.5">써비쌤의 롤링볼 연구실</h3>
          </div>
        </div>
        <p className="text-sm text-teal-50 ml-1 mt-3 italic leading-relaxed">
          "안녕 얘들아! 롤링볼 설계는 단순한 미술이 아니라 <b>돌림힘(토크)</b>과 <b>에너지 전환</b>을 설계하는 실전 공학이란다. 설계 규칙을 마스터하고 명품 트랙을 완성해보자!"
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 gap-1">
        <button
          id="tab-req"
          onClick={() => setActiveTab('requirements')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'requirements'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          수행 요구사항
        </button>
        <button
          id="tab-phys"
          onClick={() => setActiveTab('physics')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'physics'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          물리 매커니즘
        </button>
        <button
          id="tab-quiz"
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'quiz'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          공학 퀴즈
        </button>
        <button
          id="tab-plan"
          onClick={() => setActiveTab('planner')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'planner'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          계획서 작성
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 custom-scroll focus:outline-none">
        
        {/* Tab 1: Requirements Checklist */}
        {activeTab === 'requirements' && (
          <div className="space-y-4 animate-fadeIn" id="guide-sec-req">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-50">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-800 text-sm">롤링볼 프로젝트 설계 가이드 (상세 요구조건)</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              본 웹앱 시뮬레이션은 중학교 기술과 수행평가의 핵심 요구조건인 5대 평가 요소를 가상으로 설계하고 디버깅 가능하도록 구성되었습니다.
            </p>

            <div className="space-y-3">
              {/* Req 1 */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/40">
                <div className="flex gap-2 items-start">
                  <span className="mt-0.5 bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <div>
                    <h5 className="font-bold text-xs text-indigo-900">가로지레 (Horizontal See-saw) 필수 배치</h5>
                    <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                      공이 올라탔을 때 회전축 기준으로 우측/좌측 무게 밸런스가 흐트러져 한쪽으로 기우는 수평 시소를 1개 이상 배치해야 합니다.
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">시뮬레이터 검증 가능</span>
                  </div>
                </div>
              </div>

              {/* Req 2 */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/40">
                <div className="flex gap-2 items-start">
                  <span className="mt-0.5 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <div>
                    <h5 className="font-bold text-xs text-amber-900">세로지레 (Vertical Tilting Bucket) 필수 배치</h5>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      공이 떨어져 담기면 무거워지면서 하단으로 수직 회전 낙하하며, 공이 탈출하면 뒤쪽 카운터웨이트 추에 의해 <b>다시 복귀하는</b> 트리거 기구를 설치하세요.
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">수직 탈부착 버킷</span>
                  </div>
                </div>
              </div>

              {/* Req 3 */}
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100/40">
                <div className="flex gap-2 items-start">
                  <span className="mt-0.5 bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <div>
                    <h5 className="font-bold text-xs text-teal-900">물레방아 (Gravitational Waterwheel) 배치</h5>
                    <p className="text-[11px] text-teal-700 mt-0.5 leading-relaxed">
                      낙하하는 공이 바퀴살 모양 홈에 차례로 안착하여 중심축을 기준으로 영구 중력 회전을 유발한 후 밑으로 매끄럽게 흐르도록 설계하는 고급 메커니즘입니다.
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">6엽, 8엽 기어 세팅</span>
                  </div>
                </div>
              </div>

              {/* Req 4 */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/40">
                <div className="flex gap-2 items-start">
                  <span className="mt-0.5 bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                  <div>
                    <h5 className="font-bold text-xs text-emerald-950">공이 모이는 공간 (Final Collector Area)</h5>
                    <p className="text-[11px] text-emerald-800 mt-[1px] leading-relaxed">
                      끝까지 도달한 공들을 충격을 없애며 순서대로 안전하게 수집하고 개수를 실시간 기록 분석하는 정거장을 만들어야 합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Req 5 */}
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/40">
                <div className="flex gap-2 items-start">
                  <span className="mt-0.5 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0">5</span>
                  <div>
                    <h5 className="font-bold text-xs text-rose-900">공 5개 이상 연속 사용 물리 테스트</h5>
                    <p className="text-[11px] text-rose-700 mt-[1px] leading-relaxed">
                      단일 공의 우연성 통과가 아닌, <b>5개 이상의 구슬</b>을 투입해도 트랙에서 병목이나 정체구간 없이 정상 주기 작동하는지 지속성을 확보해야 고득점입니다!
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">다중 흐름 부하검증</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Physics Mechanisms */}
        {activeTab === 'physics' && (
          <div className="space-y-4 animate-fadeIn" id="guide-sec-phys">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-50">
              <Info className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-800 text-sm">지레 및 장치 구동의 과학적 원리</h4>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="border-l-2 border-indigo-400 pl-3 py-1">
                <h5 className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                  💡 돌림힘 (Torque)의 지배
                </h5>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  지레의 기울어짐은 단순한 무게 차이가 아닙니다. 축과의 거리(L)가 2배 길어지면 무게가 절반이어도 동일한 힘을 냅니다:
                  <code className="block bg-slate-50 border border-slate-100 p-1.5 rounded my-1 text-center font-mono text-indigo-700 font-bold">
                    T = F × d (돌림힘 = 수직 힘 × 거리)
                  </code>
                  시뮬레이터에서 공이 시소 중심을 멀어질수록 시소가 훨씬 역동적으로 기우는 이유입니다.
                </p>
              </div>

              <div className="border-l-2 border-teal-400 pl-3 py-1">
                <h5 className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                  ⚙️ 물레방아의 질량 가중 회전
                </h5>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  위에서 떨어지는 공이 비대칭적으로 우측(혹은 좌측) 버킷에 치우쳐 쌓이게 되면서 물레방아 회전축을 기준으로 시계방향 편향 돌림힘이 누적됩니다. 
                  무중력 외에 지구 중력 하에서 공의 무게가 클수록 가속도가 비례 증가하여 빠르게 탈출하게 됩니다.
                </p>
              </div>

              <div className="border-l-2 border-rose-400 pl-3 py-1">
                <h5 className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                  🌀 궤적 곡률과 마찰의 간섭
                </h5>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  레일의 경사가 너무 가파르면 속도는 늘지만 궤적 이탈(원심력 폭발) 위험이 있고, 너무 해발각도가 낮으면 표면 마찰력 때문에 구슬이 멈춰섭니다. 
                  우리가 쓰는 쇠구슬의 정상 한계 미끄럼 경사각은 대략 <b>5~10도</b> 범위이므로 적합한 완급조절이 필수입니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Quiz */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 animate-fadeIn" id="guide-sec-quiz">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-50">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-800 text-sm">써비쌤의 돌발 롤링볼 실전 퀴즈</h4>
              </div>
              <button 
                id="btn-reset-quiz"
                onClick={resetQuiz}
                className="text-[10px] flex items-center gap-1 font-semibold text-slate-400 hover:text-slate-600 transition"
              >
                <RotateCcw className="w-3 h-3" /> 다시 풀기
              </button>
            </div>

            <div className="space-y-5">
              {QUIZ_QUESTIONS.map((q, idx) => {
                const isSelected = quizAnswers[q.id] !== undefined;
                const userChoice = quizAnswers[q.id];
                const isCorrect = userChoice === q.answer;

                return (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-semibold text-xs text-slate-800 leading-normal">
                      Q{idx + 1}. {q.question}
                    </p>
                    <div className="mt-2.5 space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = "bg-white text-slate-700 hover:bg-slate-100 border-slate-200/80";
                        if (isSelected) {
                          if (optIdx === q.answer && showResults) {
                            btnStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
                          } else if (optIdx === userChoice) {
                            btnStyle = showResults 
                              ? "bg-rose-50 text-rose-800 border-rose-300"
                              : "bg-emerald-600 text-white border-emerald-600";
                          } else {
                            btnStyle = "bg-white text-slate-400 border-slate-100 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectAnswer(q.id, optIdx)}
                            disabled={showResults}
                            className={`w-full text-left p-2 rounded-lg text-xs leading-normal border transition duration-150 ${btnStyle}`}
                          >
                            <span className="font-mono font-bold mr-1">{optIdx + 1}.</span> {opt}
                          </button>
                        );
                      })}
                    </div>

                    {showResults && (
                      <div className="mt-2.5 p-2 bg-slate-100/50 rounded text-[11px] leading-relaxed text-slate-600 border-t border-slate-200/40">
                        <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isCorrect ? '✓ 정답입니다!' : '✗ 정답: ' + (q.answer + 1) + '번'}
                        </span>
                        <p className="mt-1 text-slate-500">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {!showResults ? (
                <button
                  id="btn-quiz-submit"
                  disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                  onClick={() => setShowResults(true)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/10'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> 채점해보기
                </button>
              ) : (
                <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200/50">
                  <span className="text-2xl mt-1 block">🏆</span>
                  <h4 className="font-bold text-xs text-emerald-800 mt-2">
                    {calculateScore() === QUIZ_QUESTIONS.length 
                      ? '백점만점에 백점! 기술 마스터 등급 획득!'
                      : `${QUIZ_QUESTIONS.length}문제 중 ${calculateScore()}개 통과! 조금만 더 관찰해봅시다.`
                    }
                  </h4>
                  <p className="text-[10px] text-emerald-600 mt-1">시뮬레이터에서 마우스로 자유롭게 레일을 옮기며 토크를 다시 느껴보세요.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Design Planner Report */}
        {activeTab === 'planner' && (
          <div className="space-y-4 animate-fadeIn" id="guide-sec-planner">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-50">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-800 text-sm font-sans">수행평가 롤링볼 계획 및 학습서</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              가상 시뮬레이션으로 실험설계를 보완한 내역을 적어보세요. 컴퓨터에 저장하면 수행평가 기초 보고서로 제출 가능합니다!
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Name & Stud ID */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">학반/학번</label>
                  <input
                    type="text"
                    value={plannerData.studentId}
                    onChange={e => setPlannerData(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="예: 2학년3반 17번"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">학생 이름</label>
                  <input
                    type="text"
                    value={plannerData.studentName}
                    onChange={e => setPlannerData(prev => ({ ...prev, studentName: e.target.value }))}
                    placeholder="예: 홍길동"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">나의 롤링볼 작품명</label>
                <input
                  type="text"
                  value={plannerData.projectName}
                  onChange={e => setPlannerData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-slate-800"
                />
              </div>

              {/* Hypothesis */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">기계적 작동 가설 및 역학적 목표</label>
                <textarea
                  rows={2}
                  value={plannerData.hypothesis}
                  onChange={e => setPlannerData(prev => ({ ...prev, hypothesis: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-slate-800 resize-none font-sans"
                />
              </div>

              {/* Materials */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">사용 준비물 및 가공 수단</label>
                <input
                  type="text"
                  value={plannerData.materials}
                  onChange={e => setPlannerData(prev => ({ ...prev, materials: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-slate-800"
                />
              </div>

              {/* Trouble Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">시뮬레이터 보완점 및 실험 수정 사항</label>
                <textarea
                  rows={2}
                  value={plannerData.troubleNotes}
                  onChange={e => setPlannerData(prev => ({ ...prev, troubleNotes: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-slate-800 resize-none font-sans"
                />
              </div>

              <button
                id="btn-download-plan"
                onClick={downloadPlanner}
                className="w-full py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 active:scale-95 transition flex items-center justify-center gap-1 shadow"
              >
                <Download className="w-3.5 h-3.5" /> 제작계획 보고서 저장하기 (.txt)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Warning */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex gap-2 items-center text-[10px] text-slate-400 select-none">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>실제 현물 제작 시 습도, 가공 마찰, 질량이 9.8m/s² 중력과 상호작용해 예상과 다르게 움직일 수 있습니다.</span>
      </div>
    </div>
  );
}
