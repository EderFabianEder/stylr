import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, FlatList,
    StatusBar, ScrollView, Platform, Modal, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, UserX, MoreVertical } from 'lucide-react-native';
import { userService, followService, postService } from '../services/api';
import PictureStatsScreen from './PictureStatsScreen';
import FollowerListScreen from './FollowerListScreen';

export default function OtherProfileScreen({ user, onBack, initialFollowing = false, onBlockUser, currentUser }) {
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [showPictureStats, setShowPictureStats] = useState(false);
    const [selectedPicture, setSelectedPicture] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showNestedProfile, setShowNestedProfile] = useState(false);
    const [nestedUser, setNestedUser] = useState(null);
    const [followerListMode, setFollowerListMode] = useState(null);

    const userId = user?.id;

    useEffect(() => {
        if (userId) loadProfile();
    }, [userId]);

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
                setIsFollowing(false);
                setHasPendingRequest(false);
                setProfileData(prev => prev ? {
                    ...prev,
                    followers_count: Math.max(0, (prev.followers_count || 1) - 1)
                } : prev);
            } else {
                const res = await followService.follow(userId);
                if (profileData?.account_type === 'private') {
                    setHasPendingRequest(true);
                } else {
                    setIsFollowing(true);
                    setProfileData(prev => prev ? {
                        ...prev,
                        followers_count: (prev.followers_count || 0) + 1
                    } : prev);
                }
            }
        } catch (error) {
            console.log('Follow toggle failed:', error);
            Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen');
        } finally {
            setFollowLoading(false);
        }
    };

    const handlePicturePress = (picture) => {
        setSelectedPicture(picture);
        setShowPictureStats(true);
    };

    const handleUserPressFromComments = (userFromComment) => {
        if (userFromComment.id === currentUser?.id) return;
        setNestedUser(userFromComment);
        setShowPictureStats(false);
        setShowNestedProfile(true);
    };

    const handleBlockUser = () => {
        setShowBlockModal(false);
        if (onBlockUser) onBlockUser(user);
        onBack();
    };

    // Follower list view
    if (followerListMode) {
        return (
            <FollowerListScreen
                userId={userId}
                mode={followerListMode}
                onBack={() => setFollowerListMode(null)}
                onUserPress={(u) => {
                    setFollowerListMode(null);
                    if (u.id !== currentUser?.id && u.id !== userId) {
                        setNestedUser(u);
                        setShowNestedProfile(true);
                    }
                }}
            />
        );
    }

    // Nested profile from comments or follower list
    if (showNestedProfile && nestedUser) {
        return (
            <OtherProfileScreen
                user={nestedUser}
                onBack={() => {
                    setShowNestedProfile(false);
                    setNestedUser(null);
                }}
                onBlockUser={onBlockUser}
                currentUser={currentUser}
            />
        );
    }

    // Picture stats
    if (showPictureStats && selectedPicture) {
        return (
            <PictureStatsScreen
                picture={selectedPicture}
                onClose={() => { setShowPictureStats(false); setSelectedPicture(null); }}
                currentUser={currentUser}
                isOwnPicture={false}
                onUserPress={handleUserPressFromComments}
            />
        );
    }

    const displayName = profileData?.name || user?.name || 'User';
    const followersCount = profileData?.followers_count || 0;
    const followingCount = profileData?.following_count || 0;

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
                        Die Person kann dein Profil, deine Posts nicht mehr sehen und dich nicht kontaktieren.
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

    const renderPost = ({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => handlePicturePress(item)}>
            <View style={styles.pictureSquare}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.squareImage} />
                ) : (
                    <View style={[styles.squareImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                        <Text style={{ fontSize: 24 }}>📝</Text>
                    </View>
                )}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)']} style={styles.pictureOverlay} />
            </View>
        </TouchableOpacity>
    );

    const getFollowButtonText = () => {
        if (followLoading) return '...';
        if (isFollowing) return 'Folge ich';
        if (hasPendingRequest) return 'Angefragt';
        return 'Folgen';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <BlockUserModal />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                </View>
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={true}>
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
                            <ArrowLeft size={24} color="#FFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.moreButton} onPress={() => setShowBlockModal(true)} activeOpacity={0.7}>
                            <MoreVertical size={24} color="#FFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                        <View style={styles.largeProfilePlaceholder}>
                            <Text style={styles.placeholderText}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.userNameText}>{displayName}</Text>
                                <Text style={styles.userHandle}>@{displayName.toLowerCase()}</Text>
                            </View>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{posts.length}</Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <TouchableOpacity style={styles.statItem} onPress={() => setFollowerListMode('followers')}>
                                <Text style={styles.statValue}>{followersCount}</Text>
                                <Text style={styles.statLabel}>Follower</Text>
                            </TouchableOpacity>
                            <View style={styles.statDivider} />
                            <TouchableOpacity style={styles.statItem} onPress={() => setFollowerListMode('following')}>
                                <Text style={styles.statValue}>{followingCount}</Text>
                                <Text style={styles.statLabel}>Folge ich</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Follow Button */}
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleFollowToggle}
                                style={styles.followButtonWrapper}
                                disabled={followLoading}
                            >
                                {(isFollowing || hasPendingRequest) ? (
                                    <View style={styles.followingButton}>
                                        <Text style={styles.followingButtonText}>{getFollowButtonText()}</Text>
                                    </View>
                                ) : (
                                    <LinearGradient
                                        colors={['#FF5A5F', '#CE494D']}
                                        style={styles.followButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.followButtonText}>{getFollowButtonText()}</Text>
                                    </LinearGradient>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Posts Grid */}
                        {posts.length > 0 && (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Posts</Text>
                            </View>
                        )}
                    </View>

                    {posts.length > 0 ? (
                        <FlatList
                            data={posts}
                            renderItem={renderPost}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={3}
                            scrollEnabled={false}
                            contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 30 }}
                            columnWrapperStyle={{ gap: 4, marginBottom: 4 }}
                        />
                    ) : (
                        <View style={styles.emptyPosts}>
                            <Text style={styles.emptyPostsText}>Noch keine Posts</Text>
                        </View>
                    )}

                    <View style={styles.bottomPadding} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    headerSection: {
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF5A5F',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        position: 'absolute', top: 50, left: 20,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    moreButton: {
        position: 'absolute', top: 50, right: 20,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    largeProfilePlaceholder: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    },
    placeholderText: { fontSize: 48, fontWeight: 'bold', color: '#FFF' },
    infoCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: -30,
        borderRadius: 25,
        padding: 25,
        ...Platform.select({
            web: { boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
        }),
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    userNameText: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 2 },
    userHandle: { fontSize: 15, color: '#999', fontWeight: '500' },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: '#F8F9FA', borderRadius: 20,
        paddingVertical: 20, paddingHorizontal: 15, marginBottom: 20,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
    statLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 4 },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#FF5A5F' },
    actionButtonsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    followButtonWrapper: { flex: 1 },
    followButton: {
        paddingVertical: 14, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 4px 8px rgba(255, 90, 95, 0.3)' },
            default: { shadowColor: '#FF5A5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
        }),
    },
    followButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },
    followingButton: {
        paddingVertical: 14, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0',
    },
    followingButtonText: { fontSize: 16, fontWeight: 'bold', color: '#666', letterSpacing: 0.5 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    pictureSquare: {
        flex: 1/3, aspectRatio: 1, backgroundColor: '#E0E0E0',
        borderRadius: 12, overflow: 'hidden',
    },
    squareImage: { width: '100%', height: '100%' },
    pictureOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%' },
    emptyPosts: { alignItems: 'center', padding: 40 },
    emptyPostsText: { fontSize: 16, color: '#999' },
    bottomPadding: { height: 40 },
    // Modal
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