import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    light: 'from-blue-50 to-blue-100',
    text: 'text-blue-600',
    shadow: 'shadow-blue-500/20'
  },
  green: {
    bg: 'from-green-500 to-green-600',
    light: 'from-green-50 to-green-100',
    text: 'text-green-600',
    shadow: 'shadow-green-500/20'
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    light: 'from-purple-50 to-purple-100',
    text: 'text-purple-600',
    shadow: 'shadow-purple-500/20'
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    light: 'from-orange-50 to-orange-100',
    text: 'text-orange-600',
    shadow: 'shadow-orange-500/20'
  },
  red: {
    bg: 'from-red-500 to-red-600',
    light: 'from-red-50 to-red-100',
    text: 'text-red-600',
    shadow: 'shadow-red-500/20'
  },
  indigo: {
    bg: 'from-indigo-500 to-indigo-600',
    light: 'from-indigo-50 to-indigo-100',
    text: 'text-indigo-600',
    shadow: 'shadow-indigo-500/20'
  }
};

export default function StatsCard({ title, value, icon: Icon, change, color }: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl ${colors.shadow} border border-white/20`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${
                change.type === 'positive' 
                  ? 'text-green-600' 
                  : change.type === 'negative' 
                    ? 'text-red-600' 
                    : 'text-slate-500'
              }`}>
                {change.type === 'positive' ? '+' : change.type === 'negative' ? '-' : ''}
                {Math.abs(change.value)}%
              </span>
              <span className="text-xs text-slate-500">vs último mês</span>
            </div>
          )}
        </div>
        <div className={`flex items-center justify-center w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {/* Background gradient overlay */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${colors.light} rounded-full opacity-20`} />
    </div>
  );
}
