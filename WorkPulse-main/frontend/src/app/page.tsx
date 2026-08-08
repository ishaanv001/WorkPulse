'use client';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
export default function Root() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!user) { window.location.href = '/login'; return; }
    if (user.role === 'member' || user.role === 'team_lead') {
      window.location.href = '/member';
    } else {
      window.location.href = '/dashboard';
    }
  }, [user, loading]);
  return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#07090f'}}>
      <div style={{width:28,height:28,border:'2px solid rgba(255,255,255,.08)',borderTopColor:'#00d4f5',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
