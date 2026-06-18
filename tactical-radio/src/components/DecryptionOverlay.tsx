import React, { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface DecryptionOverlayProps {
    isLocked: boolean;
    stationName: string;
    onComplete: () => void;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

export const DecryptionOverlay: React.FC<DecryptionOverlayProps> = ({ isLocked, stationName, onComplete }) => {
    const [text, setText] = useState('');
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<'SEARCHING' | 'DECRYPTING' | 'LOCKED'>('SEARCHING');

    useEffect(() => {
        if (isLocked) {
            setStage('LOCKED');
            setText(stationName);
            return;
        }

        setStage('SEARCHING');
        setProgress(0);

        // Phase 1: Searching (Random chars)
        const searchInterval = setInterval(() => {
            setText(Array(20).fill(0).map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''));
        }, 50);

        // Phase 2: Decrypting (Progress bar)
        setTimeout(() => {
            clearInterval(searchInterval);
            setStage('DECRYPTING');

            let p = 0;
            const decryptInterval = setInterval(() => {
                p += 5;
                setProgress(p);

                // Mix of random and real chars
                const revealed = Math.floor((p / 100) * stationName.length);
                const scrambled = Array(stationName.length - revealed).fill(0).map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
                setText(stationName.substring(0, revealed) + scrambled);

                if (p >= 100) {
                    clearInterval(decryptInterval);
                    setStage('LOCKED');
                    onComplete();
                }
            }, 50);
        }, 800);

        return () => clearInterval(searchInterval);
    }, [stationName, isLocked]);

    if (stage === 'LOCKED') return null;

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center font-mono">
            <div className="text-tactical-highlight text-4xl mb-4 animate-pulse">
                {stage === 'SEARCHING' ? <Lock size={48} /> : <Unlock size={48} />}
            </div>

            <div className="text-2xl text-tactical-text font-bold tracking-widest mb-8">
                {text}
            </div>

            <div className="w-64 h-2 bg-tactical-dim rounded overflow-hidden">
                <div
                    className="h-full bg-tactical-highlight transition-all duration-75"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mt-2 text-xs text-tactical-dim">
                {stage === 'SEARCHING' ? 'ACQUIRING SIGNAL...' : 'DECRYPTING STREAM...'}
            </div>
        </div>
    );
};
