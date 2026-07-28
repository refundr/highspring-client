import { createCookieSessionStorage } from "@remix-run/node";
import type { Session } from "~/utils/api.server";

const storage = createCookieSessionStorage({
  cookie: {
    name: "__highspring",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "highspring-dev-secret"],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function readSessionUser(request: Request): Promise<Session | null> {
  const session = await getUserSession(request);
  const raw = session.get("user");
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function commitUserSession(user: Session) {
  const session = await storage.getSession();
  session.set("user", JSON.stringify(user));
  return storage.commitSession(session);
}

export async function destroyUserSession(request: Request) {
  const session = await getUserSession(request);
  return storage.destroySession(session);
}
