module.exports = {
  apps: [
    {
      name: "evershopAzure",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "default",
        PORT: 3000,
      },
    },
  ],
};