import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

// Add a fallback route to handle SPA client-side routing
http.route({
  path: "/*",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(null, {
      status: 200,
      headers: {
        "Location": "/",
      }
    });
  }),
});

export default http;
