import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar,
    Modal, SafeAreaView, Platform, ActivityIndicator, Animated, PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, X, ArrowRight, MessageCircle, Flag } from 'lucide-react-native';
import { postService } from '../services/api';
import CommentScreen from './CommentScreen';
import ReportScreen from './ReportScreen';

const SEEN_STORAGE_KEY = 'seenPostIds';
const SEEN_LIMIT = 2000; // weiche Obergrenze, damit die Liste nicht endlos wächst

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const isSmallDevice = SCREEN_HEIGHT < 700;
const isMediumDevice = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 800;

// Swipe-Schwellenwerte
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const VELOCITY_THRESHOLD = 0.4;
const SWIPE_OUT_DURATION = 260;

const FEED_TYPES = [
    { key: 'forYou', label: 'For You' },
    { key: 'following', label: 'Follower' },
    { key: 'friends', label: 'Freunde' },
];

export default function HomeScreen({ user, onBlockUser }) {
    const [feedType, setFeedType] = useState('forYou');
    const [posts, setPosts] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [, setCurrentIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // offset (for-you) bzw. page (following/friends)
    const [cursor, setCursor] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Animated values
    const position = useRef(new Animated.ValueXY()).current;
    const isAnimating = useRef(false);

    // Persistente Liste gesehener Post-IDs (überlebt App-Neustart)
    const seenPostIdsRef = useRef(new Set());
    const [seenLoaded, setSeenLoaded] = useState(false);

    // Beim Mount: gesehene IDs aus AsyncStorage laden
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(SEEN_STORAGE_KEY);
                if (stored) {
                    const arr = JSON.parse(stored);
                    if (Array.isArray(arr)) seenPostIdsRef.current = new Set(arr);
                }
            } catch (e) { /* noop */ }
            setSeenLoaded(true);
        })();
    }, []);

    const persistSeen = async () => {
        try {
            const arr = [...seenPostIdsRef.current];
            // weiche Obergrenze: nur die letzten SEEN_LIMIT behalten
            const trimmed = arr.length > SEEN_LIMIT ? arr.slice(arr.length - SEEN_LIMIT) : arr;
            if (trimmed.length !== arr.length) seenPostIdsRef.current = new Set(trimmed);
            await AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) { /* noop */ }
    };

    const markSeen = (postId) => {
        if (postId == null) return;
        seenPostIdsRef.current.add(postId);
        persistSeen();
    };

    // Feed wechseln → von vorn laden (erst nachdem seenIds geladen sind)
    useEffect(() => { if (seenLoaded) loadPosts(true); }, [feedType, seenLoaded]);

    const loadPosts = async (reset = false) => {
        if (isLoadingMore && !reset) return;
        try {
            if (reset) { setIsLoading(true); setCursor(0); }
            else { setIsLoadingMore(true); }

            let rawPosts = [];
            let nextHasMore = false;
            let nextCursor = cursor;

            if (feedType === 'forYou') {
                const currentOffset = reset ? 0 : cursor;
                const response = await postService.getForYou(10, currentOffset);
                rawPosts = response.data || [];
                const meta = response.meta || {};
                nextCursor = meta.offset ?? currentOffset + rawPosts.length;
                nextHasMore = meta.has_more ?? rawPosts.length >= 10;
            } else {
                const currentPage = reset ? 1 : (cursor || 1);
                const response = feedType === 'following'
                    ? await postService.getFollowing(currentPage)
                    : await postService.getFriends(currentPage);
                const data = response.data || {};
                rawPosts = data.data || (Array.isArray(data) ? data : []);
                const currentP = data.current_page || currentPage;
                const lastP = data.last_page || currentPage;
                nextCursor = currentP + 1;
                nextHasMore = currentP < lastP;
            }

            // Bereits gesehene Posts + Duplikate rausfiltern
            const existingIds = new Set((reset ? [] : posts).map(p => p.id));
            const batchSeen = new Set();
            const newPosts = rawPosts.filter(p => {
                if (!p || p.id == null) return false;
                if (seenPostIdsRef.current.has(p.id)) return false;
                if (existingIds.has(p.id)) return false;
                if (batchSeen.has(p.id)) return false; // Dedup innerhalb derselben Response
                batchSeen.add(p.id);
                return true;
            });

            if (reset) {
                setPosts(newPosts);
                setCurrentIndex(0);
                position.setValue({ x: 0, y: 0 });
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setCursor(nextCursor);
            setHasMore(nextHasMore);
        } catch (error) {
            console.log('Failed to load posts:', error);
            if (reset) setPosts([]);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const fireLike = useCallback((post) => {
        if (!post) return;
        (async () => {
            try {
                if (post.user_has_liked) await postService.unlike(post.id);
                else await postService.like(post.id);
            } catch (e) { console.log('Failed to like:', e); }
        })();
    }, []);

    const fireDislike = useCallback((post) => {
        if (!post) return;
        (async () => {
            try { await postService.react(post.id, false); }
            catch (e) { console.log('Failed to dislike:', e); }
        })();
    }, []);

    // Post komplett aus dem Array rauswerfen — kann garantiert nie wieder auftauchen
    const goNext = useCallback(() => {
        setPosts(prev => {
            const next = prev.slice(1);
            if (hasMore && !isLoadingMore && next.length <= 4) {
                loadPosts(false);
            }
            return next;
        });
        setCurrentIndex(0);
        position.setValue({ x: 0, y: 0 });
        isAnimating.current = false;
    }, [hasMore, isLoadingMore, position]);

    // Karte rausanimieren
    const swipeOut = useCallback((direction) => {
        if (isAnimating.current) return;
        if (!posts[0]) return;
        isAnimating.current = true;

        const post = posts[0];
        // Post als gesehen markieren — kommt nie wieder
        markSeen(post.id);

        let toX = 0, toY = 0;
        if (direction === 'right') { toX = SCREEN_WIDTH * 1.5; fireDislike(post); }
        else if (direction === 'left') { toX = -SCREEN_WIDTH * 1.5; fireLike(post); }
        else if (direction === 'up') { toY = -SCREEN_HEIGHT; /* skip, keine Reaktion */ }

        Animated.timing(position, {
            toValue: { x: toX, y: toY },
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false,
        }).start(goNext);
    }, [posts, fireLike, fireDislike, goNext, position]);

    const resetPosition = useCallback(() => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: false,
        }).start();
    }, [position]);

    // PanResponder für Drag-Gesten
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
            onPanResponderMove: (_, g) => {
                if (isAnimating.current) return;
                position.setValue({ x: g.dx, y: g.dy });
            },
            onPanResponderRelease: (_, g) => {
                if (isAnimating.current) return;
                // Vorrang: große Horizontal-Bewegung vor vertikaler
                if (g.dx > SWIPE_THRESHOLD || g.vx > VELOCITY_THRESHOLD) {
                    swipeOut('right');
                } else if (g.dx < -SWIPE_THRESHOLD || g.vx < -VELOCITY_THRESHOLD) {
                    swipeOut('left');
                } else if (g.dy < -SWIPE_THRESHOLD || g.vy < -VELOCITY_THRESHOLD) {
                    swipeOut('up');
                } else {
                    resetPosition();
                }
            },
            onPanResponderTerminate: () => resetPosition(),
        })
    ).current;

    // Button-Aktionen triggern die gleiche Swipe-Animation
    // Like = links, Dislike = rechts (von User gewünschte Anordnung)
    const pressLike = () => swipeOut('left');
    const pressDislike = () => swipeOut('right');
    const pressSkip = () => swipeOut('up');

    const onRefresh = useCallback(() => { loadPosts(true); }, []);

    // Aktive Karte ist immer posts[0], nächste ist posts[1]
    const currentPost = posts[0];
    const nextPost = posts[1];
    const buttonSize = isSmallDevice ? 50 : isMediumDevice ? 58 : 65;
    const iconSize = isSmallDevice ? 22 : isMediumDevice ? 25 : 28;

    // Interpolation für Rotation und Overlays
    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        outputRange: ['-18deg', '0deg', '18deg'],
    });
    // Like = Swipe nach LINKS, Dislike = Swipe nach RECHTS
    const likeOpacity = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const nopeOpacity = position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const skipOpacity = position.y.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    // Zweite Karte rutscht leicht nach vorne, wenn vorne rausgewischt wird
    const nextCardScale = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        outputRange: [1, 0.94, 1],
        extrapolate: 'clamp',
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Posts werden geladen...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!currentPost) {
        const emptyHints = {
            forYou: 'Folge anderen um deren Posts zu sehen!',
            following: 'Du folgst noch niemandem — suche nach Usern um ihnen zu folgen.',
            friends: 'Du hast noch keine gegenseitigen Follows.',
        };
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                        <View style={styles.header}><Text style={styles.logo}>STYLR</Text></View>
                        <View style={styles.feedTabs}>
                            {FEED_TYPES.map(tab => (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[styles.feedTab, feedType === tab.key && styles.feedTabActive]}
                                    onPress={() => feedType !== tab.key && setFeedType(tab.key)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.feedTabText, feedType === tab.key && styles.feedTabTextActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </LinearGradient>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {posts.length > 0 ? 'Alle Posts gesehen!' : 'Keine Posts verfügbar'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {posts.length > 0 ? 'Schau später wieder vorbei.' : emptyHints[feedType]}
                        </Text>
                        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                            <Text style={styles.refreshButtonText}>Aktualisieren</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const renderCardContent = (post) => (
        <>
            <TouchableOpacity style={styles.flagButton} onPress={() => setShowReport(true)} activeOpacity={0.7}>
                <Flag size={moderateScale(18)} color="#FF5A5F" />
            </TouchableOpacity>

            {post.image_url ? (
                <Image source={{ uri: post.image_url }} style={styles.cardImage} resizeMode="cover" />
            ) : (
                <View style={[styles.cardImage, styles.noImagePlaceholder]}>
                    <Text style={styles.noImageText}>📝</Text>
                </View>
            )}

            <View style={styles.infoContainer}>
                <Text style={styles.description} numberOfLines={2}>
                    {post.description || 'Keine Beschreibung'}
                </Text>
                <View style={styles.userInfo}>
                    <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </LinearGradient>
                    <Text style={styles.username}>{post.user?.name || 'Unbekannt'}</Text>
                </View>
                <Text style={styles.statsText}>
                    ❤️ {post.likes_count || 0} • 👎 {post.dislikes_count || 0} • 💬 {post.comments_count || 0}
                </Text>
                <Text style={styles.hintText}>
                    ← Like  •  Dislike →  •  ↑ Skip
                </Text>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                    <View style={styles.header}><Text style={styles.logo}>STYLR</Text></View>
                    <View style={styles.feedTabs}>
                        {FEED_TYPES.map(tab => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.feedTab, feedType === tab.key && styles.feedTabActive]}
                                onPress={() => feedType !== tab.key && setFeedType(tab.key)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.feedTabText, feedType === tab.key && styles.feedTabTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </LinearGradient>

                <View style={styles.cardContainer}>
                    {/* Zweite Karte (Vorschau, unter der aktiven) */}
                    {nextPost && (
                        <Animated.View
                            style={[
                                styles.card,
                                styles.nextCard,
                                { transform: [{ scale: nextCardScale }] },
                            ]}
                            pointerEvents="none"
                        >
                            {renderCardContent(nextPost)}
                        </Animated.View>
                    )}

                    {/* Aktive Karte */}
                    <Animated.View
                        {...panResponder.panHandlers}
                        style={[
                            styles.card,
                            {
                                transform: [
                                    { translateX: position.x },
                                    { translateY: position.y },
                                    { rotate },
                                ],
                            },
                        ]}
                    >
                        {renderCardContent(currentPost)}

                        {/* Overlays */}
                        <Animated.View style={[styles.overlay, styles.overlayLike, { opacity: likeOpacity }]}>
                            <Text style={styles.overlayLikeText}>LIKE</Text>
                        </Animated.View>
                        <Animated.View style={[styles.overlay, styles.overlayNope, { opacity: nopeOpacity }]}>
                            <Text style={styles.overlayNopeText}>NOPE</Text>
                        </Animated.View>
                        <Animated.View style={[styles.overlay, styles.overlaySkip, { opacity: skipOpacity }]}>
                            <Text style={styles.overlaySkipText}>SKIP</Text>
                        </Animated.View>
                    </Animated.View>
                </View>

                <View style={styles.actionsWrapper}>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.likeActionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={pressLike}
                            activeOpacity={0.7}
                        >
                            <Heart size={iconSize} color="#FF5A5F" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={pressSkip}
                            activeOpacity={0.7}
                        >
                            <ArrowRight size={iconSize} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={pressDislike}
                            activeOpacity={0.7}
                        >
                            <X size={iconSize} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={() => setShowComments(true)}
                            activeOpacity={0.7}
                        >
                            <MessageCircle size={iconSize} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {isLoadingMore && (
                        <ActivityIndicator size="small" color="#FF5A5F" style={{ marginTop: 10 }} />
                    )}
                </View>

                <Modal visible={showComments} animationType="slide" onRequestClose={() => setShowComments(false)}>
                    <CommentScreen
                        post={currentPost}
                        onClose={() => setShowComments(false)}
                        currentUser={user}
                        onBlockUser={onBlockUser}
                    />
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

const CARD_WIDTH = SCREEN_WIDTH - scale(24);
const CARD_HEIGHT = isSmallDevice ? SCREEN_HEIGHT * 0.50 : isMediumDevice ? SCREEN_HEIGHT * 0.52 : SCREEN_HEIGHT * 0.55;

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
    header: { paddingVertical: verticalScale(10), alignItems: 'center' },
    logo: { fontSize: moderateScale(22), fontWeight: 'bold', color: '#fff', letterSpacing: 3 },
    feedTabs: { flexDirection: 'row', justifyContent: 'center', paddingBottom: verticalScale(10), paddingHorizontal: scale(20), gap: 6 },
    feedTab: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
    feedTabActive: { backgroundColor: '#fff' },
    feedTabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
    feedTabTextActive: { color: '#FF5A5F' },

    cardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: verticalScale(10),
        height: CARD_HEIGHT + verticalScale(20),
    },
    card: {
        width: CARD_WIDTH,
        maxWidth: 400,
        height: CARD_HEIGHT,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        position: 'absolute',
    },
    nextCard: {
        top: 8,
        opacity: 0.96,
    },
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
    hintText: { fontSize: 10, color: '#bbb', marginTop: 4, textAlign: 'center' },

    // Overlays
    overlay: {
        position: 'absolute',
        top: 40,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 4,
        borderRadius: 10,
    },
    overlayLike: { right: 20, borderColor: '#34C759', transform: [{ rotate: '18deg' }] },
    overlayLikeText: { color: '#34C759', fontSize: 32, fontWeight: '900' },
    overlayNope: { left: 20, borderColor: '#FF3B30', transform: [{ rotate: '-18deg' }] },
    overlayNopeText: { color: '#FF3B30', fontSize: 32, fontWeight: '900' },
    overlaySkip: { alignSelf: 'center', left: 0, right: 0, top: 30, alignItems: 'center', borderColor: '#007AFF', marginHorizontal: 60 },
    overlaySkipText: { color: '#007AFF', fontSize: 28, fontWeight: '900' },

    actionsWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', paddingHorizontal: scale(15) },
    actionButton: { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5 },
    likeActionButton: { backgroundColor: '#fff0f0' },
});
