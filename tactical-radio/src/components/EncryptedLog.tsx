import { useEffect, useState, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

interface LogEntry {
    id: number;
    text: string;
    timestamp: string;
    decrypted: boolean;
}

export const EncryptedLog: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Add random logs
    useEffect(() => {
        const interval = setInterval(() => {
            const msgs = [
                "INTERCEPTING PACKET...",
                "DECRYPTING STREAM...",
                "SIGNAL LOCK ACQUIRED",
                "HANDSHAKE COMPLETE",
                "ROUTING THROUGH PROXY...",
                "ANALYZING FREQUENCY SPECTRUM",
                "PACKET LOSS DETECTED",
                "RETRYING CONNECTION...",
                "SECURE CHANNEL ESTABLISHED"
            ];
            const msg = msgs[Math.floor(Math.random() * msgs.length)];

            const newLog: LogEntry = {
                id: Date.now(),
                text: msg,
                timestamp: new Date().toLocaleTimeString(),
                decrypted: false
            };

            setLogs(prev => [...prev.slice(-10), newLog]); // Keep last 10
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="h-full font-mono text-xs overflow-hidden flex flex-col">
            {logs.map(log => (
                <LogLine key={log.id} entry={log} />
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

const LogLine: React.FC<{ entry: LogEntry }> = ({ entry }) => {
    const [display, setDisplay] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);

    useEffect(() => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplay(
                entry.text
                    .split('')
                    .map((char, index) => {
                        if (index < iterations) return entry.text[index];
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join('')
            );

            if (iterations >= entry.text.length) {
                clearInterval(interval);
                setIsDecrypted(true);
            }
            iterations += 1 / 2; // Speed
        }, 30);

        return () => clearInterval(interval);
    }, [entry.text]);

    return (
        <div className="flex gap-2 mb-1">
            <span className="text-tactical-dim">[{entry.timestamp}]</span>
            <span className={isDecrypted ? "text-tactical-text" : "text-tactical-highlight animate-pulse"}>
                {display}
            </span>
        </div>
    );
};
