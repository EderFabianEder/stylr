import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    TextInput,
    Platform,
    ScrollView,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react-native';
import { reportService } from '../services/api';

export default function ReportScreen({ targetUser, contentType, contentId, onClose }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [reason, setReason] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Kategorien vom Backend laden
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setIsLoadingCategories(true);
            setError(null);
            const response = await reportService.getCategories();
            const cats = response.data || [];
            setCategories(cats);
        } catch (err) {
            console.log('Failed to load categories:', err);
            setError('Kategorien konnten nicht geladen werden.');
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedCategory || !targetUser?.id) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await reportService.report(
                targetUser.id,                   // User-ID des gemeldeten Users
                selectedCategory.slug,           // z.B. "spam", "harassment"
                contentType || 'profile',        // "post", "comment", "profile"
                contentId || targetUser.id,      // Post-ID oder User-ID
                reason.trim() || null            // Optionaler Grund
            );
            setShowSuccessModal(true);
        } catch (err) {
            const message = err.message || 'Report konnte nicht gesendet werden.';

            if (message.includes('bereits gemeldet')) {
                Alert.alert('Hinweis', 'Du hast diesen Inhalt bereits gemeldet.');
            } else {
                Alert.alert('Fehler', message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setTimeout(() => {
            onClose();
        }, 100);
    };

    // Success Modal
    const SuccessModal = () => (
        <Modal
            visible={showSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={handleSuccessClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <LinearGradient
                            colors={['#4CAF50', '#45A049']}
                            style={styles.modalIcon}
                        >
                            <Check size={32} color="white" strokeWidth={3} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.modalTitle}>Meldung gesendet</Text>
                    <Text style={styles.modalText}>
                        Danke, dass du uns hilfst, die Community sicher zu halten.
                        Wir werden die Meldung prüfen und entsprechend handeln.
                    </Text>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleSuccessClose}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            style={styles.modalButtonGradient}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
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
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={24} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Melden</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Warning Banner */}
                <View style={styles.warningBanner}>
                    <AlertTriangle size={20} color="#FF5A5F" />
                    <Text style={styles.warningText}>
                        {targetUser?.name
                            ? `${targetUser.name} melden`
                            : 'Inhalt melden'}
                    </Text>
                </View>

                {/* Info Text */}
                <Text style={styles.infoText}>
                    Bitte wähle den Grund, der am besten beschreibt, warum du diesen Inhalt melden möchtest.
                </Text>

                {/* Loading */}
                {isLoadingCategories && (
                    <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 30 }} />
                )}

                {/* Error + Retry */}
                {error && !isLoadingCategories && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={loadCategories} style={styles.retryButton}>
                            <Text style={styles.retryText}>Nochmal versuchen</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Kategorien-Liste */}
                {!isLoadingCategories && !error && categories.map((category) => (
                    <TouchableOpacity
                        key={category.slug}
                        style={[
                            styles.reasonItem,
                            selectedCategory?.slug === category.slug && styles.reasonItemSelected,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.radioContainer}>
                            <View style={[
                                styles.radio,
                                selectedCategory?.slug === category.slug && styles.radioSelected,
                            ]}>
                                {selectedCategory?.slug === category.slug && (
                                    <View style={styles.radioInner} />
                                )}
                            </View>
                        </View>
                        <View style={styles.reasonContent}>
                            <Text style={[
                                styles.reasonLabel,
                                selectedCategory?.slug === category.slug && styles.reasonLabelSelected,
                            ]}>
                                {category.name}
                            </Text>
                            <Text style={styles.reasonDescription}>
                                {category.description}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Zusätzliche Info */}
                {selectedCategory && (
                    <View style={styles.additionalInfoContainer}>
                        <Text style={styles.additionalInfoLabel}>
                            Zusätzliche Informationen (optional)
                        </Text>
                        <TextInput
                            style={styles.additionalInfoInput}
                            placeholder="Beschreibe das Problem genauer..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={reason}
                            onChangeText={(text) => {
                                if (text.length <= 500) setReason(text);
                            }}
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{reason.length}/500</Text>
                    </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    disabled={!selectedCategory || isSubmitting}
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                >
                    <LinearGradient
                        colors={(!selectedCategory || isSubmitting)
                            ? ['#ccc', '#aaa']
                            : ['#FF5A5F', '#CE494D']}
                        style={styles.submitButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>Meldung senden</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Disclaimer */}
                <Text style={styles.disclaimerText}>
                    Falsche Meldungen können zu Maßnahmen gegen deinen Account führen.
                    Melde nur Inhalte, die wirklich gegen unsere Richtlinien verstoßen.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SuccessModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
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
        padding: 20,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3F3',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    warningText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF5A5F',
        marginLeft: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 20,
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    errorText: {
        fontSize: 14,
        color: '#FF5A5F',
        marginBottom: 10,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFF3F3',
        borderRadius: 20,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF5A5F',
    },
    reasonItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: '#E8E8E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    reasonItemSelected: {
        borderColor: '#FF5A5F',
        backgroundColor: '#FFF9F9',
    },
    radioContainer: {
        marginRight: 12,
        paddingTop: 2,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CCC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: '#FF5A5F',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF5A5F',
    },
    reasonContent: {
        flex: 1,
    },
    reasonLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 3,
    },
    reasonLabelSelected: {
        color: '#FF5A5F',
    },
    reasonDescription: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
    additionalInfoContainer: {
        marginTop: 10,
        marginBottom: 10,
    },
    additionalInfoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    additionalInfoInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        color: '#333',
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 5,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        shadowColor: '#FF5A5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 0.5,
    },
    disclaimerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 18,
        paddingHorizontal: 10,
    },
    // Success Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    modalIconContainer: {
        marginBottom: 20,
    },
    modalIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    modalButton: {
        width: '100%',
    },
    modalButtonGradient: {
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
});