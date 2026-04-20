import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Reply, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react-native';
import { commentService } from '../services/api';
import OtherProfileScreen from './OtherProfileScreen';

export default function CommentScreen({ post, onClose, currentUser, onBlockUser }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (post?.id) loadComments();
    }, [post?.id]);

    const loadComments = async (pageNum = 1) => {
        try {
            if (pageNum === 1) setIsLoading(true); else setIsLoadingMore(true);

            const response = await commentService.getComments(post.id, pageNum);

            // Backend kann unterschiedliche Shapes liefern:
            // - Laravel Paginator roh:  { current_page, data: [...], last_page, ... }
            // - Wrapped:                { success, data: { current_page, data: [...], last_page, ... } }
            // - Comments-Key:           { success, data: { comments: [...], pagination: { last_page } } }
            // - Roher Array:            [...]
            const commentsArray =
                Array.isArray(response) ? response :
                Array.isArray(response?.data?.data) ? response.data.data :
                Array.isArray(response?.data?.comments) ? response.data.comments :
                Array.isArray(response?.data) ? response.data :
                [];

            const lastPage =
                response?.data?.pagination?.last_page ||
                response?.data?.last_page ||
                response?.last_page ||
                1;

            if (pageNum === 1) {
                setComments(commentsArray);
            } else {
                setComments(prev => [...(Array.isArray(prev) ? prev : []), ...commentsArray]);
            }

            setHasMore(pageNum < lastPage);
            setPage(pageNum);
        } catch (error) {
            console.log('Failed to load comments:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (hasMore && !isLoading && !isLoadingMore) {
            loadComments(page + 1);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || isSending) return;

        setIsSending(true);
        try {
            const parentId = replyingTo?.id || null;
            // Text bereinigen (@ Mention entfernen wenn es ein Reply ist)
            let commentText = newComment.trim();

            const response = await commentService.create(post.id, commentText, parentId);
            // Backend kann wrappen ({success, data: {...}}) oder roh liefern
            const newCommentData =
                (response?.data && !Array.isArray(response.data) && response.data.id)
                    ? response.data
                    : response;

            if (replyingTo) {
                // Reply zu bestehendem Comment hinzufügen
                setComments(prevComments => {
                    const list = Array.isArray(prevComments) ? prevComments : [];
                    return list.map(comment => {
                        if (comment.id === replyingTo.id) {
                            return {
                                ...comment,
                                replies: [...(Array.isArray(comment.replies) ? comment.replies : []), newCommentData],
                                replies_count: (comment.replies_count || 0) + 1
                            };
                        }
                        return comment;
                    });
                });
                setExpandedReplies(prev => ({ ...prev, [replyingTo.id]: true }));
                setReplyingTo(null);
            } else {
                // Neuen Comment oben einfügen
                setComments(prev => [newCommentData, ...(Array.isArray(prev) ? prev : [])]);
            }

            setNewComment('');
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Kommentar konnte nicht gesendet werden');
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteComment = async (commentId, parentId = null) => {
        Alert.alert('Kommentar löschen', 'Bist du sicher?', [
            { text: 'Abbrechen', style: 'cancel' },
            {
                text: 'Löschen',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await commentService.delete(commentId);

                        if (parentId) {
                            // Reply entfernen
                            setComments(prev => prev.map(comment => {
                                if (comment.id === parentId) {
                                    return {
                                        ...comment,
                                        replies: (comment.replies || []).filter(r => r.id !== commentId),
                                        replies_count: Math.max(0, (comment.replies_count || 1) - 1)
                                    };
                                }
                                return comment;
                            }));
                        } else {
                            // Hauptkommentar entfernen
                            setComments(prev => prev.filter(c => c.id !== commentId));
                        }
                    } catch (error) {
                        Alert.alert('Fehler', error.message || 'Kommentar konnte nicht gelöscht werden');
                    }
                }
            }
        ]);
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        const username = comment.user?.name || comment.username || '';
        setNewComment(`@${username} `);
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setNewComment('');
    };

    const handleUserPress = (commentUser) => {
        const userId = commentUser.user_id || commentUser.user?.id || commentUser.id;
        if (!userId || userId === currentUser?.id) return;

        const userProfile = {
            id: userId,
            name: commentUser.user?.name || commentUser.name || commentUser.username,
            username: commentUser.user?.username || commentUser.username || commentUser.user?.name || commentUser.name,
            followers_count: commentUser.user?.followers_count || commentUser.followers_count || 0,
            following_count: commentUser.user?.following_count || commentUser.following_count || 0,
        };
        setSelectedUser(userProfile);
        setShowUserProfile(true);
    };

    // Profil-Ansicht
    if (showUserProfile && selectedUser) {
        return (
            <OtherProfileScreen
                user={selectedUser}
                onBack={() => { setShowUserProfile(false); setSelectedUser(null); }}
                initialFollowing={false}
                onBlockUser={onBlockUser}
                currentUser={currentUser}
            />
        );
    }

    const formatTimestamp = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Gerade eben';
        if (diffMin < 60) return `${diffMin}m`;
        if (diffHrs < 24) return `${diffHrs}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('de-DE');
    };

    const isOwnComment = (comment) => {
        const userId = comment.user_id || comment.user?.id;
        return userId === currentUser?.id;
    };

    const renderReply = (reply, parentId) => (
        <View key={reply.id} style={styles.replyItem}>
            <TouchableOpacity onPress={() => handleUserPress(reply)} activeOpacity={0.7}>
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.replyAvatar}
                >
                    <Text style={styles.replyAvatarText}>
                        {(reply.user?.name || reply.username || 'U').charAt(0).toUpperCase()}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
            <View style={styles.replyContent}>
                <View style={styles.commentHeader}>
                    <TouchableOpacity onPress={() => handleUserPress(reply)}>
                        <Text style={styles.replyUsername}>{reply.user?.name || reply.username}</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.replyTimestamp}>{formatTimestamp(reply.created_at)}</Text>
                        {isOwnComment(reply) && (
                            <TouchableOpacity onPress={() => handleDeleteComment(reply.id, parentId)} style={{ marginLeft: 8 }}>
                                <Trash2 size={12} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <Text style={styles.replyText}>{reply.body || reply.text}</Text>
            </View>
        </View>
    );

    const renderComment = ({ item: commentItem }) => (
        <View style={styles.commentContainer}>
            <View style={styles.commentItem}>
                <TouchableOpacity onPress={() => handleUserPress(commentItem)} activeOpacity={0.7}>
                    <LinearGradient
                        colors={['#FF5A5F', '#CE494D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.commentAvatar}
                    >
                        <Text style={styles.commentAvatarText}>
                            {(commentItem.user?.name || commentItem.username || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={() => handleUserPress(commentItem)}>
                            <Text style={styles.commentUsername}>{commentItem.user?.name || commentItem.username}</Text>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.commentTimestamp}>{formatTimestamp(commentItem.created_at)}</Text>
                            {isOwnComment(commentItem) && (
                                <TouchableOpacity onPress={() => handleDeleteComment(commentItem.id)} style={{ marginLeft: 8 }}>
                                    <Trash2 size={14} color="#ccc" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <Text style={styles.commentText}>{commentItem.body || commentItem.text}</Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity style={styles.replyButton} onPress={() => handleReply(commentItem)} activeOpacity={0.7}>
                            <Reply size={14} color="#888" strokeWidth={2} />
                            <Text style={styles.replyButtonText}>Antworten</Text>
                        </TouchableOpacity>
                        {commentItem.replies && commentItem.replies.length > 0 && (
                            <TouchableOpacity style={styles.viewRepliesButton} onPress={() => toggleReplies(commentItem.id)} activeOpacity={0.7}>
                                {expandedReplies[commentItem.id] ? (
                                    <ChevronUp size={14} color="#FF5A5F" strokeWidth={2} />
                                ) : (
                                    <ChevronDown size={14} color="#FF5A5F" strokeWidth={2} />
                                )}
                                <Text style={styles.viewRepliesText}>
                                    {expandedReplies[commentItem.id] ? 'Ausblenden' : 'Zeige'} {commentItem.replies.length} {commentItem.replies.length === 1 ? 'Antwort' : 'Antworten'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            {expandedReplies[commentItem.id] && commentItem.replies && commentItem.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {commentItem.replies.map(reply => renderReply(reply, commentItem.id))}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={['#FF5A5F', '#CE494D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kommentare</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            {/* Post Info */}
            <View style={styles.itemInfo}>
                <Text style={styles.itemDescription}>{post?.description || 'Post'}</Text>
                <Text style={styles.itemUsername}>von {post?.user?.name || 'Unbekannt'}</Text>
            </View>

            {/* Loading */}
            {isLoading ? (
                <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={(commentItem) => commentItem.id.toString()}
                    style={styles.commentsList}
                    contentContainerStyle={styles.commentsListContent}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Noch keine Kommentare</Text>
                            <Text style={styles.emptySubtext}>Schreib den ersten Kommentar!</Text>
                        </View>
                    }
                />
            )}

            {/* Reply Indikator */}
            {replyingTo && (
                <View style={styles.replyingToContainer}>
                    <Text style={styles.replyingToText}>
                        Antwort an <Text style={styles.replyingToUsername}>@{replyingTo.user?.name || replyingTo.username}</Text>
                    </Text>
                    <TouchableOpacity onPress={cancelReply} activeOpacity={0.7}>
                        <X size={18} color="#666" strokeWidth={2} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Eingabe */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={replyingTo ? `Antwort an @${replyingTo.user?.name || replyingTo.username}...` : "Kommentar schreiben..."}
                        placeholderTextColor="#999"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity onPress={handleSendComment} activeOpacity={0.8} disabled={isSending || !newComment.trim()}>
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.sendButton, (isSending || !newComment.trim()) && { opacity: 0.5 }]}
                        >
                            {isSending ? (
                                <ActivityIndicator size={16} color="#fff" />
                            ) : (
                                <Send size={20} color="#fff" strokeWidth={2} />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerGradient: { paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    placeholder: { width: 40 },
    itemInfo: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    itemDescription: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
    itemUsername: { fontSize: 14, color: '#666' },
    commentsList: { flex: 1 },
    commentsListContent: { padding: 15 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#666' },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 5 },
    commentContainer: { marginBottom: 15 },
    commentItem: { flexDirection: 'row', marginBottom: 0, backgroundColor: '#fff', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    commentAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    commentAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    commentContent: { flex: 1 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    commentUsername: { fontSize: 14, fontWeight: '600', color: '#FF5A5F' },
    commentTimestamp: { fontSize: 12, color: '#999' },
    commentText: { fontSize: 14, color: '#555', lineHeight: 20 },
    commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    replyButton: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    replyButtonText: { fontSize: 12, color: '#888', marginLeft: 4, fontWeight: '500' },
    viewRepliesButton: { flexDirection: 'row', alignItems: 'center' },
    viewRepliesText: { fontSize: 12, color: '#FF5A5F', marginLeft: 4, fontWeight: '500' },
    repliesContainer: { marginLeft: 52, marginTop: 8, borderLeftWidth: 2, borderLeftColor: '#e0e0e0', paddingLeft: 12 },
    replyItem: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 10 },
    replyAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    replyAvatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    replyContent: { flex: 1 },
    replyUsername: { fontSize: 13, fontWeight: '600', color: '#FF5A5F' },
    replyTimestamp: { fontSize: 11, color: '#999' },
    replyText: { fontSize: 13, color: '#555', lineHeight: 18 },
    replyingToContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
    replyingToText: { fontSize: 13, color: '#666' },
    replyingToUsername: { fontWeight: '600', color: '#FF5A5F' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
    input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, maxHeight: 100, fontSize: 14, color: '#333' },
    sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});