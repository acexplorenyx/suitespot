import React from 'react';
import { signInWithPopup, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/firebase';

function GoogleLoginButton({ onSuccess, onError, rememberMe = false }) {
  const handleGoogleLogin = async () => {
    try {
      // Set persistence based on rememberMe
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Google login successful:", user);
      if (onSuccess) onSuccess(user);
    } catch (error) {
      console.error("Google login error:", error);
      if (onError) onError(error);
    }
  };

  return (
    <button 
      type="button" 
      className="google-login-btn"
      onClick={handleGoogleLogin}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 48 48"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.15 0 5.97 1.09 8.21 3.22l6.11-6.11C34.64 3.03 29.67 1 24 1 14.82 1 7.06 6.44 3.68 14.09l7.24 5.63C12.33 13.83 17.7 9.5 24 9.5z"
        />
        <path
          fill="#34A853"
          d="M46.14 24.5c0-1.64-.15-3.19-.42-4.68H24v9.16h12.4c-.55 2.98-2.21 5.5-4.7 7.2l7.17 5.55C43.92 38.24 46.14 31.89 46.14 24.5z"
        />
        <path
          fill="#FBBC05"
          d="M10.92 28.52c-.49-1.46-.77-3.02-.77-4.64s.28-3.18.77-4.64V14.1H3.68A22.88 22.88 0 0 0 1 23.88c0 3.63.86 7.07 2.68 9.78l7.24-5.14z"
        />
        <path
          fill="#4285F4"
          d="M24 47c6.48 0 11.91-2.14 15.88-5.82l-7.17-5.55c-2.01 1.35-4.58 2.16-8.71 2.16-6.3 0-11.67-4.33-13.08-10.22l-7.24 5.14C7.06 41.56 14.82 47 24 47z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

export default GoogleLoginButton;