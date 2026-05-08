import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  RotateCcw, 
  Settings2, 
  Calculator,
  FlameKindling
} from 'lucide-react';

// --- Constants & Types ---

interface LEDPreset {
  name: string;
  color: string;
  forwardVoltage: number; // Vf (V)
  standardCurrent: number; // If (mA)
  hex: string;
  glowHex: string;
}

const LED_PRESETS: LEDPreset[] = [
  { name: 'Red', color: 'red', forwardVoltage: 2.0, standardCurrent: 20, hex: '#ef4444', glowHex: '#f87171' },
  { name: 'Green', color: 'green', forwardVoltage: 3.2, standardCurrent: 20, hex: '#22c55e', glowHex: '#4ade80' },
  { name: 'Blue', color: 'blue', forwardVoltage: 3.2, standardCurrent: 20, hex: '#3b82f6', glowHex: '#60a5fa' },
  { name: 'Yellow', color: 'yellow', forwardVoltage: 2.1, standardCurrent: 20, hex: '#eab308', glowHex: '#facc15' },
  { name: 'White', color: 'white', forwardVoltage: 3.3, standardCurrent: 20, hex: '#ffffff', glowHex: '#ffffff' },
];

const RESISTOR_COLORS = [
  { color: 'black', hex: '#000000', text: 'white' },
  { color: 'brown', hex: '#8B4513', text: 'white' },
  { color: 'red', hex: '#FF0000', text: 'white' },
  { color: 'orange', hex: '#FFA500', text: 'black' },
  { color: 'yellow', hex: '#FFFF00', text: 'black' },
  { color: 'green', hex: '#008000', text: 'white' },
  { color: 'blue', hex: '#0000FF', text: 'white' },
  { color: 'violet', hex: '#EE82EE', text: 'black' },
  { color: 'grey', hex: '#808080', text: 'white' },
  { color: 'white', hex: '#FFFFFF', text: 'black' },
];

// --- Helper Functions ---

function getResistorBands(resistance: number) {
  if (resistance <= 0) return ['black', 'black', 'black'];
  
  // Format to standard scientific notation (e.g., 220 -> 2.2 * 10^2)
  const str = resistance.toString();
  let firstDigit, secondDigit, exponent;

  if (resistance < 10) {
    firstDigit = Math.floor(resistance);
    secondDigit = Math.floor((resistance * 10) % 10);
    exponent = -1; // Silver or Gold (complex for high school simplified, let's keep it 10+ for now or clamp)
  } else {
    const magnitude = Math.floor(Math.log10(resistance));
    firstDigit = Math.floor(resistance / Math.pow(10, magnitude));
    secondDigit = Math.floor((resistance / Math.pow(10, magnitude - 1)) % 10);
    exponent = magnitude - 1;
  }

  // Clamping for safety in simplified visualizer
  const b1 = RESISTOR_COLORS[Math.min(9, Math.max(0, firstDigit))].color;
  const b2 = RESISTOR_COLORS[Math.min(9, Math.max(0, secondDigit))].color;
  const b3 = exponent >= 0 && exponent <= 9 ? RESISTOR_COLORS[exponent].color : 'gold'; // Using a fallback for 10^x
  
  return [b1, b2, b3, 'gold'];
}

// --- Components ---

const ResistorComponent = ({ resistance }: { resistance: number }) => {
  const bands = useMemo(() => getResistorBands(resistance), [resistance]);

  return (
    <div className="relative h-16 w-48 flex items-center justify-center">
      {/* Resistor Body */}
      <div className="absolute h-1 w-full bg-slate-600 rounded-full" />
      <div className="relative h-10 w-32 bg-amber-100 rounded-lg border-2 border-amber-200 overflow-hidden flex items-center justify-around px-2">
        {bands.map((band, idx) => (
          <div 
            key={idx} 
            className="w-3 h-full shadow-sm"
            style={{ 
              backgroundColor: band === 'gold' ? '#FFD700' : RESISTOR_COLORS.find(c => c.color === band)?.hex || '#8b4513'
            }}
          />
        ))}
        {/* Fill the rest with the body color */}
        <div className="absolute inset-0 pointer-events-none border-x-4 border-amber-200/50" />
      </div>
    </div>
  );
};

