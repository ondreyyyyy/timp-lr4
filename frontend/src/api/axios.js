import axios from 'axios';

const api = axios.create({
    baseURL: '/api', 
});

let isRedirecting = false; 

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        if (isRedirecting) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/login') {
            originalRequest._retry = true;
            try {
                const res = await axios.post('/api/refresh', {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                localStorage.setItem('token', res.data.access_token);
                originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                if (!isRedirecting) {
                    isRedirecting = true; 
                    localStorage.removeItem('token');
                    window.dispatchEvent(new CustomEvent('app_error', { detail: 'Сессия истекла. Перенаправление на страницу входа...' }));
                    
                    setTimeout(() => {
                        isRedirecting = false;
                        window.location.href = '/login';
                    }, 2500);
                }
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 403) {
            window.dispatchEvent(new CustomEvent('app_error', { detail: 'Ошибка 403: У вас нет прав для выполнения этого действия.' }));
            return Promise.reject(error);
        }

        if (error.response && !(error.response.status === 401 && originalRequest.url === '/login')) {
            const errorMsg = error.response.data?.detail || `Ошибка сервера: ${error.response.status}`;
            window.dispatchEvent(new CustomEvent('app_error', { detail: errorMsg }));
        } else if (!error.response) {
            window.dispatchEvent(new CustomEvent('app_error', { detail: 'Ошибка сети. Сервер недоступен.' }));
        }

        return Promise.reject(error);
    }
);

export default api;
