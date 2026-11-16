import { post } from "./request";

export interface UserInfo {
  id: string;
  username: string;
  nickname?: string;
  role: string;
#@@TENANT_ONLY_START
  tenantId: number;
#@@TENANT_ONLY_END
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

/** 登录接口无需 token，显式传 needAuth:false（否则无 token 时拦截器直接跳走） */
//@@TENANT_ONLY_START
export function usernameLogin(username: string, password: string, tenantCode: string) {
  return post<LoginResponse>("/auth/login", { username, password, tenantCode }, { needAuth: false });
}
//@@TENANT_ONLY_END
//@@SINGLE_ONLY_START
export function usernameLogin(username: string, password: string) {
  return post<LoginResponse>("/auth/login", { username, password }, { needAuth: false });
}
//@@SINGLE_ONLY_END
