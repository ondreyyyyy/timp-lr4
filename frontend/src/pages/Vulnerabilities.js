import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

export default function Vulnerabilities() {
    const { currentUser } = useOutletContext();
    const canEdit = currentUser.role === 'admin' || currentUser.role === 'security';

    const [vulns, setVulns] = useState([]);
    const [vulTypesMap, setVulTypesMap] = useState({});
    const [staffMap, setStaffMap] = useState({});
    
    const [availableTypes, setAvailableTypes] = useState([]);
    const [availableStatuses, setAvailableStatuses] = useState([]);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailsVuln, setDetailsVuln] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [modalError, setModalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ id_s: 1, id_vultype: 1, sw_ver: '', fix_status: 'Открыта' });

    useEffect(() => { 
        fetchLookups();
        fetchVulns(); 
    }, [page, filterType, filterStatus]);

    const fetchLookups = async () => {
        try {
            const [vtRes, staffRes] = await Promise.all([
                api.get('/vulnerability_types/?skip=0&limit=1000'),
                api.get('/staff/?skip=0&limit=1000')
            ]);
            
            const vtMap = {};
            if (Array.isArray(vtRes.data)) vtRes.data.forEach(t => vtMap[t.id_vultype] = t.type_name);
            setVulTypesMap(vtMap);

            const sMap = {};
            if (Array.isArray(staffRes.data)) staffRes.data.forEach(s => sMap[s.id_s] = `${s.surname} ${s.name[0]}.`);
            setStaffMap(sMap);
        } catch (err) { console.error("Ошибка загрузки справочников"); }
    };

    const fetchVulns = async () => {
        setIsLoading(true);
        try {
            const allRes = await api.get('/vulnerabilities/?skip=0&limit=1000');
            if (Array.isArray(allRes.data)) {
                setAvailableTypes([...new Set(allRes.data.map(v => v.id_vultype))].sort((a, b) => a - b));
                setAvailableStatuses([...new Set(allRes.data.map(v => v.fix_status))]);
            }

            const res = await api.get(`/vulnerabilities/?skip=${(page - 1) * limit}&limit=${limit}`);
            let data = Array.isArray(res.data) ? res.data : [];
            
            if (filterType) data = data.filter(v => v.id_vultype.toString() === filterType.toString());
            if (filterStatus) data = data.filter(v => v.fix_status === filterStatus);
            
            data.sort((a, b) => a.id_vul - b.id_vul);
            setVulns(data);
        } catch (err) { setVulns([]); }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');

        try { await api.get(`/staff/${formData.id_s}`); } 
        catch (err) { return setModalError(`Ошибка: Сотрудник с ID ${formData.id_s} не найден.`); }

        try { await api.get(`/vulnerability_types/${formData.id_vultype}`); } 
        catch (err) { return setModalError(`Ошибка: Тип уязвимости с ID ${formData.id_vultype} не найден.`); }

        try {
            if (editingId) await api.put(`/vulnerabilities/${editingId}`, formData);
            else await api.post('/vulnerabilities/', formData);
            setIsModalOpen(false); fetchVulns();
        } catch (err) { setModalError('Ошибка при сохранении на сервере.'); }
    };

    const handleDelete = async (id_vul) => {
        if (window.confirm('Удалить?')) { await api.delete(`/vulnerabilities/${id_vul}`); fetchVulns(); }
    };

    const openModal = (v = null) => {
        setModalError('');
        if (v) { setFormData({ id_s: v.id_s, id_vultype: v.id_vultype, sw_ver: v.sw_ver || '', fix_status: v.fix_status }); setEditingId(v.id_vul); } 
        else { setFormData({ id_s: currentUser.id_s, id_vultype: 1, sw_ver: '', fix_status: 'Открыта' }); setEditingId(null); }
        setIsModalOpen(true);
    };

    const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '-5px' };
    const tdStyle = { padding: '12px', wordBreak: 'break-word', maxWidth: '200px' };

    return (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>База уязвимостей</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                        <option value="">Все типы</option>
                        {availableTypes.map(t => <option key={t} value={t}>{t} ({vulTypesMap[t] || '...'})</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                        <option value="">Все статусы</option>
                        {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {canEdit && <button onClick={() => openModal()} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>+ Уязвимость</button>}
                </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <th style={tdStyle}>ID</th><th style={tdStyle}>Тип (ID)</th><th style={tdStyle}>Версия ПО</th><th style={tdStyle}>Статус</th><th style={{...tdStyle, textAlign: 'right'}}>Действия</th>
                </tr></thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></td></tr>
                    ) : vulns.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Нет записей</td></tr> : vulns.map(v => (
                        <tr key={v.id_vul} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={tdStyle}>{v.id_vul}</td>
                            <td style={tdStyle}>{v.id_vultype} <span style={{color: '#64748b'}}>({vulTypesMap[v.id_vultype] || '...'})</span></td>
                            <td style={tdStyle}>{v.sw_ver}</td>
                            <td style={tdStyle}>{v.fix_status}</td>
                            <td style={{...tdStyle, textAlign: 'right'}}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button onClick={() => setDetailsVuln(v)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Подробнее</button>
                                    {canEdit && (
                                        <>
                                            <button onClick={() => openModal(v)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Изменить</button>
                                            <button onClick={() => handleDelete(v.id_vul)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
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
                <button disabled={vulns.length < limit || isLoading} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>Вперед</button>
            </div>

            {detailsVuln && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', wordBreak: 'break-word' }}>Уязвимость #{detailsVuln.id_vul}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            <div><strong>Тип:</strong> {detailsVuln.id_vultype} ({vulTypesMap[detailsVuln.id_vultype] || 'Неизвестно'})</div>
                            <div><strong>Ответственный:</strong> {detailsVuln.id_s} ({staffMap[detailsVuln.id_s] || 'Неизвестно'})</div>
                            <div><strong>Версия ПО:</strong> {detailsVuln.sw_ver || '-'}</div>
                            <div><strong>Статус:</strong> <span style={{ fontWeight: 'bold' }}>{detailsVuln.fix_status}</span></div>
                        </div>
                        <button onClick={() => setDetailsVuln(null)} style={{ width: '100%', marginTop: '20px', background: '#e2e8f0', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Закрыть</button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>{editingId ? 'Редактировать' : 'Новая уязвимость'}</h3>
                        {modalError && <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', wordBreak: 'break-word' }}>{modalError}</div>}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={labelStyle}>ID Сотрудника</label><input type="number" min="1" value={formData.id_s} onChange={e => setFormData({...formData, id_s: parseInt(e.target.value)})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>ID Типа уязвимости</label><input type="number" min="1" value={formData.id_vultype} onChange={e => setFormData({...formData, id_vultype: parseInt(e.target.value)})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>Версия ПО</label><input maxLength="50" value={formData.sw_ver} onChange={e => setFormData({...formData, sw_ver: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            <label style={labelStyle}>Статус исправления</label><input maxLength="50" value={formData.fix_status} onChange={e => setFormData({...formData, fix_status: e.target.value})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
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