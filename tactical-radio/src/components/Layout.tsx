import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface LayoutProps {
    children: ReactNode;
    isOn: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isOn }) => {
    return (
        <div className="min-h-screen bg-black text-tactical-text font-mono overflow-hidden relative selection:bg-tactical-highlight selection:text-black">
            {/* CRT Effects Layer */}
            <div className="fixed inset-0 pointer-events-none z-50">
                <div className="absolute inset-0 crt-overlay opacity-50"></div>
                <div className="absolute inset-0 vignette"></div>
                {isOn && (
                    <div className="absolute inset-0 bg-tactical-highlight/5 animate-pulse-slow pointer-events-none"></div>
                )}
            </div>

            {/* Main Content */}
            <div className={clsx(
                "h-screen w-full transition-all duration-1000 flex flex-col",
                isOn ? "opacity-100 scale-100 blur-none" : "opacity-50 scale-100 blur-[1px]"
            )}>
                {children}

                {/* Footer Status Bar */}
                <div className="h-6 border-t border-tactical-dim bg-black/90 flex items-center justify-between px-4 text-[10px] text-tactical-dim tracking-widest z-10 select-none">
                    <div className="flex gap-6">
                        <span className="animate-pulse">● LIVE FEED</span>
                        <span>SECURE_CONN: ESTABLISHED</span>
                        <span>ENCRYPTION: AES-256-GCM</span>
                    </div>
                    <div className="flex gap-6">
                        <span>UPTIME: {isOn ? '00:42:15' : '00:00:00'}</span>
                        <span>MEM: 64TB</span>
                        <span>V.2.0.4</span>
                    </div>
                </div>
            </div>

            {/* Power Off Overlay */}
            {!isOn && (
                <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="text-center space-y-4">
                        <div className="text-6xl font-bold text-tactical-dim opacity-40">SYSTEM LOCKED</div>
                        <div className="text-xl text-tactical-highlight animate-pulse">CLICK POWER TO INITIALIZE</div>
                    </div>
                </div>
            )}
        </div>
    );
};
