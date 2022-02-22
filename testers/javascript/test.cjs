const fs = require('fs');

/**
 * @param matchOrError {RegExpExecArray | Error | null matchOrError}
 * @param time {number}
 */
const serialize = (matchOrError, time) => {
  if (matchOrError === null) {
    return {
      type: 'no match',
      time,
    };
  } else if (matchOrError instanceof Error) {
    return {
      type: 'error',
      message: matchOrError.toString(),
      time,
    };
  } else {
    return {
      type: 'match',
      match: {
        index: matchOrError.index,
        indices: Array.from(matchOrError),
        groups: matchOrError.groups ?? {},
      },
      time,
    };
  }
};

(async () => {
  const buffers = [];
  for await (const chunk of process.stdin) {
    buffers.push(chunk);
  }
  const buffer = Buffer.concat(buffers);
  const { source, flags, input } = JSON.parse(buffer.toString('utf-8'));

  const start = Date.now();

  try {
    const regex = new RegExp(source, flags);
    const match = regex.exec(input);
    console.log(JSON.stringify(serialize(match, Date.now() - start)));
  } catch (error) {
    console.log(JSON.stringify(serialize(error, Date.now() - start)));
  }
})();
