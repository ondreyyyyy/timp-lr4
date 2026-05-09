import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

export default function Staff() {
    const { currentUser } = useOutletContext();
    const [staff, setStaff] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [filterRole, setFilterRole] = useState('');
    
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [formData, setFormData] = useState({ surname:'', name:'', patronymic:'', position:'', phonenum:'', login:'', email:'', password:'', role:'user' });

    useEffect(() => { if (currentUser.role === 'admin') fetchStaff(); }, [page, filterRole, currentUser.role]);

    if (currentUser.role !== 'admin') {
        return <div style={{ textAlign: 'center', marginTop: '100px', color: '#ef4444', fontSize: '24px' }}>⛔ Доступ запрещен.</div>;
    }

    const fetchStaff = async () => {
        setIsLoading(true); 
        try {
            const allRes = await api.get('/staff/?skip=0&limit=1000');
            if (Array.isArray(allRes.data)) {
                setAvailableRoles([...new Set(allRes.data.map(s => s.role))]);
            }

            const res = await api.get(`/staff/?skip=${(page - 1) * limit}&limit=${limit}`);
            let data = Array.isArray(res.data) ? res.data : [];
            if (filterRole) data = data.filter(s => s.role === filterRole);
            
            data.sort((a, b) => a.id_s - b.id_s);
            setStaff(data);
        } catch (err) { setStaff([]); }
        setIsLoading(false); 
    };

    const validatePassword = (pwd, isNew) => {
        if (!pwd && !isNew) return "";
        if (pwd.length < 7) return "Пароль должен содержать минимум 7 символов.";
        if (!/\d/.test(pwd)) return "Пароль должен содержать хотя бы одну цифру.";
        if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(pwd)) return "Пароль должен содержать хотя бы один спецсимвол.";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');

        const pwdError = validatePassword(formData.password, !editingId);
        if (pwdError) {
            setModalError(pwdError);
            return;
        }

        const payload = { ...formData };
        if (!payload.password) delete payload.password;

        try {
            if (editingId) await api.put(`/staff/${editingId}`, payload);
            else await api.post('/register', payload); 
            setIsModalOpen(false); fetchStaff();
        } catch(err) {
            setModalError(err.response?.data?.detail || 'Ошибка при сохранении.');
        }
    };

    const handleDelete = async (id_s) => {
        if (window.confirm('Точно уволить?')) { await api.delete(`/staff/${id_s}`); fetchStaff(); }
    };

    const openModal = (s = null) => {
        setModalError('');
        if (s) { setFormData({...s, password: '', patronymic: s.patronymic || ''}); setEditingId(s.id_s); } 
        else { setFormData({ surname:'', name:'', patronymic:'', position:'', phonenum:'', login:'', email:'', password:'', role:'user' }); setEditingId(null); }
        setIsModalOpen(true);
    };

    const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '-5px' };
    const tdStyle = { padding: '12px', wordBreak: 'break-word', maxWidth: '200px' };

    return (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Управление персоналом</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                        <option value="">Все роли</option>
                        {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={() => openModal()} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>+ Регистрация</button>
                </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <th style={tdStyle}>ID</th><th style={tdStyle}>ФИО</th><th style={tdStyle}>Должность</th><th style={tdStyle}>Роль</th><th style={{...tdStyle, textAlign: 'right'}}>Действия</th>
                </tr></thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></td></tr>
                    ) : staff.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Нет записей</td></tr> : staff.map(s => (
                        <tr key={s.id_s} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={tdStyle}>{s.id_s}</td><td style={tdStyle}>{s.surname} {s.name} {s.patronymic || ''}</td><td style={tdStyle}>{s.position}</td>
                            <td style={tdStyle}><span style={{ background: s.role==='admin'?'#fee2e2':'#e0e7ff', color: s.role==='admin'?'#991b1b':'#3730a3', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>{s.role}</span></td>
                            <td style={{...tdStyle, textAlign: 'right'}}>
                                {s.id_s === currentUser.id_s ? (
                                    <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Ваш профиль</span>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button onClick={() => openModal(s)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Изменить</button>
                                        <button onClick={() => handleDelete(s.id_s)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button disabled={page === 1 || isLoading} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Назад</button> 
                <span style={{ padding: '8px', fontWeight: 'bold' }}>Страница {page}</span>
                <button disabled={staff.length < limit || isLoading} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Вперед</button>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px' }}>
                        <h3 style={{ marginTop: 0 }}>{editingId ? 'Изменить' : 'Новый сотрудник'}</h3>
                        {modalError && <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', wordBreak: 'break-word' }}>{modalError}</div>}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={labelStyle}>Фамилия</label><input maxLength="30" value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}/></div>
                                <div style={{ flex: 1 }}><label style={labelStyle}>Имя</label><input maxLength="30" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}/></div>
                            </div>
                            <label style={labelStyle}>Отчество (не обязательно)</label><input maxLength="30" value={formData.patronymic} onChange={e => setFormData({...formData, patronymic: e.target.value})} style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            
                            <label style={labelStyle}>Должность</label><input maxLength="100" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>Телефон (только цифры)</label><input maxLength="11" value={formData.phonenum} onChange={e => setFormData({...formData, phonenum: e.target.value.replace(/\D/g, '')})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            
                            <label style={labelStyle}>Email</label>
                            <input type="email" maxLength="100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            
                            <label style={labelStyle}>Логин</label>
                            <input maxLength="50" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            
                            <label style={labelStyle}>{editingId ? "Новый пароль" : "Пароль"}</label>
                            <input type="password" maxLength="255" placeholder={editingId ? "Оставьте пустым, чтобы не менять" : ""} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingId} style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            
                            <label style={labelStyle}>Роль</label>
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ padding: '8px', border: '1px solid #cbd5e1' }}>
                                <option value="user">Пользователь</option><option value="security">Сотрудник охраны</option><option value="admin">Администратор</option>
                            </select>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '6px' }}>Сохранить</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#e2e8f0', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px' }}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}