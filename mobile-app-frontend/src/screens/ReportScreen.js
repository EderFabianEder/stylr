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
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react-native';
import { reportService } from '../services/api';

// Fallback Kategorien falls API nicht erreichbar
const fallbackReasons = [
    { id: 1, slug: 'inappropriate', label: 'Unangemessener Inhalt', description: 'Nacktheit, sexueller Inhalt oder anstößiges Material' },
    { id: 2, slug: 'spam', label: 'Spam', description: 'Irreführender oder sich wiederholender Inhalt' },
    { id: 3, slug: 'harassment', label: 'Belästigung oder Mobbing', description: 'Angriffe auf oder Belästigung von Personen' },
    { id: 4, slug: 'hate_speech', label: 'Hassrede', description: 'Diskriminierung oder hasserfüllter Inhalt' },
    { id: 5, slug: 'violence', label: 'Gewalt oder gefährlicher Inhalt', description: 'Drohungen, Selbstverletzung oder gefährliche Aktivitäten' },
    { id: 6, slug: 'ip_violation', label: 'Urheberrechtsverletzung', description: 'Verletzung von Urheberrecht oder Markenrecht' },
    { id: 7, slug: 'scam', label: 'Betrug', description: 'Betrügerische Praktiken oder gefälschte Produkte' },
    { id: 8, slug: 'other', label: 'Sonstiges', description: 'Etwas anderes, das oben nicht aufgeführt ist' },
];

