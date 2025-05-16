import { Reflector } from "@nestjs/core";

export const RequiredHeaders = Reflector.createDecorator<string[]>();
