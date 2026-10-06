import neo4j from "neo4j-driver";
export const driver = neo4j.driver(process.env.NEO4J_URI || "bolt://localhost:7687", neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD || "neo4j_pass"));
export async function runCypher(query, params = {}) {
    const session = driver.session();
    try {
        const result = await session.run(query, params);
        return result.records;
    }
    finally {
        await session.close();
    }
}
