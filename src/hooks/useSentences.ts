import { useState, useEffect, useCallback } from 'react';
import { Sentence, DifficultyLevel } from '../types';
import {
  loadSentencesByLevel,
  loadAllSentences,
  findSentenceInCache,
} from '../data/sentenceLoader';

interface UseSentencesReturn {
  sentences: Sentence[];
  isLoading: boolean;
  error: string | null;
  findSentenceById: (id: number) => Promise<Sentence | undefined>;
}

/** Nog niets geladen. */
const NOT_LOADED = Symbol('not-loaded');

/**
 * Hoort de geladen zinnenset bij het gekozen niveau? Direct na een niveauwissel
 * is dat nog niet zo: de oude set staat er nog tot het laden klaar is.
 */
export function isCorpusCurrent(
  loadedLevel: DifficultyLevel | null | typeof NOT_LOADED,
  selectedLevel: DifficultyLevel | null,
): boolean {
  return loadedLevel === selectedLevel;
}

export function useSentences(selectedLevel: DifficultyLevel | null): UseSentencesReturn {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedLevel, setLoadedLevel] = useState<DifficultyLevel | null | typeof NOT_LOADED>(NOT_LOADED);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        let data: Sentence[];
        if (selectedLevel !== null) {
          data = await loadSentencesByLevel(selectedLevel);
        } else {
          data = await loadAllSentences();
        }
        if (!cancelled) {
          setSentences(data);
          setLoadedLevel(selectedLevel);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Kon zinnen niet laden.');
          setLoadedLevel(selectedLevel);
          setIsLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedLevel]);

  const findSentenceById = useCallback(async (id: number): Promise<Sentence | undefined> => {
    const cached = findSentenceInCache(id);
    if (cached) return cached;
    const all = await loadAllSentences();
    return all.find(s => s.id === id);
  }, []);

  // isLoading wordt pas in het effect gezet; tot die tijd hoort de set nog bij het vorige niveau.
  return { sentences, isLoading: isLoading || !isCorpusCurrent(loadedLevel, selectedLevel), error, findSentenceById };
}
