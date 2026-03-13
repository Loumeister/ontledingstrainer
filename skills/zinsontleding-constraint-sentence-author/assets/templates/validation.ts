export type ValidationResult = {
  ok: boolean;
  reasons: string[];
};

export function validateExerciseCandidate(input: {
  sentence: string;
  focus: string;
  hasUniquePv: boolean;
  hasUniqueOw: boolean;
  isNaturalDutch: boolean;
  usesOnlyRepoRoles: boolean;
  hasSingleMainTrap: boolean;
  hasAmbiguousSchoolAnalysis: boolean;
}): ValidationResult {
  const reasons: string[] = [];

  if (!input.hasUniquePv) reasons.push('Persoonsvorm is niet eenduidig.');
  if (!input.hasUniqueOw) reasons.push('Onderwerp is niet eenduidig.');
  if (!input.isNaturalDutch) reasons.push('Zin klinkt niet natuurlijk.');
  if (!input.usesOnlyRepoRoles) reasons.push('Niet-bestaande labelnaam gebruikt.');
  if (!input.hasSingleMainTrap) reasons.push('Meer dan één hoofdvalkuil aanwezig.');
  if (input.hasAmbiguousSchoolAnalysis) reasons.push('Schoolgrammaticale dubbellezing gedetecteerd.');

  return {
    ok: reasons.length === 0,
    reasons,
  };
}
