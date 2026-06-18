import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";

/**
 * Signal Classification Panel
 * Displays SETI-style analysis: classification, trait scores, uncertainty
 */
export default function SignalClassificationPanel({ selectedEventId, events = [] }) {
    const [classification, setClassification] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedEventId) {
            setClassification(null);
            return;
        }

        loadClassification(selectedEventId);
    }, [selectedEventId]);

    const loadClassification = async (eventId) => {
        setLoading(true);
        try {
            // Try to get existing classification
            const res = await axios.get(`${API_BASE}/api/signals/classification/${eventId}`);
            setClassification(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                // No classification yet - run analysis
                try {
                    const res = await axios.post(`${API_BASE}/api/signals/classify/${eventId}`);
                    setClassification(res.data);
                } catch (e) {
                    console.error("Classification failed:", e);
                    setClassification(null);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    if (!selectedEventId) {
        return (
            <div className="panel">
                <div className="panel-title">🔍 SIGNAL ANALYSIS</div>
                <div style={{ padding: '20px', textAlign: 'center', color: '#607a90', fontSize: '0.85rem' }}>
                    Select a radar contact to analyze signal traits
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="panel">
                <div className="panel-title">🔍 SIGNAL ANALYSIS</div>
                <div style={{ padding: '20px', textAlign: 'center', color: '#00d4ff' }}>
                    Analyzing signal traits...
                </div>
            </div>
        );
    }

    if (!classification) {
        return (
            <div className="panel">
                <div className="panel-title">🔍 SIGNAL ANALYSIS</div>
                <div style={{ padding: '20px', textAlign: 'center', color: '#607a90', fontSize: '0.85rem' }}>
                    No classification available
                </div>
            </div>
        );
    }

    // Classification badge styling
    const getClassificationStyle = (type) => {
        const styles = {
            artificial_candidate: { bg: 'rgba(255, 215, 0, 0.2)', color: '#FFD700', border: '#FFD700' },
            known_transmitter: { bg: 'rgba(136, 136, 136, 0.2)', color: '#888888', border: '#888888' },
            unclassified: { bg: 'rgba(255, 149, 0, 0.2)', color: '#FF9500', border: '#FF9500' },
            natural: { bg: 'rgba(0, 255, 136, 0.2)', color: '#00ff88', border: '#00ff88' }
        };
        return styles[type] || styles.natural;
    };

    const style = getClassificationStyle(classification.classification);

    return (
        <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-title">
                🔍 SIGNAL ANALYSIS
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

                {/* Classification Badge */}
                <div style={{
                    padding: '12px',
                    background: style.bg,
                    border: `2px solid ${style.border}`,
                    borderRadius: '6px',
                    marginBottom: '16px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.7rem', color: '#607a90', marginBottom: '4px' }}>CLASSIFICATION</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: style.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {classification.classification.replace('_', ' ')}
                    </div>
                </div>

                {/* Confidence */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#607a90', marginBottom: '6px' }}>CONFIDENCE</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#00d4ff' }}>
                            {(classification.confidence * 100).toFixed(0)}%
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#607a90' }}>
                            ± {(((classification.confidence_bounds[1] - classification.confidence_bounds[0]) / 2) * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>

                {/* Trait Scores */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#607a90', marginBottom: '8px' }}>SIGNAL TRAITS</div>

                    {/* Narrowband */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                            <span>Narrowband</span>
                            <span style={{ color: '#00d4ff' }}>{(classification.trait_scores.narrowband * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#0a1420', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${classification.trait_scores.narrowband * 100}%`,
                                background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>

                    {/* Repetition */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                            <span>Repetition</span>
                            <span style={{ color: '#00d4ff' }}>{(classification.trait_scores.repetition * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#0a1420', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${classification.trait_scores.repetition * 100}%`,
                                background: 'linear-gradient(90deg, #ff9500, #ffdd00)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>

                    {/* Doppler Drift */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                            <span>Doppler Drift</span>
                            <span style={{ color: '#00d4ff' }}>{(classification.trait_scores.doppler_drift * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#0a1420', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${classification.trait_scores.doppler_drift * 100}%`,
                                background: 'linear-gradient(90deg, #9933ff, #ff00ff)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                </div>

                {/* Measurements */}
                {classification.measurements && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#607a90', marginBottom: '6px' }}>MEASUREMENTS</div>
                        <div style={{ fontSize: '0.75rem', color: '#e0f0ff', lineHeight: '1.6' }}>
                            {classification.measurements.bandwidth_hz && (
                                <div>BW: {classification.measurements.bandwidth_hz.toFixed(2)} Hz</div>
                            )}
                            {classification.measurements.repetition_period_s && (
                                <div>Period: {classification.measurements.repetition_period_s.toFixed(3)} s</div>
                            )}
                            {classification.measurements.doppler_drift_hz_per_s && (
                                <div>Drift: {classification.measurements.doppler_drift_hz_per_s.toFixed(4)} Hz/s</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Alternative Explanations */}
                {classification.alternative_explanations && classification.alternative_explanations.length > 0 && (
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#607a90', marginBottom: '6px' }}>ALTERNATIVE EXPLANATIONS</div>
                        <ul style={{
                            margin: 0,
                            paddingLeft: '16px',
                            fontSize: '0.72rem',
                            color: '#aab',
                            lineHeight: '1.5',
                            listStyleType: '▸'
                        }}>
                            {classification.alternative_explanations.slice(0, 4).map((exp, i) => (
                                <li key={i} style={{ marginBottom: '4px' }}>{exp}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
