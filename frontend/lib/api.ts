const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smartwarga_token');
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('smartwarga_token', token);
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('smartwarga_token');
  localStorage.removeItem('smartwarga_user');
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada sistem.');
  }

  return data;
}

// User type definition
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'rw' | 'rt' | 'warga' | 'bendahara' | 'sekretaris';
  rt_number?: string;
  house_id?: number;
  rfid_uid?: string;
  status: 'pending' | 'approved';
  phone?: string;
  avatar?: string;
  kk_type?: 'kk_utama' | 'kk_pendukung' | 'anggota';
  no_kk?: string;
  nik?: string;
  birth_place?: string;
  birth_date?: string;
  gender?: string;
  religion?: string;
  occupation?: string;
  marital_status?: string;
  blood_type?: string;
  relationship?: string;
  is_head_of_house?: boolean;
  house?: {
    id: number;
    house_code?: string;
    rt_number: string;
    block: string;
    number: number;
    full_address: string;
    is_occupied: boolean;
    head_of_family_id?: number;
    head_of_family?: {
      id: number;
      name: string;
      phone?: string;
      no_kk?: string;
      nik?: string;
    };
    residents?: any[];
    kk_pendukung?: any[];
  };
  wallet?: {
    id: number;
    balance: string | number;
  };
}
