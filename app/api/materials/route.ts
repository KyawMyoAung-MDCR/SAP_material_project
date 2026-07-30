import { NextResponse } from 'next/server';
import { SapMatlStkInAcctMod } from '@/types/material';

export async function GET() {
  const baseUrl = process.env.SAP_MATERIAL_API_URL;
  const user = process.env.SAP_COMM_USER;
  const password = process.env.SAP_COMM_PASSWORD;

  console.log('DEBUG — baseUrl exists:', !!baseUrl);
  console.log('DEBUG — user:', user); 
  console.log('DEBUG — password length:', password?.length);
  console.log('DEBUG — password has trailing space:', password !== password?.trim());

  if (!baseUrl || !user || !password) {
    return NextResponse.json(
      { error: 'Not complete SAP credentials' },
      { status: 500 }
    );
  }

  try {
    const url = `${baseUrl}/A_MatlStkInAcctMod?$format=json&$filter=Material ne ''&$top=1500`;

    const response = await fetch(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64'),
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SAP API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `SAP API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    let rawResults: SapMatlStkInAcctMod[] = [];

    if (Array.isArray(data?.d?.results)) {
      rawResults = data.d.results;
    } else if (Array.isArray(data?.d)) {
      rawResults = data.d;
    } else if (
      data?.d &&
      typeof data.d === 'object' &&
      Object.keys(data.d).length > 0
    ) {
      rawResults = [data.d];
    }

    return NextResponse.json(rawResults);
  } catch (error) {
    console.error('SAP fetch failed:', error);
    return NextResponse.json(
      { error: 'Can not connect to SAP system' },
      { status: 500 }
    );
  }
}