export default function ReportScreen({ targetUser, contentType = 'post', contentId, onClose, onSubmit }) {
    const [reportReasons, setReportReasons] = useState(fallbackReasons);
    const [selectedReason, setSelectedReason] = useState(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await reportService.getCategories();
            const categories = response.data || response;
            if (Array.isArray(categories) && categories.length > 0) {
                setReportReasons(categories.map((cat, idx) => ({
                    id: cat.id || idx + 1,
                    slug: cat.slug || cat.id,
                    label: cat.name || cat.label,
                    description: cat.description || '',
                })));
            }
        } catch (error) {
            console.log('Failed to load categories, using fallback:', error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedReason || isSubmitting) return;

        const reason = reportReasons.find(r => r.id === selectedReason);
        if (!reason) return;

        setIsSubmitting(true);
        try {
            const userId = targetUser?.id;
            if (!userId) {
                Alert.alert('Fehler', 'Kein Benutzer zum Melden ausgewählt');
                return;
            }

            // API Call: POST /users/{userId}/report
            await reportService.report(
                userId,
                reason.slug,
                contentType,
                contentId,
                additionalInfo.trim() || null
            );

            if (onSubmit) {
                onSubmit({
                    userId,
                    reason,
                    contentType,
                    contentId,
                    additionalInfo: additionalInfo.trim(),
                });
            }

            setShowSuccessModal(true);
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Meldung konnte nicht gesendet werden');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setTimeout(() => { onClose(); }, 100);
    };

    // Success Modal
    const SuccessModal = () => (
        <Modal visible={showSuccessModal} transparent={true} animationType="fade" onRequestClose={handleSuccessClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.successIconContainer}>
                        <Check size={40} color="#4CAF50" strokeWidth={3} />
                    </View>
                    <Text style={styles.modalTitle}>Meldung gesendet</Text>
                    <Text style={styles.modalMessage}>
                        Danke, dass du hilfst unsere Community sicher zu halten. Wir werden die Meldung prüfen und entsprechend handeln.
                    </Text>
                    <TouchableOpacity activeOpacity={0.8} onPress={handleSuccessClose}>
                        <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.modalButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.modalButtonText}>Fertig</Text>
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
            <LinearGradient colors={['#FF5A5F', '#CE494D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Inhalt melden</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Warnung */}
                <View style={styles.warningBanner}>
                    <AlertTriangle size={24} color="#FF5A5F" strokeWidth={2} />
                    <Text style={styles.warningText}>
                        Bitte wähle den Grund, der am besten beschreibt, warum du diesen Inhalt meldest.
                    </Text>
                </View>

                {/* Ziel-Info */}
                {targetUser && (
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemInfoLabel}>Meldung gegen:</Text>
                        <Text style={styles.itemInfoText}>@{targetUser.name || targetUser.username}</Text>
                    </View>
                )}

                {/* Kategorien */}
                <View style={styles.reasonsContainer}>
                    <Text style={styles.sectionTitle}>Grund auswählen</Text>

                    {isLoadingCategories ? (
                        <ActivityIndicator size="small" color="#FF5A5F" style={{ marginVertical: 20 }} />
                    ) : (
                        reportReasons.map((reason) => (
                            <TouchableOpacity
                                key={reason.id}
                                style={[styles.reasonItem, selectedReason === reason.id && styles.reasonItemSelected]}
                                onPress={() => setSelectedReason(reason.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.reasonContent}>
                                    <View style={[styles.radioButton, selectedReason === reason.id && styles.radioButtonSelected]}>
                                        {selectedReason === reason.id && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <View style={styles.reasonTextContainer}>
                                        <Text style={[styles.reasonLabel, selectedReason === reason.id && styles.reasonLabelSelected]}>
                                            {reason.label}
                                        </Text>
                                        {reason.description ? <Text style={styles.reasonDescription}>{reason.description}</Text> : null}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Zusätzliche Informationen */}
                <View style={styles.additionalSection}>
                    <Text style={styles.sectionTitle}>Zusätzliche Informationen (optional)</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Beschreibe das Problem genauer..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            value={additionalInfo}
                            onChangeText={setAdditionalInfo}
                            textAlignVertical="top"
                        />
                    </View>
                    <Text style={styles.characterCount}>{additionalInfo.length}/500</Text>
                </View>

                {/* Submit */}
                <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} disabled={!selectedReason || isSubmitting}>
                    <LinearGradient
                        colors={selectedReason ? ['#FF5A5F', '#CE494D'] : ['#CCC', '#BBB']}
                        style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Meldung senden</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Falsche Meldungen können zu Maßnahmen gegen deinen Account führen. Sende nur eine Meldung, wenn du wirklich glaubst, dass dieser Inhalt unsere Richtlinien verletzt.
                </Text>

                <View style={styles.bottomPadding} />
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
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', margin: 15, padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF5A5F' },
    warningText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#666', lineHeight: 20 },
    itemInfo: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 12 },
    itemInfoLabel: { fontSize: 12, color: '#999', marginBottom: 5 },
    itemInfoText: { fontSize: 15, color: '#333', fontWeight: '500' },
    reasonsContainer: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    reasonItem: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 8, backgroundColor: '#f8f9fa' },
    reasonItemSelected: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FF5A5F' },
    reasonContent: { flexDirection: 'row', alignItems: 'flex-start' },
    radioButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    radioButtonSelected: { borderColor: '#FF5A5F' },
    radioButtonInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5A5F' },
    reasonTextContainer: { flex: 1 },
    reasonLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 3 },
    reasonLabelSelected: { color: '#FF5A5F' },
    reasonDescription: { fontSize: 13, color: '#888', lineHeight: 18 },
    additionalSection: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 12 },
    textInputContainer: { backgroundColor: '#f8f9fa', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
    textInput: { padding: 12, fontSize: 14, color: '#333', minHeight: 100, lineHeight: 20 },
    characterCount: { textAlign: 'right', marginTop: 8, fontSize: 12, color: '#999' },
    submitButton: { marginHorizontal: 15, paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },
    disclaimer: { marginHorizontal: 15, marginTop: 15, fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
    bottomPadding: { height: 40 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 340, alignItems: 'center' },
    successIconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    modalButton: { paddingVertical: 12, paddingHorizontal: 50, borderRadius: 25 },
    modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});