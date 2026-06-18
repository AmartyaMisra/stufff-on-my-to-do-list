export type StationType = 'NEWS' | 'MUSIC';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Station {
    id: string;
    name: string;
    frequency: number;
    type: StationType;
    coordinates: Coordinates;
    region: string;
    streamUrl: string;
}
