module.exports = {
  apps: [
    {
      name: "evershopAzure",
      script: "node_modules/@evershop/evershop/bin/evershop",
      args: "start",
      env: {
        NODE_ENV: "default",
        PORT: 3000,
      },
    },
  ],
};