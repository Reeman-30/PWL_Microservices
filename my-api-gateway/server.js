const path = require("path");
const express = require("express");
const gateway = require("express-gateway");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

console.log("🚀 Starting My API Gateway...");
console.log(`📁 Config directory: ${path.join(__dirname, "config")}`);

// Create Express app for Swagger
const swaggerApp = express();
swaggerApp.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Gateway Documentation",
    customfavIcon: "/assets/favicon.ico",
  }),
);

// Start Swagger server on different port
const SWAGGER_PORT = 8081;
swaggerApp.listen(SWAGGER_PORT, () => {
  console.log(
    `📚 Swagger UI running on: http://localhost:${SWAGGER_PORT}/api-docs`,
  );
});

// Start Express Gateway
gateway()
  .load(path.join(__dirname, "config"))
  .run()
  .then(() => {
    console.log("\n" + "=".repeat(70));
    console.log("MY API GATEWAY STARTED SUCCESSFULLY");
    console.log("=".repeat(70));
    console.log(`Gateway URL: http://localhost:8080`);
    console.log(`Admin API: http://localhost:9876`);
    console.log(`Swagger UI: http://localhost:${SWAGGER_PORT}/api-docs`);
    console.log("\nConnected Services:");
    console.log(`Book Service: http://localhost:3001`);
    console.log(`User Service: http://localhost:3002`);
    console.log("\nAvailable Endpoints:");
    console.log(`   - Books API: http://localhost:8080/api/books`);
    console.log(`   - Users API: http://localhost:8080/api/users`);
    console.log(`   - Health Check: http://localhost:8080/health`);
    console.log("=".repeat(70) + "\n");
  })
  .catch((err) => {
    console.error("\nGATEWAY FAILED TO START");
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\nShutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");
  process.exit(0);
});
