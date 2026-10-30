import { useEffect, useState } from 'react';
import { checkHealth } from '../services/health.service';

export type HealthStatus = 'checking' | 'online' | 'offline';

// Rechecagem periódica para o indicador refletir o backend sendo ligado ou desligado.
const CHECK_INTERVAL_MS = 30_000;

/** Estado real do backend para o indicador da sidebar. */
export function useHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    let active = true;
    const run = async () => {
      const online = await checkHealth();
      if (active) setStatus(online ? 'online' : 'offline');
    };
    run();
    const timer = window.setInterval(run, CHECK_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return status;
}
