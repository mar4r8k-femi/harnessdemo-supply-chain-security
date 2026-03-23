const request = require("supertest");
const app = require("../src/index");

describe("GET /api/health", () => {
  it("should return 200 with correct shape", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "healthy");
    expect(res.body).toHaveProperty("service", "supplywatch-backend");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("version");
  });
});

describe("GET /api/components", () => {
  it("should return an array of components", async () => {
    const res = await request(app).get("/api/components");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should return a single component by id", async () => {
    const res = await request(app).get("/api/components/comp-001");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", "comp-001");
    expect(res.body).toHaveProperty("name");
  });

  it("should return 404 for unknown component", async () => {
    const res = await request(app).get("/api/components/nonexistent");
    expect(res.statusCode).toBe(404);
  });
});
