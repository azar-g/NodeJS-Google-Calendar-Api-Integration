export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Appointments API",
      description: "Calendar API information",
      schemes: ["http", "https"],
      servers: [
        {
          url: "http://localhost:8080",
        },
      ],
    },
  },
  apis: [`${__dirname}/routes/*.ts`, "./build/routes/*.js"],
};
