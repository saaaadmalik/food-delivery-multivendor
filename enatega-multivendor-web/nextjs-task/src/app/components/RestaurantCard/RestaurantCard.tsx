import { Restaurant } from '@/app/Types/Types'
import { Card } from 'primereact/card'
import React from 'react'

interface RestaurantCardProps{
    restaurantData: Restaurant
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurantData }) => {
    return (
        <Card
            key={restaurantData._id}
            title={restaurantData.name}
            subTitle={restaurantData.address}
            className="overflow-hidden rounded-xl shadow-2xl"
            header={
                <div className="h-48 w-full mb-4 p-3">
                    <img
                        alt={restaurantData.name}
                        src={restaurantData.image}
                        className="w-full h-full object-cover rounded-xl"
                    />
                </div>

            }
        >
            <p>Delivery Time: {restaurantData.deliveryTime} mins</p>
            <p>Minimum Order: ${restaurantData.minimumOrder}</p>
            <p>Rating: {restaurantData.reviewData.ratings} / 5</p>
        </Card>
    )
}

export default RestaurantCard