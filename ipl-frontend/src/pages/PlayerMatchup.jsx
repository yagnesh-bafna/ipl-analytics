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
    { title: 'Metric', dataKey: 'label', render: (t) => <Text strong className="text-gray-400 uppercase text-[10px] tracking-widest">{t}</Text> },
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
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-y-auto custom-scrollbar">
        <Header title="Player Matchup" subtitle="Compare tactical profiles and career trajectories." />

        {/* Selection UI */}
        <div className="glass-card mb-8 p-6">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={10}>
              <div className="flex flex-col gap-2">
                <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Primary Selection</Text>
                <Select
                  showSearch
                  placeholder="Select Player A"
                  className="w-full custom-select"
                  onChange={setPlayerA}
                  value={playerA}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {allPlayers.map(p => (
                    <Option key={p.name} value={p.name}>{p.name}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} md={4} className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center border-4 border-white dark:border-dark-900 shadow-xl">
                <GitCompare className="w-5 h-5 text-gray-400" />
              </div>
            </Col>
            <Col xs={24} md={10}>
              <div className="flex flex-col gap-2">
                <Text className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Target Comparison</Text>
                <Select
                  showSearch
                  placeholder="Select Player B"
                  className="w-full custom-select"
                  onChange={setPlayerB}
                  value={playerB}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {allPlayers.map(p => (
                    <Option key={p.name} value={p.name}>{p.name}</Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>
        </div>

        {/* Comparison Content */}
        <AnimatePresence mode="wait">
          {(!pAData || !pBData) ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-96 flex flex-col items-center justify-center bg-gray-50/10 rounded-3xl border-2 border-dashed border-gray-200 dark:border-dark-800">
              <Empty description={<Text className="text-gray-400 font-bold">Select two players to generate visual comparison</Text>} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="space-y-8">
              
              <Row gutter={[32, 32]}>
                {/* Radar Chart */}
                <Col xs={24} lg={12}>
                  <Card className="glass-card h-full border-none shadow-none bg-gray-50/30 dark:bg-dark-900/40 p-4">
                    <div className="flex items-center gap-3 mb-8">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      <Text className="text-sm font-black uppercase tracking-widest">Tactical Profile Overlay</Text>
                    </div>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                          <PolarGrid stroke="rgba(156, 163, 175, 0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name={pAData.name}
                            dataKey="A"
                            stroke={COLORS.playerA}
                            fill={COLORS.playerA}
                            fillOpacity={0.4}
                          />
                          <Radar
                            name={pBData.name}
                            dataKey="B"
                            stroke={COLORS.playerB}
                            fill={COLORS.playerB}
                            fillOpacity={0.4}
                          />
                          <RechartsTooltip 
                             contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', padding: '12px' }}
                             itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-8 mt-4">
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.playerA }} />
                         <Text className="text-xs font-bold text-gray-500">{pAData.name}</Text>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.playerB }} />
                         <Text className="text-xs font-bold text-gray-500">{pBData.name}</Text>
                       </div>
                    </div>
                  </Card>
                </Col>

                {/* Comparison Table & Insight */}
                <Col xs={24} lg={12} className="space-y-8">
                   {/* Tactical Insight Badge */}
                   <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-6 rounded-3xl border-2 flex items-start gap-4 ${
                      tacticalInsight.type === 'danger' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                      tacticalInsight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' :
                      tacticalInsight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' :
                      'bg-indigo-500/5 border-indigo-500/20 text-indigo-500'
                    }`}
                   >
                     {tacticalInsight.type === 'danger' ? <ShieldAlert className="w-6 h-6 flex-shrink-0" /> : <Zap className="w-6 h-6 flex-shrink-0" />}
                     <div>
                       <Title level={5} className="!m-0 !text-inherit font-black uppercase tracking-tighter italic">Tactical Insight</Title>
                       <Text className="text-sm font-medium opacity-80">{tacticalInsight.message}</Text>
                     </div>
                   </motion.div>

                   {/* Stats Table */}
                   <Card className="glass-card border-none shadow-none p-0 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex items-center gap-3">
                        <Info className="w-5 h-5 text-gray-400" />
                        <Text className="text-sm font-black uppercase tracking-widest">Head-to-Head Totals</Text>
                      </div>
                      <Table 
                        dataSource={tableData} 
                        columns={columns} 
                        pagination={false} 
                        className="custom-antd-table"
                        rowKey="label"
                      />
                   </Card>
                </Col>
              </Row>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-select .ant-select-selector {
          background: rgba(156, 163, 175, 0.05) !important;
          border-radius: 12px !important;
          border: 2px solid rgba(156, 163, 175, 0.1) !important;
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
          font-weight: 700 !important;
        }
        .dark .custom-select .ant-select-selector {
          background: rgba(31, 41, 55, 0.5) !important;
          color: white !important;
        }
        .custom-antd-table .ant-table {
          background: transparent !important;
        }
        .custom-antd-table .ant-table-thead > tr > th {
          background: rgba(156, 163, 175, 0.05) !important;
          color: #9ca3af !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          border-bottom: 2px solid rgba(156, 163, 175, 0.1) !important;
        }
        .custom-antd-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(156, 163, 175, 0.05) !important;
        }
        .custom-antd-table .ant-table-tbody > tr:hover > td {
          background: rgba(79, 70, 229, 0.05) !important;
        }
      `}</style>
    </Layout>
  );
}
