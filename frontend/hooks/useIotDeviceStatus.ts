'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

export interface IotDeviceStatus {
  isOnline: boolean;
  status: 'online' | 'offline' | 'loading';
  lastPing: string | null;
  secondsAgo: number | null;
  loading: boolean;
  message: string;
  refetch: () => Promise<void>;
}

export function useIotDeviceStatus(pollingIntervalMs: number = 12000): IotDeviceStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [status, setStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastPing, setLastPing] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetchApi('/iot/device/status');
      if (res && res.success !== undefined) {
        const online = Boolean(res.is_online);
        setIsOnline(online);
        setStatus(online ? 'online' : 'offline');
        setLastPing(res.last_ping || null);
        setSecondsAgo(res.seconds_ago !== undefined ? res.seconds_ago : null);
        setMessage(res.message || (online ? 'Perangkat Online' : 'Perangkat Offline'));
      }
    } catch (err) {
      // If error occurs, treat as offline or keep status
      console.warn('[useIotDeviceStatus] Failed to check status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    if (pollingIntervalMs <= 0) return;

    const interval = setInterval(() => {
      checkStatus();
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [checkStatus, pollingIntervalMs]);

  return {
    isOnline,
    status,
    lastPing,
    secondsAgo,
    loading,
    message,
    refetch: checkStatus,
  };
}

