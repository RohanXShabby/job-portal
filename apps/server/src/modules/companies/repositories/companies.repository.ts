import { CompanyModel } from "@job-portal/db";
import { getOrSet, invalidate } from "@job-portal/redis";

export class CompaniesRepository {
  async findById(id: string) {
    return getOrSet(
      `company:${id}`,
      () => CompanyModel.findOne({ _id: id, isDeleted: false } as any).lean(),
      1800
    );
  }

  async findBySlug(slug: string) {
    return CompanyModel.findOne({ slug, isDeleted: false } as any).lean();
  }

  async create(data: any, recruiterId: string) {
    const company = new CompanyModel({
      ...data,
      recruiters: [recruiterId],
    });
    await company.save();
    return company.toObject();
  }

  async update(id: string, updateData: any) {
    const company = await CompanyModel.findOneAndUpdate(
      { _id: id, isDeleted: false } as any,
      { $set: updateData },
      { new: true } as any
    ).lean();

    if (company) {
      await invalidate(`company:${id}`);
    }
    return company;
  }

  async addRecruiter(id: string, recruiterId: string) {
    const company = await CompanyModel.findOneAndUpdate(
      { _id: id, isDeleted: false } as any,
      { $addToSet: { recruiters: recruiterId } },
      { new: true } as any
    ).lean();

    if (company) {
      await invalidate(`company:${id}`);
    }
    return company;
  }

  async findMany(filters: any = {}, limit = 20, skip = 0) {
    return CompanyModel.find({ ...filters, isDeleted: false } as any)
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filters: any = {}): Promise<number> {
    return CompanyModel.countDocuments({ ...filters, isDeleted: false });
  }

  async delete(id: string) {
    const company = await CompanyModel.findOneAndUpdate(
      { _id: id, isDeleted: false } as any,
      { $set: { isDeleted: true } },
      { new: true } as any
    ).lean();

    if (company) {
      await invalidate(`company:${id}`);
    }
    return company;
  }
}

export const companiesRepository = new CompaniesRepository();
