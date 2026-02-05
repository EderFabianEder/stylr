import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, StatusBar, Modal, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Plus, Grid, Lock } from 'lucide-react-native';
import { postService, userService } from '../services/api';
import AddPhotoScreen from './AddPhotoScreen';
import PictureStatsScreen from './PictureStatsScreen';
import EditProfileScreen from './EditProfileScreen';

export default function ProfileScreen({ user, onUpdateUser, onLogout, refreshUser }) {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddPhoto, setShowAddPhoto] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => { loadUserData(); }, [user?.id]);

    const loadUserData = async (refresh = false) => {
        try {
            if (refresh) setIsRefreshing(true);

            const [postsRes, profileRes] = await Promise.all([
                postService.getUserPosts(user?.id),
                userService.getProfile()
            ]);

            // GET /posts/user/{userId} returns: { success, data: { current_page, data: [...], per_page, total } }
            const postsData = postsRes.data?.data || postsRes.data || [];
            const profileData = profileRes.data?.user || profileRes.data || profileRes;

            setPosts(postsData);
            setProfile(profileData);
        } catch (error) {
            console.log('Failed to load profile:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        loadUserData(true);
    }, []);

    const handleAddPhoto = async (photoData) => {
        try {
            // POST /posts { description, image_url }
            await postService.create(photoData.description, photoData.imageUri || null);
            loadUserData(true);
            setShowAddPhoto(false);
            Alert.alert('Erfolg', 'Post wurde erstellt!');
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Post konnte nicht erstellt werden');
        }
    };

    const handleDeletePost = async (postId) => {
        Alert.alert('Post löschen', 'Bist du sicher?', [
            { text: 'Abbrechen', style: 'cancel' },
            {
                text: 'Löschen',
                style: 'destructive',
                onPress: async () => {
                    try {
                        // DELETE /posts/{id}
                        await postService.delete(postId);
                        setPosts(prev => prev.filter(p => p.id !== postId));
                        setSelectedPost(null);
                        Alert.alert('Erfolg', 'Post wurde gelöscht');
                    } catch (error) {
                        Alert.alert('Fehler', error.message || 'Post konnte nicht gelöscht werden');
                    }
                }
            }
        ]);
    };

    const handleUpdateProfile = async (data) => {
        try {
            await userService.updateProfile(data);
            if (onUpdateUser) onUpdateUser(data);
            if (refreshUser) refreshUser();
            loadUserData(true);
            setShowEditProfile(false);
            Alert.alert('Erfolg', 'Profil wurde aktualisiert');
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Profil konnte nicht aktualisiert werden');
            throw error;
        }
    };

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

    if (selectedPost) {
        return (
            <PictureStatsScreen
                picture={selectedPost}
                isOwnPicture={true}
                onBack={() => setSelectedPost(null)}
                onDelete={() => handleDeletePost(selectedPost.id)}
                currentUser={user}
            />
        );
    }

    const displayUser = profile || user;
    const isPrivate = displayUser?.account_type === 'private';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profil</Text>
                    <TouchableOpacity onPress={() => setShowEditProfile(true)} style={styles.settingsButton}>
                        <Settings size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    <LinearGradient colors={['#fff', '#f0f0f0']} style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{displayUser?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                    </LinearGradient>

                    <View style={styles.nameRow}>
                        <Text style={styles.username}>{displayUser?.name || 'User'}</Text>
                        {isPrivate && <Lock size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />}
                    </View>

                    <Text style={styles.email}>{displayUser?.email}</Text>
                    {isPrivate && <Text style={styles.privateLabel}>Privates Profil</Text>}

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{posts.length}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <TouchableOpacity style={styles.statItem}>
                            <Text style={styles.statNumber}>{displayUser?.followers_count || 0}</Text>
                            <Text style={styles.statLabel}>Follower</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statItem}>
                            <Text style={styles.statNumber}>{displayUser?.following_count || 0}</Text>
                            <Text style={styles.statLabel}>Folge ich</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.tabBar}>
                    <TouchableOpacity style={styles.tabActive}>
                        <Grid size={22} color="#FF5A5F" />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 40 }} />
                ) : posts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Noch keine Posts</Text>
                        <TouchableOpacity onPress={() => setShowAddPhoto(true)} style={styles.addButton}>
                            <Text style={styles.addButtonText}>Ersten Post erstellen</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={posts}
                        renderItem={renderPost}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={3}
                        contentContainerStyle={styles.gridContainer}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FF5A5F']} />
                        }
                    />
                )}
            </View>

            <TouchableOpacity style={styles.fab} onPress={() => setShowAddPhoto(true)}>
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.fabGradient}>
                    <Plus size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            <Modal visible={showAddPhoto} animationType="slide" onRequestClose={() => setShowAddPhoto(false)}>
                <AddPhotoScreen onClose={() => setShowAddPhoto(false)} onSubmit={handleAddPhoto} />
            </Modal>

            <Modal visible={showEditProfile} animationType="slide" onRequestClose={() => setShowEditProfile(false)}>
                <EditProfileScreen
                    user={displayUser}
                    onClose={() => setShowEditProfile(false)}
                    onSave={handleUpdateProfile}
                    onLogout={onLogout}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerGradient: { paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    settingsButton: { padding: 8 },
    profileSection: { alignItems: 'center', paddingTop: 20 },
    avatarContainer: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FF5A5F' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    username: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    privateLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    statsContainer: { flexDirection: 'row', marginTop: 20 },
    statItem: { alignItems: 'center', marginHorizontal: 25 },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    content: { flex: 1 },
    tabBar: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
    tabActive: { padding: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, color: '#666', marginBottom: 20 },
    addButton: { backgroundColor: '#FF5A5F', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
    addButtonText: { color: '#fff', fontWeight: '600' },
    gridContainer: { padding: 2 },
    gridItem: { flex: 1/3, aspectRatio: 1, padding: 2 },
    gridImage: { flex: 1, borderRadius: 4, backgroundColor: '#e0e0e0' },
    noImagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    noImageText: { fontSize: 24 },
    gridOverlay: { position: 'absolute', bottom: 4, left: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 4, alignItems: 'center' },
    gridStats: { color: '#fff', fontSize: 11 },
    fab: { position: 'absolute', bottom: 20, right: 20 },
    fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});