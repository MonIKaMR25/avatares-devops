import http from "k6/http";
import { check, sleep } from "k6";
import { generateHtmlReport } from "./report.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Test rápido: 30 segundos, sube a 10 usuarios
export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "10s", target: 10 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
  },
};

const EYES = ["DEFAULT", "CRY", "SURPRISED"];
const MOUTHS = ["DEFAULT", "SMILE", "SAD"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  const health = http.get(`${BASE_URL}/health`);
  check(health, { "health ok": (r) => r.status === 200 });

  const res = http.get(
    `${BASE_URL}/api/avatar?eyes=${pick(EYES)}&mouth=${pick(MOUTHS)}`
  );
  check(res, {
    "avatar ok": (r) => r.status === 200,
    "is svg": (r) => r.body.includes("<svg"),
  });

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    "/reports/quick-report.html": generateHtmlReport(data),
  };
}
