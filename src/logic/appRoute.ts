export function isRollenladderRoute(hash: string): boolean {
  return hash === '#/rollenladder';
}

export function shouldResetTrainerOnRouteChange(previousHash: string, nextHash: string): boolean {
  return isRollenladderRoute(previousHash) !== isRollenladderRoute(nextHash);
}

export function shouldClearSelectedLevelOnLadderToggle(previousEnabled: boolean, nextEnabled: boolean): boolean {
  return previousEnabled !== nextEnabled;
}
