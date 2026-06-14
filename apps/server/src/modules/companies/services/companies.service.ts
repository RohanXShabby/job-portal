import { companiesRepository } from "../repositories/companies.repository.js";

export class CompaniesService {
  async getById(id: string) {
    return companiesRepository.findById(id);
  }

  async getBySlug(slug: string) {
    return companiesRepository.findBySlug(slug);
  }

  async create(data: any, recruiterId: string) {
    return companiesRepository.create(data, recruiterId);
  }

  async update(id: string, updateData: any) {
    const company = await companiesRepository.update(id, updateData);
    if (!company) throw new Error("Company not found");
    return company;
  }

  async addRecruiter(companyId: string, recruiterId: string) {
    const company = await companiesRepository.addRecruiter(companyId, recruiterId);
    if (!company) throw new Error("Company not found");
    return company;
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [companies, total] = await Promise.all([
      companiesRepository.findMany({}, limit, skip),
      companiesRepository.count(),
    ]);
    return { companies, total, page, limit };
  }

  async delete(id: string) {
    const company = await companiesRepository.delete(id);
    if (!company) throw new Error("Company not found");
    return company;
  }
}

export const companiesService = new CompaniesService();
