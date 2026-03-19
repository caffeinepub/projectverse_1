import { createActorWithConfig } from "../config";

let actorCache: any = null;

async function getActor(): Promise<any | null> {
  try {
    if (!actorCache) {
      actorCache = await createActorWithConfig();
    }
    return actorCache;
  } catch {
    return null;
  }
}

export const backendService = {
  async saveUser(loginCode: string, user: object): Promise<void> {
    try {
      const actor = await getActor();
      if (!actor) return;
      await (actor as any).kvSet(`user:${loginCode}`, JSON.stringify(user));
    } catch {
      /* silent fail */
    }
  },

  async getUser(loginCode: string): Promise<object | null> {
    try {
      const actor = await getActor();
      if (!actor) return null;
      const result = await (actor as any).kvGet(`user:${loginCode}`);
      if (result && result.__kind__ === "Some") {
        return JSON.parse(result.value);
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveCompany(company: any, userId: string): Promise<void> {
    try {
      const actor = await getActor();
      if (!actor) return;
      await (actor as any).kvSet(
        `company:${company.id}`,
        JSON.stringify(company),
      );
      await (actor as any).kvSet(`member:${userId}:${company.id}`, company.id);
    } catch {
      /* silent fail */
    }
  },

  async syncUserCompanies(userId: string): Promise<any[]> {
    try {
      const actor = await getActor();
      if (!actor) return [];
      const allCompanyJsons: string[] = await (actor as any).kvList("company:");
      const companies: any[] = [];
      for (const json of allCompanyJsons) {
        try {
          const c = JSON.parse(json);
          if (c.members?.some((m: any) => m.userId === userId)) {
            companies.push(c);
          }
        } catch {}
      }
      return companies;
    } catch {
      return [];
    }
  },

  async saveData(key: string, data: any[]): Promise<void> {
    try {
      const actor = await getActor();
      if (!actor) return;
      await (actor as any).kvSet(key, JSON.stringify(data));
    } catch {
      /* silent fail */
    }
  },

  async loadData(key: string): Promise<any[] | null> {
    try {
      const actor = await getActor();
      if (!actor) return null;
      const result = await (actor as any).kvGet(key);
      if (result && result.__kind__ === "Some") {
        return JSON.parse(result.value);
      }
      return null;
    } catch {
      return null;
    }
  },
};
