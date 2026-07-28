const BASE_URL = 'http://localhost:5000/api';

export async function fetchHealthCheck() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return null;
  }
}