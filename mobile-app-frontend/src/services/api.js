// src/services/api.js
// STYLR API Service - Vollständig basierend auf Laravel Backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Base URL - Live Server
const API_URL = 'https://stylr-api-qnpwmnzl.ams1.preview.ploi.it/api/v1';

// Für lokale Entwicklung:
// const API_URL = 'http://localhost:8000/api/v1';  // Web
// const API_URL = 'http://10.0.2.2:8000/api/v1';   // Android Emulator
// const API_URL = 'http://192.168.x.x:8000/api/v1'; // Physical Device

let authToken = null;

// Device name für Token
const getDeviceName = () => {
    return `${Platform.OS}-${Platform.Version || 'unknown'}`;
};

// Base API Request
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;

    if (!authToken) {
        authToken = await AsyncStorage.getItem('authToken');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || 'Ein Fehler ist aufgetreten',
                errors: data.errors || {},
                data: data.data || null
            };
        }
        return data;
    } catch (error) {
        if (error.status) throw error;
        throw { status: 0, message: 'Netzwerkfehler - Bitte Verbindung prüfen', errors: {} };
    }
};

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {
    /**
     * Registrierung
     * Required: name, email, password, password_confirmation, device_name
     * Optional: account_type (public/private)
     */
    register: async (name, email, password, password_confirmation, account_type = 'public') => {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name,
                email,
                password,
                password_confirmation,
                device_name: getDeviceName(),
                account_type
            }),
        });

        if (response.data?.token) {
            authToken = response.data.token;
            await AsyncStorage.setItem('authToken', response.data.token);
        }
        return response;
    },

    /**
     * Login
     * Required: email, password, device_name
     * Optional: two_factor_code (6 digits)
     */
    login: async (email, password, two_factor_code = null) => {
        const body = {
            email,
            password,
            device_name: getDeviceName(),
        };

        if (two_factor_code) {
            body.two_factor_code = two_factor_code;
        }

        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        if (response.data?.token) {
            authToken = response.data.token;
            await AsyncStorage.setItem('authToken', response.data.token);
        }
        return response;
    },

    /**
     * Logout - Aktuellen Token löschen
     */
    logout: async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
            authToken = null;
            await AsyncStorage.removeItem('authToken');
        }
    },

    /**
     * Logout All - Alle Tokens löschen
     */
    logoutAll: async () => {
        try {
            await apiRequest('/auth/logout-all', { method: 'POST' });
        } finally {
            authToken = null;
            await AsyncStorage.removeItem('authToken');
        }
    },

    /**
     * Aktueller User
     */
    getUser: async () => apiRequest('/auth/user'),

    /**
     * Token erneuern
     */
    refresh: async () => {
        const response = await apiRequest('/auth/refresh', { method: 'POST' });
        if (response.data?.token) {
            authToken = response.data.token;
            await AsyncStorage.setItem('authToken', response.data.token);
        }
        return response;
    },

    /**
     * Passwort vergessen - Reset Link senden
     */
    forgotPassword: async (email) => apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),

    /**
     * Passwort zurücksetzen
     */
    resetPassword: async (token, email, password, password_confirmation) => apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, email, password, password_confirmation }),
    }),

    /**
     * Email Verifizierung erneut senden
     */
    resendVerification: async () => apiRequest('/auth/email/resend', { method: 'POST' }),

    /**
     * Check ob eingeloggt
     */
    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('authToken');
        return !!token;
    },
};

// ============================================
// TWO FACTOR SERVICE
// ============================================
export const twoFactorService = {
    /**
     * 2FA aktivieren
     * Required: password
     */
    enable: async (password) => apiRequest('/auth/two-factor/enable', {
        method: 'POST',
        body: JSON.stringify({ password }),
    }),

    /**
     * QR Code abrufen
     */
    getQR: async () => apiRequest('/auth/two-factor/qr'),

    /**
     * 2FA bestätigen
     * Required: code (6 digits)
     */
    confirm: async (code) => apiRequest('/auth/two-factor/confirm', {
        method: 'POST',
        body: JSON.stringify({ code }),
    }),

    /**
     * 2FA deaktivieren
     * Required: password
     */
    disable: async (password) => apiRequest('/auth/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify({ password }),
    }),
};

