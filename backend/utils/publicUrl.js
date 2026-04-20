function getDefaultWebhookBaseUrl() {
  const configuredUrl = process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_PUBLIC_URL;

  if (configuredUrl && typeof configuredUrl === "string") {
    return configuredUrl.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT || 5000}`;
}

module.exports = { getDefaultWebhookBaseUrl };
