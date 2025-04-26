import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import fs from "fs/promises";
import path from "path";

const http = httpRouter();

auth.addHttpRoutes(http);

// Add a fallback route to handle SPA client-side routing
// This serves the index.html content for any path that doesn't match
// an existing file, allowing client-side routing to work
http.route({
  path: "/*",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Get the URL from the request
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Check if this is an asset path (for files in the public directory)
      // In production, Convex automatically serves static assets, so this code
      // only needs to handle the SPA fallback case
      if (pathname.startsWith("/assets/") || 
          pathname.endsWith(".js") || 
          pathname.endsWith(".css") || 
          pathname.endsWith(".ico") || 
          pathname.endsWith(".jpg") || 
          pathname.endsWith(".png") || 
          pathname.endsWith(".svg")) {
        // Let the default static asset handling take over
        return new Response(null, { status: 404 });
      }
      
      // For all other routes, serve the index.html content
      // In production, Convex will serve the built index.html
      return new Response(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/src/index.css" />
    <title>lumenly</title>
    <meta property="og:image" content="/og-preview.jpg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        }
      });
    } catch (error) {
      console.error("Error serving SPA fallback:", error);
      return new Response("Server Error", { status: 500 });
    }
  }),
});

export default http;
