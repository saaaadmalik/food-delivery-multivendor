// lib/apollo-client.ts
import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: 'https://enatega-multivendor.up.railway.app/graphql',
  cache: new InMemoryCache(),
});