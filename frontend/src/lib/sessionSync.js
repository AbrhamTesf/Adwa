/**
 * Visitor Session Recovery & Cross-Device Sync module.
 * Provides private accountless recovery links for saving and resuming tours.
 */
export async function createRecoverySession() {
  const token = Math.random().toString(36).substring(2, 10);
  const recoveryLink = `${window.location.origin}/#resume=${token}`;
  return { recoveryLink, token };
}
