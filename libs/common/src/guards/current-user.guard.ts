import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { getCurrentUserFromContext } from "../contexts/auth-context";

// Validate roles here
@Injectable()
export class CurrentUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = getCurrentUserFromContext(context);

    if (!user) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
