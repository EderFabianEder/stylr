import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    StatusBar,
    Pressable,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, X } from 'lucide-react-native';
import { userService, followService } from '../services/api';
import OtherProfileScreen from './OtherProfileScreen';

export default function SearchScreen({ blockedUsers = [], onBlockUser, currentUser }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [following, setFollowing] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Debounced API-Suche
    const handleSearch = useCallback((text) => {
        setSearchQuery(text);

        // Vorherigen Timeout löschen
        if (searchTimeout) clearTimeout(searchTimeout);

        if (text.trim().length < 2) {
            setUsers([]);
            setHasSearched(false);
            return;
        }

        // Debounce: 500ms warten bevor API-Call
        const timeout = setTimeout(async () => {
            setIsLoading(true);
            setHasSearched(true);
            try {
                const response = await userService.searchUsers(text.trim());
                const results = response.data?.users || response.data?.data || [];

                // Blockierte User und eigenen Account filtern
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

    const handleFollow = async (userId) => {
        const isCurrentlyFollowing = following.includes(userId);

        // Optimistic update
        if (isCurrentlyFollowing) {
            setFollowing(following.filter(id => id !== userId));
        } else {
            setFollowing([...following, userId]);
        }

        try {
            if (isCurrentlyFollowing) {
                await followService.unfollow(userId);
            } else {
                await followService.follow(userId);
            }
        } catch (error) {
            // Revert bei Fehler
            if (isCurrentlyFollowing) {
                setFollowing(prev => [...prev, userId]);
            } else {
                setFollowing(prev => prev.filter(id => id !== userId));
            }
            console.log('Follow/Unfollow failed:', error);
        }
    };

    const handleUserPress = (user) => {
        setSelectedUser(user);
        setShowProfile(true);
    };

    const handleBlockUser = (user) => {
        if (onBlockUser) onBlockUser(user);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
    };

    const handleBackFromProfile = () => {
        setShowProfile(false);
        setSelectedUser(null);
    };

    // Profil-Ansicht
    if (showProfile && selectedUser) {
        return (
            <OtherProfileScreen
                user={selectedUser}
                onBack={handleBackFromProfile}
                initialFollowing={following.includes(selectedUser.id)}
                onBlockUser={handleBlockUser}
                currentUser={currentUser}
            />
        );
    }

    const renderUser = ({ item }) => {
        const isFollowing = following.includes(item.id) || item.is_following;

        return (
            <Pressable
                onPress={() => handleUserPress(item)}
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
                    <Text style={styles.userStats}>
                        {item.followers_count ?? 0} followers · {item.following_count ?? 0} following
                    </Text>
                </View>

                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        handleFollow(item.id);
                    }}
                    style={styles.followButtonContainer}
                >
                    {isFollowing ? (
                        <View style={styles.followingButton}>
                            <Text style={styles.followingButtonText}>Following</Text>
                        </View>
                    ) : (
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.followButton}
                        >
                            <Text style={styles.followButtonText}>Follow</Text>
                        </LinearGradient>
                    )}
                </Pressable>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
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

            {/* Search Bar */}
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

            {/* Loading */}
            {isLoading && (
                <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 30 }} />
            )}

            {/* Users List */}
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
    username: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    userStats: { fontSize: 13, color: '#666' },
    followButtonContainer: { zIndex: 10 },
    followButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    followButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    followingButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0' },
    followingButtonText: { color: '#666', fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, color: '#999' },
});