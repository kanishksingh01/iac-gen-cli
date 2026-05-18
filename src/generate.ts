export type Cloud = 'aws' | 'gcp' | 'azure';
export type Format = 'terraform' | 'ansible';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function getSystemPrompt(format: Format): string {
  if (format === 'ansible') {
    return (
      'You are an expert Ansible engineer. Generate production-quality Ansible playbook YAML ' +
      'for the user\'s request. Output ONLY valid YAML, no explanations, no markdown fences.'
    );
  }
  return (
    'You are an expert Terraform engineer. Generate production-quality Terraform HCL for the ' +
    'user\'s request. Output ONLY valid Terraform HCL code, no explanations, no markdown fences. ' +
    'Include provider configuration and all necessary resources.'
  );
}

function getUserPrompt(description: string, cloud: Cloud, format: Format): string {
  if (format === 'ansible') {
    return `Generate an Ansible playbook for the following: ${description}`;
  }
  return `Generate Terraform HCL for the following on ${cloud.toUpperCase()}: ${description}`;
}

/**
 * Strips leading/trailing code fences that the model may emit despite instructions.
 * e.g. ```hcl ... ``` or ```yaml ... ```
 */
function stripCodeFences(text: string): string {
  return text
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

export async function generate(
  description: string,
  cloud: Cloud,
  format: Format
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.IAC_GEN_API_KEY;

  if (!apiKey) {
    process.stderr.write(
      'Error: API key not found.\n' +
      'Set GROQ_API_KEY or IAC_GEN_API_KEY in your environment:\n\n' +
      '  export GROQ_API_KEY=your_key_here\n\n' +
      'Get a free key at https://console.groq.com\n'
    );
    process.exit(1);
  }

  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: getSystemPrompt(format) },
      { role: 'user', content: getUserPrompt(description, cloud, format) },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error contacting Groq API: ${message}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      detail = errBody?.error?.message ?? '';
    } catch {
      // ignore parse errors on error body
    }
    throw new Error(
      `Groq API returned ${response.status} ${response.statusText}${detail ? ': ' + detail : ''}`
    );
  }

  interface GroqResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  }

  const data = (await response.json()) as GroqResponse;
  const raw = data?.choices?.[0]?.message?.content ?? '';

  if (!raw) {
    throw new Error('Groq API returned an empty response. Please try again.');
  }

  return stripCodeFences(raw);
}
