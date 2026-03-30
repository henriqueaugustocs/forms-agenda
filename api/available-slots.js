import getAvailableSlotsHandler from "./get-available-slots.js";

export default async function handler(req, res) {
  return getAvailableSlotsHandler(req, res);
}
