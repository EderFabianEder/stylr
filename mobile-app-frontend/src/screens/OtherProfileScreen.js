import React, { useState } from 'react';
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
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Mock data for user's pictures
const userPictures = [
    { id: '1', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' },
    { id: '2', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' },
    { id: '3', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400' },
    { id: '4', image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400' },
    { id: '5', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
    { id: '6', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400' },
];

export default function OtherProfileScreen({ user, onBack, initialFollowing = false }) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing);

    const handleFollowToggle = () => {
        setIsFollowing(!isFollowing);
    };

    const renderPicture = ({ item }) => (
        <TouchableOpacity activeOpacity={0.8}>
            <View style={styles.pictureSquare}>
                <Image source={{ uri: item.image }} style={styles.squareImage} />
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

                    <View style={styles.largeProfilePlaceholder}>
                        {user?.profilePhoto ? (
                            <Image source={{ uri: user.profilePhoto }} style={styles.profileImage} />
                        ) : (
                            <Text style={styles.placeholderText}>
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Info Card Container */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.userNameText}>{user?.username || 'UserName'}</Text>
                            <Text style={styles.userHandle}>@{user?.username?.toLowerCase() || 'username'}</Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{userPictures.length}</Text>
                            <Text style={styles.statLabel}>Pictures</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {user?.followers?.toLocaleString() || '0'}
                            </Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {user?.following?.toLocaleString() || '0'}
                            </Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>

                    {/* Bio Description */}
                    <View style={styles.bioContainer}>
                        <Text style={styles.bioText}>
                            {user?.bio || 'Fashion enthusiast | Style lover | Creating content that inspires ✨'}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleFollowToggle}
                            style={styles.followButtonWrapper}
                        >
                            {isFollowing ? (
                                <View style={styles.followingButton}>
                                    <Text style={styles.followingButtonText}>Following</Text>
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

                    {/* Gallery Section Header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Gallery</Text>
                    </View>

                    {/* Horizontal Carousel for Pictures */}
                    <View style={styles.carouselWrapper}>
                        <FlatList
                            data={userPictures}
                            renderItem={renderPicture}
                            keyExtractor={item => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>

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
        gap: 12,
    },
    followButtonWrapper: {
        flex: 1,
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
});