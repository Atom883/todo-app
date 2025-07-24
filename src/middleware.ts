import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublic = createRouteMatcher([
  '/api/webhooks/(.*)',   // ← Webhook ルートを必ずパブリックに
  '/', '/sign-in(.*)', '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();           // ここだけ保護
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:.*)).*)',
    '/(api|trpc)(.*)',
  ],
};

