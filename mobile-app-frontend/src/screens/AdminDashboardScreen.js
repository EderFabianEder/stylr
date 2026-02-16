import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView,
    ActivityIndicator, Alert, Modal, TextInput, RefreshControl, Dimensions, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, CheckCircle, XCircle, Ban, UserCheck, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react-native';
import { moderationService } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

export default function AdminDashboardScreen({ user }) {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expandedReport, setExpandedReport] = useState(null);
    const [showBanModal, setShowBanModal] = useState(false);
    const [banTarget, setBanTarget] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banHours, setBanHours] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadReports(true);
    }, [statusFilter]);

    const loadReports = async (reset = false) => {
        try {
            const currentPage = reset ? 1 : page;
            if (reset) setIsLoading(true);

            const response = await moderationService.getReports(statusFilter, currentPage);
            const newReports = response.data?.data || response.data || [];
            const pagination = response.data;

            if (reset) {
                setReports(newReports);
                setPage(2);
            } else {
                setReports(prev => [...prev, ...newReports]);
                setPage(prev => prev + 1);
            }

            setHasMore(pagination?.next_page_url != null);
        } catch (error) {
            Alert.alert('Fehler', 'Reports konnten nicht geladen werden.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadReports(true);
    }, [statusFilter]);

    const handleResolve = async (reportId) => {
        Alert.alert(
            'Report bestätigen',
            'Der gemeldete User erhält eine Verwarnung. Möchtest du eine Notiz hinzufügen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Bestätigen',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(reportId);
                        try {
                            await moderationService.resolveReport(reportId, adminNote || null);
                            setReports(prev => prev.filter(r => r.id !== reportId));
                            setAdminNote('');
                            Alert.alert('Erledigt', 'Report wurde bestätigt.');
                        } catch (error) {
                            Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen.');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const handleDismiss = async (reportId) => {
        Alert.alert(
            'Report ablehnen',
            'Bist du sicher, dass du diesen Report ablehnen möchtest?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Ablehnen',
                    onPress: async () => {
                        setActionLoading(reportId);
                        try {
                            await moderationService.dismissReport(reportId);
                            setReports(prev => prev.filter(r => r.id !== reportId));
                            Alert.alert('Erledigt', 'Report wurde abgelehnt.');
                        } catch (error) {
                            Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen.');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const openBanModal = (userId, userName) => {
        setBanTarget({ id: userId, name: userName });
        setBanReason('');
        setBanHours('');
        setShowBanModal(true);
    };

    const handleBan = async () => {
        if (!banReason.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Grund an.');
            return;
        }

        setActionLoading('ban');
        try {
            const hours = banHours ? parseInt(banHours) : null;
            await moderationService.banUser(banTarget.id, banReason, hours);
            setShowBanModal(false);
            Alert.alert('Erledigt', `${banTarget.name} wurde ${hours ? `für ${hours}h` : 'permanent'} gesperrt.`);
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Ban fehlgeschlagen.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnban = async (userId, userName) => {
        Alert.alert(
            'Sperre aufheben',
            `Möchtest du die Sperre von ${userName} aufheben?`,
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Aufheben',
                    onPress: async () => {
                        setActionLoading(userId);
                        try {
                            await moderationService.unbanUser(userId);
                            Alert.alert('Erledigt', `Sperre von ${userName} wurde aufgehoben.`);
                        } catch (error) {
                            Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen.');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#FF9500';
            case 'resolved': return '#34C759';
            case 'dismissed': return '#8E8E93';
            default: return '#999';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Offen';
            case 'resolved': return 'Bestätigt';
            case 'dismissed': return 'Abgelehnt';
            default: return status;
        }
    };

    const renderReport = ({ item }) => {
        const isExpanded = expandedReport === item.id;
        const isActionLoading = actionLoading === item.id;

        return (
            <View style={styles.reportCard}>
                <TouchableOpacity
                    style={styles.reportHeader}
                    onPress={() => setExpandedReport(isExpanded ? null : item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.reportHeaderLeft}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                        <Text style={styles.categoryName} numberOfLines={1}>
                            {item.category?.name || 'Unbekannt'}
                        </Text>
                    </View>
                    {isExpanded ? (
                        <ChevronUp size={20} color="#999" />
                    ) : (
                        <ChevronDown size={20} color="#999" />
                    )}
                </TouchableOpacity>

                <View style={styles.reportUsers}>
                    <View style={styles.userRow}>
                        <Text style={styles.userLabel}>Gemeldet von:</Text>
                        <Text style={styles.userName}>{item.reporter?.name || `User #${item.reporter_id}`}</Text>
                    </View>
                    <View style={styles.userRow}>
                        <Text style={styles.userLabel}>Gemeldeter User:</Text>
                        <Text style={styles.userName}>{item.reported_user?.name || item.reportedUser?.name || `User #${item.reported_user_id}`}</Text>
                    </View>
                </View>

                {isExpanded && (
                    <View style={styles.reportDetails}>
                        {item.reason ? (
                            <View style={styles.reasonBox}>
                                <Text style={styles.reasonLabel}>Begründung:</Text>
                                <Text style={styles.reasonText}>{item.reason}</Text>
                            </View>
                        ) : null}

                        <View style={styles.metaRow}>
                            <Clock size={14} color="#999" />
                            <Text style={styles.metaText}>
                                {item.content_type} #{item.content_id}
                            </Text>
                        </View>

                        {item.created_at && (
                            <View style={styles.metaRow}>
                                <Clock size={14} color="#999" />
                                <Text style={styles.metaText}>
                                    {new Date(item.created_at).toLocaleDateString('de-DE', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                        )}

                        {item.status === 'pending' && (
                            <View style={styles.noteInputContainer}>
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Admin-Notiz (optional)..."
                                    placeholderTextColor="#999"
                                    value={adminNote}
                                    onChangeText={setAdminNote}
                                    multiline
                                />
                            </View>
                        )}

                        {item.status === 'pending' && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.resolveBtn]}
                                    onPress={() => handleResolve(item.id)}
                                    disabled={isActionLoading}
                                >
                                    {isActionLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <CheckCircle size={16} color="#fff" />
                                            <Text style={styles.actionBtnText}>Bestätigen</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.dismissBtn]}
                                    onPress={() => handleDismiss(item.id)}
                                    disabled={isActionLoading}
                                >
                                    <XCircle size={16} color="#fff" />
                                    <Text style={styles.actionBtnText}>Ablehnen</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.banBtn]}
                                    onPress={() => openBanModal(
                                        item.reported_user_id,
                                        item.reported_user?.name || item.reportedUser?.name || `User #${item.reported_user_id}`
                                    )}
                                    disabled={isActionLoading}
                                >
                                    <Ban size={16} color="#fff" />
                                    <Text style={styles.actionBtnText}>Bannen</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderFilterTabs = () => (
        <View style={styles.filterContainer}>
            {['pending', 'resolved', 'dismissed'].map(status => (
                <TouchableOpacity
                    key={status}
                    style={[
                        styles.filterTab,
                        statusFilter === status && styles.filterTabActive
                    ]}
                    onPress={() => setStatusFilter(status)}
                >
                    <Text style={[
                        styles.filterTabText,
                        statusFilter === status && styles.filterTabTextActive
                    ]}>
                        {getStatusLabel(status)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Shield size={24} color="#fff" />
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                </View>
                <Text style={styles.headerSubtitle}>Moderation & Reports</Text>
            </LinearGradient>

            {/* Filter Tabs */}
            {renderFilterTabs()}

            {/* Reports List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF5A5F" />
                    <Text style={styles.loadingText}>Reports laden...</Text>
                </View>
            ) : reports.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <CheckCircle size={48} color="#34C759" />
                    <Text style={styles.emptyTitle}>Alles erledigt!</Text>
                    <Text style={styles.emptySubtitle}>
                        Keine {statusFilter === 'pending' ? 'offenen' : statusFilter === 'resolved' ? 'bestätigten' : 'abgelehnten'} Reports vorhanden.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={reports}
                    renderItem={renderReport}
                    keyExtractor={item => item.id?.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FF5A5F"
                            colors={['#FF5A5F']}
                        />
                    }
                    onEndReached={() => hasMore && loadReports(false)}
                    onEndReachedThreshold={0.3}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Ban Modal */}
            <Modal
                visible={showBanModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBanModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AlertTriangle size={24} color="#FF3B30" />
                            <Text style={styles.modalTitle}>User sperren</Text>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            {banTarget?.name} wird gesperrt.
                        </Text>

                        <Text style={styles.inputLabel}>Grund *</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Grund für die Sperre..."
                            placeholderTextColor="#999"
                            value={banReason}
                            onChangeText={setBanReason}
                            multiline
                        />

                        <Text style={styles.inputLabel}>Dauer (Stunden, leer = permanent)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="z.B. 24"
                            placeholderTextColor="#999"
                            value={banHours}
                            onChangeText={setBanHours}
                            keyboardType="number-pad"
                        />

                        {!banHours && (
                            <View style={styles.warningBox}>
                                <AlertTriangle size={14} color="#FF9500" />
                                <Text style={styles.warningText}>
                                    Ohne Stundenangabe wird der User permanent gesperrt!
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowBanModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Abbrechen</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalConfirmBtn}
                                onPress={handleBan}
                                disabled={actionLoading === 'ban'}
                            >
                                {actionLoading === 'ban' ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Sperren</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        marginLeft: 34,
    },

    // Filter Tabs
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: '#FF5A5F',
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    filterTabTextActive: {
        color: '#fff',
    },

    // List
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },

    // Report Card
    reportCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    reportHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },

    // Users
    reportUsers: {
        padding: 14,
        gap: 6,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userLabel: {
        fontSize: 12,
        color: '#999',
        width: 120,
    },
    userName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },

    // Details (expanded)
    reportDetails: {
        padding: 14,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    reasonBox: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
        marginBottom: 8,
    },
    reasonLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#999',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    reasonText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    metaText: {
        fontSize: 12,
        color: '#999',
    },

    // Note Input
    noteInputContainer: {
        marginTop: 12,
    },
    noteInput: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        color: '#333',
        minHeight: 40,
        borderWidth: 1,
        borderColor: '#eee',
    },

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 5,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    resolveBtn: {
        backgroundColor: '#34C759',
    },
    dismissBtn: {
        backgroundColor: '#8E8E93',
    },
    banBtn: {
        backgroundColor: '#FF3B30',
    },

    // Loading / Empty
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#999',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },

    // Ban Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFF3E0',
        padding: 10,
        borderRadius: 8,
        marginTop: 12,
    },
    warningText: {
        fontSize: 12,
        color: '#E65100',
        flex: 1,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 24,
    },
    modalCancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    modalConfirmBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#FF3B30',
        minWidth: 100,
        alignItems: 'center',
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});