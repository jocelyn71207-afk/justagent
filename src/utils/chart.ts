import type { ChartConfiguration } from 'chart.js'
import type { SourceChart } from '@/types/AiViewer'

// TODO... 顏色色碼還要等設計師提供
const COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7'
]

function buildDatasets(values: SourceChart['data']['values'] | undefined, chartType: string) {
  if (!values || values.length === 0) {
    return []
  }

  let colorIndex = 0
  const isArc = chartType === 'pie' || chartType === 'doughnut'

  return values.flatMap(group =>
    Object.entries(group).map(([label, data]) => {
      const color = COLORS[colorIndex++ % COLORS.length]

      return {
        label,
        data,
        backgroundColor: isArc
          ? data.map((_, i) => COLORS[i % COLORS.length])
          : chartType === 'line'
            ? `${color}33`
            : color,
        borderColor: isArc ? '#ffffff' : color,
        borderWidth: 2,
        fill: chartType === 'line',
        tension: chartType === 'line' ? 0.3 : undefined
      }
    })
  )
}

export function chartAdapter(source: SourceChart): ChartConfiguration {
  const { chart, data, title, x_axis, y_axis } = source

  return {
    type: chart as any,
    data: {
      labels: data?.labels ?? [],
      datasets: buildDatasets(data?.values, chart)
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
          text: title
        },
        legend: {
          position: 'top'
        }
      },
      scales:
        chart === 'pie' || chart === 'doughnut'
          ? undefined
          : {
            x: {
              title: {
                display: !!x_axis?.title,
                text: x_axis?.title
              },
              stacked: chart === 'bar' ? true : false
            },
            y: {
              title: {
                display: !!y_axis?.title,
                text: y_axis?.title
              },
              stacked: chart === 'bar' ? true : false
            }
          }
    }
  }
}
