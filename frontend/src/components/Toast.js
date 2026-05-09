import { useState, useEffect } from 'react';

export default function Toast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleAppError = (event) => {
            const message = event.detail;
            const id = Date.now() + Math.random(); 
            
            setToasts(prev => {
                if (prev.some(t => t.message === message)) {
                    return prev;
                }
                
                setTimeout(() => {
                    setToasts(current => current.filter(t => t.id !== id));
                }, 5000);

                return [...prev, { id, message }];
            });
        };

        window.addEventListener('app_error', handleAppError);
        return () => window.removeEventListener('app_error', handleAppError);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {toasts.map(t => (
                <div key={t.id} style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    padding: '16px 20px', 
                    borderRadius: '8px', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', 
                    minWidth: '250px', 
                    maxWidth: '350px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    borderLeft: '4px solid #b91c1c',
                    animation: 'slideIn 0.3s ease-out forwards'
                }}>
                    <style>{`
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
                    <span style={{ fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word' }}>{t.message}</span>
                    <button 
                        onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} 
                        style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 'bold', marginLeft: '15px', padding: 0, fontSize: '16px' }}
                        title="Закрыть"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}