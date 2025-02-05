const app = require("../server"); // Import the app instance
const request = require("supertest");

describe("User Authentication Tests", () => {
    let token = "";

    test("Register a new user", async () => {
        const res = await request(app)
            .post("/api/users/register")
            .send({
                username: "testuser",
                password: "password123"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message", "User registered successfully");
    });

    test("Login with valid credentials", async () => {
        const res = await request(app)
            .post("/api/users/login")
            .send({
                username: "testuser",
                password: "password123"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
        token = res.body.token;
    });

    test("Fetch user list (requires authentication)", async () => {
        const res = await request(app)
            .get("/api/users/users")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
    });
});