export default function App() {
  const [sourceVoltage, setSourceVoltage] = useState<number>(5);
  const [selectedLed, setSelectedLed] = useState<LEDPreset>(LED_PRESETS[0]);
  const [targetCurrent, setTargetCurrent] = useState<number>(20); // mA
  
  // Real-time calculation
  const resistance = useMemo(() => {
    const r = (sourceVoltage - selectedLed.forwardVoltage) / (targetCurrent / 1000);
    return Math.max(0, parseFloat(r.toFixed(1)));
  }, [sourceVoltage, selectedLed, targetCurrent]);

  // Simulation Logic
  // If user provides a specific resistor in real life, what's the actual current?
  // Here we assume the user's "Target Current" is what we are checking against ratings.
  const isOverpowered = targetCurrent > selectedLed.standardCurrent * 1.5;
  const isDanger = targetCurrent > selectedLed.standardCurrent * 2.5;

  // Visual Brightness (0 to 1)
  const brightness = useMemo(() => {
    if (sourceVoltage <= selectedLed.forwardVoltage) return 0;
    const ratio = targetCurrent / selectedLed.standardCurrent;
    return Math.min(1.5, ratio); // Cap visual brightness
  }, [targetCurrent, selectedLed, sourceVoltage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col select-none font-sans overflow-x-hidden">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">LED 저항 <span className="text-blue-400">바이브 랩</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">인터랙티브 공학 시뮬레이터 v2.4</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-blue-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> 시스템 가동 중
          </div>
          <button 
            onClick={() => { setSourceVoltage(5); setTargetCurrent(20); setSelectedLed(LED_PRESETS[0]); }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-400"
            title="초기화"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Bento Grid */}
      <main className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 min-h-[800px]">
        
        {/* Parameters Section (col-span-4 row-span-4) */}
        <section className="col-span-12 lg:col-span-4 row-span-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col gap-6 overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span> 회로 매개변수
          </h2>
          
          <div className="space-y-6">
            {/* Voltage */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <label className="text-slate-400">전원 전압 (V_src)</label>
                <span className="text-blue-400 font-bold">{sourceVoltage.toFixed(1)} V</span>
              </div>
              <input 
                type="range" min="0" max="24" step="0.1" 
                value={sourceVoltage} 
                onChange={(e) => setSourceVoltage(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* LED Selection */}
            <div className="space-y-3">
              <label className="text-xs text-slate-400 block pb-1">LED 종류 선택 (V_f: {selectedLed.forwardVoltage}V)</label>
              <div className="grid grid-cols-5 gap-2">
                {LED_PRESETS.map((led) => {
                  const labelMap: Record<string, string> = { 'Red': '빨강', 'Green': '초록', 'Blue': '파랑', 'Yellow': '노랑', 'White': '하얀' };
                  return (
                    <button
                      key={led.name}
                      onClick={() => setSelectedLed(led)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${
                        selectedLed.name === led.name 
                          ? 'border-white bg-white/5' 
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full shadow-lg" 
                        style={{ 
                          backgroundColor: led.hex,
                          boxShadow: selectedLed.name === led.name ? `0 0 10px ${led.hex}` : 'none'
                        }} 
                      />
                      <span className="text-[10px] font-bold">{labelMap[led.name] || led.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <label className="text-slate-400">목표 전류 (I_target)</label>
                <span className="text-emerald-400 font-bold">{targetCurrent} mA</span>
              </div>
              <input 
                type="range" min="1" max="100" step="1" 
                value={targetCurrent} 
                onChange={(e) => setTargetCurrent(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-auto p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest font-bold font-mono">연산 엔진 (옴의 법칙)</p>
            <p className="text-sm italic font-mono text-blue-300">R = ({sourceVoltage}V - {selectedLed.forwardVoltage}V) / {targetCurrent/1000}A</p>
            <p className="text-lg font-bold text-white mt-1">{resistance} Ω</p>
          </div>
        </section>

        {/* Main Simulator Viewport (col-span-5 row-span-4) */}
        <section className="col-span-12 lg:col-span-5 row-span-4 bg-slate-900 border border-slate-800 rounded-3xl relative flex items-center justify-center overflow-hidden group">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {/* Schematic Visual */}
          <div className="relative flex flex-col items-center">
             {/* Schematic Line Header */}
             <div className="absolute -top-16 px-4 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700 uppercase tracking-widest">
               가상 시뮬레이션 환경 활성
             </div>

             <AnimatePresence>
                {isOverpowered && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute -top-6 right-0 translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 z-50 ${
                      isDanger ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-orange-500/20 border-orange-500 text-orange-500'
                    }`}
                  >
                    {isDanger ? <FlameKindling size={12} /> : <AlertTriangle size={12} />}
                    {isDanger ? '회로 파손 위험' : '과부하 상태'}
                  </motion.div>
                )}
              </AnimatePresence>

            {/* Resistor Component */}
            <div className="mb-20 flex flex-col items-center gap-2">
               <ResistorComponent resistance={resistance} />
               <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">계산된 부하: {resistance}Ω</p>
            </div>
            
            {/* LED Visual */}
            <div className="relative flex flex-col items-center">
               {/* Internal Glow */}
               <motion.div 
                animate={{ 
                  scale: brightness * 1.5 + 1,
                  opacity: brightness * 0.4,
                  backgroundColor: selectedLed.glowHex
                }}
                className="absolute -top-12 w-32 h-32 blur-3xl rounded-full pointer-events-none"
              />

              {/* LED Head */}
              <div className="relative w-16 h-20 flex items-center justify-center">
                 <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
                    <defs>
                      <radialGradient id="ledGrad" cx="50%" cy="40%" r="50%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                        <stop offset="100%" stopColor={selectedLed.hex} />
                      </radialGradient>
                    </defs>
                    <path 
                      d="M30 40 Q30 20 50 20 Q70 20 70 40 L70 80 Q70 85 65 85 L35 85 Q30 85 30 80 Z" 
                      fill="url(#ledGrad)" 
                      className="transition-colors duration-300"
                      style={{ 
                        filter: isDanger ? 'grayscale(0.8) contrast(1.2)' : 'none',
                        boxShadow: `0 0 ${brightness * 40}px ${selectedLed.hex}`
                      }}
                    />
                    <path d="M45 50 L45 75 M55 50 L55 75" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
                 </svg>

                 {/* Smoke Effect */}
                 {isDanger && (
                    <div className="absolute -top-10 flex flex-col gap-2">
                      {[1, 2, 3].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ y: -60, opacity: 0, x: (i - 2) * 20, scale: [1, 2] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4 }}
                          className="w-4 h-4 bg-slate-600 rounded-full blur-xl"
                        />
                      ))}
                    </div>
                  )}
              </div>

               {/* LED Pins */}
               <div className="flex gap-8 -mt-2">
                 <div className="w-0.5 h-20 bg-slate-700 shadow-inner" />
                 <div className="w-0.5 h-14 bg-slate-700 shadow-inner" />
               </div>
            </div>
          </div>
        </section>

        {/* Stability Metrics (col-span-3 row-span-2) */}
        <section className="col-span-12 lg:col-span-3 row-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between overflow-hidden">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Zap size={10} className="text-blue-400" /> 안정성 지표
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-white font-mono">{resistance.toFixed(0)} <span className="text-sm font-normal text-slate-500">Ω</span></span>
              <div className="text-right">
                <p className={`text-[10px] font-bold uppercase ${isDanger ? 'text-red-500' : isOverpowered ? 'text-orange-500' : 'text-green-400'}`}>
                  {isDanger ? '위험' : isOverpowered ? '주의' : '정상'}
                </p>
                <p className="text-[10px] text-slate-500">요구 저항값</p>
              </div>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${Math.max(5, Math.min(100, (resistance / 1000) * 100))}%` }}
                className={`h-full ${isDanger ? 'bg-red-500' : 'bg-blue-500'}`} 
              />
            </div>
            <div className="grid grid-cols-2 text-[10px] font-mono text-slate-500 uppercase tracking-tight">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold">저항 전압강하</span>
                <span>{(sourceVoltage - selectedLed.forwardVoltage).toFixed(2)}V</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-slate-400 font-bold">전압 효율</span>
                <span>{((selectedLed.forwardVoltage / sourceVoltage) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Resistor Bands Breakdown (col-span-3 row-span-2) */}
        <section className="col-span-12 lg:col-span-3 row-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">저항 색띠 정보</h2>
          <div className="space-y-2.5">
            {getResistorBands(resistance).map((band, idx) => {
              const colorMap: Record<string, string> = {
                'black': '검정 (0)', 'brown': '갈색 (1)', 'red': '빨강 (2)', 'orange': '주황 (3)', 
                'yellow': '노랑 (4)', 'green': '초록 (5)', 'blue': '파랑 (6)', 'violet': '보라 (7)', 
                'grey': '회색 (8)', 'white': '하얀 (9)', 'gold': '금색 (5%)'
              };
              return (
               <div key={idx} className="flex items-center gap-3 group">
                 <div 
                   className="w-6 h-3 rounded border border-white/5 transition-transform group-hover:scale-110" 
                   style={{ backgroundColor: band === 'gold' ? '#FFD700' : RESISTOR_COLORS.find(c => c.color === band)?.hex || '#8b4513' }}
                 />
                 <div className="flex-1 text-[11px] font-mono text-slate-400">
                    <span className="opacity-50 text-[9px] mr-1 uppercase">{idx + 1}번 밴드:</span> 
                    {colorMap[band] || band}
                 </div>
               </div>
              );
            })}
          </div>
        </section>

        {/* Safety & Education (col-span-4 row-span-2) */}
        <section className={`col-span-12 lg:col-span-4 row-span-2 border transition-colors rounded-3xl p-6 flex items-center gap-6 ${
          isDanger 
            ? 'bg-red-500/10 border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]' 
            : 'bg-green-500/10 border-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]'
        }`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${
            isDanger ? 'bg-red-500/20 border-red-500/30' : 'bg-green-500/20 border-green-500/30'
          }`}>
            {isDanger ? (
              <FlameKindling className="h-8 w-8 text-red-500 animate-pulse" />
            ) : (
              <div className="p-1 px-1.5 rounded bg-green-500 shadow-lg shadow-green-900/50">
                <Zap className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-1 ${isDanger ? 'text-red-400' : 'text-green-400'}`}>
              {isDanger ? '시스템 임계치 초과' : '최적 회로 구성'}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              {isDanger 
                ? `${targetCurrent}mA의 전류는 ${selectedLed.name} LED의 정격치를 초과했습니다. 저항을 높이지 않으면 반도체 접합부가 파손될 수 있습니다.` 
                : `${selectedLed.name} LED의 허용 범위 내에서 안정적으로 작동하고 있습니다. 효율적인 전력 전달이 확인되었습니다.`}
            </p>
          </div>
        </section>

        {/* Quick Insights (col-span-8 row-span-2) */}
        <section className="col-span-12 lg:col-span-8 row-span-2 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 px-2 group">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">실시간 전력 소모율 (P)</p>
            <p className="text-xl font-mono text-white">{( (resistance * Math.pow(targetCurrent/1000, 2)) ).toFixed(3)} W</p>
            <p className="text-[10px] text-slate-600 mt-1">저항에서 열로 발산되는 에너지</p>
          </div>
          <div className="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 px-2 group">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 group-hover:text-red-400 transition-colors">순방향 전압 강하 (Vf)</p>
            <p className="text-xl font-mono text-red-400">{selectedLed.forwardVoltage.toFixed(1)} V</p>
            <p className="text-[10px] text-slate-600 mt-1">해당 LED의 반도체 물리적 고유치</p>
          </div>
          <div className="flex flex-col justify-center px-2 group">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">오믹 가이드 링크</p>
            <p className="text-xl font-mono text-blue-400">#E24 시리즈</p>
            <p className="text-[10px] text-slate-600 mt-1">가장 가까운 표준 생산 저항값</p>
          </div>
        </section>

      </main>

      {/* Footer Section */}
      <footer className="mt-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-600 gap-4">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Info size={10} /> 센서 데이터: 정상</span>
          <span>상태 코드: {isDanger ? 'ERR_OVERLOAD' : 'SYS_NOMINAL'}</span>
        </div>
        <div className="tracking-widest uppercase">
          교육용 목적 — 바이브 랩 공학 부문 생산
        </div>
      </footer>
    </div>
  );
}
