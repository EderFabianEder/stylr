import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, FlatList,
    StatusBar, Modal, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, UserX, MoreVertical, Grid, Lock } from 'lucide-react-native';
import { userService, followService, postService, blockService } from '../services/api';
import PictureStatsScreen from './PictureStatsScreen';
import FollowerListScreen from './FollowerListScreen';

export default function OtherProfileScreen({ user, onBack, onBlockUser, currentUser }) {
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [nestedUser, setNestedUser] = useState(null);
    const [followerListMode, setFollowerListMode] = useState(null);

    const userId = user?.id;

    useEffect(() => { if (userId) loadProfile(); }, [userId]);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const [profileRes, postsRes] = await Promise.all([
                userService.getUser(userId),
                postService.getUserPosts(userId),
            ]);

            const data = profileRes.data || profileRes;
            setProfileData(data);
            setIsFollowing(data.is_following || false);
            setHasPendingRequest(data.has_pending_request || false);

            const postsData = postsRes.data?.data || postsRes.data || [];
            setPosts(postsData);
        } catch (error) {
            console.log('Failed to load other profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (followLoading) return;
        setFollowLoading(true);

        try {
            if (isFollowing || hasPendingRequest) {
                await followService.unfollow(userId);
                if (isFollowing) {
                    setProfileData(prev => prev ? { ...prev, followers_count: Math.max(0, (prev.followers_count || 1) - 1) } : prev);
                }
                setIsFollowing(false);
                setHasPendingRequest(false);
            } else {
                await followService.follow(userId);
                if (profileData?.account_type === 'private') {
                    setHasPendingRequest(true);
                } else {
                    setIsFollowing(true);
                    setProfileData(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : prev);
                }
            }
        } catch (error) {
            console.log('Follow toggle failed:', error);
            Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleBlockUser = async () => {
        setShowBlockModal(false);
        try {
            await blockService.block(userId);
            if (onBlockUser) onBlockUser(user);
            onBack();
        } catch (error) {
            Alert.alert('Fehler', error.message || 'User konnte nicht blockiert werden');
        }
    };

    const getFollowButtonText = () => {
        if (followLoading) return '...';
        if (isFollowing) return 'Folge ich';
        if (hasPendingRequest) return 'Angefragt';
        return 'Folgen';
    };

    // ---- Sub-screens ----

    if (followerListMode) {
        return (
            <FollowerListScreen
                userId={userId}
                mode={followerListMode}
                onBack={() => { setFollowerListMode(null); loadProfile(); }}
                onUserPress={(u) => {
                    if (u.id !== currentUser?.id && u.id !== userId) {
                        setFollowerListMode(null);
                        setNestedUser(u);
                    }
                }}
            />
        );
    }

    if (nestedUser) {
        return (
            <OtherProfileScreen
                user={nestedUser}
                onBack={() => { setNestedUser(null); loadProfile(); }}
                onBlockUser={onBlockUser}
                currentUser={currentUser}
            />
        );
    }

    if (selectedPost) {
        return (
            <PictureStatsScreen
                picture={selectedPost}
                onClose={() => setSelectedPost(null)}
                onBack={() => setSelectedPost(null)}
                currentUser={currentUser}
                isOwnPicture={false}
                onUserPress={(u) => {
                    if (u.id !== currentUser?.id) {
                        setSelectedPost(null);
                        setNestedUser(u);
                    }
                }}
            />
        );
    }

    const displayName = profileData?.name || user?.name || 'User';
    const followersCount = profileData?.followers_count || 0;
    const followingCount = profileData?.following_count || 0;
    const isPrivate = profileData?.account_type === 'private';

    const renderPost = ({ item }) => (
        <TouchableOpacity style={styles.gridItem} onPress={() => setSelectedPost(item)}>
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            ) : (
                <View style={[styles.gridImage, styles.noImagePlaceholder]}>
                    <Text style={styles.noImageText}>📝</Text>
                </View>
            )}
            <View style={styles.gridOverlay}>
                <Text style={styles.gridStats}>❤️ {item.likes_count || 0}</Text>
            </View>
        </TouchableOpacity>
    );

    // Block Modal
    const BlockUserModal = () => (
        <Modal visible={showBlockModal} transparent animationType="fade" onRequestClose={() => setShowBlockModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <UserX size={40} color="#FF5A5F" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.modalTitle}>{displayName} blockieren?</Text>
                    <Text style={styles.modalMessage}>
                        Die Person kann dein Profil und deine Posts nicht mehr sehen.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowBlockModal(false)}>
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleBlockUser}>
                            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.blockConfirmButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={styles.blockConfirmText}>Blockieren</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <ArrowLeft size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Profil</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <BlockUserModal />

            {/* Same gradient header as ProfileScreen */}
            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil</Text>
                    <TouchableOpacity onPress={() => setShowBlockModal(true)} style={styles.moreButton}>
                        <MoreVertical size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    <LinearGradient colors={['#fff', '#f0f0f0']} style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>

                    <View style={styles.nameRow}>
                        <Text style={styles.nameText}>{displayName}</Text>
                        {isPrivate && <Lock size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />}
                    </View>
                    {isPrivate && <Text style={styles.privateLabel}>Privates Profil</Text>}

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{posts.length}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <TouchableOpacity style={styles.statItem} onPress={() => setFollowerListMode('followers')}>
                            <Text style={styles.statNumber}>{followersCount}</Text>
                            <Text style={styles.statLabel}>Follower</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statItem} onPress={() => setFollowerListMode('following')}>
                            <Text style={styles.statNumber}>{followingCount}</Text>
                            <Text style={styles.statLabel}>Folge ich</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Follow button inside gradient */}
                    <TouchableOpacity
                        onPress={handleFollowToggle}
                        disabled={followLoading}
                        style={styles.followButtonWrapper}
                        activeOpacity={0.8}
                    >
                        {(isFollowing || hasPendingRequest) ? (
                            <View style={styles.followingButton}>
                                <Text style={styles.followingButtonText}>{getFollowButtonText()}</Text>
                            </View>
                        ) : (
                            <View style={styles.followButton}>
                                <Text style={styles.followButtonText}>{getFollowButtonText()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Content - same as ProfileScreen */}
            <View style={styles.content}>
                <View style={styles.tabBar}>
                    <TouchableOpacity style={styles.tabActive}>
                        <Grid size={22} color="#FF5A5F" />
                    </TouchableOpacity>
                </View>

                {posts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Noch keine Posts</Text>
                    </View>
                ) : (
                    <FlatList
                        data={posts}
                        renderItem={renderPost}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={3}
                        contentContainerStyle={styles.gridContainer}
                        refreshControl={
                            <RefreshControl refreshing={false} onRefresh={loadProfile} colors={['#FF5A5F']} />
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header - same as ProfileScreen
    headerGradient: { paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    backButton: { padding: 8 },
    moreButton: { padding: 8 },

    // Profile section - same as ProfileScreen
    profileSection: { alignItems: 'center', paddingTop: 20 },
    avatarContainer: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FF5A5F' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    nameText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    privateLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    statsContainer: { flexDirection: 'row', marginTop: 20 },
    statItem: { alignItems: 'center', marginHorizontal: 25 },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    // Follow button
    followButtonWrapper: { marginTop: 15, width: '60%' },
    followButton: { backgroundColor: 'rgba(255,255,255,0.25)', paddingVertical: 12, borderRadius: 25, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
    followButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    followingButton: { backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
    followingButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FF5A5F' },

    // Content - same as ProfileScreen
    content: { flex: 1 },
    tabBar: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
    tabActive: { padding: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, color: '#666' },
    gridContainer: { padding: 2 },
    gridItem: { flex: 1/3, aspectRatio: 1, padding: 2 },
    gridImage: { flex: 1, borderRadius: 4, backgroundColor: '#e0e0e0' },
    noImagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    noImageText: { fontSize: 24 },
    gridOverlay: { position: 'absolute', bottom: 4, left: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 4, alignItems: 'center' },
    gridStats: { color: '#fff', fontSize: 11 },

    // Modal - same as before
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 340, alignItems: 'center' },
    modalIconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
    modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    modalButtons: { flexDirection: 'row' },
    cancelButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0', marginRight: 12 },
    cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#666' },
    blockConfirmButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
    blockConfirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});