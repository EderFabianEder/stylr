import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, StatusBar, Pressable, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, X } from 'lucide-react-native';
import { userService } from '../services/api';
import OtherProfileScreen from './OtherProfileScreen';

export default function SearchScreen({ blockedUsers = [], onBlockUser, currentUser }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        if (searchTimeout) clearTimeout(searchTimeout);

        if (text.trim().length < 2) {
            setUsers([]);
            setHasSearched(false);
            return;
        }

        const timeout = setTimeout(async () => {
            setIsLoading(true);
            setHasSearched(true);
            try {
                const response = await userService.searchUsers(text.trim());
                const results = response.data?.users || response.data?.data || [];

                const filtered = results.filter(user =>
                    !blockedUsers.some(blocked => blocked.id === user.id) &&
                    user.id !== currentUser?.id
                );

                setUsers(filtered);
            } catch (error) {
                console.log('Search failed:', error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        setSearchTimeout(timeout);
    }, [blockedUsers, currentUser, searchTimeout]);

    const handleBlockUser = (user) => {
        if (onBlockUser) onBlockUser(user);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
    };

    if (showProfile && selectedUser) {
        return (
            <OtherProfileScreen
                user={selectedUser}
                onBack={() => { setShowProfile(false); setSelectedUser(null); }}
                onBlockUser={handleBlockUser}
                currentUser={currentUser}
            />
        );
    }

    const renderUser = ({ item }) => (
        <Pressable
            onPress={() => { setSelectedUser(item); setShowProfile(true); }}
            style={({ pressed }) => [styles.userItem, pressed && styles.userItemPressed]}
        >
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.userAvatar}
            >
                <Text style={styles.userAvatarText}>
                    {item.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
            </LinearGradient>

            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.name}</Text>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Suche</Text>
                </View>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="User suchen (min. 2 Zeichen)..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <X size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading && (
                <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 30 }} />
            )}

            {!isLoading && (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.usersList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            {hasSearched ? (
                                <Text style={styles.emptyText}>Keine User gefunden</Text>
                            ) : (
                                <Text style={styles.emptyText}>Suche nach Usern...</Text>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerGradient: { paddingTop: 50 },
    header: { paddingVertical: 15, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    searchContainer: { padding: 15, backgroundColor: '#fff' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: '#333', height: 40 },
    usersList: { padding: 15 },
    userItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    userItemPressed: { opacity: 0.7, backgroundColor: '#f9f9f9' },
    userAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    userAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    username: { fontSize: 16, fontWeight: '600', color: '#333' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, color: '#999' },
});