// ============================================
// USER SERVICE
// ============================================
export const userService = {
    /**
     * Eigenes Profil anzeigen
     */
    getProfile: async () => apiRequest('/user'),

    /**
     * Profil aktualisieren
     * Optional: name, email, account_type (public/private)
     */
    updateProfile: async (data) => apiRequest('/user', {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    /**
     * Passwort ändern
     * Required: current_password, password, password_confirmation
     * Optional: revoke_other_tokens (boolean)
     */
    updatePassword: async (current_password, password, password_confirmation, revoke_other_tokens = false) =>
        apiRequest('/user/password', {
            method: 'PATCH',
            body: JSON.stringify({ current_password, password, password_confirmation, revoke_other_tokens }),
        }),

    /**
     * Account löschen
     * Required: password
     */
    deleteAccount: async (password) => {
        const response = await apiRequest('/user', {
            method: 'DELETE',
            body: JSON.stringify({ password }),
        });
        authToken = null;
        await AsyncStorage.removeItem('authToken');
        return response;
    },

    /**
     * Anderen User anzeigen (mit Follower Stats)
     */
    getUser: async (userId) => apiRequest(`/users/${userId}`),

    /**
     * User suchen
     * Required: search (min 2, max 50 chars)
     */
    searchUsers: async (query) => apiRequest(`/search/users?search=${encodeURIComponent(query)}`),
};

// ============================================
// FOLLOW SERVICE
// ============================================
export const followService = {
    /**
     * User folgen (oder Anfrage senden bei privaten Accounts)
     */
    follow: async (userId) => apiRequest(`/users/${userId}/follow`, { method: 'POST' }),

    /**
     * Entfolgen oder Anfrage zurückziehen
     */
    unfollow: async (userId) => apiRequest(`/users/${userId}/follow`, { method: 'DELETE' }),

    /**
     * Followers eines Users abrufen
     */
    getFollowers: async (userId, page = 1) => apiRequest(`/users/${userId}/followers?page=${page}`),

    /**
     * Following eines Users abrufen
     */
    getFollowing: async (userId, page = 1) => apiRequest(`/users/${userId}/following?page=${page}`),

    /**
     * Follower entfernen (von eigenem Profil)
     */
    removeFollower: async (userId) => apiRequest(`/users/${userId}/remove-follower`, { method: 'DELETE' }),

    /**
     * Eingehende Follow-Anfragen (für private Accounts)
     */
    getRequests: async (page = 1) => apiRequest(`/follow-requests?page=${page}`),

    /**
     * Follow-Anfrage annehmen
     */
    acceptRequest: async (requestId) => apiRequest(`/follow-requests/${requestId}/accept`, { method: 'POST' }),

    /**
     * Follow-Anfrage ablehnen
     */
    declineRequest: async (requestId) => apiRequest(`/follow-requests/${requestId}/decline`, { method: 'POST' }),
};

// ============================================
// BLOCK SERVICE
// ============================================
export const blockService = {
    /**
     * Liste blockierter User
     */
    getBlocked: async (page = 1) => apiRequest(`/blocks?page=${page}`),

    /**
     * User blockieren
     */
    block: async (userId) => apiRequest(`/users/${userId}/block`, { method: 'POST' }),

    /**
     * User entblockieren
     */
    unblock: async (userId) => apiRequest(`/users/${userId}/block`, { method: 'DELETE' }),
};

// ============================================
// POST SERVICE
// ============================================
export const postService = {
    /**
     * Alle Posts (paginiert)
     */
    getPosts: async (page = 1) => apiRequest(`/posts?page=${page}`),

    /**
     * For You Feed - Personalisiert
     * Optional: limit (1-20), offset
     */
    getForYou: async (limit = 5, offset = 0) =>
        apiRequest(`/posts/for-you?limit=${limit}&offset=${offset}`),

    /**
     * Following Feed - Posts von gefolgten Usern
     */
    getFollowing: async (page = 1) => apiRequest(`/posts/following?page=${page}`),

    /**
     * Friends Feed - Posts von gegenseitigen Follows
     */
    getFriends: async (page = 1) => apiRequest(`/posts/friends?page=${page}`),

    /**
     * Posts eines Users
     */
    getUserPosts: async (userId, page = 1) => apiRequest(`/posts/user/${userId}?page=${page}`),

    /**
     * Einzelnen Post anzeigen
     */
    getPost: async (postId) => apiRequest(`/posts/${postId}`),

    /**
     * Neuen Post erstellen (nur Text, ohne Bild)
     * Required: description (max 1000)
     */
    create: async (description) => apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({ description }),
    }),

    /**
     * Post mit Bild erstellen (FormData)
     * Wenn dein Backend File Upload unterstützt
     */
    createWithImage: async (formData) => {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            throw { status: response.status, message: data.message, errors: data.errors };
        }
        return data;
    },

    /**
     * Post aktualisieren
     * Optional: description, image_url
     */
    update: async (postId, data) => apiRequest(`/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    /**
     * Post löschen
     */
    delete: async (postId) => apiRequest(`/posts/${postId}`, { method: 'DELETE' }),

    /**
     * Like/Dislike setzen
     * Required: is_like (true = like, false = dislike)
     */
    react: async (postId, is_like = true) => apiRequest(`/posts/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ is_like }),
    }),

    /**
     * Like (Shortcut)
     */
    like: async (postId) => apiRequest(`/posts/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ is_like: true }),
    }),

    /**
     * Reaction entfernen
     */
    unlike: async (postId) => apiRequest(`/posts/${postId}/like`, { method: 'DELETE' }),
};

// ============================================
// COMMENT SERVICE
// ============================================
export const commentService = {
    /**
     * Comments eines Posts abrufen (mit Replies)
     */
    getComments: async (postId, page = 1) => apiRequest(`/posts/${postId}/comments?page=${page}`),

    /**
     * Comment erstellen
     * Required: body (max 500)
     * Optional: parent_id (für Replies)
     */
    create: async (postId, body, parent_id = null) => apiRequest(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body, ...(parent_id && { parent_id }) }),
    }),

    /**
     * Comment löschen
     */
    delete: async (commentId) => apiRequest(`/comments/${commentId}`, { method: 'DELETE' }),
};

// ============================================
// REPORT SERVICE
// ============================================
export const reportService = {
    /**
     * Report-Kategorien abrufen
     */
    getCategories: async () => apiRequest('/reports/categories'),

    /**
     * User/Content melden
     * Required: category (slug), content_type (post/comment/message/profile), content_id
     * Optional: reason (max 500)
     */
    report: async (userId, category, content_type, content_id, reason = null) =>
        apiRequest(`/users/${userId}/report`, {
            method: 'POST',
            body: JSON.stringify({ category, content_type, content_id, reason }),
        }),

    /**
     * Eigene Warnings abrufen
     */
    getMyWarnings: async () => apiRequest('/user/warnings'),

    /**
     * Eigenen Moderations-Status abrufen
     */
    getMyStatus: async () => apiRequest('/user/moderation-status'),
};

// ============================================
// ADMIN/MODERATION SERVICE (falls Admin)
// ============================================
export const moderationService = {
    /**
     * Alle offenen Reports
     */
    getReports: async (status = 'pending', page = 1) =>
        apiRequest(`/admin/moderation/reports?status=${status}&page=${page}`),

    /**
     * Report anzeigen
     */
    getReport: async (reportId) => apiRequest(`/admin/moderation/reports/${reportId}`),

    /**
     * Report als gelöst markieren
     */
    resolveReport: async (reportId, admin_note = null) =>
        apiRequest(`/admin/moderation/reports/${reportId}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ admin_note }),
        }),

    /**
     * Report ablehnen
     */
    dismissReport: async (reportId) =>
        apiRequest(`/admin/moderation/reports/${reportId}/dismiss`, { method: 'POST' }),

    /**
     * User bannen
     * Required: reason
     * Optional: hours (für temporären Ban)
     */
    banUser: async (userId, reason, hours = null) =>
        apiRequest(`/admin/moderation/users/${userId}/ban`, {
            method: 'POST',
            body: JSON.stringify({ reason, hours }),
        }),

    /**
     * User entbannen
     */
    unbanUser: async (userId, reason = null) =>
        apiRequest(`/admin/moderation/users/${userId}/unban`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),
};

// Default Export
export default {
    auth: authService,
    twoFactor: twoFactorService,
    user: userService,
    follow: followService,
    block: blockService,
    post: postService,
    comment: commentService,
    report: reportService,
    moderation: moderationService,
};