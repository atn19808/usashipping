module.exports = {
  apps: [
    {
      name: "evershopAzure",
      script: "node",
      env: {
        NODE_ENV: "default",
        PORT: 3000,
      },
      args: "node_modules/@evershop/evershop/bin/evershop start",
    },
  ],
};