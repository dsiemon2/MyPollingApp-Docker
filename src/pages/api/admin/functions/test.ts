import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as vm from 'vm';

// Dangerous patterns that should be blocked
const BLOCKED_PATTERNS = [
  /require\s*\(/,
  /import\s+/,
  /process\./,
  /global\./,
  /eval\s*\(/,
  /Function\s*\(/,
  /setTimeout/,
  /setInterval/,
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /__proto__/,
  /constructor\s*\[/,
  /child_process/,
  /fs\./,
  /path\./,
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || !['SUPER_ADMIN', 'POLL_ADMIN'].includes((session.user as any).role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.json({ success: false, error: 'No code provided' });
  }

  // Check for dangerous patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return res.json({
        success: false,
        error: `Blocked: Code contains potentially dangerous pattern (${pattern.source})`
      });
    }
  }

  try {
    // Create a sandboxed context with limited access
    const sandbox = {
      result: undefined as any,
      console: {
        log: (...args: any[]) => { /* no-op */ }
      },
      Math,
      Date,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object,
      // Sample context variables that would be available
      sampleContext: {
        user: { name: 'Test User', email: 'test@example.com' },
        poll: { title: 'Sample Poll', totalVotes: 42 },
        messages: []
      }
    };

    // Wrap the code to capture the result
    const wrappedCode = `
      try {
        const fn = ${code};
        result = typeof fn === 'function' ? fn(sampleContext) : fn;
      } catch (e) {
        result = { error: e.message };
      }
    `;

    // Run in a VM context with timeout
    const context = vm.createContext(sandbox);
    vm.runInContext(wrappedCode, context, {
      timeout: 1000, // 1 second timeout
      displayErrors: true
    });

    if (sandbox.result?.error) {
      return res.json({ success: false, error: sandbox.result.error });
    }

    return res.json({
      success: true,
      result: sandbox.result,
      message: 'Function syntax is valid and executed successfully in sandbox'
    });
  } catch (error: any) {
    // Handle syntax errors and timeouts
    if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      return res.json({ success: false, error: 'Function execution timed out (max 1 second)' });
    }
    return res.json({ success: false, error: error.message });
  }
}
