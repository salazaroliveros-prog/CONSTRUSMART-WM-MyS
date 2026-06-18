import React from 'react';

interface Props {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

const KpiCard: React.FC<Props> = ({ label, value, icon, trend, trendUp, accent = 'from-orange-500 to-amber-500' }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-3">
      <div className="text-xl font-bold text-slate-800 leading-tight truncate">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  </div>
);

export default KpiCard;
