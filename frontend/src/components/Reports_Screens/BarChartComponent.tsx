import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { BASE_URL } from '../../services/service';

Chart.register(...registerables);

interface BillData {
  id: number;
  bill_number: number;
  user_id: number;
  name: string;
  price: string;
  image: string;
  category: string;
  available: boolean;
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface PaymentData {
  id: number;
  bill_number: number;
  user_id: number;
  method: string;
  amount: string;
}

interface ApiResponse {
  items: BillData[];
  payments: PaymentData[];
}

type ViewType = 'daily' | 'weekly' | 'monthly';

const BarChartComponent: React.FC = () => {
  const [view, setView] = useState<ViewType>('daily');
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barChartRef = useRef<Chart | null>(null);
  const pieChartRef = useRef<Chart | null>(null);
  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pieCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const formatIndianRupees = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User ID not found');
        }

        const response = await fetch(`${BASE_URL}/api/bills/activebills?userId=${userId}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        setApiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const processBarChartData = () => {
    if (!apiData) return { labels: [], data: [], trends: [] };

    const currentDate = new Date();
    // Set the time to the end of the day to include today's data
    currentDate.setHours(23, 59, 59, 999);
    const result = { labels: [], data: [], trends: [] };

    const calculateTotal = (startDate: Date, endDate: Date): number => {
      return apiData.payments
        .filter((payment) => {
          const billItem = apiData.items.find((item) => item.bill_number === payment.bill_number);
          if (!billItem) return false;
          const paymentDate = new Date(billItem.created_at);
          return paymentDate >= startDate && paymentDate <= endDate; // Changed to include end date
        })
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    };

    switch (view) {
      case 'daily': {
        for (let i = 9; i >= 0; i--) {
          const date = new Date(currentDate);
          date.setHours(0, 0, 0, 0); // Start of day
          date.setDate(date.getDate() - i);
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999); // End of day

          result.labels.push(
            date.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })
          );
          result.data.push(calculateTotal(date, endDate));
        }
        break;
      }
      case 'weekly': {
        for (let i = 9; i >= 0; i--) {
          const startOfWeek = new Date(currentDate);
          
          // Set the start date to Monday of the current week
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Get the previous Monday
          startOfWeek.setDate(startOfWeek.getDate() - i * 7); // Subtract weeks accordingly
          startOfWeek.setHours(0, 0, 0, 0); // Set to start of day (00:00:00)
      
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday of the current week
          endOfWeek.setHours(23, 59, 59, 999); // Set to end of day (23:59:59)
      
          result.labels.push(
            ` ${startOfWeek.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })} - ${endOfWeek.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })}`
          );
          result.data.push(calculateTotal(startOfWeek, endOfWeek));
        }
        break;
      }
      
      case 'monthly': {
        for (let i = 11; i >= 0; i--) {
          const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);

          result.labels.push(
            startDate.toLocaleDateString('en-IN', {
              month: 'short',
              year: '2-digit',
            })
          );
          result.data.push(calculateTotal(startDate, endDate));
        }
        break;
      }
    }

    for (let i = 1; i < result.data.length; i++) {
      const prevValue = result.data[i - 1];
      const currentValue = result.data[i];
      const percentageChange = prevValue !== 0
        ? ((currentValue - prevValue) / prevValue) * 100
        : 0;
      result.trends.push(percentageChange);
    }
    result.trends.unshift(0);

    return result;
  };

  const processPieChartData = () => {
    if (!apiData) return { labels: [], data: [] };

    const itemTotals = new Map<string, { amount: number; quantity: number }>();
   
    apiData.items.forEach(item => {
      const amount = parseFloat(item.price) * item.quantity;
      const existingItem = itemTotals.get(item.name);
     
      if (existingItem) {
        itemTotals.set(item.name, {
          amount: existingItem.amount + amount,
          quantity: existingItem.quantity + item.quantity
        });
      } else {
        itemTotals.set(item.name, { amount, quantity: item.quantity });
      }
    });

    const sortedItems = Array.from(itemTotals.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 5);

    const totalAmount = Array.from(itemTotals.values())
      .reduce((sum, { amount }) => sum + amount, 0);
   
    return {
      labels: sortedItems.map(([name, data]) =>
        `${name} (${data.quantity} units)`
      ),
      data: sortedItems.map(([, data]) =>
        (data.amount / totalAmount) * 100
      )
    };
  };

  const generateBarChartConfig = (chartData: { labels: string[]; data: number[]; trends: number[] }): ChartConfiguration => {
    const ctx = barCanvasRef.current?.getContext('2d');
    const gradients = chartData.data.map((_, i) => {
      if (!ctx) return 'rgba(54, 162, 235, 0.7)';
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      const colors = [
        { start: '#3B82F6', end: '#1D4ED8' },
        { start: '#EF4444', end: '#B91C1C' },
        { start: '#10B981', end: '#047857' },
        { start: '#F59E0B', end: '#B45309' },
        { start: '#8B5CF6', end: '#5B21B6' },
      ];
      const colorSet = colors[i % colors.length];
      gradient.addColorStop(0, colorSet.start);
      gradient.addColorStop(1, colorSet.end);
      return gradient;
    });

    return {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: `${view.charAt(0).toUpperCase() + view.slice(1)} Sales`,
            data: chartData.data,
            backgroundColor: gradients,
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            type: 'line',
            label: 'Trend',
            data: chartData.data,
            borderColor: '#6366F1',
            borderWidth: 2,
            pointBackgroundColor: '#4F46E5',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.4,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart',
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
            },
            ticks: {
              callback: (value) => formatIndianRupees(Number(value)),
              padding: 10,
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              padding: 10,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: `${view.toUpperCase()} SALES REPORT`,
            font: { size: 16, weight: 'bold' },
            padding: { top: 20, bottom: 20 },
            color: '#1F2937',
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1F2937',
            titleFont: { size: 13, weight: 'bold' },
            bodyColor: '#4B5563',
            bodyFont: { size: 12 },
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const datasetLabel = context.dataset.label || '';
                const trend = chartData.trends[context.dataIndex];
               
                if (context.datasetIndex === 0) {
                  const trendIndicator = trend > 0 ? '▲' : trend < 0 ? '▼' : '■';
                  const trendColor = trend > 0 ? '🟢' : trend < 0 ? '🔴' : '⚪';
                  return [
                    `${datasetLabel}: ${formatIndianRupees(value)}`,
                    `Change: ${trendIndicator} ${trend.toFixed(1)}% ${trendColor}`,
                  ];
                }
                return `${datasetLabel}: ${formatIndianRupees(value)}`;
              },
            },
          },
        },
      },
    };
  };

  const generatePieChartConfig = (chartData: { labels: string[]; data: number[] }): ChartConfiguration => {
    return {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: 'white',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Top 5 Items by Sales',
            font: { size: 16, weight: 'bold' },
            padding: { top: 20, bottom: 20 },
            color: '#1F2937',
          },
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 12 },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels?.length && data.datasets.length) {
                  return data.labels.map((label, i) => ({
                    text: `${label}: ${data.datasets[0].data[i].toFixed(1)}%`,
                    fillStyle: data.datasets[0].backgroundColor?.[i] as string,
                    hidden: false,
                    lineCap: undefined,
                    lineDash: undefined,
                    lineDashOffset: undefined,
                    lineJoin: undefined,
                    lineWidth: undefined,
                    strokeStyle: undefined,
                    pointStyle: 'circle',
                    rotation: undefined,
                  }));
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1F2937',
            titleFont: { size: 13, weight: 'bold' },
            bodyColor: '#4B5563',
            bodyFont: { size: 12 },
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const label = context.label || '';
                return `${label}: ${value.toFixed(1)}% of total sales`;
              }
            }
          }
        }
      }
    };
  };

  useEffect(() => {
    if (barChartRef.current) {
      barChartRef.current.destroy();
    }
    if (pieChartRef.current) {
      pieChartRef.current.destroy();
    }

    if (barCanvasRef.current && pieCanvasRef.current && apiData) {
      const barChartData = processBarChartData();
      const pieChartData = processPieChartData();
     
      const barConfig = generateBarChartConfig(barChartData);
      const pieConfig = generatePieChartConfig(pieChartData);
     
      barChartRef.current = new Chart(barCanvasRef.current, barConfig);
      pieChartRef.current = new Chart(pieCanvasRef.current, pieConfig);
    }

    return () => {
      if (barChartRef.current) {
        barChartRef.current.destroy();
      }
      if (pieChartRef.current) {
        pieChartRef.current.destroy();
      }
    };
  }, [view, apiData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-[300px] w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-red-600 flex flex-col items-center">
          <span className="text-4xl mb-2">⚠️</span>
          <p className="font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex gap-4 mb-6 justify-center">
          {(['daily', 'weekly', 'monthly'] as ViewType[]).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-6 py-2 rounded-md transition-all duration-200 font-medium transform hover:scale-105 ${
                view === viewType
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          <div className="h-[400px] w-full p-4 flex-1 border-2 border-gray-200 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl">
            <canvas ref={barCanvasRef} className="w-full h-full" />
          </div>
          <div className="h-[400px] w-full p-4 flex-1 border-2 border-gray-200 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl">
            <canvas ref={pieCanvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChartComponent;