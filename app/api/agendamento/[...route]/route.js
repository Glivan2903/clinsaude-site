import { NextResponse } from 'next/server';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

let cachedToken = null;

async function getOrFetchToken(baseUrl) {
  if (cachedToken) return cachedToken;
  
  try {
    console.log('Fetching API Token...');
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to login: ${response.status}`);
    }
    const token = await response.text();
    cachedToken = token.trim();
    console.log('Token fetched successfully!');
    return cachedToken;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    return null;
  }
}

async function fetchWithTokenRetry(url, options = {}, baseUrl) {
  let token = await getOrFetchToken(baseUrl);
  
  const headers = {
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    console.log('401 Unauthorized. Resetting token and retrying...');
    cachedToken = null;
    token = await getOrFetchToken(baseUrl);
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete headers['Authorization'];
    }
    response = await fetch(url, { ...options, headers });
  }
  
  return response;
}

export async function GET(request, { params }) {
  const { route } = await params;
  const path = route.join('/');
  const baseUrl = process.env.API_BASE_URL || 'http://clinvida.ddnsfree.com:9000';
  
  try {
    const response = await fetchWithTokenRetry(`${baseUrl}/api/agendamento/${path}`, {}, baseUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Proxy GET Error:', error);
    return NextResponse.json({ error: 'Erro ao conectar com o servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { route } = await params;
  const path = route.join('/');
  const baseUrl = process.env.API_BASE_URL || 'http://clinvida.ddnsfree.com:9000';
  
  try {
    const body = await request.json();
    const response = await fetchWithTokenRetry(`${baseUrl}/api/agendamento/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, baseUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Proxy POST Error:', error);
    return NextResponse.json({ error: 'Erro ao conectar com o servidor' }, { status: 500 });
  }
}

