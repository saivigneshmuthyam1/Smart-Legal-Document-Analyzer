import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RISK_COLORS = {
  'HIGH RISK': '#d32f2f',
  'MEDIUM RISK': '#ed6c02',
  'LOW RISK': '#2e7d32'
};

export default function DashboardAnalytics({ analyticsData }) {
  if (!analyticsData) return null;

  const { riskCounts, typeCounts, totalDocs } = analyticsData;

  const riskChartData = Object.keys(riskCounts).map(risk => ({
    name: risk,
    value: riskCounts[risk]
  })).filter(d => d.value > 0);

  const typeChartData = Object.keys(typeCounts).map(type => ({
    name: type,
    value: typeCounts[type]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  if (totalDocs === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-xl">
      {/* Risk Profile */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-xl shadow-sm">
        <h3 className="font-title-lg text-title-lg text-on-surface font-semibold mb-1">Risk Profile Overview</h3>
        <p className="text-on-surface-variant font-body-md text-sm mb-lg">Breakdown of risks across your {totalDocs} documents.</p>
        <div className="h-64 w-full flex items-center justify-center">
          {riskChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1a1a1a', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <p className="text-on-surface-variant text-sm">No risk data available.</p>
          )}
        </div>
        <div className="flex justify-center gap-md mt-4 flex-wrap">
          {riskChartData.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_COLORS[d.name] }}></span>
              {d.name} ({d.value})
            </div>
          ))}
        </div>
      </div>

      {/* Document Types */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-xl shadow-sm">
        <h3 className="font-title-lg text-title-lg text-on-surface font-semibold mb-1">Document Types</h3>
        <p className="text-on-surface-variant font-body-md text-sm mb-lg">Top categories in your library.</p>
        <div className="h-64 w-full">
          {typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#5f6368' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f3f4' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
               <p className="text-on-surface-variant text-sm">No document types found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
