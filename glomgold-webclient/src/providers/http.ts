/** Error shape understood by Refine (`statusCode`) and by `authUtils` (`response.status`). */
export class ApiError extends Error {
  statusCode: number;
  response: { status: number };

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = status;
    this.response = { status };
  }
}

/** Thin fetch wrapper: cookies included, non-2xx thrown (Refine needs the rejection). */
export const request = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, { credentials: "include", ...init });
  if (!response.ok) throw new ApiError(response.status, response.statusText);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
};

export const jsonRequest = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});
