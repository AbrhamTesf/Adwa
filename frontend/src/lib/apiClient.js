const CSRF_HEADER = "x-adwa-csrf";
const CSRF_COOKIE = "adwa_csrf";

/**
 * Auth tokens live in HttpOnly cookies the browser attaches on its own. The
 * only value JavaScript touches is the CSRF token, which is readable by design
 * because it has to be echoed back in a header.
 */
export function readCsrfToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Shared fetch for every authenticated call: cookies, CSRF, uniform errors. */
export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";

  const csrfToken = readCsrfToken();
  if (csrfToken) headers[CSRF_HEADER] = csrfToken;

  const response = await fetch(path.startsWith("/") ? path : `/api/${path}`, {
    method,
    headers,
    credentials: "include",
    signal,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      response.status === 403
        ? data?.message || "You do not have access to this resource."
        : data?.message || "Something went wrong. Please try again.";
    throw new ApiError(message, response.status);
  }
  return data;
}
