export interface Agency {
  id: string;
  name: string;
  code: string;
  city_id: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  cities?: {
    id: string;
    name: string;
    regions: {
      id: string;
      name: string;
    };
  };
}