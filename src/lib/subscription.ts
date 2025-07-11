import axios from 'axios';

export async function fetchUserSubscription(userId: string) {
  const apiBase = import.meta.env.VITE_BACKEND_API;
  const url = `${apiBase}/dodo/subscription/${userId}`;
  const response = await axios.get(url);
  return response.data;
} 