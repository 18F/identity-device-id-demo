import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { getSessionId } from "./session-id";
import { sessionQuery } from "./lexis-nexis";

export const app = express();

app.set("views", path.join(__dirname, "../views"));

app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());

app.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.query["reset-session"] != null) {
      res.clearCookie("sessionId");
      res.redirect("/");
      return;
    }

    const newSessionId = req.query["sessionId"];
    if (newSessionId) {
      // allow manually overriding the session id
      res.cookie("sessionId", newSessionId);
      res.redirect("/");
      return;
    }

    const orgId = process.env["LEXIS_NEXIS_ORG_ID"] ?? "";
    const sessionId = getSessionId(req, res);
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

    const orgId = process.env["LEXIS_NEXIS_ORG_ID"] ?? "";
    const apiKey = process.env["LEXIS_NEXIS_API_KEY"] ?? "";

    const sessionId = getSessionId(req, res);

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
