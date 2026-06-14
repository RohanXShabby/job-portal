import { Client as ElasticClient } from "@elastic/elasticsearch";
import { Meilisearch, type SearchParams } from "meilisearch";

export interface SearchQueryParams {
  query: string;
  filters?: {
    location?: string;
    skills?: string[];
    experienceLevel?: string;
    type?: string;
    minSalary?: number;
    maxSalary?: number;
    companyId?: string;
  };
  page?: number;
  limit?: number;
}

export interface SearchResultItem<T> {
  id: string;
  score?: number;
  source: T;
}

export interface SearchResultResponse<T> {
  results: SearchResultItem<T>[];
  total: number;
  page: number;
  limit: number;
}

export interface ISearchService {
  indexJob(job: any): Promise<void>;
  updateJob(job: any): Promise<void>;
  deleteJob(jobId: string): Promise<void>;
  searchJobs(params: SearchQueryParams): Promise<SearchResultResponse<any>>;
  healthCheck(): Promise<{ status: "available" | "unavailable"; engine: string }>;
}

// ----------------------------------------------------------------------------
// 1. Elasticsearch Provider
// ----------------------------------------------------------------------------
class ElasticsearchService implements ISearchService {
  private client: ElasticClient;
  private indexName = "jobs";

  constructor(node: string, apiKey?: string) {
    this.client = new ElasticClient({
      node,
      auth: apiKey ? { apiKey } : undefined,
    });
  }

  async indexJob(job: any): Promise<void> {
    await this.client.index({
      index: this.indexName,
      id: job._id.toString(),
      document: {
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        companyId: job.companyId.toString(),
        companyName: job.companyName,
        location: job.location,
        type: job.type,
        skillsRequired: job.skillsRequired,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryRange.min,
        salaryMax: job.salaryRange.max,
        createdAt: job.createdAt,
      },
      refresh: "wait_for",
    });
  }

  async updateJob(job: any): Promise<void> {
    await this.client.update({
      index: this.indexName,
      id: job._id.toString(),
      doc: {
        title: job.title,
        description: job.description,
        companyName: job.companyName,
        location: job.location,
        type: job.type,
        skillsRequired: job.skillsRequired,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryRange.min,
        salaryMax: job.salaryRange.max,
      },
      refresh: "wait_for",
    });
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.client.delete({
      index: this.indexName,
      id: jobId,
      refresh: "wait_for",
    });
  }

  async searchJobs(params: SearchQueryParams): Promise<SearchResultResponse<any>> {
    const { query, filters, page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const must: any[] = [];
    const filter: any[] = [];

    // Full text & fuzzy matching
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ["title^3", "description", "companyName^2", "skillsRequired^2"],
          fuzziness: "AUTO",
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Apply structured filters
    if (filters) {
      if (filters.location) {
        filter.push({ match: { location: filters.location } });
      }
      if (filters.type) {
        filter.push({ term: { type: filters.type } });
      }
      if (filters.experienceLevel) {
        filter.push({ term: { experienceLevel: filters.experienceLevel } });
      }
      if (filters.companyId) {
        filter.push({ term: { companyId: filters.companyId } });
      }
      if (filters.skills && filters.skills.length > 0) {
        filters.skills.forEach((skill) => {
          filter.push({ term: { skillsRequired: skill } });
        });
      }
      if (filters.minSalary !== undefined || filters.maxSalary !== undefined) {
        const range: any = {};
        if (filters.minSalary !== undefined) range.gte = filters.minSalary;
        if (filters.maxSalary !== undefined) range.lte = filters.maxSalary;
        filter.push({ range: { salaryMin: range } });
      }
    }

    try {
      const response = await this.client.search({
        index: this.indexName,
        from,
        size: limit,
        query: {
          bool: {
            must,
            filter,
          },
        },
      });

      const total = typeof response.hits.total === "number" ? response.hits.total : (response.hits.total?.value || 0);

      const results = response.hits.hits.map((hit) => ({
        id: hit._id || "",
        score: hit._score ?? undefined,
        source: hit._source as any,
      }));

      return { results, total, page, limit };
    } catch (err) {
      console.error("Elasticsearch query error:", err);
      throw err;
    }
  }

  async healthCheck(): Promise<{ status: "available" | "unavailable"; engine: string }> {
    try {
      const ping = await this.client.ping();
      return { status: ping ? "available" : "unavailable", engine: "elasticsearch" };
    } catch {
      return { status: "unavailable", engine: "elasticsearch" };
    }
  }
}

// ----------------------------------------------------------------------------
// 2. Meilisearch Provider (Local Dev / Fallback)
// ----------------------------------------------------------------------------
class MeilisearchService implements ISearchService {
  private client: Meilisearch;
  private indexName = "jobs";

