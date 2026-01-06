import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Home, User, Settings } from 'lucide-react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';

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

    // Add this new function to update user profile
    const handleUpdateProfile = (updatedUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedUserData
        }));
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setCurrentScreen('login');
    };

    // Auth Flow
    if (!isAuthenticated) {
        return currentScreen === 'login' ? (
            <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setCurrentScreen('register')} />
        ) : (
            <RegisterScreen onRegister={handleRegister} onNavigateToLogin={() => setCurrentScreen('login')} />
        );
    }

    // Main App Content
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF5A5F" />

            <View style={styles.contentArea}>
                {activeTab === 'home' && <HomeScreen user={user} />}
                {activeTab === 'profile' && <ProfileScreen user={user} onUpdateUser={handleUpdateProfile} onLogout={handleLogout} />}
                {activeTab === 'search' && <SearchScreen />}
                {activeTab === 'settings' && (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Settings</Text>
                        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
                    </View>
                )}
            </View>

            {/* Bottom Navigation with Lucide Icons */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomNavGradient}
            >
                <View style={styles.bottomNav}>
                    {/* Profile Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('profile')}
                    >
                        <User
                            size={24}
                            color="white"
                            style={activeTab === 'profile' ? styles.navIconActive : styles.navIconInactive}
                        />
                        <Text style={[styles.navIconLabel, activeTab === 'profile' && styles.labelActive]}>
                            Profile
                        </Text>
                    </TouchableOpacity>

                    {/* Home Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('home')}
                    >
                        <Home
                            size={24}
                            color="white"
                            style={activeTab === 'home' ? styles.navIconActive : styles.navIconInactive}
                        />
                        <Text style={[styles.navIconLabel, activeTab === 'home' && styles.labelActive]}>
                            Home
                        </Text>
                    </TouchableOpacity>

                    {/* Search Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('search')}
                    >
                        <Search
                            size={24}
                            color="white"
                            style={activeTab === 'search' ? styles.navIconActive : styles.navIconInactive}
                        />
                        <Text style={[styles.navIconLabel, activeTab === 'search' && styles.labelActive]}>
                            Search
                        </Text>
                    </TouchableOpacity>

                    {/* Settings Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('settings')}
                    >
                        <Settings
                            size={24}
                            color="white"
                            style={activeTab === 'settings' ? styles.navIconActive : styles.navIconInactive}
                        />
                        <Text style={[styles.navIconLabel, activeTab === 'settings' && styles.labelActive]}>
                            Settings
                        </Text>
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
});