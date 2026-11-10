import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, badge }) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B7280] font-normal tracking-tight">{label}</span>
        {badge && (
          <span className="text-[11px] font-medium bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold text-[#111827] tracking-tight">{value}</div>
        {subtext && <div className="text-xs text-[#6B7280] mt-1 font-normal">{subtext}</div>}
      </div>
    </div>
  );
};
