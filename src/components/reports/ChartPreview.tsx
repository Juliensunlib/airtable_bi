import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { ChartData, ChartOptions } from '../../types';

interface ChartPreviewProps {
  data: ChartData;
  type: string;
  options?: ChartOptions;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ChartPreview({ data, type, options }: ChartPreviewProps) {
  // Transform Chart.js data to Recharts format
  const transformedData = data.labels.map((label, index) => ({
    name: label,
    value: data.datasets[0]?.data[index] || 0,
    ...data.datasets.reduce((acc, dataset, datasetIndex) => ({
      ...acc,
      [`dataset_${datasetIndex}`]: dataset.data[index] || 0
    }), {})
  }));

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {options?.show_legend && <Legend />}
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {options?.show_legend && <Legend />}
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {options?.show_legend && <Legend />}
              <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={transformedData}
                cx="50%"
                cy="50%"
                innerRadius={type === 'doughnut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {transformedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              {options?.show_legend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {data.labels[0] || 'Label'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {data.datasets[0]?.label || 'Valeur'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transformedData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'kpi':
        const totalValue = transformedData.reduce((sum, item) => sum + item.value, 0);
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {totalValue.toLocaleString()}
              </div>
              <div className="text-lg text-gray-600">
                {data.datasets[0]?.label || 'Total'}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Type de graphique non supporté
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full">
      {renderChart()}
    </div>
  );
}