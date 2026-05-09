import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

export default function ResponseLogs() {
    const { currentUser } = useOutletContext();
    const canEdit = currentUser.role === 'admin' || currentUser.role === 'security';

    const [logs, setLogs] = useState([]);
    const [staffMap, setStaffMap] = useState({});
    const [measMap, setMeasMap] = useState({});
    const [incMap, setIncMap] = useState({});
    
    const [availableIncs, setAvailableIncs] = useState([]);
    const [availableMeas, setAvailableMeas] = useState([]);
    const [filterInc, setFilterInc] = useState('');
    const [filterMeas, setFilterMeas] = useState('');
    
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailsLog, setDetailsLog] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [modalError, setModalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ id_inc: 1, id_meas: 1, id_s: 1, date_exec: '', time_exec: '', result: '' });

    useEffect(() => { 
        fetchLookups();
        fetchLogs(); 
    }, [page, filterInc, filterMeas]);

    const fetchLookups = async () => {
        try {
            const [staffRes, measRes, incRes] = await Promise.all([
                api.get('/staff/?skip=0&limit=1000'),
                api.get('/response_measures/?skip=0&limit=1000'),
                api.get('/incidents/?skip=0&limit=1000')
            ]);
            
            const sMap = {};
            if (Array.isArray(staffRes.data)) staffRes.data.forEach(s => sMap[s.id_s] = `${s.surname} ${s.name[0]}.`);
            setStaffMap(sMap);

            const mMap = {};
            if (Array.isArray(measRes.data)) measRes.data.forEach(m => mMap[m.id_meas] = m.meas_name);
            setMeasMap(mMap);
            
            const iMap = {};
            if (Array.isArray(incRes.data)) incRes.data.forEach(i => iMap[i.id_inc] = i.inc_type);
            setIncMap(iMap);
        } catch (err) { console.error("Ошибка загрузки справочников"); }
    };

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const allRes = await api.get('/response_logs/?skip=0&limit=1000');
            if (Array.isArray(allRes.data)) {
                setAvailableIncs([...new Set(allRes.data.map(l => l.id_inc))].sort((a, b) => a - b));
                setAvailableMeas([...new Set(allRes.data.map(l => l.id_meas))].sort((a, b) => a - b));
            }

            const res = await api.get(`/response_logs/?skip=${(page - 1) * limit}&limit=${limit}`);
            let data = Array.isArray(res.data) ? res.data : [];
            
            if (filterInc) data = data.filter(l => l.id_inc.toString() === filterInc.toString());
            if (filterMeas) data = data.filter(l => l.id_meas.toString() === filterMeas.toString());
            
            data.sort((a, b) => a.id_log - b.id_log);
            setLogs(data);
        } catch (err) { setLogs([]); }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        
        try { await api.get(`/incidents/${formData.id_inc}`); } 
        catch (err) { return setModalError(`Ошибка: Инцидент с ID ${formData.id_inc} не найден.`); }

        try { await api.get(`/response_measures/${formData.id_meas}`); } 
        catch (err) { return setModalError(`Ошибка: Мера реагирования с ID ${formData.id_meas} не найдена.`); }

        try { await api.get(`/staff/${formData.id_s}`); } 
        catch (err) { return setModalError(`Ошибка: Сотрудник с ID ${formData.id_s} не найден.`); }

        let payload = { ...formData };
        if (payload.time_exec && payload.time_exec.length === 5) payload.time_exec += ':00';

        try {
            if (editingId) await api.put(`/response_logs/${editingId}`, payload);
            else await api.post('/response_logs/', payload);
            setIsModalOpen(false); fetchLogs();
        } catch (err) { setModalError('Ошибка при сохранении на сервере.'); }
    };

    const handleDelete = async (id_log) => {
        if (window.confirm('Удалить?')) { await api.delete(`/response_logs/${id_log}`); fetchLogs(); }
    };

    const openModal = (log = null) => {
        setModalError('');
        if (log) { setFormData({...log, time_exec: log.time_exec ? log.time_exec.slice(0, 8) : '', result: log.result || ''}); setEditingId(log.id_log); } 
        else { setFormData({ id_inc: 1, id_meas: 1, id_s: currentUser.id_s, date_exec: new Date().toISOString().split('T')[0], time_exec: '12:00:00', result: '' }); setEditingId(null); }
        setIsModalOpen(true);
    };

    const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '-5px' };
    const tdStyle = { padding: '12px', wordBreak: 'break-word', maxWidth: '200px' };
    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Журнал реагирования</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select value={filterInc} onChange={e => setFilterInc(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                        <option value="">Все инциденты (ID)</option>
                        {availableIncs.map(i => <option key={i} value={i}>{i} ({incMap[i] || '...'})</option>)}
                    </select>
                    <select value={filterMeas} onChange={e => setFilterMeas(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                        <option value="">Все меры (ID)</option>
                        {availableMeas.map(m => <option key={m} value={m}>{m} ({measMap[m] || '...'})</option>)}
                    </select>
                    {canEdit && <button onClick={() => openModal()} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>+ Запись</button>}
                </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <th style={tdStyle}>ID</th><th style={tdStyle}>Инцидент</th><th style={tdStyle}>Мера</th><th style={tdStyle}>Дата / Время</th><th style={{...tdStyle, textAlign: 'right'}}>Действия</th>
                </tr></thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></td></tr>
                    ) : logs.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Нет записей</td></tr> : logs.map(l => (
                        <tr key={l.id_log} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={tdStyle}>{l.id_log}</td>
                            <td style={tdStyle}>{l.id_inc} <span style={{color: '#64748b'}}>({incMap[l.id_inc] || '...'})</span></td>
                            <td style={tdStyle}>{l.id_meas} <span style={{color: '#64748b'}}>({measMap[l.id_meas] || '...'})</span></td>
                            <td style={tdStyle}>{l.date_exec} {l.time_exec}</td>
                            <td style={{...tdStyle, textAlign: 'right'}}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button onClick={() => setDetailsLog(l)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Подробнее</button>
                                    {canEdit && (
                                        <>
                                            <button onClick={() => openModal(l)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Изменить</button>
                                            <button onClick={() => handleDelete(l.id_log)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
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
                <span style={{ padding: '8px', fontWeight: 'bold' }}>Страница {page}</span>
                <button disabled={logs.length < limit || isLoading} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Вперед</button>
            </div>

            {detailsLog && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', wordBreak: 'break-word' }}>Запись реагирования #{detailsLog.id_log}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            <div><strong>Инцидент:</strong> {detailsLog.id_inc} ({incMap[detailsLog.id_inc] || 'Неизвестно'})</div>
                            <div><strong>Мера:</strong> {detailsLog.id_meas} ({measMap[detailsLog.id_meas] || 'Неизвестно'})</div>
                            <div><strong>Ответственный:</strong> {detailsLog.id_s} ({staffMap[detailsLog.id_s] || 'Неизвестно'})</div>
                            <div><strong>Дата и время:</strong> {detailsLog.date_exec} {detailsLog.time_exec}</div>
                            <div><strong>Результат:</strong><br/><div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginTop: '5px' }}>{detailsLog.result || 'Нет описания результата'}</div></div>
                        </div>
                        <button onClick={() => setDetailsLog(null)} style={{ width: '100%', marginTop: '20px', background: '#e2e8f0', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Закрыть</button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px' }}>
                        <h3 style={{ marginTop: 0 }}>{editingId ? 'Редактировать' : 'Новая запись'}</h3>
                        {modalError && <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', wordBreak: 'break-word' }}>{modalError}</div>}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}><label style={labelStyle}>ID Инцидента</label><input type="number" min="1" value={formData.id_inc} onChange={e => setFormData({...formData, id_inc: parseInt(e.target.value)})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/></div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}><label style={labelStyle}>ID Меры</label><input type="number" min="1" value={formData.id_meas} onChange={e => setFormData({...formData, id_meas: parseInt(e.target.value)})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/></div>
                            </div>
                            <label style={labelStyle}>ID Сотрудника</label><input type="number" min="1" value={formData.id_s} onChange={e => setFormData({...formData, id_s: parseInt(e.target.value)})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}><label style={labelStyle}>Дата</label><input type="date" min="2020-01-01" max={todayDate} value={formData.date_exec} onChange={e => setFormData({...formData, date_exec: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/></div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}><label style={labelStyle}>Время</label><input type="time" step="1" value={formData.time_exec} onChange={e => setFormData({...formData, time_exec: e.target.value})} required style={{ padding: '8px', border: '1px solid #cbd5e1' }}/></div>
                            </div>
                            <label style={labelStyle}>Результат</label><textarea value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} rows="2" style={{ padding: '8px', border: '1px solid #cbd5e1' }}/>
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