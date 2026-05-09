import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

export default function Objects() {
    const { currentUser } = useOutletContext();
    const canEdit = currentUser.role === 'admin' || currentUser.role === 'security';

    const [objects, setObjects] = useState([]);
    const [availableTypes, setAvailableTypes] = useState([]); 
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [filterType, setFilterType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ obj_name: '', obj_type: '', location: '' });

    useEffect(() => { fetchObjects(); }, [page, filterType]);

    const fetchObjects = async () => {
        setIsLoading(true);
        try {
            const allRes = await api.get('/objects/?skip=0&limit=1000');
            if (Array.isArray(allRes.data)) {
                const uniqueTypes = [...new Set(allRes.data.map(o => o.obj_type))];
                setAvailableTypes(uniqueTypes);
            }

            const res = await api.get(`/objects/?skip=${(page - 1) * limit}&limit=${limit}`);
            let data = Array.isArray(res.data) ? res.data : [];
            
            if (filterType) data = data.filter(o => o.obj_type === filterType);
            
            data.sort((a, b) => a.id_obj - b.id_obj);
            setObjects(data);
        } catch (err) { setObjects([]); }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) await api.put(`/objects/${editingId}`, formData);
        else await api.post('/objects/', formData);
        setIsModalOpen(false); fetchObjects(); 
    };

    const handleDelete = async (id_obj) => {
        if (window.confirm('Удалить?')) { await api.delete(`/objects/${id_obj}`); fetchObjects(); }
    };

    const openModal = (obj = null) => {
        if (obj) { setFormData({ obj_name: obj.obj_name, obj_type: obj.obj_type, location: obj.location || '' }); setEditingId(obj.id_obj); } 
        else { setFormData({ obj_name: '', obj_type: 'Сервер', location: '' }); setEditingId(null); }
        setIsModalOpen(true);
    };

    const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '-5px' };
    const tdStyle = { padding: '12px', wordBreak: 'break-word', maxWidth: '200px' };

    return (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Реестр объектов</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>
                        <option value="">Все типы</option>
                        {availableTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    {canEdit && <button onClick={() => openModal()} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>+ Новый объект</button>}
                </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <th style={tdStyle}>ID</th><th style={tdStyle}>Название</th><th style={tdStyle}>Тип</th><th style={tdStyle}>Локация</th>{canEdit && <th style={{...tdStyle, textAlign: 'right'}}>Действия</th>}
                </tr></thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></td></tr>
                    ) : objects.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Нет записей</td></tr>
                    ) : (
                        objects.map(obj => (
                            <tr key={obj.id_obj} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={tdStyle}>{obj.id_obj}</td><td style={tdStyle}>{obj.obj_name}</td>
                                <td style={tdStyle}><span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{obj.obj_type}</span></td>
                                <td style={tdStyle}>{obj.location}</td>
                                {canEdit && (
                                    <td style={{...tdStyle, textAlign: 'right'}}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <button onClick={() => openModal(obj)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Изменить</button>
                                            <button onClick={() => handleDelete(obj.id_obj)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button disabled={page === 1 || isLoading} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Назад</button> 
                <span style={{ padding: '8px', fontWeight: 'bold', color: '#475569' }}>Страница {page}</span>
                <button disabled={objects.length < limit || isLoading} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Вперед</button>
            </div>
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>{editingId ? 'Редактировать' : 'Новый объект'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={labelStyle}>Название</label><input maxLength="100" value={formData.obj_name} onChange={e => setFormData({...formData, obj_name: e.target.value})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>Тип</label><input maxLength="50" value={formData.obj_type} onChange={e => setFormData({...formData, obj_type: e.target.value})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>Локация</label><input maxLength="150" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                <button type="submit" style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Сохранить</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#e2e8f0', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}