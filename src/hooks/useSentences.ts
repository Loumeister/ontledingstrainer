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

export function useSentences(selectedLevel: DifficultyLevel | null): UseSentencesReturn {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Kon zinnen niet laden.');
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

  return { sentences, isLoading, error, findSentenceById };
}
