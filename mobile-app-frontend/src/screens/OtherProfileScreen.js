import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    FlatList,
    Dimensions,
    StatusBar,
    ScrollView,
    Platform,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MessageCircle, UserX, MoreVertical, Lock } from 'lucide-react-native';
import { userService, followService, postService } from '../services/api';
import PictureStatsScreen from './PictureStatsScreen';

const { width, height } = Dimensions.get('window');

export default function OtherProfileScreen({ user, onBack, initialFollowing = false, onBlockUser, currentUser }) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [showPictureStats, setShowPictureStats] = useState(false);
    const [selectedPicture, setSelectedPicture] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showNestedProfile, setShowNestedProfile] = useState(false);
    const [nestedUser, setNestedUser] = useState(null);

    // API state
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [followStatus, setFollowStatus] = useState(null);
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, [user?.id]);

    const loadUserProfile = async () => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const profileRes = await userService.getUser(user.id);
            const profile = profileRes.data || profileRes;
            setProfileData(profile);

            // Determine follow status
            const followState = profile.follow_status || profile.is_following;
            if (followState === 'following' || followState === true) {
                setIsFollowing(true);
                setFollowStatus('following');
            } else if (followState === 'requested' || followState === 'pending') {
                setFollowStatus('requested');
                setIsFollowing(false);
            } else {
                setIsFollowing(false);
                setFollowStatus(null);
            }

            setIsPrivate(profile.account_type === 'private');

            // Load posts
            try {
                const postsRes = await postService.getUserPosts(user.id);
                const posts = postsRes.data?.data || postsRes.data || [];
                setUserPosts(posts);
            } catch (postError) {
                console.log('Posts not accessible:', postError);
                setUserPosts([]);
            }
        } catch (error) {
            console.log('Failed to load profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        const userId = user?.id;
        if (!userId) return;

        const wasFollowing = isFollowing;
        const prevStatus = followStatus;

        try {
            if (wasFollowing || followStatus === 'requested') {
                setIsFollowing(false);
                setFollowStatus(null);
                await followService.unfollow(userId);
            } else {
                const response = await followService.follow(userId);
                const status = response.data?.status || response.status;

                if (status === 'requested' || isPrivate) {
                    setFollowStatus('requested');
                    setIsFollowing(false);
                } else {
                    setIsFollowing(true);
                    setFollowStatus('following');
                }
            }
        } catch (error) {
            setIsFollowing(wasFollowing);
            setFollowStatus(prevStatus);
            Alert.alert('Error', error.message || 'Action failed');
        }
    };

    const handlePicturePress = (picture) => {
        setSelectedPicture(picture);
        setShowPictureStats(true);
    };

    const handleUserPressFromComments = (userFromComment) => {
        setNestedUser(userFromComment);
        setShowPictureStats(false);
        setShowNestedProfile(true);
    };

    const handleBlockUser = () => {
        setShowBlockModal(false);
        if (onBlockUser) {
            onBlockUser(user);
        }
        onBack();
    };

    const getFollowButtonText = () => {
        if (isFollowing) return 'Following';
        if (followStatus === 'requested') return 'Requested';
        return 'Follow';
    };

    const displayProfile = profileData || user;
    const displayName = displayProfile?.name || displayProfile?.username || 'User';
    const followersCount = displayProfile?.followers_count ?? displayProfile?.followers ?? 0;
    const followingCount = displayProfile?.following_count ?? displayProfile?.following ?? 0;

    // Block User Modal
    const BlockUserModal = () => (
        <Modal
            visible={showBlockModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowBlockModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <UserX size={40} color="#FF5A5F" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.modalTitle}>Block {displayName}?</Text>
                    <Text style={styles.modalMessage}>
                        They won't be able to find your profile, posts, or contact you. They won't be notified that you blocked them.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowBlockModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleBlockUser}>
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                style={styles.blockConfirmButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.blockConfirmText}>Block</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Show Nested Profile (from comments)
    if (showNestedProfile && nestedUser) {
        return (
            <OtherProfileScreen
                user={nestedUser}
                onBack={() => {
                    setShowNestedProfile(false);
                    setNestedUser(null);
                }}
                initialFollowing={false}
                onBlockUser={onBlockUser}
                currentUser={currentUser}
            />
        );
    }

    // Show Picture Stats Screen
    if (showPictureStats && selectedPicture) {
        return (
            <PictureStatsScreen
                picture={selectedPicture}
                onBack={() => {
                    setShowPictureStats(false);
                    setSelectedPicture(null);
                }}
                currentUser={currentUser}
                isOwnPicture={false}
                onUserPress={handleUserPressFromComments}
            />
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    const renderPicture = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handlePicturePress(item)}
        >
            <View style={styles.pictureSquare}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.squareImage} />
                ) : (
                    <View style={[styles.squareImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                        <Text style={{ fontSize: 24 }}>📝</Text>
                    </View>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.pictureOverlay}
                />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <BlockUserModal />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Top Profile Picture with Gradient Background */}
                <View style={styles.headerSection}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={24} color="#FFF" strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Block Button */}
                    <TouchableOpacity
                        style={styles.moreButton}
                        onPress={() => setShowBlockModal(true)}
                        activeOpacity={0.7}
                    >
                        <MoreVertical size={24} color="#FFF" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <View style={styles.largeProfilePlaceholder}>
                        {displayProfile?.profile_photo_url ? (
                            <Image source={{ uri: displayProfile.profile_photo_url }} style={styles.profileImage} />
                        ) : (
                            <Text style={styles.placeholderText}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Info Card Container */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.userNameText}>{displayName}</Text>
                                {isPrivate && <Lock size={18} color="#888" style={{ marginLeft: 8 }} />}
                            </View>
                            <Text style={styles.userHandle}>@{displayName.toLowerCase()}</Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{userPosts.length}</Text>
                            <Text style={styles.statLabel}>Pictures</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{followersCount}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{followingCount}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>

                    {/* Bio Description */}
                    <View style={styles.bioContainer}>
                        <Text style={styles.bioText}>
                            {displayProfile?.description || displayProfile?.bio || 'No bio yet'}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleFollowToggle}
                            style={styles.followButtonWrapper}
                        >
                            {isFollowing || followStatus === 'requested' ? (
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
                                    <Text style={styles.followButtonText}>Follow</Text>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.8}>
                            <View style={styles.messageButton}>
                                <MessageCircle size={22} color="#FF5A5F" strokeWidth={2} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Gallery Section */}
                    {userPosts.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Gallery</Text>
                            </View>
                            <View style={styles.carouselWrapper}>
                                <FlatList
                                    data={userPosts}
                                    renderItem={renderPicture}
                                    keyExtractor={item => item.id.toString()}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.horizontalList}
                                />
                            </View>
                        </>
                    )}

                    {/* Private profile message */}
                    {isPrivate && !isFollowing && userPosts.length === 0 && (
                        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                            <Lock size={40} color="#ccc" />
                            <Text style={{ color: '#888', marginTop: 10, fontSize: 14 }}>This profile is private</Text>
                            <Text style={{ color: '#aaa', marginTop: 4, fontSize: 12 }}>Follow to see their posts</Text>
                        </View>
                    )}

                    {/* No posts for public profiles */}
                    {!isPrivate && userPosts.length === 0 && (
                        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                            <Text style={{ color: '#888', fontSize: 14 }}>No posts yet</Text>
                        </View>
                    )}

                    {/* Extra padding at bottom for scroll */}
                    <View style={styles.bottomPadding} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF5A5F',
    },
    scrollView: {
        flex: 1,
    },
    headerSection: {
        height: height * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 20,
        backgroundColor: '#FF5A5F',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    largeProfilePlaceholder: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#FFFFFF',
        borderRadius: width * 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 12px rgba(0, 0, 0, 0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 10,
            },
        }),
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    placeholderText: {
        fontSize: 52,
        fontWeight: 'bold',
        color: '#FF5A5F',
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingTop: 25,
        paddingHorizontal: 25,
        paddingBottom: 20,
        minHeight: height * 0.7,
        ...Platform.select({
            web: {
                boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.1)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 10,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    userNameText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 2,
    },
    userHandle: {
        fontSize: 15,
        color: '#999',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E0E0E0',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        marginTop: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FF5A5F',
    },
    bioContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 15,
        marginBottom: 20,
    },
    bioText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    followButtonWrapper: {
        flex: 1,
        marginRight: 12,
    },
    followButton: {
        paddingVertical: 14,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(255, 90, 95, 0.3)',
            },
            default: {
                shadowColor: '#FF5A5F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
            },
        }),
    },
    followButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    followingButton: {
        paddingVertical: 14,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
    },
    followingButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        letterSpacing: 0.5,
    },
    messageButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    carouselWrapper: {
        marginBottom: 20,
    },
    horizontalList: {
        paddingVertical: 5,
    },
    pictureSquare: {
        width: 100,
        height: 100,
        backgroundColor: '#E0E0E0',
        borderRadius: 20,
        marginHorizontal: 6,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
            },
        }),
    },
    squareImage: {
        width: '100%',
        height: '100%',
    },
    pictureOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30%',
    },
    bottomPadding: {
        height: 40,
    },
    moreButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginRight: 12,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    blockConfirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
    },
    blockConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});