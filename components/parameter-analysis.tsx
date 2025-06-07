"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipItem,
  ChartType,
  TooltipModel
} from "chart.js"
import { useRealtimeHistory } from "@/hooks/use-realtime-history"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Skeleton } from "./ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "./ui/alert"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const parameters = [
  { name: "PH", unit: "", min: 6.5, max: 8.5, key: "PH" },
  { name: "BOD", unit: "mg/L", min: 0, max: 30, key: "BOD" },
  { name: "COD", unit: "mg/L", min: 0, max: 250, key: "COD" },
  { name: "TSS", unit: "mg/L", min: 0, max: 30, key: "TSS" },
  { name: "Flow", unit: "m³/h", min: 0, max: 100, key: "Flow" },
]

const chartColors = {
  PH: { base: 'rgba(75, 192, 192, 0.6)', light: 'rgba(75, 192, 192, 0.2)' },
  BOD: { base: 'rgba(255, 99, 132, 0.6)', light: 'rgba(255, 99, 132, 0.2)' },
  COD: { base: 'rgba(54, 162, 235, 0.6)', light: 'rgba(54, 162, 235, 0.2)' },
  TSS: { base: 'rgba(255, 206, 86, 0.6)', light: 'rgba(255, 206, 86, 0.2)' },
  Flow: { base: 'rgba(153, 102, 255, 0.6)', light: 'rgba(153, 102, 255, 0.2)' }
}

const borderColors = {
  PH: "rgba(75, 192, 192, 1)",
  BOD: "rgba(255, 99, 132, 1)",
  COD: "rgba(54, 162, 235, 1)",
  TSS: "rgba(255, 206, 86, 1)",
  Flow: "rgba(153, 102, 255, 1)",
}

export function ParameterAnalysis({ deviceId = "RPi001" }: { deviceId?: string }) {
  const { historicalData, loading, error } = useRealtimeHistory(deviceId)

  // Prepare chart data for each parameter
  const getChartData = (paramKey: string) => {
    if (!historicalData.length) return null

    // Sort data by timestamp
    const sortedData = [...historicalData].sort((a, b) => {
      return a.timestamp.getTime() - b.timestamp.getTime()
    })

    // Limit to last 50 readings for better performance
    const recentData = sortedData.slice(-50)

    return {
      labels: recentData.map((entry) =>
        entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ),
      datasets: [
        {
          label: paramKey,
          data: recentData.map((entry) => entry[paramKey as keyof typeof entry] as number || 0),
          borderColor: borderColors[paramKey as keyof typeof borderColors],
          backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            const color = chartColors[paramKey as keyof typeof chartColors];
            gradient.addColorStop(0, color.base);
            gradient.addColorStop(1, color.light);
            return gradient;
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const chartOptions = (paramKey: string): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      } as const,
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  })

  if (loading && !historicalData.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading parameter analysis</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!historicalData.length) {
    return (
      <Alert>
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>No historical data found for analysis.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs defaultValue={parameters[0].key} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        {parameters.map((param) => (
          <TabsTrigger key={param.key} value={param.key}>
            {param.name}
          </TabsTrigger>
        ))}
      </TabsList>
      
      <div className="mt-4 h-80">
        {parameters.map((param) => {
          const chartData = getChartData(param.key)
          return (
            <TabsContent key={param.key} value={param.key} className="h-full">
              <div className="h-full">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{param.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    Range: {param.min} - {param.max} {param.unit}
                  </span>
                </div>
                {chartData ? (
                  <div className="h-[calc(100%-2rem)]">
                    <Line data={chartData} options={chartOptions(param.key)} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </div>
    </Tabs>
  )
}
