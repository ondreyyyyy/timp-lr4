import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [is2FAStep, setIs2FAStep] = useState(false);
    const [pendingLogin, setPendingLogin] = useState('');
    const [info, setInfo] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', login);
            formData.append('password', password);
            const response = await api.post('/login', formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            if (response.data.two_factor_required) {
                setPendingLogin(response.data.login);
                setIs2FAStep(true);
                setInfo(response.data.detail || 'Код подтверждения отправлен на почту');
                return;
            }

            setError('Неожиданный ответ сервера');
        } catch (err) {
            setError(err.response?.status === 401 ? 'Неверный логин или пароль' : 'Ошибка сервера');
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        try {
            const response = await api.post('/login/verify', { login: pendingLogin, code });
            localStorage.setItem('token', response.data.access_token);
            navigate('/incidents');
        } catch (err) {
            setError(err.response?.data?.detail || 'Неверный или просроченный код');
        }
    };

    const handleCodeChange = (e) => {
        setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
    };

    const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#0f172a' }}>Вход в Security Hub</h2>
                {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
                {info && <p style={{ color: '#2563eb', textAlign: 'center', marginBottom: '15px' }}>{info}</p>}
                {!is2FAStep ? (
                    <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" placeholder="Логин" value={login} onChange={e => setLogin(e.target.value)} required style={inputStyle}/>
                        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle}/>
                        <button type="submit" style={{ padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Войти</button>
                    </form>
                ) : (
                    <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" value={pendingLogin} disabled style={{ ...inputStyle, background: '#f1f5f9' }}/>
                        <input type="text" placeholder="Код из email" value={code} onChange={handleCodeChange} required maxLength={6} inputMode="numeric" autoComplete="one-time-code" style={inputStyle}/>
                        <button type="submit" style={{ padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Подтвердить вход</button>
                        <button type="button" onClick={() => { setIs2FAStep(false); setCode(''); setInfo(''); }} style={{ padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Назад</button>
                    </form>
                )}
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b' }}>
                    Нет аккаунта? <Link to="/register" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
}
