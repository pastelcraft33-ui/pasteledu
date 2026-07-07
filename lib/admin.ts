export const ADMIN_LOGIN_ID = "pastelcraft3@naver.com";
export const ADMIN_AUTH_EMAIL = "pastelcraft3@naver.com";

export function isAllowedAdminEmail(email: string | null | undefined) {
  return email?.toLowerCase() === ADMIN_AUTH_EMAIL;
}
