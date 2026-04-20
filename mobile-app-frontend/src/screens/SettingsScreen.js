import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Switch,
    Modal,
    TextInput,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronRight, Lock, LogOut, Trash2, Eye, Bell,
    FileText, Shield, Info, User, AlertTriangle, X, UserX, ArrowLeft
} from 'lucide-react-native';
import { authService, userService, blockService } from '../services/api';

export default function SettingsScreen({ onLogout, user, blockedUsers = [], onUnblockUser, onUpdateUser }) {
    // Privacy settings - initialisiert mit aktuellem User
    const [isProfilePublic, setIsProfilePublic] = useState(user?.account_type !== 'private');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Blocked users aus API
    const [apiBlockedUsers, setApiBlockedUsers] = useState([]);
    const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
    const [hasLoadedBlocked, setHasLoadedBlocked] = useState(false);

    // Modals
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showBlockedUsers, setShowBlockedUsers] = useState(false);

    // Change password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Delete account
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // Profil-Sichtbarkeit
    const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

    // Blockierte User beim Öffnen laden
    useEffect(() => {
        if (showBlockedUsers) loadBlockedUsers();
    }, [showBlockedUsers]);

    const loadBlockedUsers = async () => {
        setIsLoadingBlocked(true);
        try {
            const response = await blockService.getBlocked();
            const blocked = response.data?.blocked_users || response.data?.data || [];
            setApiBlockedUsers(blocked);
            setHasLoadedBlocked(true);
        } catch (error) {
            console.log('Failed to load blocked users:', error);
        } finally {
            setIsLoadingBlocked(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Fehler', 'Neue Passwörter stimmen nicht überein');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Fehler', 'Passwort muss mindestens 8 Zeichen haben');
            return;
        }

        setIsChangingPassword(true);
        try {
            await userService.updatePassword(currentPassword, newPassword, confirmPassword);
            Alert.alert('Erfolg', 'Passwort wurde geändert!');
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Passwort konnte nicht geändert werden');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            Alert.alert('Fehler', 'Bitte gib dein Passwort ein');
            return;
        }

        setIsDeletingAccount(true);
        try {
            await userService.deleteAccount(deletePassword);
            setShowDeleteAccount(false);
            Alert.alert('Account gelöscht', 'Dein Account wurde permanent gelöscht.');
            if (onLogout) onLogout();
        } catch (error) {
            Alert.alert('Fehler', error.message || 'Account konnte nicht gelöscht werden');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        try {
            await authService.logout();
        } catch (error) {
            console.log('Logout API error (continuing):', error);
        }
        if (onLogout) onLogout();
    };

    const handlePrivacyToggle = async (value) => {
        const prevValue = isProfilePublic;
        setIsProfilePublic(value);
        setIsUpdatingPrivacy(true);

        try {
            const accountType = value ? 'public' : 'private';
            await userService.updateProfile({ account_type: accountType });
            if (onUpdateUser) onUpdateUser({ account_type: accountType });
        } catch (error) {
            // Revert
            setIsProfilePublic(prevValue);
            Alert.alert('Fehler', error.message || 'Einstellung konnte nicht geändert werden');
        } finally {
            setIsUpdatingPrivacy(false);
        }
    };

    const handleUnblockUser = async (userId) => {
        try {
            await blockService.unblock(userId);
            setApiBlockedUsers(prev => prev.filter(u => u.id !== userId));
            if (onUnblockUser) onUnblockUser(userId);
        } catch (error) {
            Alert.alert('Fehler', error.message || 'User konnte nicht entblockiert werden');
        }
    };

    // --- UI Components ---

    const SectionHeader = ({ title, icon: Icon }) => (
        <View style={styles.sectionHeader}>
            <Icon size={20} color="#FF5A5F" strokeWidth={2} />
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    const SettingItem = ({ icon: Icon, title, subtitle, onPress, showChevron = true, danger = false }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.settingIconContainer, danger && styles.settingIconDanger]}>
                <Icon size={20} color={danger ? "#FF5A5F" : "#666"} strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {showChevron && <ChevronRight size={20} color="#ccc" />}
        </TouchableOpacity>
    );

    const ToggleItem = ({ icon: Icon, title, subtitle, value, onValueChange, disabled }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
                <Icon size={20} color="#666" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#ddd', true: '#FFB5B7' }}
                thumbColor={value ? '#FF5A5F' : '#f4f3f4'}
                disabled={disabled}
            />
        </View>
    );

    // Change Password Modal
    const changePasswordModal = (
        <Modal visible={showChangePassword} transparent={true} animationType="fade" onRequestClose={() => setShowChangePassword(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Passwort ändern</Text>
                        <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Aktuelles Passwort</Text>
                        <TextInput style={styles.input} placeholder="Aktuelles Passwort" placeholderTextColor="#999" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} editable={!isChangingPassword} />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Neues Passwort</Text>
                        <TextInput style={styles.input} placeholder="Neues Passwort (min. 8 Zeichen)" placeholderTextColor="#999" secureTextEntry value={newPassword} onChangeText={setNewPassword} editable={!isChangingPassword} />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Passwort bestätigen</Text>
                        <TextInput style={styles.input} placeholder="Neues Passwort bestätigen" placeholderTextColor="#999" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} editable={!isChangingPassword} />
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowChangePassword(false)}>
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleChangePassword} disabled={isChangingPassword}>
                            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={[styles.confirmButton, isChangingPassword && { opacity: 0.6 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {isChangingPassword ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Ändern</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Logout Modal
    const logoutConfirmModal = (
        <Modal visible={showLogoutConfirm} transparent={true} animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <LogOut size={40} color="#FF5A5F" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.modalTitle}>Abmelden?</Text>
                    <Text style={styles.modalMessage}>Bist du sicher, dass du dich abmelden möchtest?</Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogoutConfirm(false)}>
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout}>
                            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.confirmButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={styles.confirmButtonText}>Abmelden</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Delete Account Modal
    const deleteAccountModal = (
        <Modal visible={showDeleteAccount} transparent={true} animationType="fade" onRequestClose={() => setShowDeleteAccount(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={[styles.modalIconContainer, styles.dangerIcon]}>
                        <AlertTriangle size={40} color="#FF5A5F" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.modalTitle}>Account löschen?</Text>
                    <Text style={styles.modalMessage}>
                        Diese Aktion ist permanent und kann nicht rückgängig gemacht werden. Alle Daten, Fotos und Einstellungen werden gelöscht.
                    </Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Passwort zur Bestätigung</Text>
                        <TextInput style={styles.input} placeholder="Passwort eingeben" placeholderTextColor="#999" secureTextEntry value={deletePassword} onChangeText={setDeletePassword} editable={!isDeletingAccount} />
                    </View>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowDeleteAccount(false); setDeletePassword(''); }}>
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteAccount} disabled={isDeletingAccount}>
                            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={[styles.confirmButton, isDeletingAccount && { opacity: 0.6 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {isDeletingAccount ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Löschen</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Terms Modal
    const termsModal = (
        <Modal visible={showTerms} transparent={true} animationType="slide" onRequestClose={() => setShowTerms(false)}>
            <View style={styles.fullModalContainer}>
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.fullModalHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <TouchableOpacity onPress={() => setShowTerms(false)} style={styles.modalBackButton}><X size={24} color="#fff" /></TouchableOpacity>
                    <Text style={styles.fullModalTitle}>Nutzungsbedingungen</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    <Text style={styles.legalTitle}>Nutzungsbedingungen</Text>
                    <Text style={styles.legalDate}>Letzte Aktualisierung: Januar 2025</Text>
                    <Text style={styles.legalHeading}>1. Akzeptanz der Bedingungen</Text>
                    <Text style={styles.legalText}>Durch die Nutzung dieser Anwendung akzeptierst du die hier aufgeführten Bedingungen.</Text>
                    <Text style={styles.legalHeading}>2. Nutzungslizenz</Text>
                    <Text style={styles.legalText}>Du erhältst eine temporäre Lizenz zur persönlichen, nicht-kommerziellen Nutzung der App.</Text>
                    <Text style={styles.legalHeading}>3. Nutzerinhalte</Text>
                    <Text style={styles.legalText}>Du behältst das Eigentum an deinen Inhalten. Durch das Posten gewährst du uns eine Lizenz zur Nutzung im Rahmen des Dienstes.</Text>
                    <Text style={styles.legalHeading}>4. Verbotene Nutzung</Text>
                    <Text style={styles.legalText}>Die Nutzung für illegale Zwecke, Belästigung oder das Posten schädlicher Inhalte ist untersagt.</Text>
                    <Text style={styles.legalHeading}>5. Kündigung</Text>
                    <Text style={styles.legalText}>Wir können deinen Account jederzeit sperren, wenn du gegen diese Bedingungen verstößt.</Text>
                    <View style={styles.legalBottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );

    // Privacy Policy Modal
    const privacyPolicyModal = (
        <Modal visible={showPrivacyPolicy} transparent={true} animationType="slide" onRequestClose={() => setShowPrivacyPolicy(false)}>
            <View style={styles.fullModalContainer}>
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.fullModalHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)} style={styles.modalBackButton}><X size={24} color="#fff" /></TouchableOpacity>
                    <Text style={styles.fullModalTitle}>Datenschutz</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    <Text style={styles.legalTitle}>Datenschutzrichtlinie</Text>
                    <Text style={styles.legalDate}>Letzte Aktualisierung: Januar 2025</Text>
                    <Text style={styles.legalHeading}>1. Gesammelte Daten</Text>
                    <Text style={styles.legalText}>Wir erfassen direkt von dir bereitgestellte Informationen wie Name, E-Mail und Profilinformationen.</Text>
                    <Text style={styles.legalHeading}>2. Verwendung der Daten</Text>
                    <Text style={styles.legalText}>Deine Daten werden zur Bereitstellung und Verbesserung unserer Dienste verwendet.</Text>
                    <Text style={styles.legalHeading}>3. Datenweitergabe</Text>
                    <Text style={styles.legalText}>Wir verkaufen keine persönlichen Daten. Weitergabe erfolgt nur an Dienstleister oder aus rechtlichen Gründen.</Text>
                    <Text style={styles.legalHeading}>4. Datensicherheit</Text>
                    <Text style={styles.legalText}>Wir implementieren angemessene Sicherheitsmaßnahmen zum Schutz deiner Daten.</Text>
                    <Text style={styles.legalHeading}>5. Deine Rechte</Text>
                    <Text style={styles.legalText}>Du hast das Recht, deine Daten einzusehen, zu aktualisieren oder zu löschen.</Text>
                    <View style={styles.legalBottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );

    // About Modal
    const aboutModal = (
        <Modal visible={showAbout} transparent={true} animationType="slide" onRequestClose={() => setShowAbout(false)}>
            <View style={styles.fullModalContainer}>
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.fullModalHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <TouchableOpacity onPress={() => setShowAbout(false)} style={styles.modalBackButton}><X size={24} color="#fff" /></TouchableOpacity>
                    <Text style={styles.fullModalTitle}>Über</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    <View style={styles.aboutLogoContainer}>
                        <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.aboutLogo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Text style={styles.aboutLogoText}>S</Text>
                        </LinearGradient>
                        <Text style={styles.aboutAppName}>STYLR</Text>
                        <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                    </View>
                    <View style={styles.aboutSection}>
                        <Text style={styles.aboutHeading}>Über STYLR</Text>
                        <Text style={styles.aboutText}>STYLR ist eine Fashion-Social-Plattform, auf der Style-Enthusiasten Looks entdecken, teilen und sich über ihre Liebe zur Mode verbinden.</Text>
                    </View>
                    <View style={styles.aboutSection}>
                        <Text style={styles.aboutHeading}>Kontakt</Text>
                        <Text style={styles.aboutText}>Email: support@stylr.app{'\n'}Website: www.stylr.app</Text>
                    </View>
                    <Text style={styles.copyright}>© 2025 STYLR. Alle Rechte vorbehalten.</Text>
                    <View style={styles.legalBottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );

    // Blocked Users Modal - prefer API data once loaded (empty is valid)
    const displayBlockedUsers = hasLoadedBlocked ? apiBlockedUsers : blockedUsers;

    const blockedUsersModal = (
        <Modal visible={showBlockedUsers} transparent={true} animationType="slide" onRequestClose={() => setShowBlockedUsers(false)}>
            <View style={styles.fullModalContainer}>
                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.fullModalHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <TouchableOpacity onPress={() => setShowBlockedUsers(false)} style={styles.modalBackButton}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.fullModalTitle}>Blockierte Accounts</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    {isLoadingBlocked ? (
                        <ActivityIndicator size="large" color="#FF5A5F" style={{ marginTop: 40 }} />
                    ) : displayBlockedUsers.length === 0 ? (
                        <View style={styles.emptyBlockedContainer}>
                            <UserX size={60} color="#ccc" strokeWidth={1.5} />
                            <Text style={styles.emptyBlockedTitle}>Keine blockierten Accounts</Text>
                            <Text style={styles.emptyBlockedText}>Wenn du jemanden blockierst, erscheint er hier.</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.blockedCount}>
                                {displayBlockedUsers.length} blockierte{displayBlockedUsers.length === 1 ? 'r' : ''} Account{displayBlockedUsers.length !== 1 ? 's' : ''}
                            </Text>
                            {displayBlockedUsers.map((blockedUser) => (
                                <View key={blockedUser.id} style={styles.blockedUserItem}>
                                    <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.blockedUserAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Text style={styles.blockedUserAvatarText}>
                                            {(blockedUser.name || blockedUser.username || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                    <View style={styles.blockedUserInfo}>
                                        <Text style={styles.blockedUserName}>{blockedUser.name || blockedUser.username}</Text>
                                        <Text style={styles.blockedUserHandle}>@{(blockedUser.name || blockedUser.username || '').toLowerCase()}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblockUser(blockedUser.id)} activeOpacity={0.7}>
                                        <Text style={styles.unblockButtonText}>Entblockieren</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </>
                    )}
                    <View style={styles.legalBottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {changePasswordModal}
            {logoutConfirmModal}
            {deleteAccountModal}
            {termsModal}
            {privacyPolicyModal}
            {aboutModal}
            {blockedUsersModal}

            <LinearGradient colors={['#FF5A5F', '#CE494D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Einstellungen</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Account */}
                <SectionHeader title="Account" icon={User} />
                <View style={styles.sectionContainer}>
                    <SettingItem icon={Lock} title="Passwort ändern" subtitle="Aktualisiere dein Passwort" onPress={() => setShowChangePassword(true)} />
                    <SettingItem icon={LogOut} title="Abmelden" subtitle="Von deinem Account abmelden" onPress={() => setShowLogoutConfirm(true)} />
                    <SettingItem icon={Trash2} title="Account löschen" subtitle="Account permanent löschen" onPress={() => setShowDeleteAccount(true)} danger />
                </View>

                {/* Privatsphäre */}
                <SectionHeader title="Privatsphäre" icon={Shield} />
                <View style={styles.sectionContainer}>
                    <ToggleItem
                        icon={Eye}
                        title="Öffentliches Profil"
                        subtitle={isProfilePublic ? "Jeder kann dein Profil sehen" : "Nur Follower können dein Profil sehen"}
                        value={isProfilePublic}
                        onValueChange={handlePrivacyToggle}
                        disabled={isUpdatingPrivacy}
                    />
                    <SettingItem
                        icon={UserX}
                        title="Blockierte Accounts"
                        subtitle={`${displayBlockedUsers.length} blockiert`}
                        onPress={() => setShowBlockedUsers(true)}
                    />
                </View>

                {/* Benachrichtigungen */}
                <SectionHeader title="Benachrichtigungen" icon={Bell} />
                <View style={styles.sectionContainer}>
                    <ToggleItem
                        icon={Bell}
                        title="Push-Benachrichtigungen"
                        subtitle={notificationsEnabled ? "Aktiviert" : "Deaktiviert"}
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                </View>

                {/* App Info */}
                <SectionHeader title="App Info" icon={Info} />
                <View style={styles.sectionContainer}>
                    <SettingItem icon={FileText} title="Nutzungsbedingungen" subtitle="Unsere Bedingungen lesen" onPress={() => setShowTerms(true)} />
                    <SettingItem icon={Shield} title="Datenschutzrichtlinie" subtitle="Wie wir deine Daten handhaben" onPress={() => setShowPrivacyPolicy(true)} />
                    <SettingItem icon={Info} title="Über" subtitle="App-Version und Info" onPress={() => setShowAbout(true)} />
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerGradient: { paddingTop: 50 },
    header: { paddingVertical: 15, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    scrollView: { flex: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 25, paddingBottom: 10 },
    sectionHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#FF5A5F', marginLeft: 10 },
    sectionContainer: { backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 12, overflow: 'hidden' },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    settingIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingIconDanger: { backgroundColor: '#fff0f0' },
    settingTextContainer: { flex: 1 },
    settingTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
    settingTitleDanger: { color: '#FF5A5F' },
    settingSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    bottomPadding: { height: 40 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 360 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalIconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff0f0', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 15 },
    dangerIcon: { backgroundColor: '#fff0f0' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center' },
    modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    modalButtons: { flexDirection: 'row', justifyContent: 'center' },
    cancelButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0', marginRight: 12 },
    cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#666' },
    confirmButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
    confirmButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    inputContainer: { marginBottom: 15 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#e0e0e0' },
    // Full screen modal
    fullModalContainer: { flex: 1, backgroundColor: '#fff' },
    fullModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
    modalBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    fullModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    fullModalContent: { flex: 1, padding: 20 },
    legalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    legalDate: { fontSize: 14, color: '#888', marginBottom: 25 },
    legalHeading: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
    legalText: { fontSize: 14, color: '#555', lineHeight: 22 },
    legalBottomPadding: { height: 40 },
    // About
    aboutLogoContainer: { alignItems: 'center', marginBottom: 30 },
    aboutLogo: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    aboutLogoText: { fontSize: 40, fontWeight: 'bold', color: '#fff' },
    aboutAppName: { fontSize: 28, fontWeight: 'bold', color: '#333', letterSpacing: 3 },
    aboutVersion: { fontSize: 14, color: '#888', marginTop: 5 },
    aboutSection: { marginBottom: 25 },
    aboutHeading: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    aboutText: { fontSize: 14, color: '#555', lineHeight: 22 },
    copyright: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20 },
    // Blocked users
    emptyBlockedContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyBlockedTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20 },
    emptyBlockedText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
    blockedCount: { fontSize: 14, color: '#888', marginBottom: 15 },
    blockedUserItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 12, marginBottom: 10 },
    blockedUserAvatar: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    blockedUserAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    blockedUserInfo: { flex: 1 },
    blockedUserName: { fontSize: 15, fontWeight: '600', color: '#333' },
    blockedUserHandle: { fontSize: 13, color: '#888', marginTop: 2 },
    unblockButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF5A5F' },
    unblockButtonText: { fontSize: 13, fontWeight: '600', color: '#FF5A5F' },
});