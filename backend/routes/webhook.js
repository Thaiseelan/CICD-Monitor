const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../controllers/webhookController");

// GitHub (and others) may send GET/HEAD to verify the endpoint; return 200 so they don't get 404
router.get("/:token", (req, res) =>
  res.status(200).json({ ok: true, message: "Webhook endpoint ready" })
);
router.head("/:token", (req, res) => res.status(200).end());

router.post("/", handleWebhook);
router.post("/:token", handleWebhook);

module.exports = router;
