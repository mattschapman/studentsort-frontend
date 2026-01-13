// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/block-ordering-optimizer.ts

interface LessonData {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  tgNumber: number;
  lessonNumber: number;
  length: number;
}

interface MetaLessonData {
  id: string;
  number: number;
  length: number;
  periods: Array<{ id: string; number: number }>;
}

/**
 * Optimizes lesson assignments to minimize the maximum concurrent lessons
 * of any subject in each meta period.
 * 
 * Strategy: For each lesson, assign it to the meta period that currently has
 * the fewest lessons of that subject. This spreads subjects across time slots
 * to reduce the peak number of teachers needed per subject.
 */
export function optimizeLessonAssignments(
  allLessons: LessonData[],
  metaLessons: MetaLessonData[]
): Record<string, string> {
  const mappings: Record<string, string> = {};

  // Map periodId -> subjectId -> count
  const subjectCounts: Record<string, Record<string, number>> = {};
  // Map periodId -> set of tgNumbers assigned in that period
  const tgAssignments: Record<string, Set<number>> = {};

  // helper: map periodId -> metaLesson (so we can find both periods for doubles quickly)
  const periodToMeta: Record<string, MetaLessonData> = {};

  metaLessons.forEach(ml => {
    ml.periods.forEach(p => {
      subjectCounts[p.id] = {};
      tgAssignments[p.id] = new Set();
      periodToMeta[p.id] = ml;
    });
  });

  // Count how many lessons each subject has (used to order hardest first)
  const subjectFrequency: Record<string, number> = {};
  for (const l of allLessons) {
    subjectFrequency[l.subjectId] = (subjectFrequency[l.subjectId] || 0) + 1;
  }

  // Order lessons: biggest subject groups first, and longer lessons first.
  // Within same priority, shuffle so ties are random
  const shuffled = [...allLessons].sort(() => Math.random() - 0.5);
  const lessonsOrdered = shuffled.sort((a, b) => {
    const sfDiff = (subjectFrequency[b.subjectId] || 0) - (subjectFrequency[a.subjectId] || 0);
    if (sfDiff !== 0) return sfDiff;
    // longer lessons first
    if (b.length !== a.length) return b.length - a.length;
    return 0;
  });

  // Helper to compute current peak count for a subject across all periods
  const currentPeakForSubject = (subjectId: string) => {
    let peak = 0;
    for (const pid of Object.keys(subjectCounts)) {
      const c = subjectCounts[pid][subjectId] || 0;
      if (c > peak) peak = c;
    }
    return peak;
  };

  // Assign each lesson
  for (const lesson of lessonsOrdered) {
    // Build compatible candidate period IDs
    const compatible: string[] = [];

    for (const ml of metaLessons) {
      if (lesson.length === 1) {
        // single lesson can go in any single or double meta period slot
        ml.periods.forEach(p => compatible.push(p.id));
      } else if (lesson.length === 2) {
        // double lesson requires a double meta lesson; assign to the first period ID
        if (ml.length === 2) {
          compatible.push(ml.periods[0].id);
        }
      }
    }

    // Filter out periods where this TG is already assigned (for double lessons both periods must be free)
    const available: string[] = compatible.filter(pid => {
      const ml = periodToMeta[pid];
      if (!ml) return false;
      // if single lesson -> just check this period
      if (lesson.length === 1) {
        return !tgAssignments[pid].has(lesson.tgNumber);
      } else {
        // double lesson -> both periods of ml must not have this TG
        return ml.periods.every(p => !tgAssignments[p.id].has(lesson.tgNumber));
      }
    });

    if (available.length === 0) {
      // No available period for this lesson under constraints. We still try to place it
      // in any compatible period ignoring TG conflict (best-effort fallback). This allows
      // scheduling in tight situations per your note that sometimes there isn't wiggle room.
      // We'll prefer compatible periods even if the TG is already present elsewhere.
      // (If you want strict failure instead, remove this fallback.)
      for (const pid of compatible) {
        const ml = periodToMeta[pid];
        if (!ml) continue;
        if (lesson.length === 1) {
          available.push(pid);
        } else if (lesson.length === 2 && ml.length === 2) {
          available.push(pid);
        }
      }
      if (available.length === 0) {
        console.warn(`No compatible meta period found for lesson ${lesson.id}`);
        continue;
      }
    }

    // Evaluate candidates: pick those that minimize the subject's resulting peak
    const subjId = lesson.subjectId;
    const currentPeak = currentPeakForSubject(subjId);

    let bestScore = Infinity;
    const candidates: string[] = [];

    for (const pid of available) {
      // For single lesson, placement affects one period; for double, it affects both periods
      const ml = periodToMeta[pid];
      if (!ml) continue;

      // compute the maximum count for this subject after placement
      let localMaxAfter = 0;
      if (lesson.length === 1) {
        // simulate increment at pid
        for (const pIdKey of Object.keys(subjectCounts)) {
          const val = (pIdKey === pid ? (subjectCounts[pIdKey][subjId] || 0) + 1 : (subjectCounts[pIdKey][subjId] || 0));
          if (val > localMaxAfter) localMaxAfter = val;
        }
      } else {
        // double -> both periods of ml are incremented
        const impacted = new Set(ml.periods.map(p => p.id));
        for (const pIdKey of Object.keys(subjectCounts)) {
          const base = subjectCounts[pIdKey][subjId] || 0;
          const val = impacted.has(pIdKey) ? base + 1 : base;
          if (val > localMaxAfter) localMaxAfter = val;
        }
      }

      // primary objective: keep subject peak low (localMaxAfter). Lower is better.
      // secondary objective: prefer candidate with lower current local count on that period(s)
      // Combine into a score tuple (localMaxAfter, sumLocalCounts) -> flatten to number.
      let sumLocalCounts = 0;
      if (lesson.length === 1) {
        sumLocalCounts = (subjectCounts[pid][subjId] || 0);
      } else {
        sumLocalCounts = ml.periods.reduce((s, p) => s + (subjectCounts[p.id][subjId] || 0), 0);
      }

      // Create a numeric score that preserves lexicographic order:
      // primary = localMaxAfter, secondary = sumLocalCounts
      const score = localMaxAfter * 10000 + sumLocalCounts; // 10000 is a large multiplier to keep lexicographic ordering

      if (score < bestScore) {
        bestScore = score;
        candidates.length = 0;
        candidates.push(pid);
      } else if (score === bestScore) {
        candidates.push(pid);
      }
    }

    if (candidates.length === 0) {
      console.warn(`No candidate periods after evaluation for lesson ${lesson.id}`);
      continue;
    }

    // random tie-break
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // Assign
    mappings[lesson.id] = selected;

    if (lesson.length === 1) {
      subjectCounts[selected][lesson.subjectId] = (subjectCounts[selected][lesson.subjectId] || 0) + 1;
      tgAssignments[selected].add(lesson.tgNumber);
    } else {
      // mark both periods
      const ml = periodToMeta[selected];
      if (ml && ml.length === 2) {
        ml.periods.forEach(p => {
          subjectCounts[p.id][lesson.subjectId] = (subjectCounts[p.id][lesson.subjectId] || 0) + 1;
          tgAssignments[p.id].add(lesson.tgNumber);
        });
      } else {
        // fallback (shouldn't happen because available was built from double meta lessons)
        subjectCounts[selected][lesson.subjectId] = (subjectCounts[selected][lesson.subjectId] || 0) + 1;
        tgAssignments[selected].add(lesson.tgNumber);
      }
    }
  }

  return mappings;
}