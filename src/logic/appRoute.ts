export function isRollenladderRoute(hash: string): boolean {
  return hash === '#/rollenladder';
}

/** Hidden entry point for the not yet released bijzin analysis. */
export function isBijzinOntledingRoute(hash: string): boolean {
  return hash === '#/bijzinontleding';
}

export function shouldResetTrainerOnRouteChange(previousHash: string, nextHash: string): boolean {
  return isRollenladderRoute(previousHash) !== isRollenladderRoute(nextHash);
}

export function shouldClearSelectedLevelOnLadderToggle(previousEnabled: boolean, nextEnabled: boolean): boolean {
  return previousEnabled !== nextEnabled;
}
