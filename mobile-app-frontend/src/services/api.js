// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this based on your testing environment
const getBaseUrl = () => {
    // For web browser
    // return 'http://localhost:8000/api/v1';

    // For Android Emulator
    // return 'http://10.0.2.2:8000/api/v1';

    // For iOS Simulator
    return 'http://localhost:8000/api/v1';

    // For physical device - use your computer's IP
    // return 'http://192.168.1.XXX:8000/api/v1';
};

const API_URL = getBaseUrl();

// Store token
let authToken = null;

// API helper function
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;

    // Get token from storage if not in memory
    if (!authToken) {
        authToken = await AsyncStorage.getItem('authToken');
    }

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (authToken) {
        defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || 'Something went wrong',
                errors: data.errors || {},
            };
        }

        return data;
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 0,
            message: 'Network error. Please check your connection.',
            errors: {},
        };
    }
};

// ============ AUTH SERVICES ============

export const authService = {
    // Register new user
    register: async (name, email, password, password_confirmation) => {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, password_confirmation }),
        });
        if (response.token) {
            authToken = response.token;
            await AsyncStorage.setItem('authToken', response.token);
        }
        return response;
    },

    // Login
    login: async (email, password) => {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response.token) {
            authToken = response.token;
            await AsyncStorage.setItem('authToken', response.token);
        }
        return response;
    },

    // Logout
    logout: async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
            authToken = null;
            await AsyncStorage.removeItem('authToken');
        }
    },

    // Get current user
    getUser: async () => {
        return await apiRequest('/auth/user');
    },

    // Refresh token
    refresh: async () => {
        const response = await apiRequest('/auth/refresh', { method: 'POST' });
        if (response.token) {
            authToken = response.token;
            await AsyncStorage.setItem('authToken', response.token);
        }
        return response;
    },

    // Forgot password
    forgotPassword: async (email) => {
        return await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    // Reset password
    resetPassword: async (token, email, password, password_confirmation) => {
        return await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, email, password, password_confirmation }),
        });
    },

    // Check if token exists
    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('authToken');
        return !!token;
    },

    // Set token (for app initialization)
    setToken: async (token) => {
        authToken = token;
        await AsyncStorage.setItem('authToken', token);
    },
};

// ============ USER SERVICES ============

export const userService = {
    // Get own profile
    getProfile: async () => {
        return await apiRequest('/user/profile');
    },

    // Update profile
    updateProfile: async (data) => {
        return await apiRequest('/user/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Update password
    updatePassword: async (current_password, password, password_confirmation) => {
        return await apiRequest('/user/password', {
            method: 'PATCH',
            body: JSON.stringify({ current_password, password, password_confirmation }),
        });
    },

    // Delete account
    deleteAccount: async () => {
        const response = await apiRequest('/user/account', { method: 'DELETE' });
        authToken = null;
        await AsyncStorage.removeItem('authToken');
        return response;
    },

    // Get other user's profile
    getUser: async (userId) => {
        return await apiRequest(`/users/${userId}`);
    },

    // Search users
    searchUsers: async (query) => {
        return await apiRequest(`/search/users?q=${encodeURIComponent(query)}`);
    },
};

// ============ FOLLOW SERVICES ============

export const followService = {
    // Follow a user
    follow: async (userId) => {
        return await apiRequest(`/users/${userId}/follow`, { method: 'POST' });
    },

    // Unfollow a user
    unfollow: async (userId) => {
        return await apiRequest(`/users/${userId}/follow`, { method: 'DELETE' });
    },

    // Get followers
    getFollowers: async (userId) => {
        return await apiRequest(`/users/${userId}/followers`);
    },

    // Get following
    getFollowing: async (userId) => {
        return await apiRequest(`/users/${userId}/following`);
    },

    // Remove follower
    removeFollower: async (userId) => {
        return await apiRequest(`/users/${userId}/follower`, { method: 'DELETE' });
    },

    // Get follow requests (for private accounts)
    getRequests: async () => {
        return await apiRequest('/follow-requests');
    },

    // Accept follow request
    acceptRequest: async (requestId) => {
        return await apiRequest(`/follow-requests/${requestId}/accept`, { method: 'POST' });
    },

    // Decline follow request
    declineRequest: async (requestId) => {
        return await apiRequest(`/follow-requests/${requestId}/decline`, { method: 'POST' });
    },
};

// ============ BLOCK SERVICES ============

export const blockService = {
    // Get blocked users
    getBlocked: async () => {
        return await apiRequest('/blocks');
    },

    // Block a user
    block: async (userId) => {
        return await apiRequest(`/users/${userId}/block`, { method: 'POST' });
    },

    // Unblock a user
    unblock: async (userId) => {
        return await apiRequest(`/users/${userId}/block`, { method: 'DELETE' });
    },
};

// ============ POST SERVICES ============

export const postService = {
    // Get all posts (discover)
    getPosts: async (page = 1) => {
        return await apiRequest(`/posts?page=${page}`);
    },

    // Get "For You" feed
    getForYou: async (page = 1) => {
        return await apiRequest(`/posts/for-you?page=${page}`);
    },

    // Get following feed
    getFollowing: async (page = 1) => {
        return await apiRequest(`/posts/following?page=${page}`);
    },

    // Get friends feed
    getFriends: async (page = 1) => {
        return await apiRequest(`/posts/friends?page=${page}`);
    },

    // Get user's posts
    getUserPosts: async (userId, page = 1) => {
        return await apiRequest(`/posts/user/${userId}?page=${page}`);
    },

    // Get single post
    getPost: async (postId) => {
        return await apiRequest(`/posts/${postId}`);
    },

    // Create post
    create: async (formData) => {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                // Don't set Content-Type for FormData
            },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            throw { status: response.status, message: data.message, errors: data.errors };
        }
        return data;
    },

    // Update post
    update: async (postId, data) => {
        return await apiRequest(`/posts/${postId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Delete post
    delete: async (postId) => {
        return await apiRequest(`/posts/${postId}`, { method: 'DELETE' });
    },

    // Like post
    like: async (postId) => {
        return await apiRequest(`/posts/${postId}/like`, { method: 'POST' });
    },

    // Unlike post
    unlike: async (postId) => {
        return await apiRequest(`/posts/${postId}/like`, { method: 'DELETE' });
    },
};

// ============ COMMENT SERVICES ============

export const commentService = {
    // Get comments for a post
    getComments: async (postId, page = 1) => {
        return await apiRequest(`/posts/${postId}/comments?page=${page}`);
    },

    // Create comment
    create: async (postId, body, parentId = null) => {
        const payload = { body };
        if (parentId) {
            payload.parent_id = parentId;
        }
        return await apiRequest(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // Delete comment
    delete: async (commentId) => {
        return await apiRequest(`/comments/${commentId}`, { method: 'DELETE' });
    },
};

// ============ REPORT SERVICES ============

export const reportService = {
    // Get report categories
    getCategories: async () => {
        return await apiRequest('/reports/categories');
    },

    // Report a user
    reportUser: async (userId, category, description = '') => {
        return await apiRequest(`/users/${userId}/report`, {
            method: 'POST',
            body: JSON.stringify({ category, description }),
        });
    },

    // Get my moderation status
    getMyStatus: async () => {
        return await apiRequest('/user/moderation-status');
    },

    // Get my warnings
    getMyWarnings: async () => {
        return await apiRequest('/user/warnings');
    },
};

export default {
    auth: authService,
    user: userService,
    follow: followService,
    block: blockService,
    post: postService,
    comment: commentService,
    report: reportService,
};