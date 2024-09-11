import { ApiError } from "./errors";

export const parseRequestBody = async <T>(req: Request): Promise<T> => {
  try {
    const body: T = (await req.json()) as T;
    return body;
  } catch {
    throw new ApiError({
      code: "BAD_REQUEST",
      message:
        "Invalid JSON format in request body. Please ensure the request body is a valid JSON object.",
    });
  }
};
