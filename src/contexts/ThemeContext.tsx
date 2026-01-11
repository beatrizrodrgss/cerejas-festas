import { createContext, useContext, useEffect, useState } from "react";

type Theme = "cherry" | "blue" | "green" | "purple" | "orange";

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const initialState: ThemeProviderState = {
    theme: "cherry",
    setTheme: () => null,
    isDarkMode: false,
    toggleDarkMode: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "cherry",
    storageKey = "cerejas-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        return localStorage.getItem(`${storageKey}-mode`) === 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old theme attributes
        root.removeAttribute("data-theme");

        if (theme !== "cherry") {
            root.setAttribute("data-theme", theme);
        }
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
        isDarkMode,
        toggleDarkMode: () => {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            localStorage.setItem(`${storageKey}-mode`, newMode ? 'dark' : 'light');
        },
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
