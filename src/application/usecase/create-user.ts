import type { UserRepository } from "../../data/repository/port/user-repository";
import type { PersonRepository } from "../../data/repository/port/person-repository";
import type { ApiResult } from "../../data/model/result";
import { type CreateUserFormData, toRegisterPersonInput } from "../mapper/person-mapper";

export type CreateUserUseCase = (command: CreateUserFormData) => Promise<ApiResult<{ readonly userId: string }>>;

export const createCreateUserUseCase = (deps: {
  readonly userRepo: UserRepository;
  readonly personRepo: PersonRepository;
}): CreateUserUseCase => async (command) => {
  // 1. Create in Zitadel
  const result = await deps.userRepo.create({
    firstName: command.firstName,
    lastName: command.lastName,
    email: command.email,
    username: command.username,
    password: command.password,
  });
  if (!result.ok) return result;

  // 2. Register in People Context (best-effort)
  const personInput = toRegisterPersonInput(command);
  if (personInput) {
    const personResult = await deps.personRepo.register(result.data.userId, personInput);
    if (!personResult.ok) {
      console.error("[people-context] Registration failed:", personResult.message);
    }
  }

  return result;
};
