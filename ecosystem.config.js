module.exports = {
  apps: [
    {
      name: "evershopAzure",
      script: "npm",
      env: {
        NODE_ENV: "default",
        PORT: 3000,
      },
      args: "run start",
    },
  ],
};