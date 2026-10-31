export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function fail(message, status = 400) {
  return json({ error: message }, status);
}

export function cookie(token, request, maxAge = 60 * 60 * 24 * 30) {
  return `bestie_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
