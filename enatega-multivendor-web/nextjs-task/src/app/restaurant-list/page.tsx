'use client'
import React from 'react'
import Address from '../components/Address/Address'
import { useSearchParams } from 'next/navigation'

const HomePage = () => {
  const searchParams = useSearchParams()
  const latitude = searchParams.get('lat');
  const longitude = searchParams.get('lng');
  return (
    <main>
      <Address 
      src= "restaurant_list" 
      lat = {latitude ? parseFloat(latitude) : null} 
      lng = {longitude ? parseFloat(longitude) : null}/>
    </main>
  )
}

export default HomePage