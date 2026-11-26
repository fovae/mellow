// Cloudflare Worker: /api/* is the account API, everything else is the app's static files.
// Headers of the static files are in /_headers.
import { handleApi } from "./api.js";

export default {
    fetch(request, env) {
        const { pathname } = new URL(request.url);
        if (pathname.startsWith("/api/")) return handleApi(request, env);
        if (pathname === "/") return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
        return env.ASSETS.fetch(request);
    },
};
