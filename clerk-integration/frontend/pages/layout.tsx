'use client'

import './globals.css'
import { Source_Sans_3 } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import { SidebarProvider } from '@/components/Sidebar/SidebarProvider'
import MainContent from '@/components/MainContent'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import { Toaster, toast } from 'sonner'
import "sonner/dist/styles.css"
import { useState, useEffect, Suspense, use } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RecordingStateProvider } from '@/contexts/RecordingStateContext'
import { OllamaDownloadProvider } from '@/contexts/OllamaDownloadContext'
import { TranscriptProvider } from '@/contexts/TranscriptContext'
import { ConfigProvider } from '@/contexts/ConfigContext'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { OnboardingFlow } from '@/components/onboarding'
import { DownloadProgressToastProvider } from '@/components/shared/DownloadProgressToast'
import { UpdateCheckProvider } from '@/components/UpdateCheckProvider'
import { RecordingPostProcessingProvider } from '@/contexts/RecordingPostProcessingProvider'
import { usePathname } from 'next/navigation'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import type { Clerk } from '@clerk/clerk-js'

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-source-sans-3',
})

// export { metadata } from './metadata'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Don't show sidebar/main layout on onboarding page
  // Note: login page is handled OUTSIDE of LayoutContent (see RootLayout)
  const isOnboardingPage = pathname === '/onboarding';

  // Check onboarding status immediately on mount (don't wait for Clerk)
  useEffect(() => {
    if (isOnboardingPage) {
      setIsCheckingOnboarding(false);
      return;
    }

    console.log('[Layout] Checking onboarding status on mount');

    // Check general onboarding status first (before user email is available)
    invoke<{ completed: boolean; current_step: number } | null>('get_onboarding_status')
      .then((status) => {
        console.log('[Layout] Onboarding status:', status);

        if (!status || !status.completed) {
          console.log('[Layout] Onboarding not completed, showing onboarding flow');
          setShowOnboarding(true);
          setOnboardingCompleted(false);
        } else {
          console.log('[Layout] Onboarding completed, will verify user when Clerk loads');
          setOnboardingCompleted(true);
        }
        setIsCheckingOnboarding(false);
      })
      .catch((error) => {
        console.error('[Layout] Failed to check onboarding status:', error);
        // Default to showing onboarding if we can't check
        setShowOnboarding(true);
        setOnboardingCompleted(false);
        setIsCheckingOnboarding(false);
      });
  }, [isOnboardingPage]);

  // Once Clerk is loaded and user is signed in, verify onboarding for THIS specific user
  useEffect(() => {
    if (!isLoaded || !isSignedIn || isOnboardingPage || !user || isCheckingOnboarding) return;

    // Get user email from Clerk
    const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      console.error('[Layout] No user email found');
      return;
    }

    console.log('[Layout] Verifying onboarding status for user:', userEmail);

    // Check if THIS user has completed onboarding
    invoke<boolean>('check_onboarding_for_user', { userEmail })
      .then((isComplete) => {
        console.log('[Layout] User-specific onboarding check result:', isComplete);
        setOnboardingCompleted(isComplete);

        if (!isComplete) {
          console.log('[Layout] Onboarding not completed for this user, showing onboarding flow');
          setShowOnboarding(true);
        } else {
          console.log('[Layout] Onboarding completed for this user, showing main app');
          setShowOnboarding(false);
        }
      })
      .catch((error) => {
        console.error('[Layout] Failed to verify user-specific onboarding:', error);
      });
  }, [isLoaded, isSignedIn, isOnboardingPage, user, isCheckingOnboarding]);

  // Disable context menu in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      document.addEventListener('contextmenu', handleContextMenu);
      return () => document.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);
  useEffect(() => {
    // Listen for tray recording toggle request
    const unlisten = listen('request-recording-toggle', () => {
      console.log('[Layout] Received request-recording-toggle from tray');

      if (showOnboarding) {
        toast.error("Please complete setup first", {
          description: "You need to finish onboarding before you can start recording."
        });
      } else {
        // If in main app, forward to useRecordingStart via window event
        console.log('[Layout] Forwarding to start-recording-from-sidebar');
        window.dispatchEvent(new CustomEvent('start-recording-from-sidebar'));
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [showOnboarding]);

  const handleOnboardingComplete = () => {
    console.log('[Layout] Onboarding completed, reloading app');
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    // Optionally reload the window to ensure all state is fresh
    window.location.reload();
  };

  // Note: Login is now handled OUTSIDE of ClerkProvider (see RootLayout)
  // This layout is for the main app window, which should only be visible after login

  // If on onboarding page, just render children without sidebar
  if (isOnboardingPage) {
    return (
      <>
        <DownloadProgressToastProvider />
        {children}
      </>
    );
  }

  // Show onboarding or main app
  if (showOnboarding) {
    return (
      <>
        <DownloadProgressToastProvider />
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </>
    );
  }

  // Main app with sidebar
  return (
    <>
      <DownloadProgressToastProvider />
      <div className="flex">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </>
  );
}


// Clean Clerk wrapper using tauri-plugin-clerk
// Simple pattern: initClerk() returns a Promise<Clerk>, use React.use() to unwrap it
function ClerkWrappedProviders({
  clerkPromise,
  children
}: {
  clerkPromise: Promise<Clerk>
  children: React.ReactNode
}) {
  // Use React 19's use() hook to unwrap the promise (works in Suspense boundary)
  const clerk = use(clerkPromise);

  return (
    <ClerkProvider
      publishableKey={clerk.publishableKey}
      Clerk={clerk}
    >
      <AnalyticsProvider>
        <RecordingStateProvider>
          <TranscriptProvider>
            <ConfigProvider>
              <OllamaDownloadProvider>
                <OnboardingProvider>
                  <UpdateCheckProvider>
                    <SidebarProvider>
                      <TooltipProvider>
                        <RecordingPostProcessingProvider>
                          <LayoutContent>{children}</LayoutContent>
                        </RecordingPostProcessingProvider>
                      </TooltipProvider>
                    </SidebarProvider>
                  </UpdateCheckProvider>
                </OnboardingProvider>
              </OllamaDownloadProvider>
            </ConfigProvider>
          </TranscriptProvider>
        </RecordingStateProvider>
      </AnalyticsProvider>
    </ClerkProvider>
  );
}

// Loading component shown while Clerk initializes
const LoadingClerk = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Initializing authentication...</p>
    </div>
  </div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize Clerk for Tauri desktop app using dynamic import (client-side only)
  // tauri-plugin-clerk handles everything through Rust backend
  const [clerkPromise, setClerkPromise] = useState<Promise<Clerk> | null>(null);

  useEffect(() => {
    console.log('[Clerk] Starting initialization...');
    console.log('[Clerk] Environment:', {
      isDev: process.env.NODE_ENV === 'development',
      isTauri: typeof window !== 'undefined' && '__TAURI__' in window,
    });

    // Dynamic import to avoid SSR issues (Next.js tries to load this on server)
    import('tauri-plugin-clerk')
      .then(mod => {
        console.log('[Clerk] Plugin module loaded successfully');
        return mod.initClerk();
      })
      .then(clerk => {
        console.log('[Clerk] Successfully initialized');
        console.log('[Clerk] Publishable key:', clerk.publishableKey);
        console.log('[Clerk] Version:', clerk.version);
        setClerkPromise(Promise.resolve(clerk));
      })
      .catch(err => {
        console.error('[Clerk] Failed to initialize:', err);
        console.error('[Clerk] Error details:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
        });

        // Show user-friendly error message
        if (typeof window !== 'undefined') {
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fee; border: 2px solid #f00; padding: 20px; border-radius: 8px; z-index: 9999; max-width: 500px;';
          errorDiv.innerHTML = `
            <h3 style="color: #c00; margin: 0 0 10px 0;">Clerk Initialization Failed</h3>
            <p style="margin: 0 0 10px 0;"><strong>Error:</strong> ${err?.message || 'Unknown error'}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Press <kbd>F12</kbd> to open DevTools and see full error details.</p>
          `;
          document.body.appendChild(errorDiv);
        }
      });
  }, []);

  // Show loading while Clerk initializes
  if (!clerkPromise) {
    return (
      <html lang="en">
        <body className={`${sourceSans3.variable} font-sans antialiased`}>
          <LoadingClerk />
        </body>
      </html>
    );
  }

  // Wrap everything in single ClerkProvider (including login page and main app)
  return (
    <html lang="en">
      <body className={`${sourceSans3.variable} font-sans antialiased`}>
        <Suspense fallback={<LoadingClerk />}>
          <ClerkWrappedProviders clerkPromise={clerkPromise}>
            {children}
          </ClerkWrappedProviders>
        </Suspense>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
