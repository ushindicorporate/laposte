'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, User, TrendingUp, MapPin, Activity } from 'lucide-react';
import { CustomerStats as CustomerStatsType } from '@/actions/customers';

interface CustomerStatsProps {
  stats: CustomerStatsType;
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  const activePercentage = stats.total > 0 
    ? Math.round((stats.active / stats.total) * 100) 
    : 0;

  const entreprisePercentage = stats.total > 0 
    ? Math.round((stats.entreprise / stats.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} actifs ({activePercentage}%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Particuliers</CardTitle>
          <User className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.particulier}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.particulier / stats.total) * 100) : 0}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
          <Building className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.entreprise}</div>
          <p className="text-xs text-muted-foreground">
            {entreprisePercentage}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Évolution</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.byMonth.length > 1 
              ? stats.byMonth[stats.byMonth.length - 1].count 
              : 0
            }
          </div>
          <p className="text-xs text-muted-foreground">
            Nouveaux ce mois
          </p>
        </CardContent>
      </Card>
    </div>
  );
}