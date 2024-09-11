import { type Plan } from "@prisma/client";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { generateErrorMessage } from "zod-error";
import { capitalize } from "./capitalize";

export const ERROR_CODE = z.enum([
  "BAD_REQUEST",
  "CONFLICT",
  "FORBIDDEN",
  "INTERNAL_SERVER_ERROR",
  "INVITE_EXPIRED",
  "INVITE_PENDING",
  "LIMIT_EXCEEDED",
  "NOT_FOUND",
  "RATE_LIMIT_EXCEEDED",
  "UNAUTHORIZED",
  "UNPROCESSABLE_ENTITY",
]);

export type ErrorCodes = z.infer<typeof ERROR_CODE>;

export const ERROR_HTTP_STATUS: Record<ErrorCodes, number> = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  INVITE_EXPIRED: 410,
  INVITE_PENDING: 409,
  LIMIT_EXCEEDED: 403,
  NOT_FOUND: 404,
  RATE_LIMIT_EXCEEDED: 429,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
};

export class ApiError extends Error {
  public readonly code: ErrorCodes;
  public readonly docUrl?: string;

  constructor({ code, message }: { code: ErrorCodes; message: string }) {
    super(message);
    this.code = code;
  }
}

export const ErrorSchema = z.object({
  error: z.object({
    code: ERROR_CODE,
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;

interface PrismaError {
  code: string;
  meta?: {
    cause?: string;
  };
}

export function fromZodError(error: ZodError): ErrorResponse {
  return {
    error: {
      code: "UNPROCESSABLE_ENTITY",
      message: generateErrorMessage(error.issues, {
        maxErrors: 1,
        delimiter: {
          component: ": ",
        },
        path: {
          enabled: true,
          type: "objectNotation",
          label: "",
        },
        code: {
          enabled: true,
          label: "",
        },
        message: {
          enabled: true,
          label: "",
        },
      }),
    },
  };
}

function isPrismaError(error: unknown): error is PrismaError {
  return typeof error === "object" && error !== null && "code" in error;
}

export function handleApiError(
  error: unknown,
): ErrorResponse & { status: number } {
  if (error instanceof Error) {
    console.error("API error occurred", error.message);
  } else {
    console.error("API error occurred", error);
  }

  // Zod errors
  if (error instanceof ZodError) {
    return {
      ...fromZodError(error),
      status: ERROR_HTTP_STATUS.UNPROCESSABLE_ENTITY,
    };
  }

  // DubApiError errors
  if (error instanceof ApiError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
      status: ERROR_HTTP_STATUS[error.code],
    };
  }

  // Prisma record not found error
  if (isPrismaError(error)) {
    if (error.code === "P2025") {
      return {
        error: {
          code: "NOT_FOUND",
          message: error.meta?.cause ?? "The requested resource was not found.",
        },
        status: ERROR_HTTP_STATUS.NOT_FOUND,
      };
    }
  }

  // Fallback
  // Unhandled errors are not user-facing, so we don't expose the actual error
  return {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        "An internal server error occurred. Please contact our support if the problem persists.",
    },
    status: 500,
  };
}

export function handleAndReturnErrorResponse(
  err: unknown,
  headers?: Record<string, string>,
) {
  const { error, status } = handleApiError(err);
  return NextResponse.json<ErrorResponse>({ error }, { headers, status });
}

export const exceededLimitError = ({
  plan,
  limit,
  type,
}: {
  plan: Plan;
  limit: number;
  type: "clicks" | "links" | "AI" | "domains" | "tags" | "users";
}) => {
  return `You've reached your ${
    type === "links" || type === "AI" ? "monthly" : ""
  } limit of ${limit} ${
    limit === 1 ? type.slice(0, -1) : type
  } on the ${capitalize(plan)} plan. Please upgrade to add more ${type}.`;
};
