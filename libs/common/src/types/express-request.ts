export {};

declare global {
  namespace Express {
    interface SessionPayload {
      jwt?: string;
    }

    interface Request {
      jwt?: string;
      session?: SessionPayload | null;
    }
  }
}
