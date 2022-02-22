export type MatchResult =
  | MatchResultMatch
  | MatchResultNoMatch
  | MatchResultError
  | MatchResultTimeout;

export type Match = {
  index: number;
  indices: (string | null)[];
  groups: Record<string, string | null> | null;
};

export type MatchResultMatch = {
  type: 'match';
  match: Match;
  time: number;
};

export type MatchResultNoMatch = {
  type: 'no match';
  time: number;
};

export type MatchResultError = {
  type: 'error';
  message: string;
  time: number;
};

export type MatchResultTimeout = {
  type: 'timeout';
  time: number;
}

const globalEval = eval;

const parse = (regex: string) => {
  if (!regex.startsWith('/')) {
    throw new Error('invalid regex');
  }
  const lastSlash = regex.lastIndexOf('/');
  return {
    source: regex.slice(1, lastSlash),
    flags: regex.slice(lastSlash + 1),
  };
};

export const match = async (language: string, regex: string, inputScript: string, timeoutSeconds: number): Promise<MatchResult> => {
  const start = Date.now();
  try {
    const { source, flags } = parse(regex);
    const input = globalEval(inputScript);
    const timeout = timeoutSeconds * 1000;

    const response = await fetch('/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language, source, flags, input, timeout }),
    });
    return await response.json();
  } catch (error) {
    return {
      type: 'error',
      message: error.message,
      time: Date.now() - start,
    }
  }
};
