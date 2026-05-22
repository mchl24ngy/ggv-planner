import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyEnergyFlow } from '../../types';
import { useLanguage } from '../../i18n/useLanguage';

interface MonthlyEnergyFlowChartProps {
  data: MonthlyEnergyFlow[];
}

const MONTH_NAMES_DE = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
];
const MONTH_NAMES_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MonthlyEnergyFlowChart: React.FC<MonthlyEnergyFlowChartProps> = ({ data }) => {
  const { t, lang } = useLanguage();
  const monthNames = lang === 'de' ? MONTH_NAMES_DE : MONTH_NAMES_EN;

  // Integrate month names into the data points
  const chartData = data.map((d) => ({
    ...d,
    name: monthNames[d.month - 1],
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
            unit=" kWh"
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(0)} kWh`, name]}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />

          {/* Stacked bars for PV utilisation:
              The three segments sum to the total monthly PV yield.
              Stack order: self-consumption → battery charge → grid export */}
          <Bar
            dataKey="selfConsumptionKwh"
            name={t.monthlyFlowDirectConsumption}
            stackId="pv"
            fill="#22c55e"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="batteryChargeKwh"
            name={t.monthlyFlowBatteryCharge}
            stackId="pv"
            fill="#3b82f6"
          />
          <Bar
            dataKey="gridExportKwh"
            name={t.monthlyFlowGridExport}
            stackId="pv"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
          />

          {/* Line for grid supply: shows in which months the PV system is insufficient
              and energy must be drawn from the public grid. */}
          <Line
            dataKey="gridSupplyKwh"
            name={t.monthlyFlowGridSupply}
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
