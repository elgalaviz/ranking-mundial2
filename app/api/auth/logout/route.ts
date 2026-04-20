import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/quiniela/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
  response.cookies.set("quiniela_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
