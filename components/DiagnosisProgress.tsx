'use client';

interface DiagnosisProgressProps {
  stage: number;
}

const stages = [
  { label: 'Preprocessing log', icon: '🧹' },
  { label: 'Extracting fingerprint', icon: '🔍' },
  { label: 'Analyzing with AI', icon: '🤖' },
  { label: 'Parsing results', icon: '📊' },
  { label: 'Generating recommendations', icon: '💡' }
];

export default function DiagnosisProgress({ stage }: DiagnosisProgressProps) {
  return (
    <div className="space-y-4">
      {stages.map((item, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${i < stage ? 'bg-green-500 text-white scale-110' : i === stage ? 'bg-blue-500 text-white animate-pulse scale-110' : 'bg-gray-200 text-gray-400'}`}>
            {i < stage ? '✓' : item.icon}
          </div>
          <span className={`font-medium transition-all duration-300 ${i <= stage ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
