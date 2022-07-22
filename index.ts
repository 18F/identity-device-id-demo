import {
  Application,
  Context,
  dotEnv,
  etaEngine,
  oakAdapter,
  Router,
  viewEngine,
} from "./deps.ts";

dotEnv.config({ export: true });

async function getSessionId(ctx: Context): Promise<string> {
  let id = await ctx.cookies.get("sessionId");
  if (!id) {
    id = crypto.randomUUID();
    await ctx.cookies.set("sessionId", id);
  }
  return id;
}

async function sessionQuery() {
}

const router = new Router();

router.get("/", async (ctx: Context) => {
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

  if (email.length === 0) {
    ctx.response.redirect("/");
    return;
  }

  const orgId = Deno.env.get("LEXIS_NEXIS_ORG_ID") ?? "";
  const apiKey = Deno.env.get("LEXIS_NEXIS_API_KEY") ?? "";
  const sessionId = await getSessionId(ctx);

  const resp = await fetch(
    " https://h-api.online-metrix.net/api/session-query",
    {
      method: "POST",
      headers: {
        // "Accept": "application/json",
      },
      body: new URLSearchParams({
        output_format: "JSON",
        org_id: orgId,
        api_key: apiKey,
        session_id: sessionId,
        service_type: "All",
        event_type: "LOGIN",
        account_email: email,
      }).toString(),
    },
  );

  if (resp.status !== 200) {
    console.error("%d %s", resp.status, await resp.text());
    ctx.response.redirect("/");
    return;
  }

  const data = await resp.json();

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

app.addEventListener(
  "listen",
  () => {
    console.log("Listening");
  },
);

await app.listen({ port: 8000 });
