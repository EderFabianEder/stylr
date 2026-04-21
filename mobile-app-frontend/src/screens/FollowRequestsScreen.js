import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    ActivityIndicator, StatusBar, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, X, UserPlus } from 'lucide-react-native';
import { followService } from '../services/api';

export default function FollowRequestsScreen({ onBack, onCountChange }) {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => { loadRequests(true); }, []);

    const loadRequests = async (reset = false) => {
        try {
            if (reset) {
                setIsLoading(true);
                setPage(1);
            }
            const currentPage = reset ? 1 : page;
            const response = await followService.getRequests(currentPage);

            // Backend may return various shapes - handle all
            const data = response.data || {};
            const list = data.requests || data.data || (Array.isArray(data) ? data : []);
            const pagination = data.pagination || data;

            if (reset) {
                setRequests(list);
            } else {
                setRequests(prev => [...prev, ...list]);
            }

            setHasMore((pagination.current_page || 1) < (pagination.last_page || 1));
            setPage(currentPage + 1);

            if (reset && onCountChange) onCountChange(list.length);
        } catch (error) {
            console.log('Failed to load follow requests:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadRequests(true);
    }, []);

    const handleAccept = async (request) => {
        if (actionLoading) return;
        setActionLoading(request.id);
        try {
            await followService.acceptRequest(request.id);
            setRequests(prev => {
                const next = prev.filter(r => r.id !== request.id);
                if (onCountChange) onCountChange(next.length);
                return next;
            });
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Anfrage konnte nicht akzeptiert werden');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (request) => {
        if (actionLoading) return;
        setActionLoading(request.id);
        try {
            await followService.declineRequest(request.id);
            setRequests(prev => {
                const next = prev.filter(r => r.id !== request.id);
                if (onCountChange) onCountChange(next.length);
                return next;
            });
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Anfrage konnte nicht abgelehnt werden');
        } finally {
            setActionLoading(null);
        }
    };

    const renderRequest = ({ item }) => {
        const requester = item.requester || item.user || item.from_user || item;
        const name = requester?.name || requester?.username || 'Unbekannt';
        const isBusy = actionLoading === item.id;

        return (
            <View style={styles.requestItem}>
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.avatar}
                >
                    <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>

                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{name}</Text>
                    <Text style={styles.subtext}>möchte dir folgen</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAccept(item)}
                        disabled={isBusy}
                        activeOpacity={0.7}
                    >
                        {isBusy ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Check size={18} color="#fff" strokeWidth={2.5} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={() => handleDecline(item)}
                        disabled={isBusy}
                        activeOpacity={0.7}
                    >
                        <X size={18} color="#FF5A5F" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

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
                    <Text style={styles.headerTitle}>Follow-Anfragen</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {isLoading ? (
                <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id?.toString() ?? String(Math.random())}
                    contentContainerStyle={styles.list}
                    onEndReached={() => hasMore && loadRequests(false)}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FF5A5F']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <UserPlus size={60} color="#ccc" strokeWidth={1.5} />
                            <Text style={styles.emptyTitle}>Keine offenen Anfragen</Text>
                            <Text style={styles.emptyText}>Wenn dir jemand folgen möchte, erscheint die Anfrage hier.</Text>
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
    list: { padding: 15, flexGrow: 1 },
    requestItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '600', color: '#333' },
    subtext: { fontSize: 12, color: '#888', marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8 },
    actionButton: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    acceptButton: { backgroundColor: '#FF5A5F' },
    declineButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FF5A5F' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20 },
    emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8 },
});
