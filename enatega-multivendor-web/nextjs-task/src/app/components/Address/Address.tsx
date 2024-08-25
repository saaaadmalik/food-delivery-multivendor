'use client';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Card } from 'primereact/card';
import React, { use, useState, useEffect } from 'react'
import MapBackground from "../../assets/images/map_backgorund_image.jpeg"
import location_icon from "../../assets/icons/location.svg"
import clear_icon from "../../assets/icons/clear.svg"
import arrow_down_icon from "../../assets/icons/arrow_down.svg"
import location_map_icon from "../../assets/icons/location_map.svg"
import Image from 'next/image'
import useGeolocation from 'react-hook-geolocation';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import "react-toastify/dist/ReactToastify.css";
import process from 'process';
import { useRestaurants } from '../../hooks/useRestaurants';
import RestaurantCard from '../RestaurantCard/RestaurantCard';
import {Location, Suggestion, Restaurant} from '../../Types/Types'

const Address = () => {
    const [location, setLocation] = useState<Location | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    const { restaurants, restaurantsloading, resaurantserror, findRestaurants } = useRestaurants();

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        // libraries: ['places'],
    });

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    console.log(position)
                },
                (error) => {
                    console.error('Error getting location', error);
                    toast.warning("Error getting location!", { autoClose: 3000 });
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
            toast.warning("Geolocation is not supported by this browser.", { autoClose: 3000 });
        }
    }
    function setAddressData() {
        if (location) {
            const { latitude, longitude } = location;
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data && data.address) {
                        const { road, residential, suburb, city, country } = data.address;
                        setAddress(`${road ? road + ', ' : ''}${residential ? residential + ', ' : ''}${suburb ? suburb + ', ' : ''}${city ? city + ', ' : ''}${country}`);
                    } else {
                        setAddress('');
                    }
                })
                .catch((error) => console.error('Error fetching address:', error));
        }
    }

    function getLocationButton() {
        getLocation();
        setAddressData();
    }

    useEffect(() => {
        getLocation();
    }, []);

    useEffect(() => {
        setAddressData();
    }, [location]);

    const fetchSuggestions = async (value: any) => {
        if (!value) return;
        fetch(`https://nominatim.openstreetmap.org/search?q=${value}&format=json&addressdetails=1`)
            .then((response) => response.json())
            .then((data) => {
                if (data) {
                    setSuggestions(data);
                } else {
                    setSuggestions([]);
                }
            })
    };

    const handleAddressChange = (e: { target: { value: any; }; }) => {
        const value = e.target.value
        setAddress(value);
        fetchSuggestions(value);

    }
    const handleSelect = (place: any) => {
        console.log(place)
        setLocation({
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
        });
        setAddress(place.display_name);
        setSuggestions([]);
    };

    const mapContainerStyle = {
        width: '100%',
        height: '100%',
    };

    const center = location ? { lat: location.latitude, lng: location.longitude } : { lat: 0, lng: 0 };
    const zoom = 15;

    if (loadError) return <div>Map loading error</div>;
    if (!isLoaded) return <div>Loading map...</div>;

    const clearAddressButton = () => {
        setAddress(null);
        setLocation(null);
        setSuggestions([]);
    }
    const handleFindRestaurants = () => {
        if (location?.latitude && location?.longitude) {
            findRestaurants(location.latitude, location.longitude);
        } else {
            console.error('Location not set');
        }

    }
    return (
        <div className="relative w-screen h-screen sm:h-[70vh]">
            {/** Google Map */}
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={zoom}
                center={center}
            >
                {location && <Marker position={{
                    lat: location.latitude,
                    lng: location.longitude,
                }} />}

                {/* Markers for each restaurant */}
                {!restaurantsloading && !resaurantserror && restaurants.length > 0 &&
                    restaurants.map((restaurant: any) => (
                        <Marker
                            key={restaurant._id}
                            position={{ lat: restaurant.location.coordinates[1], lng: restaurant.location.coordinates[0] }} // Assuming coordinates are in [lng, lat] order
                            icon={{
                                url: location_map_icon,
                                scaledSize: new google.maps.Size(30, 30), 
                            }}
                            title={restaurant.name}
                        />
                    ))}
            </GoogleMap>

            <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none mb-24">
                <div className='relative flex justify-between items-center rounded-lg bg-[black] gap-2 p-2 w-full sm:w-5/6 md:w-4/6 pointer-events-auto'>
                    <div className='p-2 w-3/4 lg:w-2/3 sm:p-4 rounded-lg bg-white flex items-center justify-between'>
                        <input
                            type="text"
                            placeholder="Search Location..."
                            value={address ? address : ''}
                            onChange={handleAddressChange}
                            className="w-2/3 sm:w-3/4 focus:outline-none"
                        />
                        <div className='flex sm:gap-2'>
                            <button onClick={getLocationButton}>
                                <Image src={location_icon} alt="Location Icon" className='w-4 sm:w-6' />
                            </button>
                            <button onClick={clearAddressButton}>
                                <Image src={clear_icon} alt="Clear Icon" className='w-4 sm:w-6' />
                            </button>
                            <button >
                                <Image src={arrow_down_icon} alt="Arrow down Icon" className='w-4 sm:w-6' />
                            </button>
                        </div>
                    </div>

                    <button className='py-2 w-1/3 sm:py-4 rounded-lg bg-[#90EA93] font-bold text-xs sm:text-sm' onClick={handleFindRestaurants}>FIND RESTURANTS</button>

                    {suggestions.length > 0 &&
                        <ul className='absolute top-full left-0 right-0 mt-1 bg-[white] rounded-lg gap-2 p-2 w-full pointer-events-auto max-h-40 overflow-y-auto'>
                            {suggestions.map((suggestion) => (
                                <li key={suggestion.place_id} onClick={() => handleSelect(suggestion)} className=' flex gap-2 items-center cursor-pointer p-2 hover:bg-gray-100'>
                                    <Image src={location_icon} alt="Location Icon" className='w-4 sm:w-6' />
                                    <p>{suggestion.display_name}</p>
                                </li>
                            ))}
                        </ul>
                    }
                </div>

            </div>
            {restaurantsloading && (
                <div className="flex justify-center items-center h-full">
                    <ProgressSpinner />
                </div>
            )}

            {!restaurantsloading && !resaurantserror && restaurants.length > 0 && (
                <div className="p-10 bg-slate-100">
                    <h2 className="text-3xl font-black mb-6">Restaurants near you!</h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12'>
                        {restaurants.map((restaurant: Restaurant) => (
                            <RestaurantCard key = {restaurant._id} restaurantData = {restaurant} />
                        ))}
                    </div>
                </div>
            )}

            {!restaurantsloading && resaurantserror && (
                <div className="text-center text-red-500">
                    <p>Error loading restaurants. Please try again.</p>
                </div>
            )}
        </div>
    );
};
export default Address;