import { defineStore } from 'pinia';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,  // Holds the logged-in user data
    loading: true, // Tracks if auth state is being checked
  }),

  actions: {
    setUser(userData) {
      this.user = userData;
      this.loading = false;
    },

    clearUser() {
      this.user = null;
      this.loading = false;
    },

    async logout() {
      const auth = getAuth();
      await signOut(auth);
      this.clearUser();
    },

    initAuth() {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
          });
        } else {
          this.clearUser();
        }
      });
    }
  },
});
