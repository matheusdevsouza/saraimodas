import { NextResponse } from 'next/server';
export function createStandardResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
export function addCustomHeaders(response: NextResponse, headers: Record<string, string>): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
