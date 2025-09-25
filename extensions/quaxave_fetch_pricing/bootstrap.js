import path from "path";
import { registerCronJob } from "@evershop/evershop/lib/cronjob";

registerCronJob({
  name: "myCronJob",
  resolve: path.resolve(import.meta.dirname, "jobs/fetchRate.js"),
  schedule: "0 0 * * *",
  enabled: true,
});