import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

export default function ResponseMeasures() {
    const { currentUser } = useOutletContext();
    const canEdit = currentUser.role === 'admin';

    const [measures, setMeasures] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ meas_name: '', time_reg: 0 });

    useEffect(() => { fetchMeasures(); }, [page]);

    const fetchMeasures = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/response_measures/?skip=${(page - 1) * limit}&limit=${limit}`);
            let data = Array.isArray(res.data) ? res.data : [];
            data.sort((a, b) => a.id_meas - b.id_meas);
            setMeasures(data);
        } catch (err) { setMeasures([]); }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) await api.put(`/response_measures/${editingId}`, formData);
        else await api.post('/response_measures/', formData);
        setIsModalOpen(false); fetchMeasures();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить меру?')) { await api.delete(`/response_measures/${id}`); fetchMeasures(); }
    };

    const openModal = (item = null) => {
        if (item) { setFormData({ meas_name: item.meas_name, time_reg: item.time_reg || 0 }); setEditingId(item.id_meas); } 
        else { setFormData({ meas_name: '', time_reg: 0 }); setEditingId(null); }
        setIsModalOpen(true);
    };

    const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '-5px' };
    const tdStyle = { padding: '12px', wordBreak: 'break-word', maxWidth: '250px' };

    return (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Справочник: Меры реагирования</h2>
                {canEdit && <button onClick={() => openModal()} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>+ Новая мера</button>}
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <th style={tdStyle}>ID</th><th style={tdStyle}>Название меры</th><th style={tdStyle}>Время (мин)</th>{canEdit && <th style={{...tdStyle, textAlign: 'right'}}>Действия</th>}
                </tr></thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></td></tr>
                    ) : measures.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Нет записей</td></tr>
                    ) : (
                        measures.map(m => (
                            <tr key={m.id_meas} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={tdStyle}>{m.id_meas}</td><td style={tdStyle}>{m.meas_name}</td><td style={tdStyle}>{m.time_reg}</td>
                                {canEdit && (
                                    <td style={{...tdStyle, textAlign: 'right'}}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <button onClick={() => openModal(m)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Изменить</button>
                                            <button onClick={() => handleDelete(m.id_meas)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button disabled={page === 1 || isLoading} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: (page===1 || isLoading) ? 'not-allowed':'pointer' }}>Назад</button> 
                <span style={{ padding: '8px', fontWeight: 'bold', color: '#475569' }}>Страница {page}</span>
                <button disabled={measures.length < limit || isLoading} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: (measures.length<limit || isLoading) ? 'not-allowed':'pointer' }}>Вперед</button>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>{editingId ? 'Редактировать' : 'Новая мера'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={labelStyle}>Название меры</label>
                            <input maxLength="150" value={formData.meas_name} onChange={e => setFormData({...formData, meas_name: e.target.value})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            
                            <label style={labelStyle}>Время (мин)</label>
                            <input type="number" min="0" value={formData.time_reg} onChange={e => setFormData({...formData, time_reg: parseInt(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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