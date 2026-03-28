/**
 * labExerciseStore — Persistentie voor Zinsdeellab-oefensdefinities.
 *
 * Opslag: localStorage, key 'zinsdeellab_exercises_v1'
 *
 * Toekomstige MVPs kunnen hier bovenop:
 * - Teacher-editor om exercises aan te maken via SentenceEditorScreen
 * - Built-in exercises laden uit een static JSON file
 * - Sync naar centrale opslag (Google Drive, backend)
 *
 * Bewust weggelaten:
 * - Volledige versie-history (alleen huidige versie opgeslagen)
 * - Validatie van frame-referenties
 * - Exporteren naar deelbare URL
 */

import type { ZinsdeellabExercise } from '../types';

const EXERCISE_KEY = 'zinsdeellab_exercises_v1';

export function getExercises(): ZinsdeellabExercise[] {
  try {
    const raw = localStorage.getItem(EXERCISE_KEY);
    return raw ? (JSON.parse(raw) as ZinsdeellabExercise[]) : [];
  } catch {
    return [];
  }
}

function saveExercises(exercises: ZinsdeellabExercise[]): void {
  try {
    localStorage.setItem(EXERCISE_KEY, JSON.stringify(exercises));
  } catch {
    // localStorage may be unavailable
  }
}

/** Upsert: voeg toe of overschrijf op basis van id */
export function saveExercise(exercise: ZinsdeellabExercise): void {
  const exercises = getExercises();
  const idx = exercises.findIndex(e => e.id === exercise.id);
  if (idx >= 0) {
    exercises[idx] = exercise;
  } else {
    exercises.push(exercise);
  }
  saveExercises(exercises);
}

export function deleteExercise(id: string): void {
  const exercises = getExercises().filter(e => e.id !== id);
  saveExercises(exercises);
}

/**
 * Verhoog version met 1 en update updatedAt.
 * Herberekent contentHash synchroon (btoa-fallback).
 * Returns de bijgewerkte exercise of null als id niet gevonden.
 */
export function bumpVersion(id: string): ZinsdeellabExercise | null {
  const exercises = getExercises();
  const idx = exercises.findIndex(e => e.id === id);
  if (idx < 0) return null;
  const updated: ZinsdeellabExercise = {
    ...exercises[idx],
    version: exercises[idx].version + 1,
    updatedAt: new Date().toISOString(),
    contentHash: computeContentHashSync(exercises[idx]),
  };
  exercises[idx] = updated;
  saveExercises(exercises);
  return updated;
}

/**
 * Synchrone hash van exercise-inhoud.
 * Gebruikt btoa over de geserialiseerde kernvelden.
 * Voor forensische attributie — geen cryptografische garanties nodig.
 */
export function computeContentHashSync(exercise: ZinsdeellabExercise): string {
  const content = JSON.stringify({
    frameId: exercise.frameId,
    exerciseType: exercise.exerciseType,
    level: exercise.level,
    title: exercise.title,
    version: exercise.version,
  });
  try {
    return btoa(encodeURIComponent(content));
  } catch {
    return String(content.length);
  }
}
