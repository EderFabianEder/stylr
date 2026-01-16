import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    TextInput,
    Dimensions,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, ImagePlus, X, MessageCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function AddPhotoScreen({ onBack, onSubmit }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [commentsAllowed, setCommentsAllowed] = useState(true);

    const pickImageFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please allow access to your photo library to upload images.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please allow access to your camera to take photos.'
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    const handleSubmit = async () => {
        if (!selectedImage) {
            Alert.alert('No Image', 'Please select an image to upload.');
            return;
        }

        setIsLoading(true);

        // Simulate upload delay
        setTimeout(() => {
            if (onSubmit) {
                onSubmit({
                    image: selectedImage,
                    description: description.trim(),
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    commentsAllowed: commentsAllowed,
                });
            }
            setIsLoading(false);
            // Return to profile immediately
            onBack();
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={24} color="#FFF" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Photo</Text>
                <View style={styles.headerSpacer} />
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Image Preview Section */}
                <View style={styles.imageSection}>
                    {selectedImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.imagePreview}
                            />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={removeImage}
                                activeOpacity={0.8}
                            >
                                <X size={20} color="#FFF" strokeWidth={3} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <ImagePlus size={60} color="#CCC" strokeWidth={1.5} />
                            <Text style={styles.placeholderText}>No image selected</Text>
                        </View>
                    )}
                </View>

                {/* Upload Buttons */}
                <View style={styles.uploadButtonsContainer}>
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={pickImageFromGallery}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#F8F9FA', '#EEEEEE']}
                            style={styles.uploadButtonGradient}
                        >
                            <ImagePlus size={28} color="#FF5A5F" strokeWidth={2} />
                            <Text style={styles.uploadButtonText}>Gallery</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={takePhoto}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#F8F9FA', '#EEEEEE']}
                            style={styles.uploadButtonGradient}
                        >
                            <Camera size={28} color="#FF5A5F" strokeWidth={2} />
                            <Text style={styles.uploadButtonText}>Camera</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Description Input */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionLabel}>Description</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Write a caption for your photo..."
                            placeholderTextColor="#AAA"
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            value={description}
                            onChangeText={setDescription}
                            textAlignVertical="top"
                        />
                    </View>
                    <Text style={styles.characterCount}>
                        {description.length}/500
                    </Text>
                </View>

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionLabel}>Settings</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingIconContainer}>
                            <MessageCircle size={20} color="#FF5A5F" strokeWidth={2} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingTitle}>Allow Comments</Text>
                            <Text style={styles.settingSubtitle}>
                                {commentsAllowed ? "Anyone can comment on this photo" : "Comments are disabled"}
                            </Text>
                        </View>
                        <Switch
                            value={commentsAllowed}
                            onValueChange={setCommentsAllowed}
                            trackColor={{ false: '#ddd', true: '#FFB5B7' }}
                            thumbColor={commentsAllowed ? '#FF5A5F' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={isLoading || !selectedImage}
                >
                    <LinearGradient
                        colors={selectedImage ? ['#FF5A5F', '#CE494D'] : ['#CCC', '#BBB']}
                        style={styles.submitButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <Text style={styles.submitButtonText}>Upload Photo</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
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
        color: '#FFF',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 25,
    },
    imageSection: {
        marginTop: 30,
        alignItems: 'center',
    },
    imagePlaceholder: {
        width: width - 50,
        height: width - 50,
        backgroundColor: '#F8F9FA',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    placeholderText: {
        marginTop: 15,
        fontSize: 16,
        color: '#AAA',
        fontWeight: '500',
    },
    imagePreviewContainer: {
        width: width - 50,
        height: width - 50,
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    uploadButton: {
        flex: 1,
        maxWidth: 150,
        marginHorizontal: 7,
    },
    uploadButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    uploadButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginLeft: 10,
    },
    descriptionSection: {
        marginTop: 30,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
    },
    inputContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textInput: {
        padding: 15,
        fontSize: 15,
        color: '#333',
        minHeight: 120,
        lineHeight: 22,
    },
    characterCount: {
        textAlign: 'right',
        marginTop: 8,
        fontSize: 12,
        color: '#999',
    },
    settingsSection: {
        marginTop: 25,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    settingSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    submitButton: {
        marginTop: 30,
        paddingVertical: 16,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF5A5F',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    bottomPadding: {
        height: 40,
    },
});