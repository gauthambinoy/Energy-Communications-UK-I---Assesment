// ============================================================
// Confirm Modal Component
// A modal dialog that asks the user to confirm before proceeding
// with an action that cannot be easily undone (e.g. sending an email).
//
// Clicking the backdrop or Cancel calls onCancel.
// Clicking the confirm button calls onConfirm.
//
// Usage:
//   <ConfirmModal
//     isOpen={showConfirm}
//     title="Send email?"
//     message={`Send campaign email to ${email}?`}
//     confirmLabel="Send"
//     onConfirm={handleSend}
//     onCancel={() => setShowConfirm(false)}
//   />
// ============================================================

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    // Label for the confirm button — defaults to "Confirm"
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    onConfirm,
    onCancel,
}: Props) {
    // Return nothing when closed so we don't add unnecessary DOM nodes
    if (!isOpen) return null;

    return (
        // Full-screen container — sits above everything else (z-50)
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center"
        >
            {/* Semi-transparent backdrop — clicking it dismisses the modal */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal panel — sits on top of the backdrop */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h2
                    id="confirm-modal-title"
                    className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2"
                >
                    {title}
                </h2>

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    {message}
                </p>

                {/* Action buttons — Cancel on left, Confirm on right */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm border rounded-lg text-gray-600 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
