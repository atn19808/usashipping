module.exports = {
  apps: [
    {
      name: "evershopAzure",
      script: "npm",
      args: "run start",
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      env: {
        NODE_ENV: "default",
        PORT: 3000,
      },
    },
  ],
};