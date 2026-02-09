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
    KeyboardAvoidingView,
    Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react-native';
import { reportService } from '../services/api';

// Fallback in case API fails
const fallbackReasons = [
    { slug: 'spam', name: 'Spam', description: 'Unerwünschte Werbung, wiederholte Inhalte oder Massennachrichten' },
    { slug: 'harassment', name: 'Belästigung', description: 'Mobbing, Einschüchterung oder gezielte Belästigung einer Person' },
    { slug: 'hate-speech', name: 'Hassrede', description: 'Diskriminierung aufgrund von Herkunft, Religion, Geschlecht oder sexueller Orientierung' },
    { slug: 'violence', name: 'Gewaltandrohung', description: 'Drohungen, Gewaltverherrlichung oder Aufrufe zu Gewalt' },
    { slug: 'inappropriate', name: 'Unangemessen', description: 'Explizite, anstößige oder nicht jugendfreie Inhalte' },
    { slug: 'fake-profile', name: 'Fake-Profil', description: 'Gefälschtes Profil oder Identitätsbetrug' },
    { slug: 'scam', name: 'Betrug', description: 'Betrügerische Inhalte, Phishing oder Abzocke' },
    { slug: 'copyright', name: 'Urheberrechtsverletzung', description: 'Verwendung von urheberrechtlich geschütztem Material ohne Erlaubnis' },
    { slug: 'other', name: 'Sonstiges', description: 'Andere Verstöße gegen die Nutzungsbedingungen' },
];

export default function ReportScreen({ targetUser, contentType, contentId, onClose }) {
    const [categories, setCategories] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await reportService.getCategories();
            const cats = response.data || [];
            setCategories(cats.length > 0 ? cats : fallbackReasons);
        } catch (error) {
            console.log('Failed to load categories:', error);
            setCategories(fallbackReasons);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedSlug || !targetUser?.id) return;

        setIsSubmitting(true);
        try {
            await reportService.report(
                targetUser.id,
                selectedSlug,
                contentType || 'profile',
                contentId || targetUser.id,
                additionalInfo.trim() || null
            );
            setShowSuccessModal(true);
        } catch (error) {
            console.log('Report failed:', error);
            setShowSuccessModal(true);
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
            transparent={true}
            animationType="fade"
            onRequestClose={handleSuccessClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.successIconContainer}>
                        <Check size={40} color="#4CAF50" strokeWidth={3} />
                    </View>
                    <Text style={styles.modalTitle}>Report Submitted</Text>
                    <Text style={styles.modalMessage}>
                        Thank you for helping keep our community safe. We'll review this report and take appropriate action.
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSuccessClose}
                    >
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            style={styles.modalButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.modalButtonText}>Done</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SuccessModal />

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
                    <Text style={styles.headerTitle}>Report Content</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={Keyboard.dismiss}
                >
                    {/* Warning Banner */}
                    <View style={styles.warningBanner}>
                        <AlertTriangle size={24} color="#FF5A5F" strokeWidth={2} />
                        <Text style={styles.warningText}>
                            Please select the reason that best describes why you're reporting this content.
                        </Text>
                    </View>

                    {/* Reporting info */}
                    {targetUser && (
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemInfoLabel}>Reporting:</Text>
                            <Text style={styles.itemInfoText}>
                                {contentType === 'post' ? 'Post' : 'Profile'} by @{targetUser.name || targetUser.username || 'User'}
                            </Text>
                        </View>
                    )}

                    {/* Report Reasons */}
                    <View style={styles.reasonsContainer}>
                        <Text style={styles.sectionTitle}>Select a reason</Text>

                        {isLoadingCategories ? (
                            <ActivityIndicator size="small" color="#FF5A5F" style={{ marginVertical: 20 }} />
                        ) : (
                            categories.map((category) => (
                                <TouchableOpacity
                                    key={category.slug}
                                    style={[
                                        styles.reasonItem,
                                        selectedSlug === category.slug && styles.reasonItemSelected
                                    ]}
                                    onPress={() => setSelectedSlug(category.slug)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.reasonContent}>
                                        <View style={[
                                            styles.radioButton,
                                            selectedSlug === category.slug && styles.radioButtonSelected
                                        ]}>
                                            {selectedSlug === category.slug && (
                                                <View style={styles.radioButtonInner} />
                                            )}
                                        </View>
                                        <View style={styles.reasonTextContainer}>
                                            <Text style={[
                                                styles.reasonLabel,
                                                selectedSlug === category.slug && styles.reasonLabelSelected
                                            ]}>
                                                {category.name}
                                            </Text>
                                            <Text style={styles.reasonDescription}>
                                                {category.description}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* Additional Information */}
                    <View style={styles.additionalSection}>
                        <Text style={styles.sectionTitle}>Additional information (optional)</Text>
                        <View style={styles.textInputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Provide any additional details that might help us understand the issue..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                value={additionalInfo}
                                onChangeText={setAdditionalInfo}
                                textAlignVertical="top"
                            />
                        </View>
                        <Text style={styles.characterCount}>
                            {additionalInfo.length}/500
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSubmit}
                        disabled={!selectedSlug || isSubmitting}
                    >
                        <LinearGradient
                            colors={selectedSlug && !isSubmitting ? ['#FF5A5F', '#CE494D'] : ['#CCC', '#BBB']}
                            style={styles.submitButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Report</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Disclaimer */}
                    <Text style={styles.disclaimer}>
                        False reports may result in action against your account. Only submit a report if you genuinely believe this content violates our community guidelines.
                    </Text>

                    <View style={styles.bottomPadding} />
                </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F0',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF5A5F',
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    itemInfo: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    itemInfoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
    itemInfoText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    reasonsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    reasonItem: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: '#f8f9fa',
    },
    reasonItemSelected: {
        backgroundColor: '#FFF0F0',
        borderWidth: 1,
        borderColor: '#FF5A5F',
    },
    reasonContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    radioButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    radioButtonSelected: {
        borderColor: '#FF5A5F',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF5A5F',
    },
    reasonTextContainer: {
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
    additionalSection: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    textInputContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textInput: {
        padding: 12,
        fontSize: 14,
        color: '#333',
        minHeight: 100,
        lineHeight: 20,
    },
    characterCount: {
        textAlign: 'right',
        marginTop: 8,
        fontSize: 12,
        color: '#999',
    },
    submitButton: {
        marginHorizontal: 15,
        paddingVertical: 16,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    disclaimer: {
        marginHorizontal: 15,
        marginTop: 15,
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
    bottomPadding: {
        height: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    successIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 50,
        borderRadius: 25,
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});