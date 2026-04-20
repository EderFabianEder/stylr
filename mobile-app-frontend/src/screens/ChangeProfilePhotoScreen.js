import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    Image,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function ChangeProfilePhotoScreen({ currentPhoto, onSave, onBack }) {
    const [selectedPhoto, setSelectedPhoto] = useState(currentPhoto);

    const pickImageFromGallery = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Berechtigung benötigt: Bitte erlaube den Zugriff auf deine Fotos');
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedPhoto(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        // Request permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            alert('Berechtigung benötigt: Bitte erlaube den Zugriff auf die Kamera');
            return;
        }

        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedPhoto(result.assets[0].uri);
        }
    };

    const removePhoto = () => {
        setSelectedPhoto(null);
    };

    const handleSave = () => {
        if (onSave) {
            onSave(selectedPhoto);
        }
        if (onBack) {
            onBack();
        }
    };

    return (
        <View style={styles.container}>
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
                <Text style={styles.headerTitle}>Foto ändern</Text>
                <View style={styles.headerSpacer} />
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Current Photo Preview */}
                <View style={styles.previewSection}>
                    <Text style={styles.sectionTitle}>Aktuelles Foto</Text>
                    <View style={styles.photoPreviewContainer}>
                        {selectedPhoto ? (
                            <Image
                                source={{ uri: selectedPhoto }}
                                style={styles.photoPreview}
                            />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Text style={styles.placeholderLogo}>bʈb</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Aktion wählen</Text>

                    {/* Take Photo Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={takePhoto}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionIconContainer}>
                            <Camera size={24} color="#FF5A5F" strokeWidth={2} />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Foto aufnehmen</Text>
                            <Text style={styles.actionSubtitle}>Kamera verwenden</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Choose from Gallery Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={pickImageFromGallery}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionIconContainer}>
                            <ImageIcon size={24} color="#FF5A5F" strokeWidth={2} />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Aus Galerie wählen</Text>
                            <Text style={styles.actionSubtitle}>Aus deinen Fotos auswählen</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Remove Photo Button */}
                    {selectedPhoto && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.dangerButton]}
                            onPress={removePhoto}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionIconContainer}>
                                <Trash2 size={24} color="#E74C3C" strokeWidth={2} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, styles.dangerText]}>Foto entfernen</Text>
                                <Text style={styles.actionSubtitle}>Standard-Platzhalter verwenden</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSave}
                    style={styles.saveButtonContainer}
                >
                    <LinearGradient
                        colors={['#FF5A5F', '#CE494D']}
                        style={styles.saveButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.saveButtonText}>Foto speichern</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
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
    previewSection: {
        backgroundColor: 'white',
        paddingVertical: 30,
        paddingHorizontal: 25,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    photoPreviewContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderLogo: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FF5A5F',
    },
    actionsSection: {
        backgroundColor: 'white',
        marginTop: 10,
        paddingVertical: 20,
        paddingHorizontal: 25,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    dangerButton: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FFE0E0',
    },
    actionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 3,
    },
    actionSubtitle: {
        fontSize: 13,
        color: '#999',
    },
    dangerText: {
        color: '#E74C3C',
    },
    saveButtonContainer: {
        paddingHorizontal: 25,
        marginTop: 20,
    },
    saveButton: {
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
        letterSpacing: 0.5,
    },
});