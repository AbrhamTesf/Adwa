/**
 * Normalizes error contracts across all AI provider proxies so the
 * client never has to branch on provider-specific error shapes.
 */
export function normalizeError(res, err) {
  const status = err.status || 502;
  return res.code(status).send({
    error: true,
    message: err.message || "Upstream AI provider error",
    provider: err.provider || "unknown",
    retryable: status >= 500
  });
}
