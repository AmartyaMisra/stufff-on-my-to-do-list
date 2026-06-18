/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-globe.gl' {
    import { Component } from 'react';

    export interface GlobeProps {
        ref?: React.Ref<Globe>;
        width?: number;
        height?: number;
        globeImageUrl?: string;
        bumpImageUrl?: string;
        backgroundImageUrl?: string;
        pointsData?: any[];
        pointLat?: string | ((d: any) => number);
        pointLng?: string | ((d: any) => number);
        pointColor?: string | ((d: any) => string);
        pointAltitude?: number | ((d: any) => number);
        pointRadius?: string | ((d: any) => number);
        pointResolution?: number;
        pointsMerge?: boolean;
        ringsData?: any[];
        ringColor?: string | ((d: any) => string);
        ringMaxRadius?: string | ((d: any) => number);
        ringPropagationSpeed?: string | ((d: any) => number);
        ringRepeatPeriod?: string | ((d: any) => number);
        onPointClick?: (point: any, event: MouseEvent, coords: { lat: number; lng: number; altitude: number }) => void;
        labelsData?: any[];
        labelLat?: string;
        labelLng?: string;
        labelText?: string;
        labelSize?: string | ((d: any) => number);
        labelDotRadius?: number | ((d: any) => number);
        labelColor?: string | ((d: any) => string);
        atmosphereColor?: string;
        atmosphereAltitude?: number;
        showAtmosphere?: boolean;
        backgroundColor?: string;
        globeMaterial?: object;
    }

    export default class Globe extends Component<GlobeProps> {
        pointOfView(coords: { lat: number; lng: number; altitude?: number }, transitionMs?: number): void;
        controls(): any;
    }
}
