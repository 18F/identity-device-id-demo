import { randomUUID } from "crypto";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { sessionQuery } from "./lexis-nexis";
import { expressCspHeader, SELF } from "express-csp-header";

import { UNSAFE_EVAL, UNSAFE_INLINE } from "csp-header";

export const app = express();

app.set("views", path.join(__dirname, "../views"));

app.use(express.static("public"));

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use(
  expressCspHeader({
    directives: {
      "default-src": [SELF],
      "connect-src": [SELF, "h.online-metrix.net"],
      "frame-src": ["h.online-metrix.net"],
      "img-src": [SELF, "*.online-metrix.net"],
      "script-src": [SELF, "h.online-metrix.net", UNSAFE_EVAL, UNSAFE_INLINE],
      "style-src": [SELF, UNSAFE_INLINE],
    },
  })
);

app.get(
  "/",
  asyncHandler(async (req, res) => {
    const sessionId = String(req.query["sessionId"] ?? "").trim();
    if (sessionId.length === 0) {
      res.redirect(`/?sessionId=${encodeURIComponent(randomUUID())}`);
      return;
    }

    const orgId = process.env["LEXIS_NEXIS_ORG_ID"] ?? "";
    const enabled = !!(orgId && sessionId);

    res.render("index.ejs", {
      lexisNexis: {
        enabled,
        orgId,
        sessionId,
      },
    });
  })
);

app.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body;

    const email = (body["email"] ?? "").trim();
    const firstName = body["firstName"] ?? "";
    const lastName = body["lastName"] ?? "";
    const sessionId = body["sessionId"] ?? "";

    const orgId = process.env["LEXIS_NEXIS_ORG_ID"] ?? "";
    const apiKey = process.env["LEXIS_NEXIS_API_KEY"] ?? "";

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

    res.render("info.ejs", {
      data,
    });
  })
);

function asyncHandler(func: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    func(req, res).catch(next);
  };
}
