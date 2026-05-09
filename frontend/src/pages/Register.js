import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ 
        surname: '', name: '', patronymic: '', position: '', 
        phonenum: '', login: '', email: '', password: '', role: 'user' 
    });

    const validatePassword = (pwd) => {
        if (pwd.length < 7) return "Пароль должен содержать минимум 7 символов.";
        if (!/\d/.test(pwd)) return "Пароль должен содержать хотя бы одну цифру.";
        if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(pwd)) return "Пароль должен содержать хотя бы один спецсимвол.";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const pwdError = validatePassword(formData.password);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        try {
            await api.post('/register', formData);
            alert('Успешно! Теперь войдите.'); 
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка регистрации');
        }
    };

    const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#0f172a' }}>Регистрация сотрудника</h2>
                {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px', background: '#fee2e2', padding: '10px', borderRadius: '6px', wordBreak: 'break-word' }}>{error}</p>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input placeholder="Фамилия" maxLength="30" value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} required style={inputStyle}/>
                        <input placeholder="Имя" maxLength="30" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle}/>
                    </div>
                    <input placeholder="Отчество" maxLength="30" value={formData.patronymic} onChange={e => setFormData({...formData, patronymic: e.target.value})} style={inputStyle}/>
                    <input placeholder="Должность" maxLength="100" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required style={inputStyle}/>
                    <input placeholder="Телефон (только цифры)" maxLength="11" value={formData.phonenum} onChange={e => setFormData({...formData, phonenum: e.target.value.replace(/\D/g, '')})} required style={inputStyle}/>
                    <input type="email" placeholder="Email" maxLength="100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={inputStyle}/>
                    <input placeholder="Логин" maxLength="50" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required style={inputStyle}/>
                    <input type="password" placeholder="Пароль" maxLength="255" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={inputStyle}/>
                    
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#f8fafc' }}>
                        <option value="user">Пользователь</option>
                        <option value="security">Сотрудник охраны</option>
                        <option value="admin">Администратор</option>
                    </select>

                    <button type="submit" style={{ padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                        Зарегистрироваться
                    </button>
                </form>
                
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b' }}>
                    Уже есть аккаунт? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>Войти</Link>
                </p>
            </div>
        </div>
    );
}