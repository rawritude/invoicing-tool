import { NextResponse } from "next/server";

export function apiHandler<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }

      const err = error as { name?: string; message?: string };

      if (err.name === "CastError") {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      if (err.name === "ValidationError") {
        return NextResponse.json(
          { error: err.message },
          { status: 400 }
        );
      }

      console.error(error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
