import {
  Application,
  Context,
  dotEnv,
  etaEngine,
  oakAdapter,
  Router,
  viewEngine,
} from "./deps.ts";
import { sessionQuery } from "./lexis-nexis.ts";

dotEnv.config({ export: true });

async function getSessionId(ctx: Context): Promise<string> {
  let id = await ctx.cookies.get("sessionId");
  if (!id) {
    id = crypto.randomUUID();
    await ctx.cookies.set("sessionId", id);
  }
  return id;
}

const router = new Router();

router.get("/", async (ctx: Context) => {
  if (ctx.request.url.searchParams.has("reset-session")) {
    await ctx.cookies.delete("sessionId");
    ctx.response.redirect("/");
    return;
  }

  const newSessionId = ctx.request.url.searchParams.get("sessionId");
  if (newSessionId) {
    // allow manually overriding the session id
    ctx.cookies.set("sessionId", newSessionId);
    ctx.response.redirect("/");
    return;
  }

  const orgId = Deno.env.get("LEXIS_NEXIS_ORG_ID") ?? "";
  const sessionId = await getSessionId(ctx);
  const enabled = !!(orgId && sessionId);

  ctx.render("index.ejs", {
    lexisNexis: {
      enabled,
      orgId,
      sessionId,
    },
  });
});

router.post("/", async (ctx: Context) => {
  const body = await ctx.request.body({ type: "form" }).value;

  const email = (body.get("email") ?? "").trim();
  const firstName = body.get("firstName") ?? "";
  const lastName = body.get("lastName") ?? "";

  const orgId = Deno.env.get("LEXIS_NEXIS_ORG_ID") ?? "";
  const apiKey = Deno.env.get("LEXIS_NEXIS_API_KEY") ?? "";
  const sessionId = await getSessionId(ctx);

  const data = await sessionQuery({
    orgId,
    apiKey,
    sessionId,
    user: {
      email,
      firstName,
      lastName,
    },
  });

  ctx.render("info.ejs", {
    data,
  });
});

const app = new Application();

app.use(viewEngine(oakAdapter, etaEngine, {
  viewRoot: "./views",
}));

app.use(router.routes());

app.use(router.allowedMethods());

app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: "./public",
      path: ctx.request.url.pathname,
    });
  } catch (_) {
    await next();
  }
});

let port: string | number | undefined = Deno.env.get("PORT");
port = port ? parseInt(String(port), 10) : 8000;
if (isNaN(port)) {
  port = 8000;
}

app.addEventListener(
  "listen",
  () => {
    console.log("Listening on port %d", port);
  },
);

await app.listen({ port });
