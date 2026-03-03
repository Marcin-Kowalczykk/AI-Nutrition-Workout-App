import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Handle root path - redirect based on auth status
  if (request.nextUrl.pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    } else {
      return NextResponse.redirect(new URL("/main-page", request.url));
    }
  }

  // Protect routes that require authentication
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/main-page") ||
      request.nextUrl.pathname.startsWith("/profile-settings"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged in users from /login and /register
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/main-page", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

