import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Heart,
    X,
    ArrowRight,
    MessageCircle,
    Flag
} from 'lucide-react-native';

// Import your CommentScreen component
import CommentScreen from './CommentScreen';
import ReportScreen from './ReportScreen';

const { width, height } = Dimensions.get('window');

const clothingItems = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
        description: 'Elegant Summer Dress',
        username: 'fashionista_23',
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
        description: 'Black Leather Jacket',
        username: 'style_hunter',
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
        description: 'Classic White Shirt',
        username: 'minimal_look',
    },
    {
        id: 4,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
        description: 'Blue Denim Jeans',
        username: 'denim_lover',
    },
];

export default function HomeScreen({ user, onBlockUser }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const handleNext = () => {
        if (currentIndex < clothingItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const handleLike = () => {
        console.log('Liked:', clothingItems[currentIndex]);
        handleNext();
    };

    const handleDislike = () => {
        console.log('Disliked:', clothingItems[currentIndex]);
        handleNext();
    };

    const handleComment = () => {
        setShowComments(true);
    };

    const handleReport = () => {
        setShowReport(true);
    };

    const handleReportSubmit = (reportData) => {
        console.log('Report submitted:', reportData);
        // Here you would typically send this to your backend
    };

    const currentItem = clothingItems[currentIndex];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>STYLR</Text>
                </View>
            </LinearGradient>

            {/* Clothing Card */}
            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    {/* Report Flag Button */}
                    <TouchableOpacity style={styles.flagButton} onPress={handleReport}>
                        <Flag size={20} color="#FF5A5F" />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: currentItem.image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />

                    <View style={styles.infoContainer}>
                        <Text style={styles.description}>{currentItem.description}</Text>
                        <View style={styles.userInfo}>
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.avatar}
                            >
                                <Text style={styles.avatarText}>
                                    {currentItem.username.charAt(0).toUpperCase()}
                                </Text>
                            </LinearGradient>
                            <Text style={styles.username}>{currentItem.username}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Action Buttons - Using Lucide Icons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <Heart size={28} color="#FF5A5F" fill="#FF5A5F" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleDislike}>
                    <X size={28} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
                    <ArrowRight size={28} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
                    <MessageCircle size={28} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Comment Modal */}
            <Modal
                visible={showComments}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowComments(false)}
            >
                <CommentScreen
                    item={currentItem}
                    onClose={() => setShowComments(false)}
                    currentUser={user}
                    onBlockUser={onBlockUser}
                />
            </Modal>

            {/* Report Modal */}
            <Modal
                visible={showReport}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowReport(false)}
            >
                <ReportScreen
                    item={currentItem}
                    onClose={() => setShowReport(false)}
                    onSubmit={handleReportSubmit}
                />
            </Modal>
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
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    header: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 3,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    card: {
        width: width - 30,
        height: height * 0.58,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    flagButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 8,
    },
    cardImage: {
        width: '100%',
        height: '75%',
        backgroundColor: '#eee',
    },
    infoContainer: {
        flex: 1,
        padding: 15,
        justifyContent: 'space-between',
    },
    description: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    actionButton: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
});