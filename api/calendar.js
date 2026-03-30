// Mock calendar API - no external dependencies

import createEventHandler from "./create-event.js";

export default async function handler(req, res) {
  return createEventHandler(req, res);
}
