import { User } from "@job-portal/db";
import { getOrSet, invalidate } from "@job-portal/redis";

export class UsersRepository {
  async findById(id: string) {
    return getOrSet(
      `user:${id}`,
      () => User.findOne({ _id: id, isDeleted: false }).lean(),
      1800
    );
  }

  async update(id: string, updateData: any) {
    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    ).lean();

    if (user) {
      await invalidate(`user:${id}`);
    }
    return user;
  }

  async saveJob(userId: string, jobId: string) {
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $addToSet: { savedJobs: jobId } },
      { new: true }
    ).lean();

    if (user) {
      await invalidate(`user:${userId}`);
    }
    return user;
  }

  async unsaveJob(userId: string, jobId: string) {
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { savedJobs: jobId } },
      { new: true }
    ).lean();

    if (user) {
      await invalidate(`user:${userId}`);
    }
    return user;
  }

  async findMany(filters: any = {}, limit = 20, skip = 0) {
    return User.find({ ...filters, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filters: any = {}): Promise<number> {
    return User.countDocuments({ ...filters, isDeleted: false });
  }

  async softDelete(id: string) {
    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();

    if (user) {
      await invalidate(`user:${id}`);
    }
    return user;
  }
}

export const usersRepository = new UsersRepository();
