import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Modal, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, X, ArrowRight, MessageCircle, Flag } from 'lucide-react-native';
import { postService } from '../services/api';
import CommentScreen from './CommentScreen';
import ReportScreen from './ReportScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const isSmallDevice = SCREEN_HEIGHT < 700;
const isMediumDevice = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 800;

const TABS = [
    { key: 'forYou', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'friends', label: 'Friends' },
];

const createFeedState = () => ({
    posts: [],
    currentIndex: 0,
    isLoading: true,
    hasMore: true,
    isLoadingMore: false,
    offset: 0,
    page: 1,
    loaded: false,
});

export default function HomeScreen({ user, onBlockUser }) {
    const [activeTab, setActiveTab] = useState('forYou');
    const [feeds, setFeeds] = useState({
        forYou: createFeedState(),
        following: createFeedState(),
        friends: createFeedState(),
    });
    const [showComments, setShowComments] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const feed = feeds[activeTab];

    // Load feed when tab is selected for the first time
    useEffect(() => {
        if (!feeds[activeTab].loaded) {
            loadPosts(activeTab, true);
        }
    }, [activeTab]);

    const updateFeed = (tab, updates) => {
        setFeeds(prev => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                ...(typeof updates === 'function' ? updates(prev[tab]) : updates),
            },
        }));
    };

    const loadPosts = async (tab, reset = false) => {
        const currentFeed = feeds[tab];
        if (currentFeed.isLoadingMore && !reset) return;

        if (reset) {
            updateFeed(tab, { isLoading: true, offset: 0, page: 1 });
        } else {
            updateFeed(tab, { isLoadingMore: true });
        }

        try {
            let newPosts = [];
            let paginationUpdate = {};

            if (tab === 'forYou') {
                const currentOffset = reset ? 0 : currentFeed.offset;
                const response = await postService.getForYou(10, currentOffset);
                newPosts = response.data || [];
                const meta = response.meta || {};
                paginationUpdate = {
                    offset: meta.offset ?? currentOffset + newPosts.length,
                    hasMore: meta.has_more ?? newPosts.length >= 10,
                };
            } else {
                const currentPage = reset ? 1 : currentFeed.page;
                const response = tab === 'following'
                    ? await postService.getFollowing(currentPage)
                    : await postService.getFriends(currentPage);

                const paginatedData = response.data || {};
                newPosts = paginatedData.data || [];
                paginationUpdate = {
                    page: (paginatedData.current_page || currentPage) + 1,
                    hasMore: (paginatedData.current_page || currentPage) < (paginatedData.last_page || 1),
                };
            }

            updateFeed(tab, prev => ({
                posts: reset ? newPosts : [...prev.posts, ...newPosts],
                currentIndex: reset ? 0 : prev.currentIndex,
                isLoading: false,
                isLoadingMore: false,
                loaded: true,
                ...paginationUpdate,
            }));
        } catch (error) {
            console.log(`Failed to load ${tab} posts:`, error);
            updateFeed(tab, { isLoading: false, isLoadingMore: false, loaded: true });
        }
    };

    const handleNext = () => {
        const tab = activeTab;
        const currentFeed = feeds[tab];

        if (currentFeed.currentIndex < currentFeed.posts.length - 1) {
            const newIndex = currentFeed.currentIndex + 1;
            updateFeed(tab, { currentIndex: newIndex });

            if (newIndex >= currentFeed.posts.length - 3 && currentFeed.hasMore && !currentFeed.isLoadingMore) {
                loadPosts(tab, false);
            }
        } else if (currentFeed.hasMore) {
            loadPosts(tab, false);
        } else if (currentFeed.posts.length > 0) {
            updateFeed(tab, { currentIndex: 0 });
        }
    };

    const handleLike = async () => {
        const tab = activeTab;
        const post = feeds[tab].posts[feeds[tab].currentIndex];
        if (!post) return;

        const wasLiked = post.user_has_liked;

        updateFeed(tab, prev => ({
            posts: prev.posts.map((p, idx) =>
                idx === prev.currentIndex
                    ? {
                        ...p,
                        user_has_liked: !wasLiked,
                        likes_count: wasLiked ? Math.max(0, (p.likes_count || 1) - 1) : (p.likes_count || 0) + 1
                    }
                    : p
            ),
        }));

        try {
            if (wasLiked) {
                await postService.unlike(post.id);
            } else {
                await postService.like(post.id);
            }
        } catch (error) {
            updateFeed(tab, prev => ({
                posts: prev.posts.map((p, idx) =>
                    idx === prev.currentIndex
                        ? {
                            ...p,
                            user_has_liked: wasLiked,
                            likes_count: wasLiked ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 1) - 1)
                        }
                        : p
                ),
            }));
            console.log('Failed to like:', error);
        }

        handleNext();
    };

    const handleDislike = async () => {
        const tab = activeTab;
        const post = feeds[tab].posts[feeds[tab].currentIndex];
        if (!post) return;

        updateFeed(tab, prev => ({
            posts: prev.posts.map((p, idx) =>
                idx === prev.currentIndex
                    ? { ...p, dislikes_count: (p.dislikes_count || 0) + 1 }
                    : p
            ),
        }));

        try {
            await postService.react(post.id, false);
        } catch (error) {
            updateFeed(tab, prev => ({
                posts: prev.posts.map((p, idx) =>
                    idx === prev.currentIndex
                        ? { ...p, dislikes_count: Math.max(0, (p.dislikes_count || 1) - 1) }
                        : p
                ),
            }));
            console.log('Failed to dislike:', error);
        }

        handleNext();
    };

    const onRefresh = useCallback(() => {
        loadPosts(activeTab, true);
    }, [activeTab]);

    const handleTabChange = (tabKey) => {
        if (tabKey === activeTab) {
            // Tap same tab = refresh
            loadPosts(tabKey, true);
            return;
        }
        setActiveTab(tabKey);
    };

    const currentPost = feed.posts[feed.currentIndex];
    const buttonSize = isSmallDevice ? 50 : isMediumDevice ? 58 : 65;
    const iconSize = isSmallDevice ? 22 : isMediumDevice ? 25 : 28;

    const emptyMessages = {
        forYou: { title: 'Keine Posts verfügbar', subtitle: 'Folge anderen um deren Posts zu sehen!' },
        following: { title: 'Keine Posts', subtitle: 'Folge anderen Nutzern um deren Posts hier zu sehen!' },
        friends: { title: 'Keine Posts', subtitle: 'Wenn du und jemand euch gegenseitig folgt, erscheinen Posts hier!' },
    };

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {TABS.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                    onPress={() => handleTabChange(tab.key)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (feed.isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                        <View style={styles.header}><Text style={styles.logo}>STYLR</Text></View>
                        {renderTabs()}
                    </LinearGradient>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF5A5F" />
                        <Text style={styles.loadingText}>Posts werden geladen...</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (feed.posts.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                        <View style={styles.header}><Text style={styles.logo}>STYLR</Text></View>
                        {renderTabs()}
                    </LinearGradient>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{emptyMessages[activeTab].title}</Text>
                        <Text style={styles.emptySubtext}>{emptyMessages[activeTab].subtitle}</Text>
                        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                            <Text style={styles.refreshButtonText}>Aktualisieren</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                    <View style={styles.header}><Text style={styles.logo}>STYLR</Text></View>
                    {renderTabs()}
                </LinearGradient>

                <View style={styles.cardContainer}>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.flagButton} onPress={() => setShowReport(true)}>
                            <Flag size={moderateScale(18)} color="#FF5A5F" />
                        </TouchableOpacity>

                        {currentPost?.image_url ? (
                            <Image
                                source={{ uri: currentPost.image_url }}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.cardImage, styles.noImagePlaceholder]}>
                                <Text style={styles.noImageText}>📝</Text>
                            </View>
                        )}

                        <View style={styles.infoContainer}>
                            <Text style={styles.description} numberOfLines={2}>
                                {currentPost?.description || 'Keine Beschreibung'}
                            </Text>
                            <View style={styles.userInfo}>
                                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {currentPost?.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                </LinearGradient>
                                <Text style={styles.username}>
                                    {currentPost?.user?.name || 'Unbekannt'}
                                </Text>
                            </View>
                            <Text style={styles.statsText}>
                                ❤️ {currentPost?.likes_count || 0} • 👎 {currentPost?.dislikes_count || 0} • 💬 {currentPost?.comments_count || 0}
                            </Text>
                            <Text style={styles.positionText}>
                                {feed.currentIndex + 1} / {feed.posts.length}{feed.hasMore ? '+' : ''}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionsWrapper}>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }, currentPost?.user_has_liked && styles.likedButton]}
                            onPress={handleLike}
                        >
                            <Heart size={iconSize} color="#FF5A5F" fill={currentPost?.user_has_liked ? "#FF5A5F" : "transparent"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={handleDislike}
                        >
                            <X size={iconSize} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={handleNext}
                        >
                            <ArrowRight size={iconSize} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={() => setShowComments(true)}
                        >
                            <MessageCircle size={iconSize} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {feed.isLoadingMore && (
                        <ActivityIndicator size="small" color="#FF5A5F" style={{ marginTop: 10 }} />
                    )}
                </View>

                <Modal visible={showComments} animationType="slide" onRequestClose={() => setShowComments(false)}>
                    <CommentScreen post={currentPost} onClose={() => setShowComments(false)} currentUser={user} onBlockUser={onBlockUser} />
                </Modal>

                <Modal visible={showReport} animationType="slide" onRequestClose={() => setShowReport(false)}>
                    <ReportScreen
                        targetUser={currentPost?.user}
                        contentType="post"
                        contentId={currentPost?.id}
                        onClose={() => setShowReport(false)}
                    />
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FF5A5F' },
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 10 },
    emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
    refreshButton: { backgroundColor: '#FF5A5F', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    refreshButtonText: { color: '#fff', fontWeight: '600' },
    headerGradient: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    header: { paddingVertical: verticalScale(8), alignItems: 'center' },
    logo: { fontSize: moderateScale(22), fontWeight: 'bold', color: '#fff', letterSpacing: 3 },
    tabContainer: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 6 },
    tab: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
    tabActive: { backgroundColor: '#fff' },
    tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
    tabTextActive: { color: '#FF5A5F' },
    cardContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(12), paddingVertical: verticalScale(10) },
    card: { width: SCREEN_WIDTH - scale(24), maxWidth: 400, height: isSmallDevice ? SCREEN_HEIGHT * 0.48 : isMediumDevice ? SCREEN_HEIGHT * 0.50 : SCREEN_HEIGHT * 0.53, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    flagButton: { position: 'absolute', top: 12, left: 12, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: 8 },
    cardImage: { width: '100%', flex: 1, minHeight: '55%', maxHeight: '70%', backgroundColor: '#eee' },
    noImagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    noImageText: { fontSize: 60 },
    infoContainer: { padding: 12 },
    description: { fontSize: 15, color: '#333', fontWeight: '600', marginBottom: 6 },
    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    avatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    username: { fontSize: 13, color: '#666', fontWeight: '500' },
    statsText: { fontSize: 12, color: '#888' },
    positionText: { fontSize: 10, color: '#aaa', marginTop: 2 },
    actionsWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', paddingHorizontal: scale(15) },
    actionButton: { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5 },
    likedButton: { backgroundColor: '#fff0f0' },
});