// components/admin/SystemSettingsForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Settings, Save, Globe, CreditCard, 
  Bell, Shield, Building, RefreshCw 
} from 'lucide-react';
import { getSystemSettings, updateSystemSetting } from '@/actions/admin';
import { supabase } from '@/lib/supabase/client';

export function SystemSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await getSystemSettings();
      if (result.success && result.data) {
        // Organiser les settings par catégorie
        const settingsByCategory: Record<string, any> = {};
        const uniqueCategories = new Set<string>();
        
        result.data.forEach((setting: any) => {
          uniqueCategories.add(setting.category);
          settingsByCategory[setting.key] = {
            ...setting,
            value: setting.value || ''
          };
        });
        
        setSettings(settingsByCategory);
        setCategories(Array.from(uniqueCategories).sort());
      }
    } catch (err: any) {
      setError('Erreur chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: value
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      // Sauvegarder tous les settings modifiés
      const promises = Object.entries(settings).map(async ([key, setting]) => {
        await updateSystemSetting(key, setting.value, userId);
      });

      await Promise.all(promises);

      setSuccess('Paramètres sauvegardés avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GENERAL':
        return <Building className="h-4 w-4" />;
      case 'FINANCE':
        return <CreditCard className="h-4 w-4" />;
      case 'OPERATIONS':
        return <Settings className="h-4 w-4" />;
      case 'SECURITY':
        return <Shield className="h-4 w-4" />;
      case 'NOTIFICATIONS':
        return <Bell className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const renderSettingField = (setting: any) => {
    const commonProps = {
      value: setting.value || '',
      onChange: (e: any) => handleSettingChange(setting.key, e.target.value),
      disabled: saving
    };

    switch (setting.data_type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value === 'true'}
            onCheckedChange={(checked) => 
              handleSettingChange(setting.key, checked.toString())
            }
            disabled={saving}
          />
        );
      
      case 'number':
        return <Input type="number" {...commonProps} />;
      
      case 'json':
        return (
          <Textarea
            {...commonProps}
            rows={3}
            placeholder='{"key": "value"}'
          />
        );
      
      default:
        return setting.key.includes('password') ? (
          <Input type="password" {...commonProps} />
        ) : (
          <Input {...commonProps} />
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Chargement des paramètres...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs par catégorie */}
      <Tabs defaultValue={categories[0] || 'GENERAL'}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {Object.values(settings)
                    .filter((s: any) => s.category === category)
                    .map((setting: any) => (
                      <div key={setting.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor={setting.key} className="font-medium">
                              {setting.key.replace(/_/g, ' ')}
                            </Label>
                            {setting.description && (
                              <p className="text-sm text-muted-foreground">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          
                          {setting.is_public && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Public
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            {renderSettingField(setting)}
                          </div>
                          
                          {setting.data_type === 'boolean' && (
                            <span className="text-sm text-muted-foreground min-w-15">
                              {setting.value === 'true' ? 'Activé' : 'Désactivé'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={loadSettings}
          disabled={saving}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Recharger
        </Button>
        
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Sauvegarder tous les paramètres
        </Button>
      </div>
    </div>
  );
}