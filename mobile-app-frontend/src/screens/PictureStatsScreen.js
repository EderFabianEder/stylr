import React, { useState } from 'react';
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
    ScrollView,
    Alert,
    Dimensions,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, MessageCircle, Eye, Share2, Trash2, Send, X, Reply, ChevronDown, ChevronUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Mock Comments with replies
const mockComments = [
    {
        id: 1,
        username: 'sarah_style',
        text: 'Love this dress! Where can I get it?',
        timestamp: '2h ago',
        replies: [
            {
                id: 101,
                username: 'fashion_lover',
                text: 'I think it\'s from Zara!',
                timestamp: '1h ago',
            },
        ],
    },
    {
        id: 2,
        username: 'fashion_lover',
        text: 'Perfect for summer! 😍',
        timestamp: '5h ago',
        replies: [],
    },
    {
        id: 3,
        username: 'minimal_john',
        text: 'Clean style, very elegant',
        timestamp: '1d ago',
        replies: [
            {
                id: 301,
                username: 'style_queen',
                text: 'Totally agree!',
                timestamp: '20h ago',
            },
            {
                id: 302,
                username: 'urban_chic',
                text: 'Yes, love the minimalist vibe',
                timestamp: '18h ago',
            },
        ],
    },
];

// Mock Stats
const mockStats = {
    views: 1234,
    likes: 89,
    comments: 12,
    shares: 5,
};

