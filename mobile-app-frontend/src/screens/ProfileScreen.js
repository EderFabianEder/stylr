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
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import EditProfileScreen from './EditProfileScreen';

const { width, height } = Dimensions.get('window');

// Mock data for "My Pictures"
const myPictures = [
    { id: '1', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
    { id: '2', image: 'https://images.unsplash.com/photo-1539109132314-3477524c859c?w=400' },
    { id: '3', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400' },
    { id: '4', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400' },
];

export default function ProfileScreen({ user, onUpdateUser }) {
    const [showEditScreen, setShowEditScreen] = useState(false);
    const [userData, setUserData] = useState(user);

    const handleSaveProfile = (updatedData) => {
        setUserData(updatedData);
        setShowEditScreen(false);
        // Persist the update to parent
        if (onUpdateUser) {
            onUpdateUser(updatedData);
        }
    };

    // Show Edit Profile Screen
    if (showEditScreen) {
        return (
            <EditProfileScreen
                user={userData}
                onSave={handleSaveProfile}
                onBack={() => setShowEditScreen(false)}
            />
        );
    }

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
                    <View style={styles.largeProfilePlaceholder}>
                        {userData?.profilePhoto ? (
                            <Image source={{ uri: userData.profilePhoto }} style={styles.profileImage} />
                        ) : (
                            <Text style={styles.placeholderLogo}>bʈb</Text>
                        )}
                    </View>
                </View>

                {/* Info Card Container with Shadow */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.userNameText}>{userData?.username || 'UserName'}</Text>
                            <Text style={styles.userHandle}>@{userData?.username?.toLowerCase() || 'username'}</Text>
                        </View>
                    </View>

                    {/* Stats Row with Enhanced Design */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>1,000</Text>
                            <Text style={styles.statLabel}>Pictures</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>2,000</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>300</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>

                    {/* Bio Description with Better Typography */}
                    <View style={styles.bioContainer}>
                        <Text style={styles.bioText}>
                            {userData?.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ✨'}
                        </Text>
                    </View>

                    {/* My Pictures Section Header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>My Gallery</Text>
                        <TouchableOpacity activeOpacity={0.7}>
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                style={styles.plusButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Plus size={20} color="white" strokeWidth={3} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Horizontal Carousel for Pictures */}
                    <View style={styles.carouselWrapper}>
                        <FlatList
                            data={myPictures}
                            renderItem={renderPicture}
                            keyExtractor={item => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>

                    {/* Edit Profile Button - Enhanced Gradient */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowEditScreen(true)}
                    >
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            style={styles.editProfileButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.editProfileText}>Edit Profile</Text>
                        </LinearGradient>
                    </TouchableOpacity>

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
    largeProfilePlaceholder: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#FFFFFF',
        borderRadius: width * 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    placeholderLogo: {
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        minHeight: height * 0.7,
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
        marginBottom: 25,
    },
    bioText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
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
        marginRight: 12,
    },
    plusButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF5A5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
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
    editProfileButton: {
        paddingVertical: 16,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
        shadowColor: '#FF5A5F',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    editProfileText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    bottomPadding: {
        height: 20,
    },
});