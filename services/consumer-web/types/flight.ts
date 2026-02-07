export interface Flight {
    id: string;
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    duration_minutes: number;
    base_price: number;
    status?: string;
    airline?: string;
    available_seats?: number;
    aircraft_type?: string;
    class_type?: string;
}
