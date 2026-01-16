import React, { useState } from 'react';
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
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronRight,
    Lock,
    LogOut,
    Trash2,
    Eye,
    MessageCircle,
    Bell,
    FileText,
    Shield,
    Info,
    User,
    AlertTriangle,
    X,
    UserX
} from 'lucide-react-native';

export default function SettingsScreen({ onLogout, user, blockedUsers = [], onUnblockUser }) {
    // Privacy settings
    const [isProfilePublic, setIsProfilePublic] = useState(true);

    // Notification settings
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

    const showAlert = (message) => {
        if (Platform.OS === 'web') {
            window.alert(message);
        } else {
            alert(message);
        }
    };

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            showAlert('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            showAlert('Password must be at least 6 characters');
            return;
        }

        console.log('Password changed');
        showAlert('Password changed successfully!');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleDeleteAccount = () => {
        console.log('Account deleted');
        setShowDeleteAccount(false);
        if (onLogout) {
            onLogout();
        }
    };

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        if (onLogout) {
            onLogout();
        }
    };

    // Section Header Component
    const SectionHeader = ({ title, icon: Icon }) => (
        <View style={styles.sectionHeader}>
            <Icon size={20} color="#FF5A5F" strokeWidth={2} />
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    // Setting Item Component
    const SettingItem = ({ icon: Icon, title, subtitle, onPress, showChevron = true, danger = false }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
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

    // Toggle Setting Item Component
    const ToggleItem = ({ icon: Icon, title, subtitle, value, onValueChange }) => (
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
            />
        </View>
    );

    // Change Password Modal
    const ChangePasswordModal = () => (
        <Modal
            visible={showChangePassword}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowChangePassword(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Current Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter current password"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowChangePassword(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleChangePassword}>
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                style={styles.confirmButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.confirmButtonText}>Change</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Logout Confirmation Modal
    const LogoutConfirmModal = () => (
        <Modal
            visible={showLogoutConfirm}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLogoutConfirm(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <LogOut size={40} color="#FF5A5F" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.modalTitle}>Log Out?</Text>
                    <Text style={styles.modalMessage}>
                        Are you sure you want to log out of your account?
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowLogoutConfirm(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout}>
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                style={styles.confirmButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.confirmButtonText}>Log Out</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Delete Account Modal
    const DeleteAccountModal = () => (
        <Modal
            visible={showDeleteAccount}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDeleteAccount(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={[styles.modalIconContainer, styles.dangerIcon]}>
                        <AlertTriangle size={40} color="#FF5A5F" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.modalTitle}>Delete Account?</Text>
                    <Text style={styles.modalMessage}>
                        This action is permanent and cannot be undone. All your data, photos, and settings will be permanently deleted.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowDeleteAccount(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteAccount}>
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                style={styles.confirmButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.confirmButtonText}>Delete</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Terms of Service Modal
    const TermsModal = () => (
        <Modal
            visible={showTerms}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTerms(false)}
        >
            <View style={styles.fullModalContainer}>
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    style={styles.fullModalHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <TouchableOpacity onPress={() => setShowTerms(false)} style={styles.modalBackButton}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.fullModalTitle}>Terms of Service</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    <Text style={styles.legalTitle}>Terms of Service</Text>
                    <Text style={styles.legalDate}>Last updated: January 2025</Text>

                    <Text style={styles.legalHeading}>1. Acceptance of Terms</Text>
                    <Text style={styles.legalText}>
                        By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
                    </Text>

                    <Text style={styles.legalHeading}>2. Use License</Text>
                    <Text style={styles.legalText}>
                        Permission is granted to temporarily download one copy of the app for personal, non-commercial transitory viewing only.
                    </Text>

                    <Text style={styles.legalHeading}>3. User Content</Text>
                    <Text style={styles.legalText}>
                        You retain ownership of content you post. By posting content, you grant us a license to use, modify, and display that content in connection with the service.
                    </Text>

                    <Text style={styles.legalHeading}>4. Prohibited Uses</Text>
                    <Text style={styles.legalText}>
                        You may not use the service for any illegal purpose, to harass others, to post harmful content, or to violate any applicable laws or regulations.
                    </Text>

                    <Text style={styles.legalHeading}>5. Termination</Text>
                    <Text style={styles.legalText}>
                        We may terminate or suspend your account at any time without prior notice for conduct that we believe violates these Terms or is harmful to other users.
                    </Text>

                    <View style={styles.legalBottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );

    // Privacy Policy Modal
    const PrivacyPolicyModal = () => (
        <Modal
            visible={showPrivacyPolicy}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPrivacyPolicy(false)}
        >
            <View style={styles.fullModalContainer}>
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    style={styles.fullModalHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)} style={styles.modalBackButton}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.fullModalTitle}>Privacy Policy</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    <Text style={styles.legalTitle}>Privacy Policy</Text>
                    <Text style={styles.legalDate}>Last updated: January 2025</Text>

                    <Text style={styles.legalHeading}>1. Information We Collect</Text>
                    <Text style={styles.legalText}>
                        We collect information you provide directly, such as your name, email, profile information, and content you post. We also collect usage data automatically.
                    </Text>

                    <Text style={styles.legalHeading}>2. How We Use Your Information</Text>
                    <Text style={styles.legalText}>
                        We use your information to provide and improve our services, communicate with you, and ensure the safety of our platform.
                    </Text>

                    <Text style={styles.legalHeading}>3. Information Sharing</Text>
                    <Text style={styles.legalText}>
                        We do not sell your personal information. We may share information with service providers, for legal reasons, or with your consent.
                    </Text>

                    <Text style={styles.legalHeading}>4. Data Security</Text>
                    <Text style={styles.legalText}>
                        We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or destruction.
                    </Text>

                    <Text style={styles.legalHeading}>5. Your Rights</Text>
                    <Text style={styles.legalText}>
                        You have the right to access, update, or delete your personal information. You can manage your privacy settings within the app.
                    </Text>

                    <View style={styles.legalBottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );

    // About Modal
    const AboutModal = () => (
        <Modal
            visible={showAbout}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAbout(false)}
        >
            <View style={styles.fullModalContainer}>
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    style={styles.fullModalHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <TouchableOpacity onPress={() => setShowAbout(false)} style={styles.modalBackButton}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.fullModalTitle}>About</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    <View style={styles.aboutLogoContainer}>
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            style={styles.aboutLogo}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.aboutLogoText}>S</Text>
                        </LinearGradient>
                        <Text style={styles.aboutAppName}>STYLR</Text>
                        <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                    </View>

                    <View style={styles.aboutSection}>
                        <Text style={styles.aboutHeading}>About STYLR</Text>
                        <Text style={styles.aboutText}>
                            STYLR is a fashion-forward social platform where style enthusiasts discover, share, and connect over their love of fashion. Swipe through curated looks, follow your favorite creators, and build your own style portfolio.
                        </Text>
                    </View>

                    <View style={styles.aboutSection}>
                        <Text style={styles.aboutHeading}>Our Mission</Text>
                        <Text style={styles.aboutText}>
                            To democratize fashion inspiration and help everyone express their unique style with confidence.
                        </Text>
                    </View>

                    <View style={styles.aboutSection}>
                        <Text style={styles.aboutHeading}>Contact Us</Text>
                        <Text style={styles.aboutText}>
                            Email: support@stylr.app{'\n'}
                            Website: www.stylr.app
                        </Text>
                    </View>

                    <Text style={styles.copyright}>© 2025 STYLR. All rights reserved.</Text>

                    <View style={styles.legalBottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );

    // Blocked Users Modal
    const BlockedUsersModal = () => (
        <Modal
            visible={showBlockedUsers}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowBlockedUsers(false)}
        >
            <View style={styles.fullModalContainer}>
                <LinearGradient
                    colors={['#FF5A5F', '#CE494D']}
                    style={styles.fullModalHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <TouchableOpacity onPress={() => setShowBlockedUsers(false)} style={styles.modalBackButton}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.fullModalTitle}>Blocked Accounts</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
                <ScrollView style={styles.fullModalContent}>
                    {blockedUsers.length === 0 ? (
                        <View style={styles.emptyBlockedContainer}>
                            <UserX size={60} color="#ccc" strokeWidth={1.5} />
                            <Text style={styles.emptyBlockedTitle}>No Blocked Accounts</Text>
                            <Text style={styles.emptyBlockedText}>
                                When you block someone, they'll appear here.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.blockedCount}>
                                {blockedUsers.length} blocked {blockedUsers.length === 1 ? 'account' : 'accounts'}
                            </Text>
                            {blockedUsers.map((blockedUser) => (
                                <View key={blockedUser.id} style={styles.blockedUserItem}>
                                    <LinearGradient
                                        colors={['#FF5A5F', '#CE494D']}
                                        style={styles.blockedUserAvatar}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.blockedUserAvatarText}>
                                            {blockedUser.username.charAt(0).toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                    <View style={styles.blockedUserInfo}>
                                        <Text style={styles.blockedUserName}>{blockedUser.username}</Text>
                                        <Text style={styles.blockedUserHandle}>@{blockedUser.username.toLowerCase()}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.unblockButton}
                                        onPress={() => {
                                            if (onUnblockUser) {
                                                onUnblockUser(blockedUser.id);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.unblockButtonText}>Unblock</Text>
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

            {/* Modals */}
            <ChangePasswordModal />
            <LogoutConfirmModal />
            <DeleteAccountModal />
            <TermsModal />
            <PrivacyPolicyModal />
            <AboutModal />
            <BlockedUsersModal />

            {/* Header */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Account Section */}
                <SectionHeader title="Account" icon={User} />
                <View style={styles.sectionContainer}>
                    <SettingItem
                        icon={Lock}
                        title="Change Password"
                        subtitle="Update your password"
                        onPress={() => setShowChangePassword(true)}
                    />
                    <SettingItem
                        icon={LogOut}
                        title="Log Out"
                        subtitle="Sign out of your account"
                        onPress={() => setShowLogoutConfirm(true)}
                    />
                    <SettingItem
                        icon={Trash2}
                        title="Delete Account"
                        subtitle="Permanently delete your account"
                        onPress={() => setShowDeleteAccount(true)}
                        danger
                    />
                </View>

                {/* Privacy Section */}
                <SectionHeader title="Privacy" icon={Shield} />
                <View style={styles.sectionContainer}>
                    <ToggleItem
                        icon={Eye}
                        title="Public Profile"
                        subtitle={isProfilePublic ? "Everyone can see your profile" : "Only followers can see your profile"}
                        value={isProfilePublic}
                        onValueChange={setIsProfilePublic}
                    />
                    <SettingItem
                        icon={UserX}
                        title="Blocked Accounts"
                        subtitle={`${blockedUsers.length} blocked ${blockedUsers.length === 1 ? 'account' : 'accounts'}`}
                        onPress={() => setShowBlockedUsers(true)}
                    />
                </View>

                {/* Notifications Section */}
                <SectionHeader title="Notifications" icon={Bell} />
                <View style={styles.sectionContainer}>
                    <ToggleItem
                        icon={Bell}
                        title="Push Notifications"
                        subtitle={notificationsEnabled ? "Notifications are enabled" : "Notifications are disabled"}
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                </View>

                {/* App Info Section */}
                <SectionHeader title="App Info" icon={Info} />
                <View style={styles.sectionContainer}>
                    <SettingItem
                        icon={FileText}
                        title="Terms of Service"
                        subtitle="Read our terms"
                        onPress={() => setShowTerms(true)}
                    />
                    <SettingItem
                        icon={Shield}
                        title="Privacy Policy"
                        subtitle="How we handle your data"
                        onPress={() => setShowPrivacyPolicy(true)}
                    />
                    <SettingItem
                        icon={Info}
                        title="About"
                        subtitle="App version and info"
                        onPress={() => setShowAbout(true)}
                    />
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
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
        paddingVertical: 15,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 10,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF5A5F',
        marginLeft: 10,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingIconDanger: {
        backgroundColor: '#fff0f0',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    settingTitleDanger: {
        color: '#FF5A5F',
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    bottomPadding: {
        height: 40,
    },
    // Modal styles
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
        maxWidth: 360,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff0f0',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 15,
    },
    dangerIcon: {
        backgroundColor: '#fff0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginRight: 12,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    confirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    // Full screen modal styles
    fullModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    fullModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    modalBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    fullModalContent: {
        flex: 1,
        padding: 20,
    },
    legalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    legalDate: {
        fontSize: 14,
        color: '#888',
        marginBottom: 25,
    },
    legalHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    legalText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
    },
    legalBottomPadding: {
        height: 40,
    },
    // About styles
    aboutLogoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    aboutLogo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    aboutLogoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    aboutAppName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 3,
    },
    aboutVersion: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    aboutSection: {
        marginBottom: 25,
    },
    aboutHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    aboutText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
    },
    copyright: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    // Blocked users styles
    emptyBlockedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyBlockedTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptyBlockedText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    blockedCount: {
        fontSize: 14,
        color: '#888',
        marginBottom: 15,
    },
    blockedUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    blockedUserAvatar: {
        width: 45,
        height: 45,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    blockedUserAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    blockedUserInfo: {
        flex: 1,
    },
    blockedUserName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    blockedUserHandle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    unblockButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF5A5F',
    },
    unblockButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF5A5F',
    },
});