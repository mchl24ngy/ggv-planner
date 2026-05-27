import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { YearlyCashflow } from '../../types';
import { useLanguage } from '../../i18n/useLanguage';

interface CashflowChartProps {
  data: YearlyCashflow[];
  selectedIndex?: number;
  onBarClick?: (index: number) => void;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({
  data,
  selectedIndex,
  onBarClick,
}) => {
  const { t } = useLanguage();
  const opacity = (idx: number) =>
    selectedIndex === undefined || idx === selectedIndex ? 1 : 0.35;

  return (
    <div className="h-[460px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          onClick={(e) => {
            if (e && e.activeTooltipIndex !== undefined && onBarClick) {
              onBarClick(e.activeTooltipIndex);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(0)} €`, name]}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />

          <Bar dataKey="totalRevenue" name={t.cashflowRevenue} fill="#22c55e" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.cashflow >= 0 ? '#22c55e' : '#ef4444'}
                fillOpacity={opacity(idx)}
              />
            ))}
          </Bar>
          <Bar dataKey="opex" name={t.cashflowOpex} stackId="costs" fill="#3b82f6">
            {data.map((_, idx) => (
              <Cell key={idx} fill="#3b82f6" fillOpacity={opacity(idx)} />
            ))}
          </Bar>
          <Bar dataKey="interestPaid" name={t.cashflowInterest} stackId="costs" fill="#64748b">
            {data.map((_, idx) => (
              <Cell key={idx} fill="#64748b" fillOpacity={opacity(idx)} />
            ))}
          </Bar>
          <Bar
            dataKey="principalPaid"
            name={t.cashflowPrincipal}
            stackId="costs"
            fill="#334155"
            radius={[4, 4, 0, 0]}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill="#334155" fillOpacity={opacity(idx)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
