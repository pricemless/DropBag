// Thin fetch wrapper for the DropBag API. Throws ApiError with the server's message.
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status, data.code)
  return data
}

export const api = {
  get: path => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: path => request('DELETE', path),
}
