import React, { useRef, useEffect, useState } from 'react';
import { MoreVertical, Maximize2, Download, ExternalLink, Minimize2 } from 'lucide-react';
import { Bar, Line, Pie, Doughnut, Scatter, Bubble, Radar, PolarArea } from 'react-chartjs-2';
import { Chart as ChartType } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardCardProps {
  chart: ChartType;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ chart }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatValue = (value: number, format?: string) => {
    if (!format) return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
      case 'percentage':
        return new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100);
      case 'decimal':
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(value);
      default:
        return new Intl.NumberFormat('fr-FR').format(value);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      return String(date);
    }
  };

  const formatLinkedField = (value: any): string => {
    // Handle Airtable linked records
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          // If it's a linked record object, try to get the name or display value
          return item.name || item.title || item.label || item.id || '[Enregistrement lié]';
        }
        return String(item);
      }).join(', ');
    } else if (typeof value === 'object' && value !== null) {
      // Single linked record
      return value.name || value.title || value.label || value.id || '[Enregistrement lié]';
    }
    return String(value);
  };

  const formatAttachmentField = (value: any): JSX.Element | string => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((attachment: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline flex items-center text-sm"
                title={`Ouvrir ${attachment.filename}`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {attachment.filename}
              </a>
              <span className="text-xs text-gray-500">
                ({Math.round(attachment.size / 1024)} KB)
              </span>
            </div>
          ))}
        </div>
      );
    } else if (typeof value === 'object' && value !== null && value.url) {
      return (
        <a
          href={value.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center text-sm"
          title={`Ouvrir ${value.filename}`}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          {value.filename}
        </a>
      );
    }
    return String(value);
  };

  const formatCellValue = (value: any, column: any) => {
    // Handle null or undefined values
    if (value === null || value === undefined) {
      return '';
    }

    // Handle objects (like Airtable attachments or linked records)
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // Handle arrays - could be attachments or linked records
        if (value.length > 0 && value[0].url && value[0].filename) {
          // It's an attachment array
          return formatAttachmentField(value);
        } else {
          // Handle other arrays (linked records, etc.)
          return value.map(item => {
            if (typeof item === 'object' && item !== null) {
              // Check if it's a linked record
              if (item.name || item.title || item.label) {
                return item.name || item.title || item.label;
              }
              // Fallback for other objects
              return item.id || '[Object]';
            }
            return String(item);
          }).join(', ');
        }
      } else {
        // Handle single objects
        if (value.url && value.filename) {
          // It's a single attachment
          return formatAttachmentField(value);
        } else if (value.name || value.title || value.label) {
          return value.name || value.title || value.label;
        } else {
          return value.id || '[Object]';
        }
      }
    }

    // Handle primitive values based on column type
    switch (column.type) {
      case 'number':
        return formatValue(value, column.format?.type);
      case 'date':
        return formatDate(value);
      case 'boolean':
        return value ? 'Oui' : 'Non';
      default:
        return String(value);
    }
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${chart.title.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  const handleMaximize = async () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.error('Erreur lors du passage en plein écran:', err);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const getChartOptions = () => {
    const displayOptions = chart.config.displayOptions || {};
    const axis = chart.config.axis || {};

    return {
      responsive: true,
      maintainAspectRatio: !isFullscreen,
      plugins: {
        legend: {
          display: displayOptions.showLegend !== false,
          position: 'top' as const,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              
              if (displayOptions.showPercentages) {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = (context.raw / total * 100).toFixed(1);
                return `${label}${formatValue(context.raw)} (${percentage}%)`;
              }
              
              return `${label}${formatValue(context.raw, displayOptions.valueFormat)}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: axis.xAxis?.showLabels !== false,
          title: {
            display: axis.xAxis?.showTitle,
            text: axis.xAxis?.title
          },
          ticks: {
            maxRotation: axis.xAxis?.labelRotation || 0
          },
          grid: {
            display: displayOptions.showGrid
          }
        },
        y: {
          display: axis.yAxis?.showLabels !== false,
          title: {
            display: axis.yAxis?.showTitle,
            text: axis.yAxis?.title
          },
          min: axis.yAxis?.min,
          max: axis.yAxis?.max,
          ticks: {
            stepSize: axis.yAxis?.stepSize,
            callback: (value: number) => formatValue(value, displayOptions.valueFormat)
          },
          grid: {
            display: displayOptions.showGrid
          }
        }
      }
    };
  };

  const renderChart = () => {
    if (!chart.data) return null;

    const options = getChartOptions();
    const defaultColors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#EC4899'
    ];

    switch (chart.type) {
      case 'bar':
      case 'line':
      case 'scatter':
      case 'bubble':
      case 'radar':
      case 'polar':
      case 'pie':
      case 'doughnut': {
        if (!chart.data.datasets) return null;
        
        const chartData = {
          labels: chart.data.labels,
          datasets: chart.data.datasets.map((dataset: any) => ({
            ...dataset,
            backgroundColor: chart.config.colors || defaultColors
          }))
        };

        const props = {
          ref: chartRef,
          options,
          data: chartData
        };

        switch (chart.type) {
          case 'bar':
            return <Bar {...props} />;
          case 'line':
            return <Line {...props} />;
          case 'pie':
            return <Pie {...props} />;
          case 'doughnut':
            return <Doughnut {...props} />;
          case 'scatter':
            return <Scatter {...props} />;
          case 'bubble':
            return <Bubble {...props} />;
          case 'radar':
            return <Radar {...props} />;
          case 'polar':
            return <PolarArea {...props} />;
        }
        break;
      }
      
      case 'kpi':
        return (
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">
              {formatValue(chart.data.value, chart.config.displayOptions?.valueFormat)}
            </p>
            <p className="text-sm text-gray-500 mt-2">{chart.data.label}</p>
            {chart.data.trend && (
              <p className={`text-sm mt-1 ${chart.data.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {chart.data.trend > 0 ? '↑' : '↓'} {Math.abs(chart.data.trend)}%
              </p>
            )}
          </div>
        );

      case 'table':
        // Add safety checks for table data
        if (!chart.data || !chart.data.columns || !chart.data.rows) {
          return (
            <div className="text-center text-gray-500 py-4">
              Aucune donnée disponible
            </div>
          );
        }

        return (
          <div className={`overflow-auto ${isFullscreen ? 'max-h-full' : 'max-h-64'}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {chart.data.columns.map((column: any, index: number) => (
                    <th
                      key={index}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.align ? `text-${column.align}` : ''
                      }`}
                      style={{ width: column.width }}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chart.data.rows.map((row: any, rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {chart.data.columns.map((column: any, colIndex: number) => {
                      // Add safety check for row and field existence
                      const value = row && row[column.field] !== undefined ? row[column.field] : '';
                      const formattedValue = formatCellValue(value, column);

                      return (
                        <td
                          key={colIndex}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            column.align ? `text-${column.align}` : 'text-left'
                          }`}
                        >
                          {formattedValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-white shadow rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md ${
        isFullscreen ? 'fixed inset-0 z-[100] p-8' : ''
      }`}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-800">{chart.title}</h3>
        <div className="flex space-x-1">
          <button 
            onClick={handleDownload}
            className="p-1 rounded hover:bg-gray-100 transition-colors duration-200"
            title="Télécharger"
          >
            <Download size={16} className="text-gray-500" />
          </button>
          <button 
            onClick={handleMaximize}
            className="p-1 rounded hover:bg-gray-100 transition-colors duration-200"
            title={isFullscreen ? "Quitter le plein écran" : "Agrandir"}
          >
            {isFullscreen ? (
              <Minimize2 size={16} className="text-gray-500" />
            ) : (
              <Maximize2 size={16} className="text-gray-500" />
            )}
          </button>
          <button className="p-1 rounded hover:bg-gray-100 transition-colors duration-200">
            <MoreVertical size={16} className="text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className={`p-4 ${isFullscreen ? 'h-full' : 'h-64'}`}>
        {renderChart()}
      </div>
    </div>
  );
};

export default DashboardCard;