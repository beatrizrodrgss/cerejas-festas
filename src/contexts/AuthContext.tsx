import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored user on mount
        const storedUser = localStorage.getItem('cerejas_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('cerejas_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use storage validation
        // Dynamic import to avoid circular dependency issues if any, though likely fine here
        const { userStorage } = await import('@/lib/storage');

        const user = userStorage.validateLogin(email, password);

        if (user) {
            setUser(user);
            localStorage.setItem('cerejas_user', JSON.stringify(user));
        } else {
            throw new Error('E-mail ou senha inválidos');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('cerejas_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
