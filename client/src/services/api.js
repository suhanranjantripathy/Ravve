// RAAVE Frontend API Client
const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const currentUserId = localStorage.getItem('raave_user_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(currentUserId ? { 'x-user-id': currentUserId } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.error || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  // Handle CSV/text responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.text();
  }

  return response.json();
}

export const api = {
  // Auth & Profiles
  getCurrentUser: () => request('/auth/me'),
  checkUsername: (username) => request(`/auth/check-username?username=${encodeURIComponent(username)}`),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  signup: (userData) => request('/auth/signup', { method: 'POST', body: userData }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  getProfile: (username) => request(`/profiles/${username}`),
  updateProfile: (data) => request('/profiles', { method: 'PUT', body: data }),

  // Books & Discovery
  searchBooks: (q, filter = 'all', sort = 'popularity', minRating = 0) =>
    request(`/books/search?q=${encodeURIComponent(q)}&filter=${filter}&sort=${sort}&minRating=${minRating}`),
  getTrendingBooks: () => request('/books/trending'),
  getBooksByGenre: (genre) => request(`/books/genre/${encodeURIComponent(genre)}`),
  getGenres: () => request('/books/genres'),
  getBookDetails: (id) => request(`/books/${id}`),
  getRecommendations: () => request('/books/recommendations'),
  compareBooks: (book1, book2) => request(`/books/compare?book1=${book1}&book2=${book2}`),

  // Shelves & Reading Tracker
  getUserBooks: (shelf = 'all', sort = 'updated_at', order = 'DESC', customShelfId = null, userId = null) => {
    let url = `/user-books?shelf=${shelf}&sort=${sort}&order=${order}`;
    if (customShelfId) url += `&customShelfId=${customShelfId}`;
    if (userId) url += `&userId=${userId}`;
    return request(url);
  },
  addBookToShelf: (book_id, shelf_type, custom_shelf_id = null) =>
    request('/user-books', { method: 'POST', body: { book_id, shelf_type, custom_shelf_id } }),
  updateReadingProgress: (bookId, progressData) =>
    request(`/user-books/${bookId}/progress`, { method: 'PUT', body: progressData }),
  removeBookFromShelf: (bookId) =>
    request(`/user-books/${bookId}`, { method: 'DELETE' }),
  exportCsvUrl: () => `${API_BASE}/user-books/export/csv`,
  importCsv: (books) => request('/user-books/import/csv', { method: 'POST', body: { books } }),

  // Custom Shelves
  getShelves: (userId = null) => request(`/shelves${userId ? `?userId=${userId}` : ''}`),
  createShelf: (shelfData) => request('/shelves', { method: 'POST', body: shelfData }),
  deleteShelf: (id) => request(`/shelves/${id}`, { method: 'DELETE' }),

  // Reviews & Comments
  getBookReviews: (bookId, sort = 'helpful') => request(`/reviews/book/${bookId}?sort=${sort}`),
  saveReview: (reviewData) => request('/reviews', { method: 'POST', body: reviewData }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
  likeReview: (id) => request(`/reviews/${id}/like`, { method: 'POST' }),
  addComment: (reviewId, content, parent_comment_id = null) =>
    request(`/reviews/${reviewId}/comment`, { method: 'POST', body: { content, parent_comment_id } }),

  // Social & Community
  toggleFollow: (targetUserId) => request(`/social/follow/${targetUserId}`, { method: 'POST' }),
  followByUsername: (username) => request('/social/follow-by-username', { method: 'POST', body: { username } }),
  unfollowByUsername: (username) => request('/social/unfollow-by-username', { method: 'POST', body: { username } }),
  searchUserByUsername: (username) => request(`/social/user-by-username/${encodeURIComponent(username)}`),
  getMyFriends: () => request('/social/my-friends'),
  getCommunityFeed: (filter = 'all') => request(`/social/feed?filter=${filter}`),
  likeActivity: (id) => request(`/social/activity/${id}/like`, { method: 'POST' }),
  postActivity: (content, book_id = null) => request('/social/post', { method: 'POST', body: { content, book_id } }),
  getSuggestedReaders: () => request('/social/suggestions'),

  // Reading Goals & Challenges
  getReadingGoal: (userId = null) => request(`/goals${userId ? `?userId=${userId}` : ''}`),
  updateReadingTarget: (target_books) => request('/goals/target', { method: 'PUT', body: { target_books } }),

  // Statistics
  getReadingStats: (userId = null) => request(`/stats${userId ? `?userId=${userId}` : ''}`),

  // Journal & Quotes
  getJournalEntries: (bookId = null) => request(`/journal${bookId ? `?bookId=${bookId}` : ''}`),
  getFavoriteQuotes: () => request('/journal/quotes'),
  createJournalEntry: (entry) => request('/journal', { method: 'POST', body: entry }),
  deleteJournalEntry: (id) => request(`/journal/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'PUT' })
};
