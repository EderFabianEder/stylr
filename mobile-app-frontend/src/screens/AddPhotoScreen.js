import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, StatusBar, ActivityIndicator, Alert, ScrollView, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function AddPhotoScreen({ onClose, onSubmit }) {
    const [imageUri, setImageUri] = useState(null);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const pickImage = async () => {
        Keyboard.dismiss();
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Berechtigung benötigt', 'Bitte erlaube den Zugriff auf deine Fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 5],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden');
        }
    };

    const takePhoto = async () => {
        Keyboard.dismiss();
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Berechtigung benötigt', 'Bitte erlaube den Zugriff auf die Kamera');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 5],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden');
        }
    };

    const handleSubmit = async () => {
        Keyboard.dismiss();

        if (!description.trim()) {
            Alert.alert('Fehler', 'Bitte gib eine Beschreibung ein');
            return;
        }

        setIsLoading(true);
        try {
            // Call parent onSubmit and wait for it
            await onSubmit({
                description: description.trim(),
                imageUri: imageUri
            });
            // Success - parent will close modal
        } catch (error) {
            // Show error to user
            Alert.alert('Fehler', error.message || 'Post konnte nicht erstellt werden');
            setIsLoading(false);
        }
    };

    const clearImage = () => {
        setImageUri(null);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.headerGradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Neuer Post</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {imageUri ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removeButton} onPress={clearImage}>
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
                                <ImageIcon size={32} color="#FF5A5F" />
                                <Text style={styles.pickButtonText}>Galerie</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
                                <Camera size={32} color="#FF5A5F" />
                                <Text style={styles.pickButtonText}>Kamera</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Beschreibung *</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="Was möchtest du teilen? (max. 1000 Zeichen)"
                        placeholderTextColor="#999"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        maxLength={1000}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{description.length}/1000</Text>
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading || !description.trim()}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#FF5A5F', '#CE494D']}
                        style={[styles.submitButton, (!description.trim() || isLoading) && { opacity: 0.5 }]}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Post veröffentlichen</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.noteText}>
                    * Die Beschreibung ist erforderlich. Ein Bild ist optional.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerGradient: { paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    imageContainer: { position: 'relative', marginBottom: 20 },
    previewImage: { width: '100%', height: 250, borderRadius: 15, backgroundColor: '#e0e0e0' },
    removeButton: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    placeholderContainer: { height: 150, backgroundColor: '#fff', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed' },
    buttonRow: { flexDirection: 'row' },
    pickButton: { alignItems: 'center', marginHorizontal: 30, padding: 15 },
    pickButtonText: { marginTop: 8, fontSize: 14, color: '#666', fontWeight: '500' },
    descriptionContainer: { marginBottom: 20 },
    descriptionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    descriptionInput: { backgroundColor: '#fff', borderRadius: 15, padding: 15, fontSize: 16, color: '#333', minHeight: 120 },
    charCount: { textAlign: 'right', fontSize: 12, color: '#888', marginTop: 5 },
    submitButton: { borderRadius: 25, paddingVertical: 16, alignItems: 'center' },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    noteText: { textAlign: 'center', fontSize: 12, color: '#888', marginTop: 15 },
});