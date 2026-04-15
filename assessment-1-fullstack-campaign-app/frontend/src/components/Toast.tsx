// ============================================================
// Toast Notification Component
// A floating alert that appears in the top-right corner and
// auto-dismisses after 4 seconds.
//
// Usage:
//   const [toast, setToast] = useState<ToastPayload | null>(null);
//   <Toast toast={toast} onDismiss={() => setToast(null)} />
//
// Pass a ToastPayload object to show it, null to hide it.
// The component handles its own timer — caller just provides the data.
// ============================================================

import { useEffect } from 'react';

// Shape of the data needed to display a toast
export interface ToastPayload {
    type: 'success' | 'error';
    message: string;
    // Optional clickable link shown below the message (e.g. email preview URL)
    previewUrl?: string;
}

interface Props {
    toast: ToastPayload | null;
    onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4000;

export default function Toast({ toast, onDismiss }: Props) {
    // Start the auto-dismiss timer whenever a new toast appears.
    // Cleans up the timer if the component unmounts or the toast changes.
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    if (!toast) return null;

    const isSuccess = toast.type === 'success';

    return (
        <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className={`
                fixed top-4 right-4 z-50 flex items-start gap-3
                px-4 py-3 rounded-lg shadow-lg max-w-sm w-full
                border transition-all duration-300
                ${isSuccess
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200'
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
                }
            `}
        >
            {/* Status icon */}
            <span className="text-lg leading-tight mt-0.5 flex-shrink-0">
                {isSuccess ? '✅' : '❌'}
            </span>

            {/* Message + optional preview link */}
            <div className="flex-1 text-sm min-w-0">
                <p className="font-medium">{toast.message}</p>
                {toast.previewUrl && (
                    <a
                        href={toast.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block underline opacity-75 hover:opacity-100 transition-opacity"
                    >
                        View email preview →
                    </a>
                )}
            </div>

            {/* Dismiss button */}
            <button
                onClick={onDismiss}
                aria-label="Dismiss notification"
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity leading-none text-current"
            >
                ✕
            </button>
        </div>
    );
}
