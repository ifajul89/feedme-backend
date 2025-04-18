import { Response } from 'express';

type TSuccessResponse<T> = {
  status?: boolean;
  statusCode: number;
  message: string;
  token?: string;
  data: T | T[] | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  errorSources?: Array<{
    path: string;
    message: string;
  }>;
};

const sendResponse = <T>(res: Response, data: TSuccessResponse<T>) => {
  res.status(data.statusCode).json({
    status: true,
    statusCode: data.statusCode,
    message: data.message,
    token: data.token,
    data: data.data,
    meta: data.meta,
    errorSources: data.errorSources,
  });
};

export default sendResponse;
