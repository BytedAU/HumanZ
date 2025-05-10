import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export default function StatsCard({
  title,
  value,
  description,
  action,
  children,
}: StatsCardProps) {
  return (
    <Card className="shadow-soft hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-medium text-foreground">{title}</CardTitle>
          {value && <span className="text-secondary font-bold text-2xl">{value}</span>}
          {action && <div>{action}</div>}
        </div>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
