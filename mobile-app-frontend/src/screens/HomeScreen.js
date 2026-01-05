import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Heart,       // ❤️ like
    X,           // ❌ dislike / close
    ArrowRight,  // ➡ arrow to the right
    MessageCircle, // 💬 comment
    Flag
} from 'lucide-react-native';

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

export default function HomeScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);

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
        console.log('Comment on:', clothingItems[currentIndex]);
    };

    const handleReport = () => {
        console.log('Report:', clothingItems[currentIndex]);
    };

    const currentItem = clothingItems[currentIndex];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header mit Gradient */}
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

            {/* Kleidungsstück Card */}
            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    {/* Flag Icon - Simpel */}
                    <TouchableOpacity style={styles.flagButton} onPress={handleReport}>
                        <Flag size={20} color="red" />
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

            {/* Action Buttons - Schwarze Simple Icons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <Heart size={24} color="red" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleDislike}>
                    <X size={24} color="black" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
                    <ArrowRight size={24} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
                    <MessageCircle size={24} color="#555" />
                </TouchableOpacity>
            </View>
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
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
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
        padding: 10,
    },
    flagIcon: {
        fontSize: 20,
        color: '#000',
    },
    cardImage: {
        width: '100%',
        height: '75%',
        backgroundColor: '#ccc',
    },
    infoContainer: {
        flex: 1,
        padding: 15,
        justifyContent: 'space-between',
    },
    description: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 14,
        color: '#666',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 30,
        paddingVertical: 20,
    },
    actionButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    actionIcon: {
        fontSize: 30,
        color: '#000',
        fontWeight: '300',
    },
});