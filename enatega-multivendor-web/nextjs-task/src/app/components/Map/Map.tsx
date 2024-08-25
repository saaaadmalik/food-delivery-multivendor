'use client';
import React, { use, useState } from 'react'
import MapBackground from "../../assets/images/map_backgorund_image.jpeg"
import location_icon from "../../assets/icons/location.svg"
import clear_icon from "../../assets/icons/clear.svg"
import arrow_down_icon from "../../assets/icons/arrow_down.svg"
import Image from 'next/image'
import useGeolocation from 'react-hook-geolocation';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface location {
    latitude: number;
    longitude: number;
    accuracy: number;
}

const Map =  () => {
    const [location, setLocation] = useState<location | null>(null);
    const [address, setAddress] = useState<string | null >(null);

    function getLocationButton() {
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if(data && data.address){
                        const { road, residential, suburb, city, country } = data.address;
                        setAddress(`${road ? road + ', ' : ''}${residential ? residential +', ':''}${suburb ? suburb + ', ' : ''}${city ? city + ', ' : ''}${country}`);
                    }else{
                        setAddress('');
                    }
                },
                (error) => {
                    console.error('Error getting location', error);
                    toast.warning("Error getting location!", {
                        autoClose: 3000, 
                    });
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
            toast.warning("Geolocation is not supported by this browser.", {
                autoClose: 3000, 
            });
        }
    }

    return (
        <div className="relative w-screen h-screen sm:max-h-96">
            {/* Background Image */}
            <Image src={MapBackground} alt="Maps" className='w-screen h-screen sm:max-h-96 object-cover' />

            {/* Search Bar */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className='flex justify-between items-center rounded-lg bg-[black] gap-2 p-2 w-full sm:w-5/6 md:w-4/6 '>
                    <div className='p-2 w-3/4 lg:w-2/3 sm:p-4 rounded-lg bg-white flex items-center justify-between'>
                        <input
                            type="text"
                            placeholder="Search Location..."
                            value={address ? address : ''}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-2/3 sm:w-3/4 focus:outline-none"
                        />
                        <div className='flex sm:gap-2'>
                            <button onClick={getLocationButton}>
                                <Image src={location_icon} alt="Location Icon" className='w-4 sm:w-6' />
                            </button>
                            <button>
                                <Image src={clear_icon} alt="Clear Icon" className='w-4 sm:w-6' />
                            </button>
                            <button >
                                <Image src={arrow_down_icon} alt="Arrow down Icon" className='w-4 sm:w-6' />
                            </button>
                        </div>
                    </div>
                    <button className='py-2 w-1/3 sm:py-4 rounded-lg bg-[#90EA93] font-bold text-xs sm:text-sm'>FIND RESTURANTS</button>

                </div>
            </div>
        </div>
    );
};
export default Map