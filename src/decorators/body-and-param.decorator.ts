import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const BodyAndParam = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        return { body: req.body, params: req.params };
    }
);

export const BodyAndQuery = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        return { body: req.body, query: req.query };
    }
);

export const BodyAndParamAndQuery = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        return { body: req.body, params: req.params, query: req.query };
    }
);

export const ParamAndQuery = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        return { params: req.params, query: req.query };
    }
);