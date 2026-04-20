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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import { userService } from '../services/api';
import ChangeProfilePhotoScreen from './ChangeProfilePhotoScreen';

const { width, height } = Dimensions.get('window');

export default function EditProfileScreen({ user, onSave, onBack, onClose }) {
    const [username, setUsername] = useState(user?.name || user?.username || '');
    const [description, setDescription] = useState(user?.description || user?.bio || '');
    const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo_url || user?.profilePhoto || null);
    const [showChangePhotoScreen, setShowChangePhotoScreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newPhotoUri, setNewPhotoUri] = useState(null); // Lokal gewähltes Foto
    const [photoRemoved, setPhotoRemoved] = useState(false); // User hat vorhandenes Foto entfernt

    const handlePhotoSave = (photoUri) => {
        setNewPhotoUri(photoUri);
        setProfilePhoto(photoUri);
        setPhotoRemoved(photoUri === null && !!(user?.profile_photo_url || user?.profilePhoto));
        setShowChangePhotoScreen(false);
    };

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Namen ein');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Profildaten aktualisieren
            const profileData = { name: username.trim() };
            if (description.trim()) {
                profileData.description = description.trim();
            }
            await userService.updateProfile(profileData);

            // 2. Profilbild hochladen wenn geändert
            if (newPhotoUri) {
                const formData = new FormData();
                formData.append('profile_picture', {
                    uri: newPhotoUri,
                    type: 'image/jpeg',
                    name: 'profile.jpg',
                });
                await userService.updateProfilePicture(formData);
            } else if (photoRemoved) {
                // Profilbild wurde entfernt
                try {
                    await userService.deleteProfilePicture();
                } catch (e) {
                    // Ignorieren wenn kein Bild existiert
                }
            }

            // Parent benachrichtigen
            if (onSave) {
                await onSave({ name: username.trim(), description: description.trim(), profilePhoto });
            }
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Profil konnte nicht aktualisiert werden');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (onBack) onBack();
        else if (onClose) onClose();
    };

    // Change Photo Screen
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
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
                    <ArrowLeft size={24} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil bearbeiten</Text>
                <View style={styles.headerSpacer} />
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profilbild */}
                <View style={styles.profileSection}>
                    <View style={styles.profilePlaceholder}>
                        {profilePhoto ? (
                            <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
                        ) : (
                            <Text style={styles.placeholderLogo}>
                                {username ? username.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setShowChangePhotoScreen(true)}>
                        <Text style={styles.changePhotoText}>Profilbild ändern</Text>
                    </TouchableOpacity>
                </View>

                {/* Formular */}
                <View style={styles.formSection}>
                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Name</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Dein Name"
                                placeholderTextColor="#999"
                                autoCapitalize="none"
                                editable={!isSaving}
                            />
                        </View>
                    </View>

                    {/* Bio */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Erzähl etwas über dich..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={150}
                            editable={!isSaving}
                        />
                        <Text style={styles.characterCount}>{description.length}/150</Text>
                    </View>
                </View>

                {/* Speichern */}
                <TouchableOpacity activeOpacity={0.8} onPress={handleSave} disabled={isSaving}>
                    <LinearGradient
                        colors={['#FF5A5F', '#CE494D']}
                        style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Check size={20} color="white" strokeWidth={3} />
                                <Text style={styles.saveButtonText}>Änderungen speichern</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, paddingHorizontal: 20 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    headerSpacer: { width: 40 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 30 },
    profileSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: 'white' },
    profilePlaceholder: { width: 120, height: 120, backgroundColor: '#E0E0E0', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, overflow: 'hidden' },
    profileImage: { width: '100%', height: '100%' },
    placeholderLogo: { fontSize: 42, fontWeight: 'bold', color: '#FF5A5F' },
    changePhotoText: { fontSize: 16, fontWeight: '600', color: '#FF5A5F' },
    formSection: { backgroundColor: 'white', marginTop: 10, paddingHorizontal: 25, paddingVertical: 20 },
    inputGroup: { marginBottom: 25 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E0E0E0' },
    input: { flex: 1, fontSize: 16, color: '#000', paddingVertical: 15 },
    textArea: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 15, minHeight: 100, borderWidth: 1, borderColor: '#E0E0E0' },
    characterCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 5 },
    saveButton: { flexDirection: 'row', marginHorizontal: 25, marginTop: 20, paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF5A5F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginLeft: 8, letterSpacing: 0.5 },
    bottomPadding: { height: 20 },
});