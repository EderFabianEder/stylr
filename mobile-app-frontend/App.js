import React, { useState } from 'react';
import { Search, Home, User, Settings } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    };

    if (!isAuthenticated) {
        return currentScreen === 'login' ? (
            <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setCurrentScreen('register')} />
        ) : (
            <RegisterScreen onRegister={handleRegister} onNavigateToLogin={() => setCurrentScreen('login')} />
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF5A5F" />

            <View style={styles.contentArea}>
                {activeTab === 'home' && <HomeScreen />}
                {activeTab === 'profile' && <ProfileScreen user={user} onLogout={handleLogout} />}
                {activeTab === 'settings' && (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Settings</Text>
                        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
                    </View>
                )}
                {activeTab === 'search' && (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Search Users</Text>
                        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
                    </View>
                )}
            </View>

            {/* Bottom Navigation mit Gradient und weißen simplen Icons */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomNavGradient}
            >
                <View style={styles.bottomNav}>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('profile')}
                    >
                        <User size={24} color="white" />
                        <Text style={styles.navIconLabel}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('home')}
                    >
                        <Home size={24} color="white" />
                        <Text style={styles.navIconLabel}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('settings')}
                    >
                        <Settings size={24} color="white" />
                        <Text style={styles.navIconLabel}>Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('search')}
                    >
                        <Search size={24} color="white" />
                        <Text style={styles.navIconLabel}>Search</Text>
                    </TouchableOpacity>
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
        paddingBottom: 34,
    },
    bottomNav: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingTop: 12,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
    },
    navIcon: {
        fontSize: 24,
        color: '#fff',
        opacity: 0.6,
        fontWeight: '300',
    },
    navIconActive: {
        opacity: 1,
        fontWeight: 'bold',
    },
    navIconLabel: {
        fontSize: 10,
        color: '#fff',
        marginTop: 4,
        opacity: 0.8,
    },
});