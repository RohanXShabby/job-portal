import { usersRepository } from "../repositories/users.repository.js";

export class UsersService {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateProfile(userId: string, data: any) {
    const user = await usersRepository.update(userId, data);
    if (!user) throw new Error("User not found");
    return user;
  }

  async saveJob(userId: string, jobId: string) {
    return usersRepository.saveJob(userId, jobId);
  }

  async unsaveJob(userId: string, jobId: string) {
    return usersRepository.unsaveJob(userId, jobId);
  }

  /** Admin: list all users with pagination */
  async listUsers(role?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const filters: any = {};
    if (role) filters.role = role;

    const [users, total] = await Promise.all([
      usersRepository.findMany(filters, limit, skip),
      usersRepository.count(filters),
    ]);
    return { users, total, page, limit };
  }

  /** Admin: soft delete user */
  async deleteUser(userId: string) {
    const user = await usersRepository.softDelete(userId);
    if (!user) throw new Error("User not found");
    return user;
  }
}

export const usersService = new UsersService();
