import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2, TrendingUp, Calendar, ShoppingBag, Landmark, ArrowUpRight, Award } from 'lucide-react';

interface SalesChartProps {
  orders: Order[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ orders }) => {
  const [metric, setMetric] = useState<'revenue' | 'count'>('revenue');

  // Compute stats and aggregated data for the last 7 calendar days
  const { chartData, totalPeriodRevenue, totalPeriodOrders, averageDailyRevenue, bestDay } = useMemo(() => {
    const days = [];
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Build the last 7 days array
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.getDate().toString().padStart(2, '0');
      const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const weekday = weekdays[d.getDay()];
      
      const year = d.getFullYear();
      const localDateStr = `${year}-${monthStr}-${dayStr}`; // YYYY-MM-DD
      
      days.push({
        dateStr: localDateStr,
        label: `${weekday} (${dayStr}/${monthStr})`,
        shortLabel: weekday,
        fullLabel: `${weekday} (${dayStr}/${monthStr})`,
        revenue: 0,
        count: 0,
      });
    }

    // Populate data based on orders
    orders.forEach((order) => {
      // Don't count cancelled orders
      if (order.status === 'cancelado') return;
      
      if (!order.date) return;
      const orderDate = new Date(order.date);
      if (isNaN(orderDate.getTime())) return;
      
      const year = orderDate.getFullYear();
      const monthStr = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = orderDate.getDate().toString().padStart(2, '0');
      const orderLocalDateStr = `${year}-${monthStr}-${dayStr}`;
      
      const targetDay = days.find((d) => d.dateStr === orderLocalDateStr);
      if (targetDay) {
        // We only aggregate price if the order is "pago" or "retirado", or "reservado"
        // Let's count revenue from all valid orders since "vendas" includes bookings in reservation mode too.
        targetDay.revenue += order.totalPrice;
        targetDay.count += 1;
      }
    });

    // Helper statistics
    const totalRev = days.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrd = days.reduce((sum, d) => sum + d.count, 0);
    const avgRev = totalRev / 7;
    
    // Find the day with highest revenue
    let highestRev = -1;
    let highestDay = { label: 'Nenhum', revenue: 0 };
    days.forEach((d) => {
      if (d.revenue > highestRev) {
        highestRev = d.revenue;
        highestDay = { label: d.fullLabel, revenue: d.revenue };
      }
    });

    return {
      chartData: days,
      totalPeriodRevenue: totalRev,
      totalPeriodOrders: totalOrd,
      averageDailyRevenue: avgRev,
      bestDay: highestDay,
    };
  }, [orders]);

  // Formatter for Currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div id="sales-dashboard-chart" className="w-full bg-white border border-zinc-200 rounded-xl p-5 shadow-sm text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <BarChart2 className="w-4.5 h-4.5" />
            </span>
            <h3 className="text-zinc-900 font-bold text-sm tracking-tight font-sans uppercase">
              Desempenho de Vendas
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            Métricas consolidadas de faturamento e volume das últimas 24h a 7 dias
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg self-start md:self-auto text-[10px] font-bold uppercase font-mono">
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              metric === 'revenue'
                ? 'bg-white text-red-600 shadow-sm border border-zinc-200/50'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Faturamento (R$)
          </button>
          <button
            type="button"
            onClick={() => setMetric('count')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              metric === 'count'
                ? 'bg-white text-red-600 shadow-sm border border-zinc-200/50'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Pedidos (Qtd)
          </button>
        </div>
      </div>

      {/* Grid: Stats on Left(1/3 on desktop) + Chart on Right (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Insights Column */}
        <div className="space-y-4">
          <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase font-bold block mb-1">
            Resumo do Período
          </span>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="bg-zinc-50 border border-zinc-200/60 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Total no Período</span>
                <Landmark className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <p className="text-sm font-black text-slate-900 font-mono">
                {metric === 'revenue' ? formatCurrency(totalPeriodRevenue) : `${totalPeriodOrders} pedidos`}
              </p>
              <p className="text-[8px] text-zinc-400 mt-0.5 font-sans">
                Últimos 7 dias combinados
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/60 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Média Diária</span>
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
              </div>
              <p className="text-sm font-black text-slate-900 font-mono">
                {metric === 'revenue' ? formatCurrency(averageDailyRevenue) : `${(totalPeriodOrders / 7).toFixed(1)} pedidos`}
              </p>
              <p className="text-[8px] text-zinc-400 mt-0.5 font-sans">
                Frequência média do canal
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-955 bg-black text-white p-3.5 rounded-lg border border-zinc-805 flex flex-col justify-between h-auto">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono tracking-widest text-zinc-400 uppercase font-black">
                  Recorde Semanal
                </span>
                <Award className="w-4 h-4 text-rose-500" />
              </div>
              <h4 className="text-xs font-bold text-zinc-200 mt-1">
                Dia de Maior Movimento
              </h4>
              <p className="text-lg font-black font-mono text-white tracking-tight mt-1">
                {bestDay.revenue > 0 ? formatCurrency(bestDay.revenue) : 'R$ 0,00'}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800 text-[9px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Data/Gatilho:</span>
              <span className="text-rose-400 font-bold">{bestDay.revenue > 0 ? bestDay.label : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Recharts Column */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="w-full h-[240px] mt-2 relative">
            {totalPeriodOrders === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 rounded-lg border border-dashed border-zinc-200 text-center p-4">
                <ShoppingBag className="w-6 h-6 text-zinc-300 mb-2" />
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Nenhum pedido no período</p>
                <p className="text-[9px] text-zinc-400">As vendas efetuadas aparecerão graficamente aqui.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis
                    dataKey="shortLabel"
                    tickLine={false}
                    axisLine={false}
                    stroke="#a1a1aa"
                    style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#a1a1aa"
                    style={{ fontSize: '9px', fontFamily: 'monospace' }}
                    tickFormatter={(val) => 
                      metric === 'revenue' 
                        ? val >= 1000 ? `R$ ${(val/1000).toFixed(1)}k` : `R$ ${val}`
                        : val.toString()
                    }
                  />
                  <Tooltip
                    cursor={{ fill: '#e4e4e7', opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-950 text-white p-2.5 rounded-lg border border-zinc-800 shadow-xl text-left text-[10px] font-mono leading-relaxed">
                            <p className="font-bold text-zinc-400 border-b border-zinc-800 pb-1 mb-1.5 tracking-wide uppercase text-[9px]">
                              {data.fullLabel}
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Faturamento:</span>
                              <span className="font-bold text-rose-400">{formatCurrency(data.revenue)}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Reservas:</span>
                              <span className="font-bold text-zinc-150">{data.count} un.</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={metric === 'revenue' ? 'revenue' : 'count'}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      // Highlighting the max day or current day
                      const isMax = metric === 'revenue' 
                        ? (entry.revenue > 0 && entry.revenue === bestDay.revenue)
                        : (entry.count > 0 && entry.count === Math.max(...chartData.map(d => d.count)));
                      
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isMax ? '#dc2626' : '#27272a'} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-[9px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-600 rounded-sm inline-block"></span>
              Dia de Pico
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-zinc-800 rounded-sm inline-block"></span>
              Demais Dias
            </span>
            <span className="ml-auto flex items-center gap-0.5 text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 animate-pulse" /> Sincronizado ao vivo
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
