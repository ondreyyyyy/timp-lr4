import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

export default function Incidents() {
    const { currentUser } = useOutletContext();
    const canEdit = currentUser.role === 'admin' || currentUser.role === 'security';

    const [incidents, setIncidents] = useState([]);
    const [overdueIncidents, setOverdueIncidents] = useState([]);
    const [objectsMap, setObjectsMap] = useState({});
    const [staffMap, setStaffMap] = useState({});
    
    const [availableThreats, setAvailableThreats] = useState([]);
    const [availableStates, setAvailableStates] = useState([]);
    const [filterThreat, setFilterThreat] = useState('');
    const [filterState, setFilterState] = useState('');
    
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailsInc, setDetailsInc] = useState(null); 
    const [editingId, setEditingId] = useState(null);
    const [modalError, setModalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ id_obj: 1, id_s: 1, inc_type: '', inc_date: '', inc_time: '', threat_lvl: 1, state: 'Открыт' });

    useEffect(() => { 
        fetchLookups();
        fetchIncidents(); 
        fetchOverdueIncidents();
    }, [page, filterThreat, filterState]);

    const fetchLookups = async () => {
        try {
            const [objRes, staffRes] = await Promise.all([
                api.get('/objects/?skip=0&limit=1000'),
                api.get('/staff/?skip=0&limit=1000')
            ]);
            
            const objMap = {};
            if (Array.isArray(objRes.data)) objRes.data.forEach(o => objMap[o.id_obj] = o.obj_name);
            setObjectsMap(objMap);

            const sMap = {};
            if (Array.isArray(staffRes.data)) staffRes.data.forEach(s => sMap[s.id_s] = `${s.surname} ${s.name[0]}.`);
            setStaffMap(sMap);
        } catch (err) { console.error("Ошибка загрузки справочников"); }
    };

    const fetchIncidents = async () => {
        setIsLoading(true);
        try {
            const allRes = await api.get('/incidents/?skip=0&limit=1000');
            if (Array.isArray(allRes.data)) {
                setAvailableThreats([...new Set(allRes.data.map(i => i.threat_lvl))].sort((a, b) => a - b));
                setAvailableStates([...new Set(allRes.data.map(i => i.state))]);
            }

            const res = await api.get(`/incidents/?skip=${(page - 1) * limit}&limit=${limit}`);
            let data = Array.isArray(res.data) ? res.data : [];
            
            if (filterThreat) data = data.filter(i => i.threat_lvl.toString() === filterThreat.toString());
            if (filterState) data = data.filter(i => i.state === filterState);
            
            data.sort((a, b) => a.id_inc - b.id_inc);
            setIncidents(data);
        } catch (err) { setIncidents([]); }
        setIsLoading(false);
    };

    const fetchOverdueIncidents = async () => {
        try {
            const res = await api.get('/incidents/overdue');
            setOverdueIncidents(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setOverdueIncidents([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        
        try { await api.get(`/objects/${formData.id_obj}`); } 
        catch (err) { return setModalError(`Ошибка: Объект с ID ${formData.id_obj} не найден.`); }

        try { await api.get(`/staff/${formData.id_s}`); } 
        catch (err) { return setModalError(`Ошибка: Сотрудник с ID ${formData.id_s} не найден.`); }

        let payload = { ...formData };
        if (payload.inc_time && payload.inc_time.length === 5) payload.inc_time += ':00';

        try {
            if (editingId) await api.put(`/incidents/${editingId}`, payload);
            else await api.post('/incidents/', payload);
            setIsModalOpen(false); fetchIncidents();
        } catch (err) { setModalError('Ошибка при сохранении на сервере.'); }
    };

    const handleDelete = async (id_inc) => {
        if (window.confirm('Удалить?')) { await api.delete(`/incidents/${id_inc}`); fetchIncidents(); }
    };

    const openModal = (inc = null) => {
        setModalError('');
        if (inc) { setFormData({...inc, inc_time: inc.inc_time ? inc.inc_time.slice(0, 8) : ''}); setEditingId(inc.id_inc); } 
        else { setFormData({ id_obj: 1, id_s: currentUser.id_s, inc_type: '', inc_date: new Date().toISOString().split('T')[0], inc_time: '12:00:00', threat_lvl: 1, state: 'Открыт' }); setEditingId(null); }
        setIsModalOpen(true);
    };

    const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '-5px' };
    const tdStyle = { padding: '12px', wordBreak: 'break-word', maxWidth: '200px' };
    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            {overdueIncidents.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                    Внимание: обнаружены инциденты с реагированием дольше 24 часов ({overdueIncidents.map(i => `#${i.id_inc}`).join(', ')}).
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Журнал инцидентов</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select value={filterThreat} onChange={e => setFilterThreat(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                        <option value="">Все угрозы</option>
                        {availableThreats.map(t => <option key={t} value={t}>Угроза: {t}</option>)}
                    </select>
                    <select value={filterState} onChange={e => setFilterState(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                        <option value="">Все состояния</option>
                        {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {canEdit && <button onClick={() => openModal()} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>+ Инцидент</button>}
                </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <th style={tdStyle}>ID</th><th style={tdStyle}>Объект</th><th style={tdStyle}>Тип</th><th style={tdStyle}>Дата / Время</th><th style={tdStyle}>Состояние</th><th style={{...tdStyle, textAlign: 'right'}}>Действия</th>
                </tr></thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}><div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></td></tr>
                    ) : incidents.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Нет записей</td></tr> : incidents.map(inc => (
                        <tr key={inc.id_inc} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={tdStyle}>{inc.id_inc}</td>
                            <td style={tdStyle}>{inc.id_obj} <span style={{color: '#64748b'}}>({objectsMap[inc.id_obj] || '...'})</span></td>
                            <td style={tdStyle}>{inc.inc_type}</td>
                            <td style={tdStyle}>{inc.inc_date} {inc.inc_time}</td>
                            <td style={tdStyle}>{inc.state}</td>
                            <td style={{...tdStyle, textAlign: 'right'}}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button onClick={() => setDetailsInc(inc)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Подробнее</button>
                                    {canEdit && (
                                        <>
                                            <button onClick={() => openModal(inc)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Изменить</button>
                                            <button onClick={() => handleDelete(inc.id_inc)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button disabled={page === 1 || isLoading} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Назад</button> 
                <span style={{ padding: '8px', fontWeight: 'bold', color: '#475569' }}>Страница {page}</span>
                <button disabled={incidents.length < limit || isLoading} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Вперед</button>
            </div>

            {detailsInc && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', wordBreak: 'break-word' }}>Детали инцидента #{detailsInc.id_inc}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            <div><strong>Объект:</strong> {detailsInc.id_obj} ({objectsMap[detailsInc.id_obj] || 'Неизвестно'})</div>
                            <div><strong>Ответственный:</strong> {detailsInc.id_s} ({staffMap[detailsInc.id_s] || 'Неизвестно'})</div>
                            <div><strong>Тип:</strong> {detailsInc.inc_type}</div>
                            <div><strong>Дата и время:</strong> {detailsInc.inc_date} {detailsInc.inc_time}</div>
                            <div><strong>Уровень угрозы:</strong> <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px' }}>{detailsInc.threat_lvl} / 10</span></div>
                            <div><strong>Состояние:</strong> {detailsInc.state}</div>
                        </div>
                        <button onClick={() => setDetailsInc(null)} style={{ width: '100%', marginTop: '20px', background: '#e2e8f0', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Закрыть</button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px' }}>
                        <h3 style={{ marginTop: 0 }}>{editingId ? 'Редактировать' : 'Новый инцидент'}</h3>
                        {modalError && <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', wordBreak: 'break-word' }}>{modalError}</div>}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={labelStyle}>ID Объекта</label><input type="number" min="1" value={formData.id_obj} onChange={e => setFormData({...formData, id_obj: parseInt(e.target.value)})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>ID Сотрудника</label><input type="number" min="1" value={formData.id_s} onChange={e => setFormData({...formData, id_s: parseInt(e.target.value)})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>Тип инцидента</label><input maxLength="100" value={formData.inc_type} onChange={e => setFormData({...formData, inc_type: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}><label style={labelStyle}>Дата</label><input type="date" min="2020-01-01" max={todayDate} value={formData.inc_date} onChange={e => setFormData({...formData, inc_date: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/></div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}><label style={labelStyle}>Время</label><input type="time" step="1" value={formData.inc_time} onChange={e => setFormData({...formData, inc_time: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/></div>
                            </div>
                            <label style={labelStyle}>Уровень угрозы (1-10)</label><input type="number" min="1" max="10" value={formData.threat_lvl} onChange={e => setFormData({...formData, threat_lvl: parseInt(e.target.value)})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>Состояние</label><input maxLength="100" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
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
