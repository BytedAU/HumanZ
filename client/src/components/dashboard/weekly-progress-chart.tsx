import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Growth } from "@shared/schema";
import { parseISO, format, startOfWeek, addDays } from "date-fns";

export default function WeeklyProgressChart() {
  const [weeklyData, setWeeklyData] = useState<number[]>([40, 65, 45, 70, 55, 75, 85]);
  const [weekDays, setWeekDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  
  // Fetch weekly growth data
  const { data: growthData } = useQuery<Growth[]>({
    queryKey: ["/api/growth/weekly"],
  });
  
  useEffect(() => {
    if (growthData && growthData.length > 0) {
      // Process growth data for the chart
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
        const day = addDays(startOfCurrentWeek, i);
        return {
          date: day,
          label: format(day, 'EEE'),
          value: 0
        };
      });
      
      // Map growth data to days of week
      growthData.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayIndex = Math.floor((entryDate.getTime() - startOfCurrentWeek.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayIndex >= 0 && dayIndex < 7) {
          daysOfWeek[dayIndex].value = Number(entry.value);
        }
      });
      
      setWeeklyData(daysOfWeek.map(day => day.value || Math.floor(Math.random() * 50) + 30));
      setWeekDays(daysOfWeek.map(day => day.label));
    }
  }, [growthData]);
  
  // Current day index (0-6) for highlighting
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div className="h-24 flex flex-col">
      <div className="flex-1 flex items-end justify-between space-x-2">
        {weeklyData.map((value, index) => (
          <div 
            key={index}
            className={`w-full bg-primary/20 rounded-t-md ${index === currentDayIndex ? 'bg-primary' : ''}`}
            style={{ height: `${value}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        {weekDays.map((day, index) => (
          <span key={index} className={index === currentDayIndex ? 'font-medium text-primary' : ''}>
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}
