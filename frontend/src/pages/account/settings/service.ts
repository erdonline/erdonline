import type {CurrentUser} from './data';
import request from "@/utils/request";

export async function queryCurrent(): Promise<{ data: CurrentUser }> {
  return request('/api/accountSettingCurrentUser');
}

export async function query() {
  return request('/api/users');
}
