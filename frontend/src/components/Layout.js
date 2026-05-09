import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Layout() {
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        api.get('/profile')
            .then(res => setCurrentUser(res.data))
            .catch(() => {
                localStorage.removeItem('token');
                navigate('/login');
            });
    }, [navigate]);

    if (!currentUser) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh', fontSize: '20px' }}>Загрузка системы...</div>;

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const getLinkStyle = (path) => ({
        color: location.pathname === path ? '#60a5fa' : 'white',
        textDecoration: 'none',
        fontWeight: location.pathname === path ? 'bold' : 'normal',
        padding: '5px 10px',
        borderRadius: '6px',
        transition: 'background 0.2s',
    });

    return (
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', backgroundColor: '#0f172a', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ fontWeight: '800', fontSize: '1.4rem', letterSpacing: '0.5px' }}>
                    Security Hub <span style={{ fontSize: '1rem', color: '#94a3b8', marginLeft: '10px' }}>| Роль: {currentUser.role}</span>
                </div>
                <nav style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <Link to="/incidents" style={getLinkStyle('/incidents')}>Инциденты</Link>
                    <Link to="/vulnerabilities" style={getLinkStyle('/vulnerabilities')}>Уязвимости</Link>
                    <Link to="/response-logs" style={getLinkStyle('/response-logs')}>Журнал мер</Link>
                    <Link to="/objects" style={getLinkStyle('/objects')}>Объекты</Link>
                    <Link to="/vul-types" style={getLinkStyle('/vul-types')}>Типы уязвимостей</Link>
                    <Link to="/response-measures" style={getLinkStyle('/response-measures')}>Меры реагирования</Link>
                    
                    {currentUser.role === 'admin' && (
                        <Link to="/staff" style={getLinkStyle('/staff')}>Сотрудники</Link>
                    )}
                    
                    <Link to="/profile" style={getLinkStyle('/profile')}>Мой профиль</Link>
                    <button onClick={handleLogout} style={{ marginLeft: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '8px 16px', fontWeight: 'bold' }}>
                        Выйти
                    </button>
                </nav>
            </header>

            <main style={{ padding: '2.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <Outlet context={{ currentUser, setCurrentUser }} />
            </main>
        </div>
    );
}