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
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Reply, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import OtherProfileScreen from './OtherProfileScreen';

// Mock Comments with replies
const mockComments = [
    {
        id: 1,
        username: 'sarah_style',
        text: 'Love this dress! Where can I get it?',
        timestamp: '2h ago',
        followers: 1245,
        following: 534,
        replies: [
            {
                id: 101,
                username: 'fashion_lover',
                text: 'I think it\'s from Zara!',
                timestamp: '1h ago',
                followers: 892,
                following: 421,
            },
        ],
    },
    {
        id: 2,
        username: 'fashion_lover',
        text: 'Perfect for summer! 😍',
        timestamp: '5h ago',
        followers: 892,
        following: 421,
        replies: [],
    },
    {
        id: 3,
        username: 'minimal_john',
        text: 'Clean style, very elegant',
        timestamp: '1d ago',
        followers: 2341,
        following: 123,
        replies: [
            {
                id: 301,
                username: 'style_queen',
                text: 'Totally agree!',
                timestamp: '20h ago',
                followers: 567,
                following: 234,
            },
            {
                id: 302,
                username: 'urban_chic',
                text: 'Yes, love the minimalist vibe',
                timestamp: '18h ago',
                followers: 3421,
                following: 456,
            },
        ],
    },
];

export default function CommentScreen({ item, onClose, currentUser, onBlockUser }) {
    const [comments, setComments] = useState(mockComments);
    const [newComment, setNewComment] = useState('');
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
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
                    followers: 0,
                    following: 0,
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
                    followers: 0,
                    following: 0,
                    replies: [],
                };
                setComments([comment, ...comments]);
            }
            setNewComment('');
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

    const handleUserPress = (commentUser) => {
        if (commentUser.username === currentUser?.username) {
            return;
        }

        const userProfile = {
            id: commentUser.id || commentUser.username,
            username: commentUser.username,
            followers: commentUser.followers || Math.floor(Math.random() * 5000),
            following: commentUser.following || Math.floor(Math.random() * 500),
            profilePhoto: commentUser.profilePhoto,
        };
        setSelectedUser(userProfile);
        setShowUserProfile(true);
    };

    // Show User Profile
    if (showUserProfile && selectedUser) {
        return (
            <OtherProfileScreen
                user={selectedUser}
                onBack={() => {
                    setShowUserProfile(false);
                    setSelectedUser(null);
                }}
                initialFollowing={false}
                onBlockUser={onBlockUser}
            />
        );
    }

    const renderReply = (reply) => (
        <View key={reply.id} style={styles.replyItem}>
            <TouchableOpacity
                onPress={() => handleUserPress(reply)}
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
                    <TouchableOpacity onPress={() => handleUserPress(reply)}>
                        <Text style={styles.replyUsername}>{reply.username}</Text>
                    </TouchableOpacity>
                    <Text style={styles.replyTimestamp}>{reply.timestamp}</Text>
                </View>
                <Text style={styles.replyText}>{reply.text}</Text>
            </View>
        </View>
    );

    const renderComment = ({ item: commentItem }) => (
        <View style={styles.commentContainer}>
            <View style={styles.commentItem}>
                <TouchableOpacity
                    onPress={() => handleUserPress(commentItem)}
                    activeOpacity={0.7}
                >
                    {commentItem.profilePhoto ? (
                        <View style={styles.commentAvatarContainer}>
                            <Image
                                source={{ uri: commentItem.profilePhoto }}
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
                                {commentItem.username.charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                    )}
                </TouchableOpacity>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={() => handleUserPress(commentItem)}>
                            <Text style={styles.commentUsername}>{commentItem.username}</Text>
                        </TouchableOpacity>
                        <Text style={styles.commentTimestamp}>{commentItem.timestamp}</Text>
                    </View>
                    <Text style={styles.commentText}>{commentItem.text}</Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity
                            style={styles.replyButton}
                            onPress={() => handleReply(commentItem)}
                            activeOpacity={0.7}
                        >
                            <Reply size={14} color="#888" strokeWidth={2} />
                            <Text style={styles.replyButtonText}>Reply</Text>
                        </TouchableOpacity>
                        {commentItem.replies && commentItem.replies.length > 0 && (
                            <TouchableOpacity
                                style={styles.viewRepliesButton}
                                onPress={() => toggleReplies(commentItem.id)}
                                activeOpacity={0.7}
                            >
                                {expandedReplies[commentItem.id] ? (
                                    <ChevronUp size={14} color="#FF5A5F" strokeWidth={2} />
                                ) : (
                                    <ChevronDown size={14} color="#FF5A5F" strokeWidth={2} />
                                )}
                                <Text style={styles.viewRepliesText}>
                                    {expandedReplies[commentItem.id] ? 'Hide' : 'View'} {commentItem.replies.length} {commentItem.replies.length === 1 ? 'reply' : 'replies'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            {expandedReplies[commentItem.id] && commentItem.replies && commentItem.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {commentItem.replies.map(reply => renderReply(reply))}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

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
                    <Text style={styles.headerTitle}>Comments</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            {/* Item Info */}
            <View style={styles.itemInfo}>
                <Text style={styles.itemDescription}>{item?.description || 'Item'}</Text>
                <Text style={styles.itemUsername}>by {item?.username || 'user'}</Text>
            </View>

            {/* Comments List */}
            <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(commentItem) => commentItem.id.toString()}
                style={styles.commentsList}
                contentContainerStyle={styles.commentsListContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No comments yet</Text>
                        <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                    </View>
                }
            />

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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
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
    placeholder: {
        width: 40,
    },
    itemInfo: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    itemDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    itemUsername: {
        fontSize: 14,
        color: '#666',
    },
    commentsList: {
        flex: 1,
    },
    commentsListContent: {
        padding: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
        color: '#FF5A5F',
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
    // Comment container
    commentContainer: {
        marginBottom: 15,
    },
    // Comment actions (reply button)
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
    // Replies container
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
});