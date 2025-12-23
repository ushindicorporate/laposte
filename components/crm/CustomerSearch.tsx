'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Download, CalendarIcon, 
  Users, Building, MapPin, Globe, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CustomerSearchFilters } from '@/lib/types/customers';
import { searchCustomerSuggestions } from '@/actions/customers';

interface CustomerSearchProps {
  onSearch: (filters: CustomerSearchFilters) => void;
  initialFilters?: CustomerSearchFilters;
  stats?: {
    total: number;
    particuliers: number;
    entreprises: number;
  };
}

export function CustomerSearch({ onSearch, initialFilters, stats }: CustomerSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<CustomerSearchFilters>({
    query: '',
    type: 'all',
    page: 1,
    limit: 20,
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Synchroniser avec les query params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const queryFilters: CustomerSearchFilters = {};
    
    if (params.get('q')) queryFilters.query = params.get('q') || '';
    if (params.get('type')) queryFilters.type = params.get('type') as any;
    if (params.get('page')) queryFilters.page = parseInt(params.get('page')!);
    
    if (Object.keys(queryFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...queryFilters }));
      onSearch({ ...filters, ...queryFilters });
    }
  }, [searchParams]);

  // Recherche de suggestions pour l'autocomplete
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const results = await searchCustomerSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Erreur suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Gérer les changements de filtre
  const handleFilterChange = (key: keyof CustomerSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    // Mettre à jour l'URL
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.type && newFilters.type !== 'all') params.set('type', newFilters.type);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    
    router.push(`/dashboard/crm?${params.toString()}`, { scroll: false });
    
    // Déclencher la recherche
    onSearch(newFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('query', filters.query);
  };

  const handleReset = () => {
    const resetFilters: CustomerSearchFilters = {
      query: '',
      type: 'all',
      page: 1,
      limit: 20
    };
    
    setFilters(resetFilters);
    setSuggestions([]);
    router.push('/dashboard/crm');
    onSearch(resetFilters);
  };

  const handleExport = async () => {
    try {
      const csvContent = await fetch('/api/customers/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      }).then(res => res.text());

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Barre de recherche principale */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par nom, téléphone, email..."
                value={filters.query}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({ ...prev, query: value }));
                  if (value.length >= 2) {
                    fetchSuggestions(value);
                  } else {
                    setSuggestions([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                className="pl-9"
              />
              
              {/* Suggestions d'autocomplete */}
              {suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="px-4 py-2 hover:bg-muted cursor-pointer border-b last:border-0"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, query: suggestion.name }));
                        setSuggestions([]);
                        handleFilterChange('query', suggestion.name);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.phone} • {suggestion.type === 'PARTICULIER' ? 'Particulier' : 'Entreprise'}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {suggestion.shipment_count} envoi{suggestion.shipment_count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type de client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="PARTICULIER">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Particuliers
                    </div>
                  </SelectItem>
                  <SelectItem value="ENTREPRISE">
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      Entreprises
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
              {showAdvanced ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>

          {/* Statistiques rapides */}
          {stats && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.total}</Badge>
                <span className="text-muted-foreground">clients</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-blue-500" />
                <span>{stats.particuliers}</span>
                <span className="text-muted-foreground">particuliers</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-3 w-3 text-purple-500" />
                <span>{stats.entreprises}</span>
                <span className="text-muted-foreground">entreprises</span>
              </div>
            </div>
          )}

          {/* Filtres avancés */}
          {showAdvanced && (
            <>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtre par date */}
                <div className="space-y-2">
                  <Label htmlFor="created_start">Date de création</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.created_start && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.created_start 
                            ? format(new Date(filters.created_start), 'PPP', { locale: fr })
                            : 'Du'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.created_start ? new Date(filters.created_start) : undefined}
                          onSelect={(date) => 
                            handleFilterChange('created_start', date ? format(date, 'yyyy-MM-dd') : '')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.created_end && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.created_end 
                            ? format(new Date(filters.created_end), 'PPP', { locale: fr })
                            : 'Au'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.created_end ? new Date(filters.created_end) : undefined}
                          onSelect={(date) => 
                            handleFilterChange('created_end', date ? format(date, 'yyyy-MM-dd') : '')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Filtre par localisation */}
                <div className="space-y-2">
                  <Label htmlFor="region">Localisation</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {/* TODO: Implémenter sélection région */}}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Région
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {/* TODO: Implémenter sélection ville */}}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Ville
                    </Button>
                  </div>
                </div>

                {/* Filtres booléens */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_shipments"
                      checked={filters.has_shipments === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange('has_shipments', checked ? true : undefined)
                      }
                    />
                    <Label htmlFor="has_shipments" className="cursor-pointer">
                      A déjà effectué des envois
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active_only"
                      checked={filters.is_active === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange('is_active', checked ? true : undefined)
                      }
                    />
                    <Label htmlFor="active_only" className="cursor-pointer">
                      Clients actifs uniquement
                    </Label>
                  </div>
                </div>
              </div>

              {/* Actions des filtres avancés */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  <span>Résultats en temps réel</span>
                </div>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}