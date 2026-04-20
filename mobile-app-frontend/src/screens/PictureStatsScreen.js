import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, StatusBar, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, MessageCircle, Trash2, Flag, ThumbsDown } from 'lucide-react-native';
import { postService } from '../services/api';
import CommentScreen from './CommentScreen';
import ReportScreen from './ReportScreen';

export default function PictureStatsScreen({ picture, isOwnPicture, onBack, onClose, onDelete, currentUser, onBlockUser, onUserPress }) {
    const [post, setPost] = useState(picture);
    const [showComments, setShowComments] = useState(false);
    const [showReport, setShowReport] = useState(false);

    // YouTube-style: only one can be active at a time
    const [reaction, setReaction] = useState(null); // 'liked' | 'disliked' | null
    const [likesCount, setLikesCount] = useState(picture?.likes_count || 0);
    const [dislikesCount, setDislikesCount] = useState(picture?.dislikes_count || 0);
    const [commentsCount, setCommentsCount] = useState(picture?.comments_count || 0);

    const handleBack = onBack || onClose;

    useEffect(() => {
        loadPostDetails();
    }, [picture?.id]);

    const loadPostDetails = async () => {
        if (!picture?.id) return;
        try {
            const response = await postService.getPost(picture.id);
            // getPost returns raw model, but handle wrapped shape defensively
            const postData = response?.data || response;
            if (!postData) return;
            setPost(postData);
            setLikesCount(postData.likes_count || 0);
            setDislikesCount(postData.dislikes_count || 0);
            setCommentsCount(postData.comments_count || postData.comments?.length || 0);

            // Set initial reaction state from API
            if (postData.user_has_liked === true) {
                setReaction('liked');
            } else if (postData.user_has_disliked === true) {
                setReaction('disliked');
            } else {
                setReaction(null);
            }
        } catch (error) {
            console.log('Failed to load post details:', error);
        }
    };

    const handleLike = async () => {
        const prevReaction = reaction;
        const prevLikes = likesCount;
        const prevDislikes = dislikesCount;

        if (reaction === 'liked') {
            // Already liked → remove like
            setReaction(null);
            setLikesCount(prev => Math.max(0, prev - 1));

            try {
                await postService.unlike(picture.id);
            } catch (error) {
                setReaction(prevReaction);
                setLikesCount(prevLikes);
                console.log('Failed to unlike:', error);
            }
        } else {
            // Not liked → set like (remove dislike if active)
            setReaction('liked');
            setLikesCount(prev => prev + 1);
            if (prevReaction === 'disliked') {
                setDislikesCount(prev => Math.max(0, prev - 1));
            }

            try {
                await postService.like(picture.id);
            } catch (error) {
                setReaction(prevReaction);
                setLikesCount(prevLikes);
                setDislikesCount(prevDislikes);
                console.log('Failed to like:', error);
            }
        }
    };

    const handleDislike = async () => {
        const prevReaction = reaction;
        const prevLikes = likesCount;
        const prevDislikes = dislikesCount;

        if (reaction === 'disliked') {
            // Already disliked → remove dislike
            setReaction(null);
            setDislikesCount(prev => Math.max(0, prev - 1));

            try {
                await postService.unlike(picture.id);
            } catch (error) {
                setReaction(prevReaction);
                setDislikesCount(prevDislikes);
                console.log('Failed to remove dislike:', error);
            }
        } else {
            // Not disliked → set dislike (remove like if active)
            setReaction('disliked');
            setDislikesCount(prev => prev + 1);
            if (prevReaction === 'liked') {
                setLikesCount(prev => Math.max(0, prev - 1));
            }

            try {
                await postService.react(picture.id, false);
            } catch (error) {
                setReaction(prevReaction);
                setLikesCount(prevLikes);
                setDislikesCount(prevDislikes);
                console.log('Failed to dislike:', error);
            }
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Post löschen',
            'Bist du sicher? Alle Likes und Comments werden automatisch mitgelöscht.',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: () => { if (onDelete) onDelete(); }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Post</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {post?.image_url ? (
                    <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.postImage, styles.noImagePlaceholder]}>
                        <Text style={styles.noImageText}>📝</Text>
                        <Text style={styles.noImageLabel}>Nur Text-Post</Text>
                    </View>
                )}

                <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                        <TouchableOpacity
                            style={[styles.statItem, reaction === 'liked' && styles.activeStatItem]}
                            onPress={handleLike}
                        >
                            <Heart size={24} color="#FF5A5F" fill={reaction === 'liked' ? "#FF5A5F" : "transparent"} />
                            <Text style={[styles.statText, reaction === 'liked' && styles.activeStatText]}>{likesCount}</Text>
                        </TouchableOpacity>

                        {!isOwnPicture && (
                            <TouchableOpacity
                                style={[styles.statItem, reaction === 'disliked' && styles.activeDislikeItem]}
                                onPress={handleDislike}
                            >
                                <ThumbsDown size={24} color={reaction === 'disliked' ? "#555" : "#666"} fill={reaction === 'disliked' ? "#555" : "transparent"} />
                                <Text style={[styles.statText, reaction === 'disliked' && styles.activeDislikeText]}>{dislikesCount}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.statItem} onPress={() => setShowComments(true)}>
                            <MessageCircle size={24} color="#666" />
                            <Text style={styles.statText}>{commentsCount}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.descriptionContainer}>
                    <TouchableOpacity
                        style={styles.userRow}
                        disabled={isOwnPicture || !onUserPress}
                        onPress={() => onUserPress && post?.user && onUserPress(post.user)}
                    >
                        <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {post?.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </LinearGradient>
                        <View>
                            <Text style={styles.username}>{post?.user?.name || 'Unbekannt'}</Text>
                            <Text style={styles.timestamp}>{formatDate(post?.created_at)}</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.description}>{post?.description || 'Keine Beschreibung'}</Text>
                </View>

                <View style={styles.actionsContainer}>
                    {isOwnPicture ? (
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Trash2 size={20} color="#FF5A5F" />
                            <Text style={styles.deleteButtonText}>Post löschen</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.reportButton} onPress={() => setShowReport(true)}>
                            <Flag size={20} color="#888" />
                            <Text style={styles.reportButtonText}>Post melden</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <Modal visible={showComments} animationType="slide" onRequestClose={() => setShowComments(false)}>
                <CommentScreen
                    post={post}
                    onClose={() => { setShowComments(false); loadPostDetails(); }}
                    currentUser={currentUser}
                    onBlockUser={onBlockUser}
                />
            </Modal>

            <Modal visible={showReport} animationType="slide" onRequestClose={() => setShowReport(false)}>
                <ReportScreen
                    targetUser={post?.user}
                    contentType="post"
                    contentId={post?.id}
                    onClose={() => setShowReport(false)}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerGradient: { paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { flex: 1 },
    postImage: { width: '100%', height: 350, backgroundColor: '#e0e0e0' },
    noImagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    noImageText: { fontSize: 60 },
    noImageLabel: { fontSize: 14, color: '#888', marginTop: 10 },
    statsContainer: { backgroundColor: '#fff', padding: 15 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    activeStatItem: { backgroundColor: '#fff0f0' },
    activeDislikeItem: { backgroundColor: '#f0f0f0' },
    statText: { marginLeft: 8, fontSize: 16, color: '#333', fontWeight: '500' },
    activeStatText: { color: '#FF5A5F', fontWeight: '700' },
    activeDislikeText: { color: '#555', fontWeight: '700' },
    descriptionContainer: { backgroundColor: '#fff', padding: 15, marginTop: 10 },
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    username: { fontSize: 16, fontWeight: '600', color: '#333' },
    timestamp: { fontSize: 12, color: '#888', marginTop: 2 },
    description: { fontSize: 15, color: '#555', lineHeight: 22 },
    actionsContainer: { padding: 20 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff0f0', padding: 15, borderRadius: 12 },
    deleteButtonText: { marginLeft: 8, color: '#FF5A5F', fontSize: 16, fontWeight: '600' },
    reportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12 },
    reportButtonText: { marginLeft: 8, color: '#888', fontSize: 16, fontWeight: '500' },
});