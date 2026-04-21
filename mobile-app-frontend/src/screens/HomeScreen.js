import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Modal, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, X, ArrowRight, MessageCircle, Flag } from 'lucide-react-native';
import Swiper from 'react-native-deck-swiper';
import { postService } from '../services/api';
import CommentScreen from './CommentScreen';
import ReportScreen from './ReportScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const isSmallDevice = SCREEN_HEIGHT < 700;
const isMediumDevice = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 800;

const CARD_HEIGHT = isSmallDevice ? SCREEN_HEIGHT * 0.55 : isMediumDevice ? SCREEN_HEIGHT * 0.58 : SCREEN_HEIGHT * 0.60;

export default function HomeScreen({ user, onBlockUser }) {
    const [posts, setPosts] = useState([]);
    const [cardIndex, setCardIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [activeModalPost, setActiveModalPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allSwiped, setAllSwiped] = useState(false);

    const swiperRef = useRef(null);

    useEffect(() => { loadPosts(true); }, []);

    const loadPosts = async (reset = false) => {
        if (isLoadingMore && !reset) return;

        try {
            if (reset) {
                setIsLoading(true);
                setOffset(0);
                setAllSwiped(false);
            } else {
                setIsLoadingMore(true);
            }

            const currentOffset = reset ? 0 : offset;
            const response = await postService.getForYou(10, currentOffset);
            const newPosts = response.data || [];
            const meta = response.meta || {};

            if (reset) {
                setPosts(newPosts);
                setCardIndex(0);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setOffset(meta.offset ?? currentOffset + newPosts.length);
            setHasMore(meta.has_more ?? newPosts.length >= 10);
        } catch (error) {
            console.log('Failed to load posts:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Fire API reaction without blocking UI (optimistic)
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

    // Called after each swipe (by deck-swiper or via button)
    const afterSwipe = useCallback((newIndex) => {
        setCardIndex(newIndex);
        // Prefetch when we're near the end
        if (hasMore && !isLoadingMore && posts.length - newIndex <= 4) {
            loadPosts(false);
        }
    }, [hasMore, isLoadingMore, posts.length]);

    const handleSwipedLeft = (idx) => {
        fireDislike(posts[idx]);
        afterSwipe(idx + 1);
    };

    const handleSwipedRight = (idx) => {
        fireLike(posts[idx]);
        afterSwipe(idx + 1);
    };

    const handleSwipedTop = (idx) => {
        // Skip — keine Reaktion
        afterSwipe(idx + 1);
    };

    const handleSwipedAll = () => {
        setAllSwiped(true);
        if (hasMore && !isLoadingMore) loadPosts(false);
    };

    // Buttons steuern den Swiper programmatisch
    const pressLike = () => swiperRef.current?.swipeRight();
    const pressDislike = () => swiperRef.current?.swipeLeft();
    const pressSkip = () => swiperRef.current?.swipeTop();

    const openComments = () => {
        const post = posts[cardIndex];
        if (post) {
            setActiveModalPost(post);
            setShowComments(true);
        }
    };

    const openReport = () => {
        const post = posts[cardIndex];
        if (post) {
            setActiveModalPost(post);
            setShowReport(true);
        }
    };

    const onRefresh = useCallback(() => { loadPosts(true); }, []);

    const buttonSize = isSmallDevice ? 50 : isMediumDevice ? 58 : 65;
    const iconSize = isSmallDevice ? 22 : isMediumDevice ? 25 : 28;

    // Rendert eine einzelne Karte
    const renderCard = (post) => {
        if (!post) return null;
        return (
            <View style={styles.card}>
                <TouchableOpacity style={styles.flagButton} onPress={openReport} activeOpacity={0.7}>
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
                        ← Dislike • Like → • ↑ Skip
                    </Text>
                </View>
            </View>
        );
    };

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

    if (posts.length === 0 || allSwiped) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                        <View style={styles.header}><Text style={styles.logo}>STYLR</Text></View>
                    </LinearGradient>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {allSwiped ? 'Alle Posts gesehen!' : 'Keine Posts verfügbar'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {allSwiped ? 'Schau später wieder vorbei.' : 'Folge anderen um deren Posts zu sehen!'}
                        </Text>
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
                </LinearGradient>

                <View style={styles.swiperContainer}>
                    <Swiper
                        ref={swiperRef}
                        cards={posts}
                        cardIndex={cardIndex}
                        renderCard={renderCard}
                        onSwipedLeft={handleSwipedLeft}
                        onSwipedRight={handleSwipedRight}
                        onSwipedTop={handleSwipedTop}
                        onSwipedAll={handleSwipedAll}
                        onTapCard={openComments}
                        stackSize={3}
                        stackSeparation={14}
                        stackScale={4}
                        disableBottomSwipe
                        backgroundColor="transparent"
                        cardVerticalMargin={0}
                        cardHorizontalMargin={scale(12)}
                        animateCardOpacity
                        verticalSwipe
                        swipeAnimationDuration={260}
                        overlayLabels={{
                            left: {
                                title: 'NOPE',
                                style: {
                                    label: styles.overlayLabelLeft,
                                    wrapper: styles.overlayWrapperLeft,
                                },
                            },
                            right: {
                                title: 'LIKE',
                                style: {
                                    label: styles.overlayLabelRight,
                                    wrapper: styles.overlayWrapperRight,
                                },
                            },
                            top: {
                                title: 'SKIP',
                                style: {
                                    label: styles.overlayLabelTop,
                                    wrapper: styles.overlayWrapperTop,
                                },
                            },
                        }}
                    />
                </View>

                <View style={styles.actionsWrapper}>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={pressDislike}
                            activeOpacity={0.7}
                        >
                            <X size={iconSize} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={pressSkip}
                            activeOpacity={0.7}
                        >
                            <ArrowRight size={iconSize} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.likeActionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={pressLike}
                            activeOpacity={0.7}
                        >
                            <Heart size={iconSize} color="#FF5A5F" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                            onPress={openComments}
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
                        post={activeModalPost}
                        onClose={() => setShowComments(false)}
                        currentUser={user}
                        onBlockUser={onBlockUser}
                    />
                </Modal>

                <Modal visible={showReport} animationType="slide" onRequestClose={() => setShowReport(false)}>
                    <ReportScreen
                        targetUser={activeModalPost?.user}
                        contentType="post"
                        contentId={activeModalPost?.id}
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
    header: { paddingVertical: verticalScale(12), alignItems: 'center' },
    logo: { fontSize: moderateScale(22), fontWeight: 'bold', color: '#fff', letterSpacing: 3 },

    // Swiper container — muss flex haben damit der Swiper seine Größe kennt
    swiperContainer: { height: CARD_HEIGHT, marginTop: verticalScale(6) },

    card: {
        height: CARD_HEIGHT - verticalScale(20),
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
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

    // Overlay-Labels während des Ziehens
    overlayLabelLeft: { borderColor: '#FF3B30', color: '#FF3B30', borderWidth: 4, fontSize: 36, fontWeight: 'bold', padding: 10, borderRadius: 10 },
    overlayWrapperLeft: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 40, marginRight: 30 },
    overlayLabelRight: { borderColor: '#34C759', color: '#34C759', borderWidth: 4, fontSize: 36, fontWeight: 'bold', padding: 10, borderRadius: 10 },
    overlayWrapperRight: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 40, marginLeft: 30 },
    overlayLabelTop: { borderColor: '#007AFF', color: '#007AFF', borderWidth: 4, fontSize: 32, fontWeight: 'bold', padding: 10, borderRadius: 10 },
    overlayWrapperTop: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },

    actionsWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', paddingHorizontal: scale(15) },
    actionButton: { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5 },
    likeActionButton: { backgroundColor: '#fff0f0' },
});
