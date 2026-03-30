module.exports = {
  apps: [
    {
      name: "diagnosticoapi",
      script: "./server/index.js",
      cwd: "/opt/diagnosticoapi",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "256M",
    },
  ],
};
