import { useEffect, useState } from 'react';
import api from '../services/api';

export const useServerWakeup = () => {
  const [serverReady, setServerReady] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 5; // จำกัดการยิงซ้ำสูงสุด 5 ครั้ง
    let timeoutId: ReturnType<typeof setTimeout>;

    const wakeUpServers = async () => {
      try {
        await api.get('/api/homepage');
        if (isMounted) setServerReady(true);
      } catch (error: any) {
        if (!isMounted) return;
        
        // ถ้าระบบตอบกลับมาเป็น 404 แสดงว่า Server ตื่นแล้ว แต่หา Endpoint ไม่เจอ ให้ปล่อยผ่านได้เลย
        if (error.response && error.response.status === 404) {
          setServerReady(true);
          return;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
          // หยุดการทำงานเมื่อครบกำหนด เพื่อป้องกันการยิง Request รัวๆ ใน Console
          setServerReady(true);
          return;
        }

        setWakingUp(true);
        const isRateLimited = error.response && error.response.status === 429;
        const retryDelay = isRateLimited ? 10000 : 5000;
        
        timeoutId = setTimeout(wakeUpServers, retryDelay);
      }
    };
    
    wakeUpServers();
    
    return () => { 
      isMounted = false; 
      clearTimeout(timeoutId); // ล้าง timeout เมื่อ component ถูกทำลาย
    };
  }, []);

  return { serverReady, wakingUp };
};