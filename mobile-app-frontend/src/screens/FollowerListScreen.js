import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    ActivityIndicator, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { followService } from '../services/api';

export default function FollowerListScreen({ userId, mode, onBack, onUserPress }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => { loadUsers(true); }, [userId, mode]);

    const loadUsers = async (reset = false) => {
        try {
            if (reset) {
                setIsLoading(true);
                setPage(1);
            } else {
                setIsLoadingMore(true);
            }

            const currentPage = reset ? 1 : page;
            const response = mode === 'followers'
                ? await followService.getFollowers(userId, currentPage)
                : await followService.getFollowing(userId, currentPage);

            const data = response.data || {};
            const list = data.followers || data.following || [];
            const pagination = data.pagination || {};

            if (reset) {
                setUsers(list);
            } else {
                setUsers(prev => [...prev, ...list]);
            }

            setHasMore((pagination.current_page || 1) < (pagination.last_page || 1));
            setPage(currentPage + 1);
        } catch (error) {
            console.log('Failed to load users:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const renderUser = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => onUserPress && onUserPress(item)}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.avatar}
            >
                <Text style={styles.avatarText}>
                    {item.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
            </LinearGradient>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
            </View>
        </TouchableOpacity>
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
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {mode === 'followers' ? 'Follower' : 'Folge ich'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {isLoading ? (
                <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    onEndReached={() => hasMore && !isLoadingMore && loadUsers(false)}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#FF5A5F" style={{ padding: 15 }} /> : null}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {mode === 'followers' ? 'Noch keine Follower' : 'Folgt niemandem'}
                            </Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    list: { padding: 15 },
    userItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600', color: '#333' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: '#999' },
});