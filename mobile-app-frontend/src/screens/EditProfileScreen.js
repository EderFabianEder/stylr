import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import ChangeProfilePhotoScreen from './ChangeProfilePhotoScreen';

const { width, height } = Dimensions.get('window');

export default function EditProfileScreen({ user, onSave, onBack }) {
    const [username, setUsername] = useState(user?.username || '');
    const [description, setDescription] = useState(user?.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ✨');
    const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null);
    const [showChangePhotoScreen, setShowChangePhotoScreen] = useState(false);

    const handlePhotoSave = (photoUri) => {
        setProfilePhoto(photoUri);
        setShowChangePhotoScreen(false);
    };

    const handleSave = () => {
        // Save the changes
        if (onSave) {
            onSave({ username, description, profilePhoto });
        }
        // Go back to profile
        if (onBack) {
            onBack();
        }
    };

    // Show Change Photo Screen
    if (showChangePhotoScreen) {
        return (
            <ChangeProfilePhotoScreen
                currentPhoto={profilePhoto}
                onSave={handlePhotoSave}
                onBack={() => setShowChangePhotoScreen(false)}
            />
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={24} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={styles.headerSpacer} />
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Picture Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profilePlaceholder}>
                        {profilePhoto ? (
                            <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
                        ) : (
                            <Text style={styles.placeholderLogo}>bʈb</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowChangePhotoScreen(true)}
                    >
                        <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    {/* Username Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Username</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.atSymbol}>@</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                placeholderTextColor="#999"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <Text style={styles.characterCount}>{description.length}/150</Text>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSave}
                >
                    <LinearGradient
                        colors={['#FF5A5F', '#CE494D']}
                        style={styles.saveButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Check size={20} color="white" strokeWidth={3} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Extra padding at bottom */}
                <View style={styles.bottomPadding} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: 'white',
    },
    profilePlaceholder: {
        width: 120,
        height: 120,
        backgroundColor: '#E0E0E0',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    placeholderLogo: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FF5A5F',
    },
    changePhotoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF5A5F',
    },
    formSection: {
        backgroundColor: 'white',
        marginTop: 10,
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    inputGroup: {
        marginBottom: 25,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    atSymbol: {
        fontSize: 16,
        color: '#999',
        marginRight: 5,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        paddingVertical: 15,
    },
    textArea: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 15,
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    characterCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 5,
    },
    saveButton: {
        flexDirection: 'row',
        marginHorizontal: 25,
        marginTop: 20,
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
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    bottomPadding: {
        height: 20,
    },
});