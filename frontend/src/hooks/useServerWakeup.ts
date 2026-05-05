import { useEffect, useState } from 'react';
import api from '../services/api';

export const useServerWakeup = () => {
  const [serverReady, setServerReady] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const wakeUpServers = async () => {
      try {
        // ยิงไปที่ endpoint ไหนก็ได้ที่ต้องผ่าน Router หลัก
        await api.get('/api/homepage');
        if (isMounted) setServerReady(true);
      } catch (error: unknown) {
        if (!isMounted) return;
        setWakingUp(true);
        
        const err = error as { response?: { status?: number } };
        const isRateLimited = err.response && err.response.status === 429;
        
        // ถ้าติด Rate limit ให้รอนานหน่อย (10 วิ) ถ้าเป็น error อื่นๆ รอ 5 วิ
        const retryDelay = isRateLimited ? 10000 : 5000;
        
        setTimeout(wakeUpServers, retryDelay);
      }
    };
    
    wakeUpServers();
    return () => { isMounted = false; };
  }, []);

  return { serverReady, wakingUp };
};