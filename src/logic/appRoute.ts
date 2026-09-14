export function isRollenladderRoute(hash: string): boolean {
  return hash === '#/rollenladder';
}

export function shouldResetTrainerOnRouteChange(previousHash: string, nextHash: string): boolean {
  return isRollenladderRoute(previousHash) !== isRollenladderRoute(nextHash);
}
