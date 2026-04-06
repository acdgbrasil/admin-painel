import type { UserRepository } from "../../port/user-repository";
import type { HttpClient } from "../../../../presenter/core/http";
import type { User } from "../../../model/user";

export const createApiUserRepository = (http: HttpClient): UserRepository => ({
  list: (search) => http.post<readonly User[]>("/api/v1/users/search", { search }),
  getById: (userId) => http.get<User>(`/api/v1/users/${userId}`),
  create: (input) => http.post("/api/v1/users", input),
  remove: (userId) => http.del(`/api/v1/users/${userId}`),
  deactivate: (userId) => http.post(`/api/v1/users/${userId}/deactivate`),
  reactivate: (userId) => http.post(`/api/v1/users/${userId}/reactivate`),
});
