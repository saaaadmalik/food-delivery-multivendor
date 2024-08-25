export interface Location{
    latitude: number;
    longitude: number;
}

export interface Suggestion {
    place_id: number;
    display_name: string;
}

export interface Restaurant {
    _id: string;
    name: string;
    address: string;
    image: string;
    deliveryTime: number | string;
    minimumOrder: number | string;
    reviewData: {
        ratings: number | string;
    };
}