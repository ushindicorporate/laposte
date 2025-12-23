'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, Clock, MapPin, Truck, Plane, Train } from 'lucide-react';

interface RouteStatsProps {
  stats: {
    total: number;
    active: number;
    road: number;
    air: number;
    rail: number;
    daily: number;
    weekly: number;
    withStops: number;
  };
}

export function RouteStats({ stats }: RouteStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
          <Route className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} active(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Par Type</CardTitle>
          <Truck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Route</span>
              <span className="font-medium">{stats.road}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Air</span>
              <span className="font-medium">{stats.air}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Rail</span>
              <span className="font-medium">{stats.rail}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fréquence</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Quotidien</span>
              <span className="font-medium">{stats.daily}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hebdomadaire</span>
              <span className="font-medium">{stats.weekly}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arrêts</CardTitle>
          <MapPin className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.withStops}</div>
          <p className="text-xs text-muted-foreground">
            Routes avec arrêts intermédiaires
          </p>
        </CardContent>
      </Card>
    </div>
  );
}