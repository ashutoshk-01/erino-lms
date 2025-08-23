import axios from 'axios';

// Create a function to initialize the API with navigate
const createAPI = (navigate) => {
    const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
        withCredentials: true,
        headers: {
            "Content-Type": 'application/json',
        },
    });

    api.interceptors.request.use(
        (config) => {
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    api.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response?.status === 401 && navigate) {
                navigate('/login');
            }
            return Promise.reject(error);
        }
    );

    return api;
}

const api = createAPI(); // Default instance without navigation

//Auth api
export const createAuthAPI = (navigate) => {
    const api = createAPI(navigate);
    return {
        register: (userData) => api.post('/auth/register', userData),
        login: (email, password) => api.post('/auth/login', { email, password }),
        logout: () => api.post('/auth/logout'),
        getCurrentUser: () => api.get('/auth/me')
    };
};

export const authAPI = createAuthAPI(); // Default instance without navigation

//Leads API

export const leadsAPI = {
    getLeads: (params = {}) => {
        return api.get('/leads', { params });
    },
    createLead: (leadData) => api.post('/leads', leadData),
    getLead: (id) => api.get(`/leads/${id}`),
    updateLead: (id, leadData) => api.put(`/leads/${id}`, leadData),
    deleteLead: (id) => api.delete(`/leads/${id}`),
}

export default api;