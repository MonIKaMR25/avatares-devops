import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { generateHtmlReport } from "./report.js";

const errorRate = new Rate("errors");
const avatarDuration = new Trend("avatar_render_duration", true);
const galleryDuration = new Trend("gallery_duration", true);

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  scenarios: {
    browse: {
      executor: "constant-vus",
      vus: 5,
      duration: "2m",
      exec: "browseFlow",
    },
    generate: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 0 },
      ],
      exec: "generateFlow",
    },
    gallery: {
      executor: "constant-arrival-rate",
      rate: 5,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 10,
      exec: "galleryFlow",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    errors: ["rate<0.05"],
    avatar_render_duration: ["p(95)<400"],
  },
};

const EYES = ["DEFAULT", "CRY", "SURPRISED", "HAPPY", "CLOSE"];
const MOUTHS = ["DEFAULT", "SMILE", "SAD", "SERIOUS", "TONGUE"];
const HAIR = ["BUN", "FRIZZLE", "SHAGGY", "CURLY", "NONE"];
const EYEBROWS = ["DEFAULT", "UP_DOWN", "ANGRY", "SAD_CONCERNED"];
const SKIN = ["%23FBD2C7", "%23D08B5B", "%23614335", "%23F8D25C"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAvatarParams() {
  return `eyes=${pick(EYES)}&mouth=${pick(MOUTHS)}&top=${pick(HAIR)}&eyebrows=${pick(EYEBROWS)}&skin_color=${pick(SKIN)}`;
}

export function browseFlow() {
  const spec = http.get(`${BASE_URL}/api/avatar/spec`);
  check(spec, {
    "spec status 200": (r) => r.status === 200,
    "spec has parts": (r) => JSON.parse(r.body).parts !== undefined,
  });
  errorRate.add(spec.status !== 200);

  const health = http.get(`${BASE_URL}/health`);
  check(health, { "health status 200": (r) => r.status === 200 });
  errorRate.add(health.status !== 200);

  sleep(1 + Math.random() * 2);
}

export function generateFlow() {
  const params = randomAvatarParams();
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/avatar?${params}`);
  avatarDuration.add(Date.now() - start);

  check(res, {
    "avatar status 200": (r) => r.status === 200,
    "avatar is SVG": (r) => r.headers["Content-Type"].includes("svg"),
    "avatar has content": (r) => r.body.length > 100,
  });
  errorRate.add(res.status !== 200);

  sleep(0.5 + Math.random());

  const params2 = randomAvatarParams();
  const res2 = http.get(`${BASE_URL}/api/avatar?${params2}`);
  check(res2, { "avatar2 status 200": (r) => r.status === 200 });
  errorRate.add(res2.status !== 200);

  sleep(0.5 + Math.random());
}

export function galleryFlow() {
  const params = randomAvatarParams();
  const name = `k6-user-${Date.now()}`;

  const start = Date.now();
  const save = http.post(
    `${BASE_URL}/api/gallery`,
    JSON.stringify({ name, params }),
    { headers: { "Content-Type": "application/json" } }
  );
  galleryDuration.add(Date.now() - start);

  const saveOk = check(save, {
    "save status 201": (r) => r.status === 201,
    "save returns id": (r) => JSON.parse(r.body).id !== undefined,
  });
  errorRate.add(!saveOk);

  const list = http.get(`${BASE_URL}/api/gallery`);
  check(list, {
    "list status 200": (r) => r.status === 200,
    "list is array": (r) => Array.isArray(JSON.parse(r.body)),
  });
  errorRate.add(list.status !== 200);

  if (save.status === 201) {
    const id = JSON.parse(save.body).id;
    const del = http.del(`${BASE_URL}/api/gallery/${id}`);
    check(del, { "delete status 204": (r) => r.status === 204 });
    errorRate.add(del.status !== 204);
  }

  sleep(0.2);
}

export function handleSummary(data) {
  return {
    "/reports/full-report.html": generateHtmlReport(data),
  };
}
