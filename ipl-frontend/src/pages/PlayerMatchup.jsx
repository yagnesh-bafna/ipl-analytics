import React, { useState, useEffect, useMemo } from 'react';
import { Select, Table, Card, Badge, Descriptions, Space, Typography, Row, Col, Empty, ConfigProvider, theme } from 'antd';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Info, Zap, TrendingUp, ShieldAlert, Target, Shield, Search } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { fetchBatting, fetchBowling, fetchMatrix } from '../lib/api.js';
import { useApi } from '../hooks/useApi';

const { Title, Text } = Typography;
const { Option } = Select;

const CustomTooltip = ({ active, payload, label, pAData, pBData }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0f172a] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">{data.subject}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-bold text-gray-300">{entry.name}</span>
              </div>
              <span className="text-sm font-black text-white">
                {entry.dataKey === 'A' ? data.valA?.toFixed(2) : data.valB?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Modern Indigo & Cyan Palette
const COLORS = {
  playerA: '#4f46e5', // Indigo
  playerB: '#06b6d4', // Cyan
};

export default function PlayerMatchup() {
  const [playerA, setPlayerA] = useState(null);
  const [playerB, setPlayerB] = useState(null);

  const { data: battingData, loading: batLoading } = useApi(fetchBatting);
  const { data: bowlingData, loading: bowlLoading } = useApi(fetchBowling);
  const { data: matrixData, loading: matLoading } = useApi(fetchMatrix);

  // Consolidate Player Data with accurate role-based stats
  const allPlayers = useMemo(() => {
    if (!battingData || !bowlingData) return [];
    
    const map = new Map();

    battingData.forEach(p => {
      map.set(p.player, { 
        ...p, 
        name: p.player, 
        role: 'batting',
        dot_ball_pct: parseFloat(p.dot_ball_pct) || (100 - (p.strike_rate / 3)),
        finishing_rate: Math.min(100, (p.strike_rate / 185 * 45) + (p.avg / 55 * 55))
      });
    });

    bowlingData.forEach(p => {
      const existing = map.get(p.player);
      const bowlStats = {
        bowl_avg: parseFloat(p.avg) || 0,
        bowl_sr: parseFloat(p.strike_rate) || 0,
        wickets: parseInt(p.wickets) || 0,
        economy: parseFloat(p.economy) || 0,
        bowl_dot_pct: parseFloat(p.dot_ball_pct) || 45
      };

      if (existing) {
        map.set(p.player, { 
          ...existing, 
          ...bowlStats,
          role: 'all_rounder'
        });
      } else {
        map.set(p.player, { 
          ...p, 
          name: p.player, 
          role: 'bowling',
          ...bowlStats,
          avg: 8, 
          strike_rate: 100,
          boundary_pct: 5,
          dot_ball_pct: 40,
          finishing_rate: 20
        });
      }
    });

    matrixData?.forEach(m => {
      const p = map.get(m.player);
      if (p) {
        p.matrix_category = m.matrix_category;
        if (m.matrix_category === 'Superstar') p.finishing_rate = Math.min(100, p.finishing_rate + 5);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [battingData, bowlingData, matrixData]);

  const pAData = useMemo(() => allPlayers.find(p => p.name === playerA), [allPlayers, playerA]);
  const pBData = useMemo(() => allPlayers.find(p => p.name === playerB), [allPlayers, playerB]);

  const comparisonMode = useMemo(() => {
    if (!pAData || !pBData) return 'BATTING';
    const aIsBowler = pAData.role === 'bowling' || (pAData.role === 'all_rounder' && (pAData.wickets > 10 || pAData.matrix_category === 'Specialist Bowler'));
    const bIsBowler = pBData.role === 'bowling' || (pBData.role === 'all_rounder' && (pBData.wickets > 10 || pBData.matrix_category === 'Specialist Bowler'));
    if (aIsBowler && bIsBowler) return 'BOWLING';
    if ((aIsBowler && !bIsBowler) || (!aIsBowler && bIsBowler)) return 'IMPACT';
    return 'BATTING'; 
  }, [pAData, pBData]);

  const metrics = useMemo(() => {
    if (comparisonMode === 'BOWLING') {
      return [
        { key: 'economy', label: 'Economy', max: 12, inverse: true },
        { key: 'wickets', label: 'Wickets', max: 30 },
        { key: 'bowl_sr', label: 'Bowl SR', max: 35, inverse: true },
        { key: 'bowl_avg', label: 'Bowl Avg', max: 45, inverse: true },
        { key: 'bowl_dot_pct', label: 'Dot Ball %', max: 60 }
      ];
    }
    if (comparisonMode === 'IMPACT') {
      return [
        { key: 'strike_rate', label: 'Aggression (SR)', max: 200, crossKey: 'economy', crossMax: 12, crossInverse: true },
        { key: 'avg', label: 'Stability (Avg)', max: 60, crossKey: 'bowl_sr', crossMax: 30, crossInverse: true },
        { key: 'boundary_pct', label: 'Dominance (B%)', max: 35, crossKey: 'bowl_dot_pct', crossMax: 60 },
        { key: 'finishing_rate', label: 'Pressure (Fin)', max: 100, crossKey: 'wickets', crossMax: 30 },
        { key: 'matches', label: 'Longevity', max: 60, crossKey: 'matches', crossMax: 60 }
      ];
    }
    return [
      { key: 'strike_rate', label: 'Strike Rate', max: 200 },
      { key: 'avg', label: 'Average', max: 60 },
      { key: 'boundary_pct', label: 'Boundary %', max: 35 },
      { key: 'dot_ball_pct', label: 'Dot Ball %', max: 50, inverse: true },
      { key: 'finishing_rate', label: 'Finishing Rate', max: 100 }
    ];
  }, [comparisonMode]);

  const chartData = useMemo(() => {
    if (!pAData || !pBData) return [];
    return metrics.map(m => {
      let valAStrength, valBStrength, actualValA, actualValB;
      if (comparisonMode === 'IMPACT') {
        const isABatter = pAData.role !== 'bowling';
        actualValA = isABatter ? pAData[m.key] : pAData[m.crossKey];
        actualValB = isABatter ? pBData[m.crossKey] : pBData[m.key];

        if (isABatter) {
          valAStrength = (actualValA / m.max) * 100;
          valBStrength = m.crossInverse ? 100 - (actualValB / m.crossMax) * 100 : (actualValB / m.crossMax) * 100;
        } else {
          valAStrength = m.crossInverse ? 100 - (actualValA / m.crossMax) * 100 : (actualValA / m.crossMax) * 100;
          valBStrength = (actualValB / m.max) * 100;
        }
      } else {
        actualValA = pAData[m.key];
        actualValB = pBData[m.key];
        valAStrength = m.inverse ? 100 - (actualValA / m.max) * 100 : (actualValA / m.max) * 100;
        valBStrength = m.inverse ? 100 - (actualValB / m.max) * 100 : (actualValB / m.max) * 100;
      }
      return { 
        subject: m.label, 
        A: Math.max(5, Math.min(100, valAStrength)), 
        B: Math.max(5, Math.min(100, valBStrength)), 
        fullMark: 100,
        valA: actualValA || 0,
        valB: actualValB || 0
      };
    });
  }, [pAData, pBData, metrics, comparisonMode]);

  const tacticalInsight = useMemo(() => {
    if (!pAData || !pBData) return null;
    if (comparisonMode === 'IMPACT') {
      const batter = pAData.role !== 'bowling' ? pAData : pBData;
      const bowler = pAData.role === 'bowling' ? pAData : pBData;
      if (batter.strike_rate > 155 && bowler.economy > 8.5) return { type: 'danger', message: `Tactical Alert: ${batter.name}'s SR of ${batter.strike_rate} is optimized to exploit ${bowler.name}'s economy ceiling and containment pressure.` };
      if (bowler.bowl_sr < 20 && batter.avg < 30) return { type: 'warning', message: `Strike Threat: ${bowler.name} maintains a strike rate of ${bowler.bowl_sr}, putting ${batter.name}'s stability at significant risk.` };
    }
    if (comparisonMode === 'BOWLING') {
      const bestBowl = pAData.economy < pBData.economy ? pAData : pBData;
      return { type: 'success', message: `Economic Supremacy: ${bestBowl.name} offers superior value containment, averaging ${bestBowl.economy} runs per over in high-stakes phases.` };
    }
    if (pAData.matrix_category === 'Superstar' && pBData.matrix_category !== 'Superstar') return { type: 'success', message: `Pedigree Advantage: ${pAData.name} carries a higher pressure-rating for clutch high-stakes scenarios.` };
    return { type: 'info', message: 'Balanced Exchange: Statistically tight matchup. Individual form and gameday conditions will be the primary lever.' };
  }, [pAData, pBData, comparisonMode]);

  const columns = [
    { 
      title: 'METRIC', 
      dataIndex: 'label', 
      render: (t) => <Text className="text-gray-500 font-bold uppercase text-[12px] tracking-widest">{t}</Text> 
    },
    { 
      title: pAData?.name?.toUpperCase() || 'PLAYER A', 
      render: (_, record) => (
        <Text className={`text-[16px] font-bold ${record.A >= record.B ? 'text-indigo-400' : 'text-gray-500 opacity-60'}`}>
          {typeof record.valA === 'number' ? record.valA.toFixed(2) : record.valA}
        </Text>
      ) 
    },
    { 
      title: pBData?.name?.toUpperCase() || 'PLAYER B', 
      render: (_, record) => (
        <Text className={`text-[16px] font-bold ${record.B > record.A ? 'text-cyan-400' : 'text-gray-500 opacity-60'}`}>
          {typeof record.valB === 'number' ? record.valB.toFixed(2) : record.valB}
        </Text>
      ) 
    },
  ];

  const tableData = useMemo(() => {
    if (!pAData || !pBData) return [];
    return metrics.map(m => {
      let valA, valB, aNorm, bNorm;
      if (comparisonMode === 'IMPACT') {
        const isABatter = pAData.role !== 'bowling';
        valA = isABatter ? pAData[m.key] : pAData[m.crossKey];
        valB = isABatter ? pBData[m.crossKey] : pBData[m.key];
        if (isABatter) {
          aNorm = (valA / m.max) * 100;
          bNorm = m.crossInverse ? 100 - (valB / m.crossMax) * 100 : (valB / m.crossMax) * 100;
        } else {
          aNorm = m.crossInverse ? 100 - (valA / m.crossMax) * 100 : (valA / m.crossMax) * 100;
          bNorm = (valB / m.max) * 100;
        }
      } else {
        valA = pAData[m.key];
        valB = pBData[m.key];
        aNorm = m.inverse ? 100 - (valA / m.max) * 100 : (valA / m.max) * 100;
        bNorm = m.inverse ? 100 - (valB / m.max) * 100 : (valB / m.max) * 100;
      }
      return { label: m.label, A: aNorm, B: bNorm, valA: valA || 0, valB: valB || 0 };
    });
  }, [pAData, pBData, metrics, comparisonMode]);

  return (
    <Layout>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: COLORS.playerA,
            borderRadius: 12,
            colorBgContainer: 'rgba(15, 23, 42, 0.4)',
            colorBorder: 'rgba(255, 255, 255, 0.1)',
          },
          components: {
            Select: {
              controlHeight: 44,
              fontSize: 15,
              colorPlaceholder: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 12,
            }
          }
        }}
      >
        <style>{`
          .antd-premium-select.ant-select .ant-select-selector {
            background: rgba(15, 23, 42, 0.6) !important;
            padding-left: 44px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
          }
          
          .antd-premium-select.ant-select .ant-select-selection-placeholder {
            left: 44px !important;
            text-transform: none !important;
            letter-spacing: normal !important;
            opacity: 0.3 !important;
          }

          .antd-premium-select.ant-select .ant-select-selection-search {
            left: 44px !important;
          }

          .antd-premium-select.ant-select .ant-select-selection-item {
            left: 44px !important;
            padding-left: 0px !important;
            font-weight: 600 !important;
          }

          .premium-sync-table .ant-table { background: transparent !important; }
          .premium-sync-table .ant-table-thead > tr > th {
            background: rgba(255, 255, 255, 0.02) !important;
            color: #64748b !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            padding: 16px 24px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          }
          .premium-sync-table .ant-table-tbody > tr > td {
            padding: 20px 24px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.02) !important;
            color: rgba(255, 255, 255, 0.9) !important;
          }
          .premium-sync-table .ant-table-tbody > tr:hover > td {
            background: rgba(255, 255, 255, 0.01) !important;
          }
        `}</style>

        <div className="flex flex-col h-full p-4 sm:p-10 overflow-y-auto custom-scrollbar bg-[#020617]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
            <h1 className="text-4xl font-black text-white tracking-tight">Player Matchup</h1>
            <p className="text-sm font-medium text-gray-400 mt-2 flex items-center gap-2 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Tactical Comparison Profile
            </p>
          </motion.div>

          {/* Filters/Selection Section */}
          <motion.div
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
             className="glass-card mb-10 p-8 bg-gray-900/40 border border-white/5 shadow-2xl rounded-3xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] items-center gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-[12px] font-black uppercase tracking-widest text-gray-500">Primary Selection</span>
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 z-10 transition-all pointer-events-none" />
                  <Select
                    showSearch
                    placeholder="Search player..."
                    className="w-full antd-premium-select"
                    optionFilterProp="children"
                    onChange={setPlayerA}
                    value={playerA}
                    suffixIcon={null}
                  >
                    {allPlayers.map(p => (
                      <Option key={p.name} value={p.name}>{p.name}</Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center rotate-45 group hover:rotate-[225deg] transition-all duration-700 cursor-pointer relative shadow-indigo-500/10 shadow-2xl">
                  <div className="-rotate-45 group-hover:rotate-[-225deg] transition-all duration-700">
                     <GitCompare className="w-7 h-7 text-indigo-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-right">
                <div className="flex items-center justify-end gap-3 mb-4">
                  <span className="text-[12px] font-black uppercase tracking-widest text-gray-500">Target Comparison</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                </div>
                <div className="relative group text-left">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-cyan-400 z-10 transition-all pointer-events-none" />
                  <Select
                    showSearch
                    placeholder="Search player..."
                    className="w-full antd-premium-select"
                    optionFilterProp="children"
                    onChange={setPlayerB}
                    value={playerB}
                    suffixIcon={null}
                  >
                    {allPlayers.map(p => (
                      <Option key={p.name} value={p.name}>{p.name}</Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {(!pAData || !pBData) ? (
              <motion.div 
                key="empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} 
                className="flex-1 flex flex-col items-center justify-center bg-gray-900/10 rounded-3xl border-2 border-dashed border-white/5 min-h-[300px]"
              >
                <Empty description={<div className="flex flex-col items-center gap-2 mt-6"><Text className="text-gray-500 font-bold text-2xl tracking-widest uppercase">Visual Engine Standby</Text><Text className="text-gray-600 text-[13px] font-bold uppercase tracking-[0.2em]">Select two players to initiate tactical profiling</Text></div>} />
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-12">
                <Row gutter={[40, 40]}>
                  <Col xs={24} lg={12}>
                    <Card className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl h-full backdrop-blur-md">
                      <div className="mb-8">
                         <h4 className="text-[14px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-3">
                            <div className="w-6 h-1 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                            Performance Visualization
                         </h4>
                         <div className="mt-3">
                            <Badge status={comparisonMode === 'IMPACT' ? 'error' : 'processing'} text={`${comparisonMode} MODE ACTIVE`} className="text-[13px] font-bold text-white/60 uppercase tracking-wider" />
                         </div>
                      </div>

                      <div className="h-[400px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={400}>
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name={pAData.name} dataKey="A" stroke={COLORS.playerA} fill={COLORS.playerA} strokeWidth={3} fillOpacity={0.25} />
                            <Radar name={pBData.name} dataKey="B" stroke={COLORS.playerB} fill={COLORS.playerB} strokeWidth={3} fillOpacity={0.25} />
                            <RechartsTooltip content={<CustomTooltip pAData={pAData} pBData={pBData} />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex justify-center gap-8 mt-10">
                         <div className="flex border border-white/5 bg-white/2 px-6 py-4 rounded-2xl items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Primary Selection</span>
                              <span className="text-white font-bold text-lg tracking-tight leading-tight whitespace-nowrap">{pAData.name}</span>
                            </div>
                         </div>
                         <div className="flex border border-white/5 bg-white/2 px-6 py-4 rounded-2xl items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Target Comparison</span>
                              <span className="text-white font-bold text-lg tracking-tight leading-tight whitespace-nowrap">{pBData.name}</span>
                            </div>
                         </div>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12} className="space-y-8">
                     <motion.div 
                      className={`p-6 rounded-[2rem] border-2 backdrop-blur-2xl ${
                        tacticalInsight.type === 'danger' ? 'bg-red-500/5 border-red-500/10' :
                        tacticalInsight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10' :
                        tacticalInsight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/10' :
                        'bg-indigo-500/5 border-indigo-500/10'
                      }`}
                     >
                       <div className="flex gap-6 items-start">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xl ${
                            tacticalInsight.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            tacticalInsight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          }`}>
                            {tacticalInsight.type === 'danger' ? <ShieldAlert className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className="text-[14px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1.5 block">Tactical Engine Insight</span>
                            <p className="text-sm font-semibold text-white leading-relaxed tracking-tight">{tacticalInsight.message}</p>
                          </div>
                       </div>
                     </motion.div>
 
                     <Card className="bg-gray-900/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-white/5 bg-white/2">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-3">
                              <div className="w-6 h-1 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
                              Matchup Performance Registry
                           </h4>
                        </div>
                        <Table dataSource={tableData} columns={columns} pagination={false} rowKey="label" className="premium-sync-table" />
                      </Card>
                  </Col>
                </Row>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ConfigProvider>
    </Layout>
  );
}
