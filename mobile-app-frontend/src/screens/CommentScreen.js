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
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Mock Comments
const mockComments = [
    {
        id: 1,
        username: 'sarah_style',
        text: 'Love this dress! Where can I get it?',
        timestamp: '2h ago',
    },
    {
        id: 2,
        username: 'fashion_lover',
        text: 'Perfect for summer! 😍',
        timestamp: '5h ago',
    },
    {
        id: 3,
        username: 'minimal_john',
        text: 'Clean style, very elegant',
        timestamp: '1d ago',
    },
];

export default function CommentScreen({ item, onClose }) {
    const [comments, setComments] = useState(mockComments);
    const [newComment, setNewComment] = useState('');

    const handleSendComment = () => {
        if (newComment.trim()) {
            const comment = {
                id: Date.now(),
                username: 'you',
                text: newComment,
                timestamp: 'Just now',
            };
            setComments([comment, ...comments]);
            setNewComment('');
        }
    };

    const renderComment = ({ item }) => (
        <View style={styles.commentItem}>
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
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>{item.username}</Text>
                    <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
            </View>
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
                        <Text style={styles.backButtonText}>←</Text>
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
                keyExtractor={(item) => item.id.toString()}
                style={styles.commentsList}
                contentContainerStyle={styles.commentsListContent}
            />

            {/* Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        placeholderTextColor="#999"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />
                    <TouchableOpacity onPress={handleSendComment}>
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.sendButton}
                        >
                            <Text style={styles.sendButtonText}>→</Text>
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
    },
    backButtonText: {
        fontSize: 28,
        color: '#fff',
        fontWeight: '300',
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
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingBottom: 40,
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
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '300',
    },
});