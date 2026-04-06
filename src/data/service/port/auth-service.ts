import type { Session } from "../../model/session";

export interface AuthService {
  readonly getSession: (cookieValue: string | undefined) => Promise<Session | null>;
  readonly getLoginUrl: () => Promise<string>;
  readonly exchangeCode: (code: string) => Promise<{ readonly session: Session; readonly signedCookie: string }>;
  readonly getLogoutUrl: (idToken: string) => Promise<string>;
  readonly cookieName: string;
  readonly cookieOptions: {
    readonly httpOnly: boolean;
    readonly secure: boolean;
    readonly sameSite: "lax" | "strict" | "none";
    readonly path: string;
    readonly maxAge: number;
  };
}
