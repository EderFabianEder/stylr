import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Home, User, Settings, Lock } from 'lucide-react-native';
import { authService, onUnauthorized } from './src/services/api';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isRestoringSession, setIsRestoringSession] = useState(true);
    const [currentScreen, setCurrentScreen] = useState('login');
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [blockedUsers, setBlockedUsers] = useState([]);

    // Admin check - tokenAbilities returns 'admin:*' for admins
    const isAdmin = user?.is_admin === true || user?.is_admin === 1 ||
        user?.abilities?.includes('admin:*');

    // Session beim App-Start aus AsyncStorage wiederherstellen
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) return;
                const response = await authService.getUser();
                if (cancelled) return;
                const userData = {
                    ...(response.data?.user || response.data),
                    abilities: response.data?.abilities || [],
                };
                if (userData?.id) {
                    setUser(userData);
                    setIsAuthenticated(true);
                }
            } catch (e) {
                // Token ungültig / Netzwerkfehler — User muss sich neu einloggen
            } finally {
                if (!cancelled) setIsRestoringSession(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Globaler 401-Handler: Token abgelaufen → zurück zum Login
    useEffect(() => {
        const unsubscribe = onUnauthorized(() => {
            setIsAuthenticated(false);
            setUser(null);
            setBlockedUsers([]);
            setCurrentScreen('login');
            setActiveTab('home');
        });
        return unsubscribe;
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleRegister = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    // Add this new function to update user profile
    const handleUpdateProfile = (updatedUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedUserData
        }));
    };

    const handleBlockUser = (userToBlock) => {
        setBlockedUsers(prev => [...prev, userToBlock]);
    };

    const handleUnblockUser = (userId) => {
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            // Even if logout API fails, clear local state
        }
        setIsAuthenticated(false);
        setUser(null);
        setBlockedUsers([]);
        setCurrentScreen('login');
        setActiveTab('home');
    };

    // Während Session-Restore: Splash/Loading
    if (isRestoringSession) {
        return (
            <View style={styles.splashContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#FF5A5F" />
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    style={StyleSheet.absoluteFill}
                />
                <Text style={styles.splashLogo}>STYLR</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
            </View>
        );
    }

    // Auth Flow
    if (!isAuthenticated) {
        return currentScreen === 'login' ? (
            <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setCurrentScreen('register')} />
        ) : (
            <RegisterScreen onRegister={handleRegister} onNavigateToLogin={() => setCurrentScreen('login')} />
        );
    }

    // Define tabs - conditionally include admin
    const tabs = [
        { key: 'profile', icon: User, label: 'Profil' },
        { key: 'home', icon: Home, label: 'Home' },
        { key: 'search', icon: Search, label: 'Suche' },
        ...(isAdmin ? [{ key: 'admin', icon: Lock, label: 'Admin' }] : []),
        { key: 'settings', icon: Settings, label: 'Einstellungen' },
    ];

    // Main App Content
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF5A5F" />

            <View style={styles.contentArea}>
                {activeTab === 'home' && <HomeScreen user={user} onBlockUser={handleBlockUser} />}
                {activeTab === 'profile' && <ProfileScreen user={user} onUpdateUser={handleUpdateProfile} onLogout={handleLogout} />}
                {activeTab === 'search' && <SearchScreen blockedUsers={blockedUsers} onBlockUser={handleBlockUser} currentUser={user} />}
                {activeTab === 'settings' && <SettingsScreen user={user} onLogout={handleLogout} blockedUsers={blockedUsers} onUnblockUser={handleUnblockUser} />}
                {activeTab === 'admin' && isAdmin && <AdminDashboardScreen user={user} />}
            </View>

            {/* Bottom Navigation with Lucide Icons */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomNavGradient}
            >
                <View style={styles.bottomNav}>
                    {tabs.map(tab => {
                        const IconComponent = tab.icon;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={styles.navItem}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <IconComponent
                                    size={24}
                                    color="white"
                                    style={activeTab === tab.key ? styles.navIconActive : styles.navIconInactive}
                                />
                                <Text style={[styles.navIconLabel, activeTab === tab.key && styles.labelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF5A5F',
    },
    contentArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholderSubtext: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    bottomNavGradient: {
        paddingBottom: 30, // Space for iPhone home indicator
    },
    bottomNav: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navIconInactive: {
        opacity: 0.5,
    },
    navIconActive: {
        opacity: 1,
    },
    navIconLabel: {
        fontSize: 10,
        color: '#fff',
        marginTop: 4,
        opacity: 0.6,
    },
    labelActive: {
        opacity: 1,
        fontWeight: 'bold',
    },
    splashContainer: {
        flex: 1,
        backgroundColor: '#FF5A5F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    splashLogo: {
        color: '#fff',
        fontSize: 42,
        fontWeight: 'bold',
        letterSpacing: 6,
    },
});