export default function PictureStatsScreen({
                                               picture,
                                               onClose,
                                               onDelete,
                                               currentUser,
                                               isOwnPicture = false,
                                               onUserPress
                                           }) {
    const [comments, setComments] = useState(mockComments);
    const [newComment, setNewComment] = useState('');
    const [stats, setStats] = useState(mockStats);
    const [isLiked, setIsLiked] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});

    const handleSendComment = () => {
        if (newComment.trim()) {
            if (replyingTo) {
                // Add reply to existing comment
                const reply = {
                    id: Date.now(),
                    username: currentUser?.username || 'you',
                    text: newComment,
                    timestamp: 'Just now',
                    isCurrentUser: true,
                    profilePhoto: currentUser?.profilePhoto,
                };
                setComments(prevComments =>
                    prevComments.map(comment => {
                        if (comment.id === replyingTo.id) {
                            return {
                                ...comment,
                                replies: [...(comment.replies || []), reply]
                            };
                        }
                        return comment;
                    })
                );
                setReplyingTo(null);
                // Expand replies for this comment
                setExpandedReplies(prev => ({ ...prev, [replyingTo.id]: true }));
            } else {
                // Add new comment
                const comment = {
                    id: Date.now(),
                    username: currentUser?.username || 'you',
                    text: newComment,
                    timestamp: 'Just now',
                    isCurrentUser: true,
                    profilePhoto: currentUser?.profilePhoto,
                    replies: [],
                };
                setComments([comment, ...comments]);
            }
            setNewComment('');
            setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
        }
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setNewComment(`@${comment.username} `);
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setNewComment('');
    };

    const handleUsernamePress = (username) => {
        if (onUserPress) {
            // Create a user object from the username
            const userFromComment = {
                id: username,
                username: username,
                followers: Math.floor(Math.random() * 5000),
                following: Math.floor(Math.random() * 500),
            };
            onUserPress(userFromComment);
        }
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        setStats(prev => ({
            ...prev,
            likes: isLiked ? prev.likes - 1 : prev.likes + 1
        }));
    };

    const handleDeletePress = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        setShowDeleteModal(false);
        if (onDelete) {
            onDelete(picture.id);
        }
        onClose();
    };

    const handleShare = () => {
        if (Platform.OS === 'web') {
            window.alert('Sharing functionality coming soon!');
        } else {
            Alert.alert('Share', 'Sharing functionality coming soon!');
        }
    };

    const renderReply = (reply, parentComment) => (
        <View key={reply.id} style={styles.replyItem}>
            <TouchableOpacity
                onPress={() => handleUsernamePress(reply.username)}
                activeOpacity={0.7}
            >
                {reply.profilePhoto ? (
                    <View style={styles.replyAvatarContainer}>
                        <Image
                            source={{ uri: reply.profilePhoto }}
                            style={styles.replyAvatarImage}
                        />
                    </View>
                ) : (
                    <LinearGradient
                        colors={['#FF5A5F', '#CE494D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.replyAvatar}
                    >
                        <Text style={styles.replyAvatarText}>
                            {reply.username.charAt(0).toUpperCase()}
                        </Text>
                    </LinearGradient>
                )}
            </TouchableOpacity>
            <View style={styles.replyContent}>
                <View style={styles.commentHeader}>
                    <TouchableOpacity onPress={() => handleUsernamePress(reply.username)}>
                        <Text style={styles.replyUsername}>{reply.username}</Text>
                    </TouchableOpacity>
                    <Text style={styles.replyTimestamp}>{reply.timestamp}</Text>
                </View>
                <Text style={styles.replyText}>{reply.text}</Text>
            </View>
        </View>
    );

    const renderComment = ({ item }) => (
        <View style={styles.commentContainer}>
            <View style={styles.commentItem}>
                <TouchableOpacity
                    onPress={() => handleUsernamePress(item.username)}
                    activeOpacity={0.7}
                >
                    {item.profilePhoto ? (
                        <View style={styles.commentAvatarContainer}>
                            <Image
                                source={{ uri: item.profilePhoto }}
                                style={styles.commentAvatarImage}
                            />
                        </View>
                    ) : (
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.commentAvatar}
                        >
                            <Text style={styles.commentAvatarText}>
                                {item.username.charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                    )}
                </TouchableOpacity>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={() => handleUsernamePress(item.username)}>
                            <Text style={styles.commentUsername}>{item.username}</Text>
                        </TouchableOpacity>
                        <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity
                            style={styles.replyButton}
                            onPress={() => handleReply(item)}
                            activeOpacity={0.7}
                        >
                            <Reply size={14} color="#888" strokeWidth={2} />
                            <Text style={styles.replyButtonText}>Reply</Text>
                        </TouchableOpacity>
                        {item.replies && item.replies.length > 0 && (
                            <TouchableOpacity
                                style={styles.viewRepliesButton}
                                onPress={() => toggleReplies(item.id)}
                                activeOpacity={0.7}
                            >
                                {expandedReplies[item.id] ? (
                                    <ChevronUp size={14} color="#FF5A5F" strokeWidth={2} />
                                ) : (
                                    <ChevronDown size={14} color="#FF5A5F" strokeWidth={2} />
                                )}
                                <Text style={styles.viewRepliesText}>
                                    {expandedReplies[item.id] ? 'Hide' : 'View'} {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            {expandedReplies[item.id] && item.replies && item.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {item.replies.map(reply => renderReply(reply, item))}
                </View>
            )}
        </View>
    );

    // Delete Confirmation Modal
    const DeleteModal = () => (
        <Modal
            visible={showDeleteModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDeleteModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <Trash2 size={40} color="#FF5A5F" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.modalTitle}>Delete Picture?</Text>
                    <Text style={styles.modalMessage}>
                        Are you sure you want to delete this picture? This action cannot be undone.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowDeleteModal(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleConfirmDelete}
                        >
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                style={styles.deleteConfirmButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.deleteConfirmText}>Delete</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <DeleteModal />

            {/* Header */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Picture Stats</Text>
                    {isOwnPicture ? (
                        <TouchableOpacity onPress={handleDeletePress} style={styles.deleteButton}>
                            <Trash2 size={22} color="#fff" strokeWidth={2} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.placeholder} />
                    )}
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Picture Preview */}
                    <View style={styles.pictureContainer}>
                        <Image
                            source={{ uri: picture?.image }}
                            style={styles.pictureImage}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Description */}
                    {picture?.description && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionText}>{picture.description}</Text>
                        </View>
                    )}

                    {/* Stats Cards */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statsRow}>
                            <TouchableOpacity
                                style={[styles.statCard, isLiked && styles.statCardActive]}
                                onPress={handleLike}
                                activeOpacity={0.7}
                            >
                                <Heart
                                    size={24}
                                    color={isLiked ? '#FF5A5F' : '#666'}
                                    fill={isLiked ? '#FF5A5F' : 'transparent'}
                                    strokeWidth={2}
                                />
                                <Text style={[styles.statValue, isLiked && styles.statValueActive]}>
                                    {stats.likes}
                                </Text>
                                <Text style={styles.statLabel}>Likes</Text>
                            </TouchableOpacity>

                            <View style={styles.statCard}>
                                <Eye size={24} color="#666" strokeWidth={2} />
                                <Text style={styles.statValue}>{stats.views.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Views</Text>
                            </View>

                            <View style={styles.statCard}>
                                <MessageCircle size={24} color="#666" strokeWidth={2} />
                                <Text style={styles.statValue}>{stats.comments}</Text>
                                <Text style={styles.statLabel}>Comments</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={handleShare}
                                activeOpacity={0.7}
                            >
                                <Share2 size={24} color="#666" strokeWidth={2} />
                                <Text style={styles.statValue}>{stats.shares}</Text>
                                <Text style={styles.statLabel}>Shares</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Comments Section */}
                    <View style={styles.commentsSection}>
                        <Text style={styles.sectionTitle}>Comments</Text>

                        {comments.length === 0 ? (
                            <View style={styles.noCommentsContainer}>
                                <Text style={styles.noCommentsText}>No comments yet</Text>
                                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
                            </View>
                        ) : (
                            comments.map((item) => (
                                <View key={item.id}>
                                    {renderComment({ item })}
                                </View>
                            ))
                        )}
                    </View>

                    {/* Bottom padding for input */}
                    <View style={styles.bottomPadding} />
                </ScrollView>

                {/* Reply indicator */}
                {replyingTo && (
                    <View style={styles.replyingToContainer}>
                        <Text style={styles.replyingToText}>
                            Replying to <Text style={styles.replyingToUsername}>@{replyingTo.username}</Text>
                        </Text>
                        <TouchableOpacity onPress={cancelReply} activeOpacity={0.7}>
                            <X size={18} color="#666" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input Bar */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                        placeholderTextColor="#999"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />
                    <TouchableOpacity onPress={handleSendComment} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.sendButton}
                        >
                            <Send size={20} color="#fff" strokeWidth={2} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerGradient: {
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        width: 40,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    pictureContainer: {
        width: width,
        height: width,
        backgroundColor: '#e0e0e0',
    },
    pictureImage: {
        width: '100%',
        height: '100%',
    },
    descriptionContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    descriptionText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    statsContainer: {
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 15,
        marginHorizontal: 4,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    statCardActive: {
        backgroundColor: '#fff0f0',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    statValueActive: {
        color: '#FF5A5F',
    },
    statLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    commentsSection: {
        backgroundColor: '#fff',
        padding: 15,
        paddingBottom: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    noCommentsContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    noCommentsText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    noCommentsSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
    },
    commentAvatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        overflow: 'hidden',
    },
    commentAvatarImage: {
        width: '100%',
        height: '100%',
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    commentAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    commentUsername: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    commentTimestamp: {
        fontSize: 12,
        color: '#999',
    },
    commentText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    bottomPadding: {
        height: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 14,
        color: '#333',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal styles
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
        paddingHorizontal: 30,
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
    deleteConfirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    deleteConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    // Comment container for grouping comments and replies
    commentContainer: {
        marginBottom: 15,
    },
    // Reply styles
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    replyButtonText: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
        fontWeight: '500',
    },
    viewRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewRepliesText: {
        fontSize: 12,
        color: '#FF5A5F',
        marginLeft: 4,
        fontWeight: '500',
    },
    repliesContainer: {
        marginLeft: 52,
        marginTop: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#e0e0e0',
        paddingLeft: 12,
    },
    replyItem: {
        flexDirection: 'row',
        marginBottom: 10,
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 10,
    },
    replyAvatarContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 10,
        overflow: 'hidden',
    },
    replyAvatarImage: {
        width: '100%',
        height: '100%',
    },
    replyAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    replyAvatarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    replyContent: {
        flex: 1,
    },
    replyUsername: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF5A5F',
    },
    replyTimestamp: {
        fontSize: 11,
        color: '#999',
    },
    replyText: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
    },
    // Replying to indicator
    replyingToContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    replyingToText: {
        fontSize: 13,
        color: '#666',
    },
    replyingToUsername: {
        fontWeight: '600',
        color: '#FF5A5F',
    },
});