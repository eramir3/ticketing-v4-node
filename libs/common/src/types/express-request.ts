export {};

declare global {
  namespace Express {
    interface SessionPayload {
      jwt?: string;
    }

    interface Request {
      jwt?: string;
      requestId?: string;
      session?: SessionPayload | null;
    }
  }
}
