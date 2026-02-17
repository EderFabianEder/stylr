import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    ActivityIndicator, Alert, Modal, TextInput, RefreshControl, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    User, Check, X, ChevronDown, ChevronUp,
    AlertTriangle, Info, Search, Flag, UserX
} from 'lucide-react-native';
import { moderationService, userService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminDashboardScreen({ user }) {
    const [activeSection, setActiveSection] = useState('reports');

    // Reports State
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expandedReport, setExpandedReport] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // Ban Modal State
    const [showBanModal, setShowBanModal] = useState(false);
    const [banTarget, setBanTarget] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banHours, setBanHours] = useState('');

    // User Management State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimer, setSearchTimer] = useState(null);

    useEffect(() => {
        if (activeSection === 'reports') {
            loadReports(true);
        }
    }, [statusFilter, activeSection]);

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
        Alert.alert('Report bestätigen', 'Der gemeldete User erhält eine Verwarnung.', [
            { text: 'Abbrechen', style: 'cancel' },
            {
                text: 'Bestätigen', style: 'destructive',
                onPress: async () => {
                    setActionLoading(reportId);
                    try {
                        await moderationService.resolveReport(reportId, adminNote || null);
                        setReports(prev => prev.filter(r => r.id !== reportId));
                        setAdminNote('');
                        Alert.alert('Erledigt', 'Report wurde bestätigt.');
                    } catch (error) {
                        Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen.');
                    } finally { setActionLoading(null); }
                }
            }
        ]);
    };

    const handleDismiss = async (reportId) => {
        Alert.alert('Report ablehnen', 'Bist du sicher?', [
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
                    } finally { setActionLoading(null); }
                }
            }
        ]);
    };

    const openBanModal = (userId, userName) => {
        setBanTarget({ id: userId, name: userName });
        setBanReason('');
        setBanHours('');
        setShowBanModal(true);
    };

    const handleBan = async () => {
        if (!banReason.trim()) { Alert.alert('Fehler', 'Bitte gib einen Grund an.'); return; }
        setActionLoading('ban');
        try {
            const hours = banHours ? parseInt(banHours) : null;
            await moderationService.banUser(banTarget.id, banReason, hours);
            setShowBanModal(false);
            // Update search results if user was banned from user management
            setSearchResults(prev => prev.map(u => u.id === banTarget.id ? { ...u, is_banned: true } : u));
            Alert.alert('Erledigt', `${banTarget.name} wurde ${hours ? `für ${hours}h` : 'permanent'} gesperrt.`);
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Ban fehlgeschlagen.');
        } finally { setActionLoading(null); }
    };

    const handleUnban = async (userId, userName) => {
        Alert.alert('Sperre aufheben', `Möchtest du die Sperre von ${userName} aufheben?`, [
            { text: 'Abbrechen', style: 'cancel' },
            {
                text: 'Aufheben',
                onPress: async () => {
                    setActionLoading(userId);
                    try {
                        await moderationService.unbanUser(userId);
                        setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, is_banned: false } : u));
                        Alert.alert('Erledigt', `Sperre von ${userName} wurde aufgehoben.`);
                    } catch (error) {
                        Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen.');
                    } finally { setActionLoading(null); }
                }
            }
        ]);
    };

    // User Search (same logic as SearchScreen)
    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        if (searchTimer) clearTimeout(searchTimer);

        if (text.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await userService.searchUsers(text.trim());
                const results = response.data?.users || response.data?.data || [];
                setSearchResults(results);
            } catch (error) {
                console.log('Search error:', error);
                setSearchResults([]);
            } finally { setIsSearching(false); }
        }, 500);
        setSearchTimer(timer);
    }, [searchTimer]);

    // Admin Promote/Demote
    const handlePromote = async (targetUser) => {
        Alert.alert('Zum Admin befördern', `Möchtest du ${targetUser.name} zum Admin machen?\n\nDer User erhält vollen Zugriff auf die Moderation.`, [
            { text: 'Abbrechen', style: 'cancel' },
            {
                text: 'Befördern',
                onPress: async () => {
                    setActionLoading(`promote-${targetUser.id}`);
                    try {
                        await moderationService.promoteAdmin(targetUser.id);
                        setSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_admin: true } : u));
                        Alert.alert('Erledigt', `${targetUser.name} ist jetzt Admin.`);
                    } catch (error) {
                        Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen.');
                    } finally { setActionLoading(null); }
                }
            }
        ]);
    };

    const handleDemote = async (targetUser) => {
        if (targetUser.id === user?.id) {
            Alert.alert('Fehler', 'Du kannst dir selbst den Admin-Status nicht entziehen.');
            return;
        }
        Alert.alert('Admin-Status entziehen', `Möchtest du ${targetUser.name} den Admin-Status entziehen?`, [
            { text: 'Abbrechen', style: 'cancel' },
            {
                text: 'Entziehen', style: 'destructive',
                onPress: async () => {
                    setActionLoading(`demote-${targetUser.id}`);
                    try {
                        await moderationService.demoteAdmin(targetUser.id);
                        setSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_admin: false } : u));
                        Alert.alert('Erledigt', `${targetUser.name} ist kein Admin mehr.`);
                    } catch (error) {
                        Alert.alert('Fehler', error.message || 'Aktion fehlgeschlagen.');
                    } finally { setActionLoading(null); }
                }
            }
        ]);
    };

    // Helpers
    const getStatusColor = (s) => ({ pending: '#FF9500', resolved: '#34C759', dismissed: '#8E8E93' }[s] || '#999');
    const getStatusLabel = (s) => ({ pending: 'Offen', resolved: 'Bestätigt', dismissed: 'Abgelehnt' }[s] || s);

    // ─── Render: Report Card ───
    const renderReport = ({ item }) => {
        const isExpanded = expandedReport === item.id;
        const isActionLoading = actionLoading === item.id;
        return (
            <View style={styles.reportCard}>
                <TouchableOpacity style={styles.reportHeader} onPress={() => setExpandedReport(isExpanded ? null : item.id)} activeOpacity={0.7}>
                    <View style={styles.reportHeaderLeft}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                        </View>
                        <Text style={styles.categoryName} numberOfLines={1}>{item.category?.name || 'Unbekannt'}</Text>
                    </View>
                    {isExpanded ? <ChevronUp size={20} color="#999" /> : <ChevronDown size={20} color="#999" />}
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
                            <Info size={14} color="#999" />
                            <Text style={styles.metaText}>{item.content_type} #{item.content_id}</Text>
                        </View>
                        {item.created_at && (
                            <View style={styles.metaRow}>
                                <Info size={14} color="#999" />
                                <Text style={styles.metaText}>
                                    {new Date(item.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        )}
                        {item.status === 'pending' && (
                            <View style={styles.noteInputContainer}>
                                <TextInput style={styles.noteInput} placeholder="Admin-Notiz (optional)..." placeholderTextColor="#999" value={adminNote} onChangeText={setAdminNote} multiline />
                            </View>
                        )}
                        {item.status === 'pending' && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]} onPress={() => handleResolve(item.id)} disabled={isActionLoading}>
                                    {isActionLoading ? <ActivityIndicator size="small" color="#fff" /> : (<><Check size={16} color="#fff" /><Text style={styles.actionBtnText}>Bestätigen</Text></>)}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.dismissBtn]} onPress={() => handleDismiss(item.id)} disabled={isActionLoading}>
                                    <X size={16} color="#fff" /><Text style={styles.actionBtnText}>Ablehnen</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.banBtn]} onPress={() => openBanModal(item.reported_user_id, item.reported_user?.name || item.reportedUser?.name || `User #${item.reported_user_id}`)} disabled={isActionLoading}>
                                    <UserX size={16} color="#fff" /><Text style={styles.actionBtnText}>Bannen</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    // ─── Render: User Card ───
    const renderUserCard = ({ item }) => {
        const isCurrentUser = item.id === user?.id;
        const isPromoteLoading = actionLoading === `promote-${item.id}`;
        const isDemoteLoading = actionLoading === `demote-${item.id}`;
        return (
            <View style={styles.userCard}>
                <View style={styles.userCardLeft}>
                    <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.userCardInfo}>
                        <View style={styles.userNameRow}>
                            <Text style={styles.userCardName} numberOfLines={1}>{item.name}</Text>
                            {item.is_admin && (
                                <View style={styles.adminBadge}><User size={10} color="#fff" /><Text style={styles.adminBadgeText}>Admin</Text></View>
                            )}
                            {isCurrentUser && (
                                <View style={styles.youBadge}><Text style={styles.youBadgeText}>Du</Text></View>
                            )}
                        </View>
                        <Text style={styles.userCardEmail} numberOfLines={1}>{item.email}</Text>
                        {item.is_banned && <Text style={styles.bannedText}>⛔ Gesperrt</Text>}
                    </View>
                </View>
                <View style={styles.userCardActions}>
                    {item.is_admin ? (
                        <TouchableOpacity style={[styles.smallBtn, styles.demoteBtn, isCurrentUser && styles.disabledBtn]} onPress={() => handleDemote(item)} disabled={isCurrentUser || isDemoteLoading}>
                            {isDemoteLoading ? <ActivityIndicator size="small" color="#fff" /> : (<><X size={14} color="#fff" /><Text style={styles.smallBtnText}>Entziehen</Text></>)}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.smallBtn, styles.promoteBtn]} onPress={() => handlePromote(item)} disabled={isPromoteLoading}>
                            {isPromoteLoading ? <ActivityIndicator size="small" color="#fff" /> : (<><Check size={14} color="#fff" /><Text style={styles.smallBtnText}>Admin</Text></>)}
                        </TouchableOpacity>
                    )}
                    {!isCurrentUser && (
                        item.is_banned ? (
                            <TouchableOpacity style={[styles.smallBtn, styles.unbanBtn]} onPress={() => handleUnban(item.id, item.name)} disabled={actionLoading === item.id}>
                                <Text style={styles.smallBtnText}>Entbannen</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.smallBtn, styles.banSmallBtn]} onPress={() => openBanModal(item.id, item.name)}>
                                <UserX size={14} color="#fff" /><Text style={styles.smallBtnText}>Ban</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>
        );
    };

    // ─── Render: Reports Section ───
    const renderReportsSection = () => (
        <>
            <View style={styles.filterContainer}>
                {['pending', 'resolved', 'dismissed'].map(status => (
                    <TouchableOpacity key={status} style={[styles.filterTab, statusFilter === status && styles.filterTabActive]} onPress={() => setStatusFilter(status)}>
                        <Text style={[styles.filterTabText, statusFilter === status && styles.filterTabTextActive]}>{getStatusLabel(status)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {isLoading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FF5A5F" /><Text style={styles.loadingText}>Reports laden...</Text></View>
            ) : reports.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Check size={48} color="#34C759" />
                    <Text style={styles.emptyTitle}>Alles erledigt!</Text>
                    <Text style={styles.emptySubtitle}>Keine {statusFilter === 'pending' ? 'offenen' : statusFilter === 'resolved' ? 'bestätigten' : 'abgelehnten'} Reports.</Text>
                </View>
            ) : (
                <FlatList data={reports} renderItem={renderReport} keyExtractor={item => item.id?.toString()} contentContainerStyle={styles.listContent}
                          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5A5F" colors={['#FF5A5F']} />}
                          onEndReached={() => hasMore && loadReports(false)} onEndReachedThreshold={0.3} showsVerticalScrollIndicator={false} />
            )}
        </>
    );

    // ─── Render: User Management Section ───
    const renderUserManagement = () => (
        <View style={styles.userManagementContainer}>
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#999" />
                    <TextInput style={styles.searchInput} placeholder="User suchen (Name oder Email)..." placeholderTextColor="#999" value={searchQuery} onChangeText={handleSearch} autoCapitalize="none" autoCorrect={false} />
                    {isSearching && <ActivityIndicator size="small" color="#FF5A5F" />}
                </View>
            </View>
            {searchQuery.length < 2 ? (
                <View style={styles.emptyContainer}>
                    <User size={48} color="#ccc" />
                    <Text style={styles.emptyTitle}>User verwalten</Text>
                    <Text style={styles.emptySubtitle}>Suche nach einem User um Admin-Rechte zu vergeben, zu entziehen oder User zu sperren.</Text>
                </View>
            ) : searchResults.length === 0 && !isSearching ? (
                <View style={styles.emptyContainer}>
                    <Search size={48} color="#ccc" />
                    <Text style={styles.emptyTitle}>Keine Ergebnisse</Text>
                    <Text style={styles.emptySubtitle}>Kein User mit "{searchQuery}" gefunden.</Text>
                </View>
            ) : (
                <FlatList data={searchResults} renderItem={renderUserCard} keyExtractor={item => item.id?.toString()} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />
            )}
        </View>
    );

    // ─── Main Render ───
    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FF5A5F', '#CE494D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
                <View style={styles.headerContent}>
                    <User size={24} color="#fff" />
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                </View>
                <View style={styles.sectionTabs}>
                    <TouchableOpacity style={[styles.sectionTab, activeSection === 'reports' && styles.sectionTabActive]} onPress={() => setActiveSection('reports')}>
                        <Flag size={16} color="#fff" style={{ opacity: activeSection === 'reports' ? 1 : 0.5 }} />
                        <Text style={[styles.sectionTabText, activeSection === 'reports' && styles.sectionTabTextActive]}>Reports</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sectionTab, activeSection === 'users' && styles.sectionTabActive]} onPress={() => setActiveSection('users')}>
                        <User size={16} color="#fff" style={{ opacity: activeSection === 'users' ? 1 : 0.5 }} />
                        <Text style={[styles.sectionTabText, activeSection === 'users' && styles.sectionTabTextActive]}>User verwalten</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {activeSection === 'reports' ? renderReportsSection() : renderUserManagement()}

            {/* Ban Modal */}
            <Modal visible={showBanModal} transparent animationType="fade" onRequestClose={() => setShowBanModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AlertTriangle size={24} color="#FF3B30" />
                            <Text style={styles.modalTitle}>User sperren</Text>
                        </View>
                        <Text style={styles.modalSubtitle}>{banTarget?.name} wird gesperrt.</Text>
                        <Text style={styles.inputLabel}>Grund *</Text>
                        <TextInput style={styles.modalInput} placeholder="Grund für die Sperre..." placeholderTextColor="#999" value={banReason} onChangeText={setBanReason} multiline />
                        <Text style={styles.inputLabel}>Dauer (Stunden, leer = permanent)</Text>
                        <TextInput style={styles.modalInput} placeholder="z.B. 24" placeholderTextColor="#999" value={banHours} onChangeText={setBanHours} keyboardType="number-pad" />
                        {!banHours && (
                            <View style={styles.warningBox}>
                                <AlertTriangle size={14} color="#FF9500" />
                                <Text style={styles.warningText}>Ohne Stundenangabe wird der User permanent gesperrt!</Text>
                            </View>
                        )}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBanModal(false)}>
                                <Text style={styles.modalCancelText}>Abbrechen</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleBan} disabled={actionLoading === 'ban'}>
                                {actionLoading === 'ban' ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalConfirmText}>Sperren</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { paddingTop: 50, paddingBottom: 0, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    sectionTabs: { flexDirection: 'row', gap: 0 },
    sectionTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    sectionTabActive: { borderBottomColor: '#fff' },
    sectionTabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
    sectionTabTextActive: { color: '#fff' },
    filterContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 8 },
    filterTab: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center' },
    filterTabActive: { backgroundColor: '#FF5A5F' },
    filterTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
    filterTabTextActive: { color: '#fff' },
    listContent: { padding: 16, paddingBottom: 100 },
    reportCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    reportHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 5 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '600' },
    categoryName: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
    reportUsers: { padding: 14, gap: 6 },
    userRow: { flexDirection: 'row', alignItems: 'center' },
    userLabel: { fontSize: 12, color: '#999', width: 120 },
    userName: { fontSize: 13, fontWeight: '600', color: '#333' },
    reportDetails: { padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    reasonBox: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 12, marginTop: 10, marginBottom: 8 },
    reasonLabel: { fontSize: 11, fontWeight: '600', color: '#999', marginBottom: 4, textTransform: 'uppercase' },
    reasonText: { fontSize: 13, color: '#333', lineHeight: 18 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    metaText: { fontSize: 12, color: '#999' },
    noteInputContainer: { marginTop: 12 },
    noteInput: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 10, fontSize: 13, color: '#333', minHeight: 40, borderWidth: 1, borderColor: '#eee' },
    actionButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
    actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    resolveBtn: { backgroundColor: '#34C759' },
    dismissBtn: { backgroundColor: '#8E8E93' },
    banBtn: { backgroundColor: '#FF3B30' },
    userManagementContainer: { flex: 1 },
    searchContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 12, gap: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#333', paddingVertical: 10 },
    userCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
    userCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    userAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FF5A5F', justifyContent: 'center', alignItems: 'center' },
    userAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    userCardInfo: { flex: 1 },
    userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    userCardName: { fontSize: 15, fontWeight: '600', color: '#333' },
    userCardEmail: { fontSize: 12, color: '#999', marginTop: 2 },
    adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FF5A5F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    adminBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    youBadge: { backgroundColor: '#007AFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    youBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    bannedText: { fontSize: 11, color: '#FF3B30', fontWeight: '600', marginTop: 2 },
    userCardActions: { flexDirection: 'column', gap: 6, marginLeft: 10 },
    smallBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 4, minWidth: 90 },
    smallBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    promoteBtn: { backgroundColor: '#34C759' },
    demoteBtn: { backgroundColor: '#FF9500' },
    unbanBtn: { backgroundColor: '#007AFF' },
    banSmallBtn: { backgroundColor: '#FF3B30' },
    disabledBtn: { opacity: 0.4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: '#999' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 8 },
    emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 12 },
    modalInput: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#eee' },
    warningBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginTop: 12 },
    warningText: { fontSize: 12, color: '#E65100', flex: 1 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
    modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#f0f0f0' },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
    modalConfirmBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#FF3B30', minWidth: 100, alignItems: 'center' },
    modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});