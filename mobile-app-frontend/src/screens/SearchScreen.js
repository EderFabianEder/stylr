import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Import Search and X from lucide-react-native
import { Search, X } from 'lucide-react-native';

// Mock Users
const mockUsers = [
    { id: 1, username: 'fashionista_23', followers: 1245, following: 534 },
    { id: 2, username: 'style_hunter', followers: 892, following: 421 },
    { id: 3, username: 'minimal_look', followers: 2341, following: 123 },
    { id: 4, username: 'denim_lover', followers: 567, following: 789 },
    { id: 5, username: 'urban_chic', followers: 3421, following: 234 },
    { id: 6, username: 'vintage_vibes', followers: 1876, following: 456 },
    { id: 7, username: 'street_style', followers: 4532, following: 678 },
    { id: 8, username: 'elegant_ella', followers: 987, following: 345 },
];

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState(mockUsers);
    const [following, setFollowing] = useState([]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.trim()) {
            const filtered = mockUsers.filter(user =>
                user.username.toLowerCase().includes(text.toLowerCase())
            );
            setUsers(filtered);
        } else {
            setUsers(mockUsers);
        }
    };

    const handleFollow = (userId) => {
        if (following.includes(userId)) {
            setFollowing(following.filter(id => id !== userId));
        } else {
            setFollowing([...following, userId]);
        }
    };

    const renderUser = ({ item }) => {
        const isFollowing = following.includes(item.id);

        return (
            <View style={styles.userItem}>
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.userAvatar}
                >
                    <Text style={styles.userAvatarText}>
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                </LinearGradient>

                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.userStats}>
                        {item.followers} followers · {item.following} following
                    </Text>
                </View>

                <TouchableOpacity onPress={() => handleFollow(item.id)}>
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
                </TouchableOpacity>
            </View>
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
                    <Text style={styles.headerTitle}>Search Users</Text>
                </View>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    {/* Replaced Text Icon with Lucide Search Icon */}
                    <Search size={20} color="#666" style={styles.searchIcon} />

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                    />

                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            {/* Replaced Text X with Lucide X Icon */}
                            <X size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Users List */}
            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.usersList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No users found</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerGradient: {
        paddingTop: 50,
    },
    header: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        padding: 15,
        backgroundColor: '#fff',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: 40,
    },
    usersList: {
        padding: 15,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userAvatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userStats: {
        fontSize: 13,
        color: '#666',
    },
    followButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    followingButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    followingButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});