import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Growth } from "@shared/schema";
import { format, parseISO, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GrowthChartProps {
  title?: string;
}

export default function GrowthChart({ title = "Growth Over Time" }: GrowthChartProps) {
  const [timeRange, setTimeRange] = useState<string>("3m");
  const [category, setCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("bar");
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Fetch growth data
  const { data: growthData, isLoading } = useQuery<Growth[]>({
    queryKey: ["/api/growth"],
  });
  
  // Process data for chart
  useEffect(() => {
    if (!growthData) return;
    
    const now = new Date();
    let startDate: Date;
    
    // Determine start date based on time range
    switch (timeRange) {
      case '1m':
        startDate = subMonths(now, 1);
        break;
      case '6m':
        startDate = subMonths(now, 6);
        break;
      case '1y':
        startDate = subMonths(now, 12);
        break;
      case '3m':
      default:
        startDate = subMonths(now, 3);
        break;
    }
    
    // Filter data by time range and category
    let filteredData = growthData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && (category === 'all' || item.category === category);
    });
    
    // Sort by date
    filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Format data for chart
    const formattedData = filteredData.map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      value: Number(item.value),
      category: item.category
    }));
    
    setChartData(formattedData);
  }, [growthData, timeRange, category]);
  
  // Generate sample data if no data available
  const generateSampleData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      data.push({
        date: format(date, 'MMM dd'),
        value: Math.floor(Math.random() * 20) + 70, // Random value between 70-90
        category: 'overall'
      });
    }
    
    return data;
  };
  
  // Use sample data if no real data available
  const displayData = chartData.length > 0 ? chartData : generateSampleData();
  
  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Growth: <span className="text-primary font-medium">{payload[0].value}%</span>
          </p>
          {payload[0].payload.category && (
            <p className="text-xs text-muted-foreground capitalize">
              Category: {payload[0].payload.category}
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card className="h-full shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={category}
            onValueChange={setCategory}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="overall">Overall</SelectItem>
              <SelectItem value="career">Career</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="line">Line Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bar" className="h-[300px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    tickCount={6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          
          <TabsContent value="line" className="h-[300px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    tickCount={6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
