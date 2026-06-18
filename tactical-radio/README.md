# Tactical Radio System

**Version 2.0.4 // CLASSIFIED**

A high-fidelity, tactical radio interface for intercepting global audio streams. Features real-time satellite tracking, signal visualization, and encrypted communication logs.

## 🚀 Installation

1.  **Prerequisites**:
    *   [Node.js](https://nodejs.org/) (Version 18 or higher) installed.

2.  **Setup**:
    *   Open the folder `radio 2`.
    *   Double-click `launch_app.bat`.
    *   The system will automatically install all necessary dependencies (`node_modules`) on the first run.

## 🖥️ Usage

There are two ways to launch the system:

### 1. App Mode (Recommended)
*   **File**: `launch_app.bat`
*   **Experience**: Launches a borderless, dedicated window (using Chrome/Edge) that looks like a native desktop application. Best for immersion.

### 2. Web Mode
*   **File**: `launch_web.bat`
*   **Experience**: Opens in your default web browser with standard tabs and address bar. Useful for debugging or if App Mode fails.

## 🎮 Controls

*   **Power**: Click the Green Power Button in the top center to initialize the system.
*   **Tuning**:
    *   **SCAN**: Auto-scans for random stations.
    *   **INTERCEPT**: Instantly locks onto a random active signal.
    *   **Manual**: Click any station in the list or satellite on the globe.
*   **Jammer**: Toggles signal interference (audio noise + visual glitching).
*   **Globe**: Drag to rotate, scroll to zoom. Click satellites to view telemetry.

## 📋 Mission Report (Recent Updates)

### Objectives Achieved
- **Layout Restoration**: Fixed the "half earth" and missing panel issues by migrating the entire layout to a robust Flexbox architecture.
- **Performance Tuning**: Implemented frame-rate throttling for all animations (Globe: 30FPS, Oscilloscope: 20FPS, NetworkStats: 15FPS) to prevent CPU overload and fan noise.
- **UI Polish**: Fixed the Dashboard search bar sizing and spacing.
- **Cleanup**: Removed unused components (`Tuner`, `StationList`, `SystemLog`) to keep the codebase clean.
- **Automation**: Created robust Batch launchers (`launch_app.bat`, `launch_web.bat`) that auto-kill blocking processes.

### Key Technical Changes
- **Layout Refactor**: Switched from `grid-cols-12` to `flex` to ensure the center globe panel always fills available space without collapsing the side panels.
- **Performance**: Added `requestAnimationFrame` throttling logic to `TacticalGlobe.tsx`, `NetworkStats.tsx`, and `Oscilloscope.tsx`.
- **Cleanup**: Deleted unused files (`src/components/Tuner.tsx`, `src/components/StationList.tsx`, `src/components/SystemLog.tsx`, `run_radio.ps1`).

## 🛠️ Troubleshooting

*   **"Port 5173 is already in use"**:
    *   The new launchers (`launch_app.bat`) automatically fix this by killing the old process. Just run it again.
*   **"Node is not recognized"**:
    *   Ensure Node.js is installed and added to your system PATH. Restart your computer after installation.
*   **Black Screen / Missing UI**:
    *   Refresh the window (Ctrl+R).
    *   Ensure you are running the latest version with the Flexbox layout fix.

## 📂 Project Structure

*   `src/`: Source code (React + TypeScript).
*   `src/components/`: UI components (Globe, Dashboard, Oscilloscope).
*   `src/lib/`: Logic for Audio Engine and Satellite tracking.
*   `launch_app.bat`: Main launcher script (App Mode).
*   `launch_web.bat`: Web Mode launcher.

---
*SECURE CONNECTION ESTABLISHED. MONITORING ACTIVE.*
