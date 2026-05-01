import { AlertCircle, RotateCw } from 'lucide-react';

interface ConnectionErrorProps {
    onRetry: () => void;
    isRetrying: boolean;
    retryCount: number;
}

export default function ConnectionError({ onRetry, isRetrying, retryCount }: ConnectionErrorProps) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-surface">
            <div className="max-w-md w-full px-6 py-12 text-center">
                {/* Error Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertCircle size={48} className="text-red-500" />
                    </div>
                </div>

                {/* Error Title */}
                <h1 className="font-headline text-3xl uppercase tracking-[2px] text-on-surface mb-4">
                    Connection Failed
                </h1>

                {/* Error Message */}
                <p className="font-body text-on-surface-variant text-sm mb-8 leading-relaxed">
                    Unable to connect to the backend server. Please ensure the backend is running and try again.
                </p>

                {/* Connection Details */}
                <div className="bg-surface-container border border-outline p-4 rounded-lg mb-8">
                    <p className="text-[11px] uppercase tracking-[1px] text-on-surface-variant font-bold mb-2">
                        Backend URL
                    </p>
                    <p className="font-mono text-xs text-on-surface break-all">
                        {import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}
                    </p>
                </div>

                {/* Retry Info */}
                {isRetrying && (
                    <div className="mb-6 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <RotateCw size={16} className="text-primary animate-spin" />
                            <span className="text-sm font-body text-primary uppercase tracking-[1px]">
                                Retrying...
                            </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                            Attempt #{retryCount} • Will retry every 5 seconds
                        </p>
                    </div>
                )}

                {/* Manual Retry Button */}
                <button
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold text-sm uppercase tracking-[2px] px-6 py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-primary"
                >
                    <RotateCw size={16} />
                    Retry Now
                </button>

                {/* Troubleshooting Tips */}
                <div className="mt-10 text-left">
                    <p className="text-[11px] uppercase tracking-[1px] text-on-surface-variant font-bold mb-3">
                        Troubleshooting
                    </p>
                    <ul className="space-y-2 text-[11px] text-on-surface-variant leading-relaxed">
                        <li className="flex gap-2">
                            <span className="text-primary mt-0.5">→</span>
                            <span>Start the backend server: <code className="font-mono bg-surface-container px-2 py-1 rounded">npm start</code></span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary mt-0.5">→</span>
                            <span>Check if backend is running on port 5000</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary mt-0.5">→</span>
                            <span>Verify <code className="font-mono bg-surface-container px-2 py-1 rounded">VITE_BACKEND_URL</code> in .env file</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary mt-0.5">→</span>
                            <span>Reload the page (F5 or Cmd+R)</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
