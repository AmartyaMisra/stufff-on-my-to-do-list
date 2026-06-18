"""
SETI-Style Signal Classifier
Analyzes signals for artificial/engineered characteristics using scientific heuristics.

IMPORTANT: This module NEVER claims "alien intelligence".
Classifications are: natural, artificial_candidate, unclassified, known_transmitter

All results include uncertainty quantification and alternative explanations.
"""
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
import math
import numpy as np
from sqlalchemy.orm import Session

from database.models import Event, SignalClassification, KnownTransmitter


class SETIClassifier:
    """
    Implements SETI Institute detection heuristics for signal analysis.
    
    References:
    - SETI Institute Signal Detection: https://www.seti.org/seti-institute/project/details/signal-detection
    - Tarter et al. (2010): "SETI Turns 50"
    - Enriquez et al. (2017): Breakthrough Listen methodology
    """
    
    # Detection thresholds (calibrated from literature)
    NARROWBAND_THRESHOLD_HZ = 10.0  # < 10 Hz indicates potential CW signal
    DOPPLER_LINEAR_THRESHOLD = 0.05  # Hz/s - constant acceleration signature
    REPETITION_SNR_THRESHOLD = 3.0  # Statistical significance for periodicity
    
    def __init__(self):
        self.confidence_floor = 0.05  # Minimum confidence (5%)
        self.confidence_ceil = 0.95   # Maximum confidence (95%) - never certain
        
    def analyze_signal(self, event: Event, db: Session) -> SignalClassification:
        """
        Main analysis pipeline for signal classification.
        
        Args:
            event: Event object to analyze
            db: Database session
            
        Returns:
            SignalClassification with scores, classification, and explanations
        """
        # Extract signal properties from event data
        signal_props = self._extract_signal_properties(event)
        
        # Compute individual trait scores
        narrowband_analysis = self._analyze_narrowband(signal_props)
        repetition_analysis = self._analyze_repetition(signal_props)
        doppler_analysis = self._analyze_doppler_drift(signal_props)
        
        # Combined score calculation
        combined_score = self._compute_combined_score(
            narrowband_analysis['score'],
            repetition_analysis['score'],
            doppler_analysis['score']
        )
        
        # Check against known transmitters
        known_match = self._match_known_transmitter(event, db)
        
        # Determine classification
        classification, confidence_bounds = self._classify_signal(
            combined_score,
            known_match
        )
        
        # Generate alternative explanations
        alternatives = self._generate_alternative_explanations(
            classification,
            narrowband_analysis,
            repetition_analysis,
            doppler_analysis
        )
        
        # Create SignalClassification record
        sig_class = SignalClassification(
            event_id=event.id,
            classification=classification,
            confidence=combined_score,
            confidence_lower=confidence_bounds[0],
            confidence_upper=confidence_bounds[1],
            narrowband_score=narrowband_analysis['score'],
            repetition_score=repetition_analysis['score'],
            doppler_drift_score=doppler_analysis['score'],
            bandwidth_hz=signal_props.get('bandwidth_hz'),
            repetition_period_s=signal_props.get('repetition_period_s'),
            doppler_drift_hz_per_s=signal_props.get('doppler_drift_hz_per_s'),
            alternative_explanations=alternatives,
            analysis_metadata={
                'narrowband_analysis': narrowband_analysis,
                'repetition_analysis': repetition_analysis,
                'doppler_analysis': doppler_analysis,
                'known_transmitter_match': known_match
            },
            analyzed_at=datetime.utcnow()
        )
        
        return sig_class
    
    def _extract_signal_properties(self, event: Event) -> Dict[str, Any]:
        """Extract relevant signal properties from event data."""
        data = event.data or {}
        
        # For FRB events
        if event.event_type == 'frb':
            return {
                'bandwidth_hz': data.get('bandwidth_mhz', 0) * 1e6,  # Convert MHz to Hz
                'frequency_mhz': data.get('frequency_mhz'),
                'width_ms': data.get('width_ms'),
                'snr': data.get('snr'),
                'dm': data.get('dm'),
                'is_repeater': data.get('is_repeater', False),
                'repetition_period_s': data.get('repetition_period_s'),
                'doppler_drift_hz_per_s': data.get('doppler_drift_hz_per_s'),
            }
        
        # For general radio signals
        return {
            'bandwidth_hz': data.get('bandwidth_hz', data.get('bandwidth_mhz', 0) * 1e6 if 'bandwidth_mhz' in data else None),
            'frequency_mhz': data.get('frequency_mhz'),
            'repetition_period_s': data.get('repetition_period_s'),
            'doppler_drift_hz_per_s': data.get('doppler_drift_hz_per_s'),
        }
    
    def _analyze_narrowband(self, props: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze signal bandwidth.
        
        Heuristic: Natural astrophysical sources are typically broadband.
        Narrowband signals (< 10 Hz) suggest engineered carrier waves.
        
        Exceptions: Pulsars, masers can have narrow spectral features.
        """
        bandwidth = props.get('bandwidth_hz')
        
        if bandwidth is None:
            return {
                'score': 0.0,
                'confidence': 0.0,
                'explanation': 'Bandwidth not measured'
            }
        
        # Score calculation (inverse sigmoid)
        if bandwidth < 1.0:
            score = 0.9
            explanation = f"Extremely narrow bandwidth ({bandwidth:.2f} Hz) — highly unusual for natural sources"
        elif bandwidth < self.NARROWBAND_THRESHOLD_HZ:
            score = 0.4 + (self.NARROWBAND_THRESHOLD_HZ - bandwidth) / self.NARROWBAND_THRESHOLD_HZ * 0.5
            explanation = f"Narrow bandwidth ({bandwidth:.2f} Hz) — potential engineered signal"
        elif bandwidth < 50:
            score = 0.2
            explanation = f"Moderately narrow ({bandwidth:.1f} Hz) — ambiguous"
        elif bandwidth < 1000:
            score = 0.1
            explanation = f"Broadband signal ({bandwidth:.0f} Hz) — consistent with natural emission"
        else:
            score = 0.05
            explanation = f"Wide bandwidth ({bandwidth:.0f} Hz) — natural source likely"
        
        return {
            'score': score,
            'confidence': 0.7,  # Bandwidth measurement generally reliable
            'explanation': explanation,
            'bandwidth_hz': bandwidth
        }
    
    def _analyze_repetition(self, props: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze repetition pattern.
        
        Heuristic: Regular periodicity suggests underlying mechanism.
        Could be rotation (pulsar), orbit (binary), or engineered beacon.
        """
        is_repeater = props.get('is_repeater', False)
        period_s = props.get('repetition_period_s')
        
        if not is_repeater or period_s is None:
            return {
                'score': 0.0,
                'confidence': 0.0,
                'explanation': 'No repetition detected'
            }
        
        # Periodicity scoring
        if 0.001 < period_s < 10.0:
            # Pulsar-like (millisecond to ~10 sec)
            score = 0.2
            explanation = f"Period {period_s:.3f}s — consistent with rotation-powered pulsar"
        elif 10.0 < period_s < 1000.0:
            # Unusual for natural sources
            score = 0.5
            explanation = f"Period {period_s:.1f}s — uncommon for known natural sources"
        elif 1000.0 < period_s < 86400.0:
            # Orbital timescales
            score = 0.3
            explanation = f"Period {period_s/3600:.1f}h — could be orbital modulation"
        else:
            score = 0.15
            explanation = f"Long period {period_s/86400:.1f}d — ambiguous"
        
        return {
            'score': score,
            'confidence': 0.6,  # Periodicity detection can have false positives
            'explanation': explanation,
            'period_s': period_s
        }
    
    def _analyze_doppler_drift(self, props: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze Doppler drift pattern.
        
        Heuristic: Linear drift with time suggests constant acceleration.
        Could indicate: orbital motion, spacecraft, or  rotating beam.
        
        Natural sources (ISM scintillation) show non-linear drift.
        """
        drift = props.get('doppler_drift_hz_per_s')
        
        if drift is None:
            return {
                'score': 0.0,
                'confidence': 0.0,
                'explanation': 'Doppler drift not measured'
            }
        
        drift_abs = abs(drift)
        
        if drift_abs < 0.001:
            score = 0.1
            explanation = f"Minimal drift ({drift:.4f} Hz/s) — stationary or distant source"
        elif drift_abs < self.DOPPLER_LINEAR_THRESHOLD:
            score = 0.4
            explanation = f"Moderate linear drift ({drift:.3f} Hz/s) — suggests acceleration"
        elif drift_abs < 1.0:
            score = 0.6
            explanation = f"Significant drift ({drift:.2f} Hz/s) — consistent with orbital motion"
        else:
            score = 0.3
            explanation = f"Strong drift ({drift:.1f} Hz/s) — possible RFI or ionospheric effect"
        
        return {
            'score': score,
            'confidence': 0.5,  # Drift measurements can be noisy
            'explanation': explanation,
            'drift_hz_per_s': drift
        }
    
    def _compute_combined_score(self, narrowband: float, repetition: float, doppler: float) -> float:
        """
        Combine individual trait scores into overall confidence.
        
        Uses weighted geometric mean to avoid false positives from single trait.
        """
        # Weights (sum to 1.0)
        w_narrow = 0.5
        w_repeat = 0.3
        w_doppler = 0.2
        
        # Geometric mean prevents score inflation from incomplete data
        scores = []
        weights = []
        
        if narrowband > 0:
            scores.append(narrowband)
            weights.append(w_narrow)
        if repetition > 0:
            scores.append(repetition)
            weights.append(w_repeat)
        if doppler > 0:
            scores.append(doppler)
            weights.append(w_doppler)
        
        if not scores:
            return 0.0
        
        # Normalize weights
        total_weight = sum(weights)
        if total_weight == 0:
            return 0.0
        
        weights = [w / total_weight for w in weights]
        
        # Weighted geometric mean
        combined = 1.0
        for score, weight in zip(scores, weights):
            combined *= score ** weight
        
        # Clamp to confidence bounds
        return max(self.confidence_floor, min(self.confidence_ceil, combined))
    
    def _match_known_transmitter(self, event: Event, db: Session) -> Optional[Dict[str, Any]]:
        """
        Check if signal matches a known human-made transmitter.
        
        Returns match details if found, else None.
        """
        # Get frequency if available
        freq_mhz = event.data.get('frequency_mhz')
        if not freq_mhz:
            return None
        
        # Query known transmitters
        # Match within ±50 MHz and ±5° position
        transmitters = db.query(KnownTransmitter).filter(
            KnownTransmitter.is_active == True
        ).all()
        
        for tx in transmitters:
            # Check frequency match
            tx_freqs = tx.frequencies_mhz or []
            for tx_freq in tx_freqs:
                if abs(freq_mhz - tx_freq) < 50:  # Within 50 MHz
                    # TODO: Add position matching for satellites (requires TLE propagation)
                    return {
                        'transmitter_id': tx.id,
                        'transmitter_name': tx.name,
                        'frequency_match_mhz': tx_freq,
                        'frequency_delta_mhz': abs(freq_mhz - tx_freq)
                    }
        
        return None
    
    def _classify_signal(self, combined_score: float, known_match: Optional[Dict]) -> Tuple[str, Tuple[float, float]]:
        """
        Determine final classification based on score and known transmitter match.
        
        Returns: (classification, (lower_bound, upper_bound))
        """
        # If matches known transmitter
        if known_match:
            return "known_transmitter", (0.8, 0.95)
        
        # Classification thresholds
        if combined_score > 0.7:
            classification = "artificial_candidate"
            bounds = (combined_score - 0.1, min(0.95, combined_score + 0.05))
        elif combined_score > 0.4:
            classification = "unclassified"
            bounds = (combined_score - 0.15, combined_score + 0.15)
        else:
            classification = "natural"
            bounds = (max(0.05, combined_score - 0.05), combined_score + 0.1)
        
        return classification, bounds
    
    def _generate_alternative_explanations(
        self,
        classification: str,
        narrowband: Dict,
        repetition: Dict,
        doppler: Dict
    ) -> List[str]:
        """
        Generate list of alternative explanations for observed signal traits.
        
        CRITICAL: Always provide natural explanations even for "artificial_candidate".
        """
        alternatives = []
        
        if classification == "artificial_candidate":
            alternatives.append("Engineered signal from human spacecraft or deep-space probe")
            alternatives.append("Pulsar nulling event or mode-changing behavior")
            alternatives.append("Magnetar outburst with narrow spectral feature")
            alternatives.append("Radio frequency interference (RFI) from satellite")
            
            if narrowband['score'] > 0.5:
                alternatives.append("Maser emission (naturally occurring coherent radio source)")
            
            if repetition['score'] > 0.4:
                alternatives.append("Binary star system orbital modulation")
                alternatives.append("Rotating neutron star (pulsar) with unusual emission geometry")
        
        elif classification == "unclassified":
            alternatives.append("Requires follow-up observation to determine nature")
            alternatives.append("Signal may be transient natural source (e.g., flare star)")
            alternatives.append("Possible atmospheric or ionospheric propagation effect")
            alternatives.append("Unknown astrophysical phenomenon")
        
        elif classification == "natural":
            alternatives.append("Consistent with known astrophysical emission processes")
            alternatives.append("Broadband thermal or non-thermal radiation")
            alternatives.append("Typical characteristic of cosmic radio source")
        
        elif classification == "known_transmitter":
            alternatives.append("Confirmed correlation with cataloged human-made transmitter")
        
        return alternatives


# Singleton instance
seti_classifier = SETIClassifier()


def classify_signal(event: Event, db: Session) -> SignalClassification:
    """
    Convenience function to classify a signal event.
    
    Args:
        event: Event to analyze
        db: Database session
        
    Returns:
        SignalClassification (not yet committed to DB)
    """
    return seti_classifier.analyze_signal(event, db)
