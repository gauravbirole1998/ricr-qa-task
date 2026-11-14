/**
 * Minimal request/response types so the controller can be written and tested
 * without installing Express. They mirror the parts of Express the controller uses.
 */
export type AuthUser = {
  id: number;
  email: string;
  userType: number;
};

export type AuthRequest = {
  body: {
    studentId?: number;
    statusId?: number;
    remarks?: string;
    [key: string]: unknown;
  };
  user: AuthUser; // injected by the `protect` middleware
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => unknown;
};
