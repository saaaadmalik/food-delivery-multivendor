import { useState } from 'react';
import {client as apolloClient}  from '../lib/apolloClient';
import { restaurantList } from '../graphql/queries';

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsloading, setRestaurantsLoading] = useState(false);
  const [resaurantserror, setRestaurantsError] = useState(null);

  const findRestaurants = async (latitude: number, longitude: number) => {
    setRestaurantsLoading(true);
    setRestaurantsError(null);
    try {
      const { data } = await apolloClient.query({
        query: restaurantList,
        variables: { latitude, longitude },
      });
      console.log(data);
      setRestaurants(data.nearByRestaurants.restaurants || []);
    } catch (err: any) {
        console.log('err:' +err);
        setRestaurantsError(err);
    } finally {
        console.log('hi');
        setRestaurantsLoading(false);
    }
  };

  return { restaurants, restaurantsloading, resaurantserror, findRestaurants };
};