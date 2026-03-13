module.exports = {
  apps: [
    {
      name: "evershopAzure",
      script: "start.sh",
      interpreter: "bash",
      env: {
        NODE_ENV: "default",
        PORT: 3000,
      },
    },
  ],
};