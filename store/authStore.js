// store/authStore.js
"use client";
import { create } from "zustand";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  loading: true,

  init: async () => {
    // Initialize Firebase Auth state listener
    onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user, session: { user }, loading: false });
      } else {
        set({ user: null, session: null, loading: false });
      }
    });
  },

  signInWithPhone: async (phoneNumber, password) => {
    set({ loading: true });
    try {
      // Create a new RecaptchaVerifier instance
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });

      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      
      // Store the confirmation result for later use
      set({ confirmationResult });
      
      return { data: { success: true } };
    } catch (error) {
      console.error("Phone sign in error:", error);
      set({ loading: false });
      throw error;
    }
  },

  signUp: async (formData) => {
    set({ loading: true });
    try {
      // Firebase signup is handled in the SignUpForm component
      set({ loading: false });
      return { error: null };
    } catch (error) {
      console.error("Auth signup error:", error);
      set({ loading: false });
      return { error };
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, session: null, loading: false });
    } catch (error) {
      console.error("signOut error:", error);
      set({ loading: false });
    }
  }
}));
