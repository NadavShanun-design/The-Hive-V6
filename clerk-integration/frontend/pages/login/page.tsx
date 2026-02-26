'use client';

import { useEffect } from 'react';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { invoke } from '@tauri-apps/api/core';

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Keyboard shortcut to open DevTools (Cmd+Shift+I or F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+I (Mac) or Ctrl+Shift+I (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        invoke('open_devtools', { label: 'login' })
          .then(() => console.log('[Debug] DevTools opened'))
          .catch(err => console.error('[Debug] Failed to open DevTools:', err));
      }
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        invoke('open_devtools', { label: 'login' })
          .then(() => console.log('[Debug] DevTools opened'))
          .catch(err => console.error('[Debug] Failed to open DevTools:', err));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When user successfully signs in, switch to main window
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('[Login] User signed in successfully, switching to main window');

      // Call Rust command to close login window and show main window
      invoke('handle_login_success')
        .then(() => {
          console.log('[Login] Window switch command sent successfully');
        })
        .catch((error) => {
          console.error('[Login] Failed to switch windows:', error);
        });
    }
  }, [isSignedIn, isLoaded]);

  // Show loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Clean login UI - Clerk SignIn component with proper styling
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md px-4">
        <SignIn
          forceRedirectUrl="/login"
          fallbackRedirectUrl="/login"
          signUpUrl="/login"
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
              },
              card: {
                width: '100%',
                minWidth: '320px',
                maxWidth: '400px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                borderRadius: '0.75rem',
                padding: '2rem',
                boxSizing: 'border-box',
              },
              formFieldInput: {
                width: '100%',
                minHeight: '44px',
                fontSize: '14px',
                borderRadius: '0.5rem',
                boxSizing: 'border-box',
              },
              formButtonPrimary: {
                width: '100%',
                minHeight: '44px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '0.5rem',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