  constructor(host: string, apiKey?: string) {
    this.client = new Meilisearch({ host, apiKey });
  }

  async indexJob(job: any): Promise<void> {
    const index = this.client.index(this.indexName);
    await index.addDocuments([
      {
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        companyId: job.companyId.toString(),
        companyName: job.companyName,
        location: job.location,
        type: job.type,
        skillsRequired: job.skillsRequired,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryRange.min,
        salaryMax: job.salaryRange.max,
        createdAt: job.createdAt,
      },
    ]);
  }

  async updateJob(job: any): Promise<void> {
    const index = this.client.index(this.indexName);
    await index.updateDocuments([
      {
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        companyName: job.companyName,
        location: job.location,
        type: job.type,
        skillsRequired: job.skillsRequired,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryRange.min,
        salaryMax: job.salaryRange.max,
      },
    ]);
  }

  async deleteJob(jobId: string): Promise<void> {
    const index = this.client.index(this.indexName);
    await index.deleteDocument(jobId);
  }

  async searchJobs(params: SearchQueryParams): Promise<SearchResultResponse<any>> {
    const { query, filters, page = 1, limit = 20 } = params;
    const index = this.client.index(this.indexName);

    const filterStrings: string[] = [];

    if (filters) {
      if (filters.location) {
        filterStrings.push(`location = "${filters.location}"`);
      }
      if (filters.type) {
        filterStrings.push(`type = "${filters.type}"`);
      }
      if (filters.experienceLevel) {
        filterStrings.push(`experienceLevel = "${filters.experienceLevel}"`);
      }
      if (filters.companyId) {
        filterStrings.push(`companyId = "${filters.companyId}"`);
      }
      if (filters.skills && filters.skills.length > 0) {
        filters.skills.forEach((skill) => {
          filterStrings.push(`skillsRequired = "${skill}"`);
        });
      }
      if (filters.minSalary !== undefined) {
        filterStrings.push(`salaryMin >= ${filters.minSalary}`);
      }
      if (filters.maxSalary !== undefined) {
        filterStrings.push(`salaryMin <= ${filters.maxSalary}`);
      }
    }

    const options: SearchParams = {
      offset: (page - 1) * limit,
      limit,
      filter: filterStrings.length > 0 ? filterStrings.join(" AND ") : undefined,
    };

    const response = await index.search(query, options);

    const results = response.hits.map((hit) => ({
      id: hit.id,
      source: hit,
    }));

    return {
      results,
      total: response.estimatedTotalHits ?? response.hits.length,
      page,
      limit,
    };
  }

  async healthCheck(): Promise<{ status: "available" | "unavailable"; engine: string }> {
    try {
      const health = await this.client.health();
      return { status: health.status === "available" ? "available" : "unavailable", engine: "meilisearch" };
    } catch {
      return { status: "unavailable", engine: "meilisearch" };
    }
  }
}

// ----------------------------------------------------------------------------
// Search Service Factory & Exports
// ----------------------------------------------------------------------------
const elasticNode = process.env.ELASTICSEARCH_NODE;
const elasticApiKey = process.env.ELASTICSEARCH_API_KEY;
const meiliHost = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const meiliApiKey = process.env.MEILISEARCH_API_KEY;

export let searchService: ISearchService;

if (elasticNode) {
  console.log(`[Search] Initializing Elasticsearch client on node: ${elasticNode}`);
  searchService = new ElasticsearchService(elasticNode, elasticApiKey);
} else {
  console.log(`[Search] Falling back to Meilisearch client on host: ${meiliHost}`);
  searchService = new MeilisearchService(meiliHost, meiliApiKey);
}
