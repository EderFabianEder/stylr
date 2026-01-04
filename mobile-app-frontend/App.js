import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('login');
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('home');

    const handleLogin = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleRegister = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setCurrentScreen('login');
        setActiveTab('home');
    };

    // Auth Flow
    if (!isAuthenticated) {
        if (currentScreen === 'login') {
            return (
                <LoginScreen
                    onLogin={handleLogin}
                    onNavigateToRegister={() => setCurrentScreen('register')}
                />
            );
        } else {
            return (
                <RegisterScreen
                    onRegister={handleRegister}
                    onNavigateToLogin={() => setCurrentScreen('login')}
                />
            );
        }
    }

    // Main App
    return (
        <SafeAreaView style={styles.safeArea}>
            {activeTab === 'home' ? (
                <HomeScreen />
            ) : (
                <ProfileScreen user={user} onLogout={handleLogout} />
            )}

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => setActiveTab('home')}
                >
                    <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>
                        🏠
                    </Text>
                    <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
                        Home
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => setActiveTab('profile')}
                >
                    <Text style={[styles.navIcon, activeTab === 'profile' && styles.navIconActive]}>
                        👤
                    </Text>
                    <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
                        Profil
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingVertical: 10,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 5,
    },
    navIcon: {
        fontSize: 24,
        marginBottom: 4,
        opacity: 0.5,
    },
    navIconActive: {
        opacity: 1,
    },
    navLabel: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    navLabelActive: {
        color: '#2c3e50',
        fontWeight: 'bold',
    },
});