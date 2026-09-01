import React, { useState, useEffect } from 'react';
import PlanToDoManager from './components/PlanToDoManager';
import BackupManager from './components/BackupManager';
import SeeDashboard from './components/SeeDashboard';
import { supabase } from './supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formInput, setFormInput] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  
  const [currentPlanId, setCurrentPlanId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) extractUsername(session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) extractUsername(session.user.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const extractUsername = (email) => {
    setUsername(email.split('@')[0]);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const dummyEmail = `${formInput.username}@pds.com`;

    try {
      if (isRegisterMode) {
        const { error } = await supabase.auth.signUp({
          email: dummyEmail,
          password: formInput.password,
        });
        if (error) throw error;
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        setIsRegisterMode(false);
        setFormInput({ username: '', password: '' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: formInput.password,
        });
        if (error) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUsername('');
    setCurrentPlanId(null);
    setFormInput({ username: '', password: '' });
    setAuthError('');
  };

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#0f172a', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '700', fontSize: '1.1rem', marginBottom: '12px' }}>P</div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{isRegisterMode ? 'Create an Account' : 'Sign in to PDS Planner'}</h1>
          </div>

          {authError && <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>{authError}</div>}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Username</label>
              <input type="text" required value={formInput.username} onChange={e => setFormInput({...formInput, username: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Password</label>
              <input type="password" required minLength={isRegisterMode ? 6 : undefined} value={formInput.password} onChange={e => setFormInput({...formInput, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ padding: '10px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {isRegisterMode ? '회원가입 완료' : '로그인'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button type="button" onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', cursor: 'pointer' }}>
              {isRegisterMode ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '700' }}>P</div>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>PDS Enterprise Secure Planner</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem' }}>👤 <strong>{username}</strong>님 접속 중</span>
          <button onClick={handleLogout} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#dc2626', cursor: 'pointer' }}>로그아웃</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', boxSizing: 'border-box' }}>
        <BackupManager session={session} />
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <PlanToDoManager session={session} onSelectPlan={(id) => setCurrentPlanId(id)} />
        </div>
        {currentPlanId && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
            <SeeDashboard currentPlanId={currentPlanId} onNextPlanCreated={() => setCurrentPlanId(null)} />
          </div>
        )}
      </main>
    </div>
  );
}