import React, { useState, useEffect, useMemo } from 'react';
import { Select, Table, Card, Badge, Descriptions, Space, Typography, Row, Col, Empty } from 'antd';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Info, Zap, TrendingUp, ShieldAlert } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { fetchBatting, fetchBowling, fetchMatrix } from '../lib/api';
import { useApi } from '../hooks/useApi';

const { Title, Text } = Typography;
const { Option } = Select;

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

  // Consolidate Player Data
  const allPlayers = useMemo(() => {
    if (!battingData || !bowlingData) return [];
    
    const map = new Map();

    battingData.forEach(p => {
      map.set(p.player, { 
        ...p, 
        name: p.player, 
        role: 'batting',
        // Mocking missing metrics for visualization consistency
        dot_ball_pct: 100 - (p.strike_rate / 3), // Approximation
        finishing_rate: (p.avg > 35 && p.strike_rate > 140) ? 85 : 55
      });
    });

    bowlingData.forEach(p => {
      const existing = map.get(p.player);
      if (existing) {
        map.set(p.player, { ...existing, ...p, role: 'all_rounder' });
      } else {
        map.set(p.player, { 
          ...p, 
          name: p.player, 
          role: 'bowling',
          avg: p.strike_rate * 0.8, // Approximation for bowling avg
          strike_rate: (12 - p.economy) * 20, // Normalized SR for radar
          boundary_pct: p.economy * 1.5,
          dot_ball_pct: 40 + (12 - p.economy) * 5,
          finishing_rate: p.economy < 8 ? 80 : 40
        });
      }
    });

    // Enrich with matrix
    matrixData?.forEach(m => {
      const p = map.get(m.player);
      if (p) {
        p.matrix_category = m.matrix_category;
        if (m.matrix_category === 'Superstar') p.finishing_rate += 15;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [battingData, bowlingData, matrixData]);

  const pAData = useMemo(() => allPlayers.find(p => p.name === playerA), [allPlayers, playerA]);
  const pBData = useMemo(() => allPlayers.find(p => p.name === playerB), [allPlayers, playerB]);

  const chartData = useMemo(() => {
    if (!pAData || !pBData) return [];

    const metrics = [
      { key: 'strike_rate', label: 'Strike Rate', max: 200 },
      { key: 'avg', label: 'Average', max: 60 },
      { key: 'boundary_pct', label: 'Boundary %', max: 30 },
      { key: 'dot_ball_pct', label: 'Dot Ball %', max: 60 },
      { key: 'finishing_rate', label: 'Finishing Rate', max: 100 }
    ];

    return metrics.map(m => ({
      subject: m.label,
      A: Math.min(100, (pAData[m.key] / m.max) * 100),
      B: Math.min(100, (pBData[m.key] / m.max) * 100),
      fullMark: 100
    }));
  }, [pAData, pBData]);

  const tacticalInsight = useMemo(() => {
    if (!pAData || !pBData) return null;

    if (pAData.role === 'batting' && pBData.role === 'bowling') {
      if (pAData.strike_rate > 150 && pBData.economy > 9) {
        return { type: 'danger', message: `High Risk for ${pBData.name}: ${pAData.name} dominates high-economy bowlers.` };
      }
      if (pAData.strike_rate > 160) {
        return { type: 'warning', message: `Aggressive Matchup: ${pAData.name} likely to target ${pBData.name} early.` };
      }
    }

    if (pAData.matrix_category === 'Superstar' && pBData.matrix_category !== 'Superstar') {
      return { type: 'success', message: `Quality Gap: ${pAData.name} holds the tactical advantage in high-pressure slots.` };
    }

    return { type: 'info', message: 'Balanced Matchup: Expect a standard tactical exchange between these units.' };
  }, [pAData, pBData]);

  const columns = [
    { title: 'Metric', dataIndex: 'label', render: (t) => <Text strong className="text-gray-400 uppercase text-[10px] tracking-widest">{t}</Text> },
    { 
      title: pAData?.name || 'Player A', 
      render: (_, record) => (
        <Text className={record.A >= record.B ? 'text-emerald-500 font-bold' : 'text-gray-400'}>
          {record.valA.toFixed(2)}
        </Text>
      ) 
    },
    { 
      title: pBData?.name || 'Player B', 
      render: (_, record) => (
        <Text className={record.B > record.A ? 'text-emerald-500 font-bold' : 'text-gray-400'}>
          {record.valB.toFixed(2)}
        </Text>
      ) 
    },
  ];

  const tableData = [
    { label: 'Strike Rate', A: pAData?.strike_rate || 0, B: pBData?.strike_rate || 0, valA: pAData?.strike_rate || 0, valB: pBData?.strike_rate || 0 },
    { label: 'Average', A: pAData?.avg || 0, B: pBData?.avg || 0, valA: pAData?.avg || 0, valB: pBData?.avg || 0 },
    { label: 'Boundary %', A: pAData?.boundary_pct || 0, B: pBData?.boundary_pct || 0, valA: pAData?.boundary_pct || 0, valB: pBData?.boundary_pct || 0 },
    { label: 'Dot Ball %', A: pAData?.dot_ball_pct || 0, B: pBData?.dot_ball_pct || 0, valA: pAData?.dot_ball_pct || 0, valB: pBData?.dot_ball_pct || 0 },
    { label: 'Matches', A: pAData?.matches || 0, B: pBData?.matches || 0, valA: pAData?.matches || 0, valB: pBData?.matches || 0 },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-dark-950/20">
        <Header title="Player Matchup" subtitle="Compare tactical profiles and career trajectories." />

        {/* Selection UI */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-8 p-8 border-gray-200/50 dark:border-dark-700/50 shadow-xl shadow-black/5"
        >
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} lg={10}>
              <div className="flex flex-col gap-3">
                <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 opacity-80">Primary Selection</Text>
                <Select
                  showSearch
                  placeholder="Select Player A"
                  className="w-full custom-select-sync"
                  popupClassName="custom-dropdown-sync"
                  onChange={setPlayerA}
                  value={playerA}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {allPlayers.map(p => (
                    <Option key={p.name} value={p.name}>{p.name}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} lg={4} className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-800 flex items-center justify-center border border-gray-100 dark:border-dark-700 shadow-2xl rotate-45 group hover:rotate-[225deg] transition-all duration-700">
                <GitCompare className="w-6 h-6 text-gray-400 -rotate-45 group-hover:rotate-[-225deg] transition-all duration-700" />
              </div>
            </Col>
            <Col xs={24} lg={10}>
              <div className="flex flex-col gap-3 text-right lg:text-left">
                <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400 opacity-80 lg:text-right">Target Comparison</Text>
                <Select
                  showSearch
                  placeholder="Select Player B"
                  className="w-full custom-select-sync"
                  popupClassName="custom-dropdown-sync"
                  onChange={setPlayerB}
                  value={playerB}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {allPlayers.map(p => (
                    <Option key={p.name} value={p.name}>{p.name}</Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>
        </motion.div>

        {/* Comparison Content */}
        <AnimatePresence mode="wait">
          {(!pAData || !pBData) ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              className="flex-1 flex flex-col items-center justify-center bg-gray-100/30 dark:bg-dark-900/20 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-dark-800/50 min-h-[400px]"
            >
              <Empty 
                imageStyle={{ height: 120 }}
                description={
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <Text className="text-gray-400 font-bold text-lg">Visual Engine Standby</Text>
                    <Text className="text-gray-500 font-medium text-xs uppercase tracking-widest">Select two players to generate tactical profile</Text>
                  </div>
                } 
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} 
              className="space-y-8"
            >
              <Row gutter={[32, 32]}>
                {/* Radar Chart Card */}
                <Col xs={24} lg={12}>
                  <Card className="glass-card h-full border-none shadow-2xl shadow-black/5 bg-white/50 dark:bg-dark-900/40 p-2 overflow-hidden">
                    <div className="flex items-center justify-between mb-8 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-indigo-500" />
                        </div>
                        <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Tactical Profile Overlay</Text>
                      </div>
                    </div>
                    
                    <div className="h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                          <PolarGrid stroke="rgba(156, 163, 175, 0.1)" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} 
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name={pAData.name}
                            dataKey="A"
                            stroke={COLORS.playerA}
                            strokeWidth={3}
                            fill={COLORS.playerA}
                            fillOpacity={0.25}
                          />
                          <Radar
                            name={pBData.name}
                            dataKey="B"
                            stroke={COLORS.playerB}
                            strokeWidth={3}
                            fill={COLORS.playerB}
                            fillOpacity={0.25}
                          />
                          <RechartsTooltip 
                             contentStyle={{ 
                               backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                               border: '1px solid rgba(255, 255, 255, 0.1)', 
                               borderRadius: '16px', 
                               padding: '16px',
                               backdropFilter: 'blur(10px)',
                               boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                             }}
                             itemStyle={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 mb-4 px-4">
                       <div className="flex items-center gap-3 bg-white/5 dark:bg-dark-800/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-dark-700">
                         <div className="w-3 h-3 rounded-full shadow-lg shadow-indigo-500/50" style={{ backgroundColor: COLORS.playerA }} />
                         <div className="flex flex-col">
                           <Text className="text-[10px] uppercase font-black tracking-widest text-gray-400">Primary</Text>
                           <Text className="text-sm font-bold text-gray-900 dark:text-white leading-none">{pAData.name}</Text>
                         </div>
                       </div>
                       <div className="flex items-center gap-3 bg-white/5 dark:bg-dark-800/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-dark-700">
                         <div className="w-3 h-3 rounded-full shadow-lg shadow-cyan-500/50" style={{ backgroundColor: COLORS.playerB }} />
                         <div className="flex flex-col">
                           <Text className="text-[10px] uppercase font-black tracking-widest text-gray-400">Target</Text>
                           <Text className="text-sm font-bold text-gray-900 dark:text-white leading-none">{pBData.name}</Text>
                         </div>
                       </div>
                    </div>
                  </Card>
                </Col>

                {/* Info Column */}
                <Col xs={24} lg={12} className="space-y-8">
                   {/* Tactical Insight Card */}
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }}
                    className={`p-8 rounded-[2rem] border flex items-start gap-5 shadow-2xl shadow-black/5 relative overflow-hidden transition-colors duration-500 ${
                      tacticalInsight.type === 'danger' ? 'bg-red-500/5 border-red-500/20' :
                      tacticalInsight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                      tacticalInsight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      'bg-indigo-500/5 border-indigo-500/20'
                    }`}
                   >
                     {/* Glow Decoration */}
                     <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[80px] opacity-20 ${
                        tacticalInsight.type === 'danger' ? 'bg-red-500' :
                        tacticalInsight.type === 'warning' ? 'bg-amber-500' :
                        tacticalInsight.type === 'success' ? 'bg-emerald-500' :
                        'bg-indigo-500'
                     }`} />

                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-colors duration-500 ${
                        tacticalInsight.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        tacticalInsight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        tacticalInsight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                     }`}>
                       {tacticalInsight.type === 'danger' ? <ShieldAlert className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                     </div>

                     <div className="relative z-10 flex-1">
                       <Title level={5} className={`!m-0 font-black uppercase tracking-widest text-[11px] mb-2 ${
                          tacticalInsight.type === 'danger' ? 'text-red-500' :
                          tacticalInsight.type === 'warning' ? 'text-amber-500' :
                          tacticalInsight.type === 'success' ? 'text-emerald-500' :
                          'text-indigo-500'
                       }`}>Tactical Insight Engine</Title>
                       <Text className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed block">{tacticalInsight.message}</Text>
                     </div>
                   </motion.div>

                   {/* Stats Table Card */}
                   <Card className="glass-card border-none shadow-2xl shadow-black/5 p-0 overflow-hidden bg-white/50 dark:bg-dark-900/40">
                      <div className="p-8 border-b border-gray-100 dark:border-dark-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center">
                            <Info className="w-4 h-4 text-gray-400" />
                          </div>
                          <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Head-to-Head Registry</Text>
                        </div>
                      </div>
                      <Table 
                        dataSource={tableData} 
                        columns={columns} 
                        pagination={false} 
                        className="custom-antd-table-sync"
                        rowKey="label"
                        scroll={{ x: true }}
                      />
                   </Card>
                </Col>
              </Row>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        /* Sync Select Styles */
        .custom-select-sync .ant-select-selector {
          background: rgba(156, 163, 175, 0.05) !important;
          border-radius: 16px !important;
          border: 2px solid rgba(156, 163, 175, 0.1) !important;
          height: 52px !important;
          display: flex !important;
          align-items: center !important;
          font-weight: 600 !important;
          padding: 0 16px !important;
          box-shadow: none !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        
        .dark .custom-select-sync .ant-select-selector {
          background: rgba(31, 41, 55, 0.4) !important;
          border-color: rgba(75, 85, 99, 0.2) !important;
          color: #f3f4f6 !important;
        }

        .custom-select-sync.ant-select-focused .ant-select-selector {
          border-color: #4f46e5 !important;
          background: rgba(79, 70, 229, 0.05) !important;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
        }

        .custom-select-sync .ant-select-selection-placeholder {
          color: #9ca3af !important;
          font-weight: 500 !important;
        }

        /* Dropdown Styling */
        .custom-dropdown-sync {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 20px !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2) !important;
          padding: 8px !important;
          overflow: hidden !important;
        }

        .dark .custom-dropdown-sync {
          background: rgba(17, 24, 39, 0.95) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        .custom-dropdown-sync .ant-select-item {
          border-radius: 12px !important;
          margin: 2px 0 !important;
          padding: 10px 16px !important;
          font-weight: 500 !important;
          color: #4b5563 !important;
          transition: all 0.2s !important;
        }

        .dark .custom-dropdown-sync .ant-select-item {
          color: #d1d5db !important;
        }

        .custom-dropdown-sync .ant-select-item-option-active {
          background: rgba(79, 70, 229, 0.08) !important;
          color: #4f46e5 !important;
        }

        .custom-dropdown-sync .ant-select-item-option-selected {
          background: #4f46e5 !important;
          color: white !important;
        }

        /* Table Styling Sync */
        .custom-antd-table-sync .ant-table {
          background: transparent !important;
        }
        
        .custom-antd-table-sync .ant-table-thead > tr > th {
          background: rgba(156, 163, 175, 0.03) !important;
          color: #64748b !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          padding: 24px 32px !important;
          border-bottom: 2px solid rgba(156, 163, 175, 0.05) !important;
        }

        .dark .custom-antd-table-sync .ant-table-thead > tr > th {
          color: #94a3b8 !important;
          border-bottom-color: rgba(255, 255, 255, 0.05) !important;
        }
        
        .custom-antd-table-sync .ant-table-tbody > tr > td {
          padding: 24px 32px !important;
          border-bottom: 1px solid rgba(156, 163, 175, 0.05) !important;
        }

        .dark .custom-antd-table-sync .ant-table-tbody > tr > td {
          border-bottom-color: rgba(255, 255, 255, 0.03) !important;
        }

        .custom-antd-table-sync .ant-table-tbody > tr:hover > td {
          background: rgba(79, 70, 229, 0.03) !important;
        }

        .dark .custom-antd-table-sync .ant-table-tbody > tr:hover > td {
          background: rgba(79, 70, 229, 0.05) !important;
        }
      `}</style>
    </Layout>
  );
}
