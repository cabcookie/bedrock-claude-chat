import { NextFunction, Request, Response } from 'express';

export class RouteNotFound extends Error {
  status: number;
  constructor() {
    super('Route Not Found');
    this.name = 'RouteNotFound';
    this.status = 400;
  }
}

export class RecordNotFoundError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'RecordNotFoundError';
    this.status = 404;
  }
}

export class ValueError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValueError';
    this.status = 400;
  }
}

export class TypeError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'TypeError';
    this.status = 400;
  }
}

interface IError {
  name: string;
  message: string;
  status?: number;
}

const errResponse = (res: Response, err: IError) =>
  res.status(err.status || 500).json({ error: err.name, message: err.message });

const accessDeniedResponse = (res: Response, {message, ...rest}: IError) =>
  errResponse(res, {
    ...rest,
    message: message.replace(/: arn:aws:sts::[0-9]+:assumed-role\/BedrockChatStack-DatabaseTableAccessRole[0-9A-Z]+-[0-9A-Z]+\/DynamoDBSession/, ''),
    status: 403,
  });

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof RecordNotFoundError) return errResponse(res, err);
  if (err instanceof ValueError) return errResponse(res, err);
  if (err instanceof TypeError) return errResponse(res, err);
  if (err.name === 'AccessDeniedException') return accessDeniedResponse(res, err);
  return res.status(500).json({
    error: err.message,
    message: 'Internal Server Error'
  });
}
