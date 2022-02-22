import { execa } from "execa";

import type { RequestHandler } from "@sveltejs/kit";

const testers = {
  dotnet: {
    command: "testers/dotnet/bin/Release/net6.0/dotnet",
    args: [],
  },
  java: {
    command: 'testers/java/app/build/install/app/bin/app',
    args: [],
  },
  javascript: {
    command: 'node',
    args: ['testers/javascript/test.cjs'],
  },
  pcre: {
    command: 'php',
    args: ['testers/pcre/test.php'],
  },
  perl: {
    command: 'perl',
    args: ['testers/perl/test.pl'],
  },
  python: {
    command: 'python3',
    args: ['testers/python/test.py'],
  },
  ruby: {
    command: 'ruby',
    args: ['testers/ruby/test.rb'],
  },
};

export const post: RequestHandler = async ({ request }) => {
  const start = Date.now();
  try {
    const params = await request.json();
    const tester = testers[params.language];
    const timeout = params.timeout;

    const result = await execa(tester.command, tester.args, { input: JSON.stringify(params), timeout });
    return {
      status: 200,
      body: JSON.parse(result.stdout),
    };
  } catch (error) {
    if (error.signal === 'SIGTERM' && error.originalMessage === 'Timed out') {
      return {
        status: 200,
        body: {
          type: 'timeout',
          time: Date.now() - start,
        }
      }
    }

    return {
      status: 200,
      body: {
        type: 'error',
        message: error.message,
        time: Date.now() - start,
      },
    };
  }
}
