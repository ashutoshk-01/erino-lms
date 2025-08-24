import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const checkAuthStatus = async () => {
        if (authChecked) return;
        
        try {
            setLoading(true);
            const response = await authAPI.getCurrentUser();
            setUser(response.data.user);
        } catch (error) {
            console.error('Auth check error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            setUser(null);
        } finally {
            setLoading(false);
            setAuthChecked(true);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async(email , password) =>{
        setLoading(true);
        try {
            const response = await authAPI.login(email , password);
            console.log('Login response:', response.data);
            setUser(response.data.user);
            await checkAuthStatus(); // Verify the auth state immediately after login
            return {success : true};
        } catch (error) {
            console.error('Login error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            return {
                success : false,
                message : error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) =>{
        setLoading(true);
        try {
            const response = await authAPI.register(userData);
            setUser(response.data.user);
            return {success : true};
        } catch (error) {
            return {
                success : false,
                message : error.response?.data?.message || 'Registration failed'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async() =>{
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:' , error);
        }finally{
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};