import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

export default function Profile() {
    const { currentUser, setCurrentUser } = useOutletContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ ...currentUser, password: '' });
    const [message, setMessage] = useState('');

    const validatePassword = (pwd) => {
        if (!pwd) return ""; 
        if (pwd.length < 7) return "Пароль должен содержать минимум 7 символов.";
        if (!/\d/.test(pwd)) return "Пароль должен содержать хотя бы одну цифру.";
        if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(pwd)) return "Пароль должен содержать хотя бы один спецсимвол.";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const pwdError = validatePassword(formData.password);
        if (pwdError) {
            setMessage('Ошибка: ' + pwdError);
            return;
        }

        setIsLoading(true);
        try {
            const payload = { ...formData };
            if (!payload.password || payload.password.trim() === '') {
                delete payload.password;
            }

            const res = await api.put(`/staff/${currentUser.id_s}`, payload);
            setCurrentUser(res.data); 
            setIsEditing(false);
            setMessage('Профиль успешно обновлен!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Ошибка при обновлении профиля');
        }
        setIsLoading(false);
    };

    const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', marginBottom: '15px' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#475569' };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Мой профиль</h2>
                {!isEditing && <button onClick={() => setIsEditing(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Редактировать</button>}
            </div>

            {message && <div style={{ padding: '10px', background: message.includes('Ошибка') ? '#fee2e2' : '#dcfce7', color: message.includes('Ошибка') ? '#991b1b' : '#166534', borderRadius: '6px', marginBottom: '15px', textAlign: 'center', wordBreak: 'break-word' }}>{message}</div>}

            {isEditing ? (
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}><label style={labelStyle}>Фамилия</label><input maxLength="30" value={formData.surname || ''} onChange={e => setFormData({...formData, surname: e.target.value})} style={inputStyle} required/></div>
                        <div style={{ flex: 1 }}><label style={labelStyle}>Имя</label><input maxLength="30" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} required/></div>
                    </div>
                    <label style={labelStyle}>Отчество</label><input maxLength="30" value={formData.patronymic || ''} onChange={e => setFormData({...formData, patronymic: e.target.value})} style={inputStyle}/>
                    
                    <label style={labelStyle}>Должность {currentUser.role !== 'admin' && '(только для чтения)'}</label>
                    <input maxLength="100" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} style={{ ...inputStyle, background: currentUser.role !== 'admin' ? '#f1f5f9' : 'white', cursor: currentUser.role !== 'admin' ? 'not-allowed' : 'text' }} required disabled={currentUser.role !== 'admin'}/>

                    <label style={labelStyle}>Телефон</label><input maxLength="11" value={formData.phonenum || ''} onChange={e => setFormData({...formData, phonenum: e.target.value.replace(/\D/g, '')})} style={inputStyle} required/>
                    
                    <label style={labelStyle}>Email {currentUser.role !== 'admin' && '(только для чтения)'}</label>
                    <input type="email" maxLength="100" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} disabled={currentUser.role !== 'admin'} required style={{ ...inputStyle, background: currentUser.role !== 'admin' ? '#f1f5f9' : 'white', cursor: currentUser.role !== 'admin' ? 'not-allowed' : 'text' }}/>
                    
                    <label style={labelStyle}>Логин {currentUser.role !== 'admin' && '(только для чтения)'}</label>
                    <input maxLength="50" value={formData.login || ''} onChange={e => setFormData({...formData, login: e.target.value})} disabled={currentUser.role !== 'admin'} required style={{ ...inputStyle, background: currentUser.role !== 'admin' ? '#f1f5f9' : 'white', cursor: currentUser.role !== 'admin' ? 'not-allowed' : 'text' }}/>
                    
                    <label style={labelStyle}>Новый пароль</label>
                    <input type="password" maxLength="255" placeholder="Оставьте пустым, чтобы не менять" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle}/>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="submit" disabled={isLoading} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: '#10b981', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                            {isLoading && <div style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
                            Сохранить
                        </button>
                        <button type="button" onClick={() => { setIsEditing(false); setFormData({...currentUser, password: ''}); }} style={{ flex: 1, background: '#e2e8f0', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Отмена</button>
                    </div>
                </form>
            ) : (
                <div style={{ fontSize: '16px', lineHeight: '2', wordBreak: 'break-word' }}>
                    <p><strong>ФИО:</strong> {currentUser.surname} {currentUser.name} {currentUser.patronymic}</p>
                    <p><strong>Должность:</strong> {currentUser.position}</p>
                    <p><strong>Права доступа:</strong> <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{currentUser.role}</span></p>
                    <p><strong>Телефон:</strong> {currentUser.phonenum}</p>
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>Логин:</strong> {currentUser.login}</p>
                </div>
            )}
        </div>
    );
}