import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', login);
            formData.append('password', password);
            const response = await api.post('/login', formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            localStorage.setItem('token', response.data.access_token);
            navigate('/incidents');
        } catch (err) {
            setError(err.response?.status === 401 ? 'Неверный логин или пароль' : 'Ошибка сервера');
        }
    };

    const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#0f172a' }}>Вход в Security Hub</h2>
                {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Логин" value={login} onChange={e => setLogin(e.target.value)} required style={inputStyle}/>
                    <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle}/>
                    <button type="submit" style={{ padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Войти</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b' }}>
                    Нет аккаунта? <Link to="/register" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
}