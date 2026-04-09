const Groq = require('groq-sdk');

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function buildFallbackExplanation({ ruleResult, urlScan, urlHaus, mlResult }) {
  const riskLabel = ruleResult.verdict.toLowerCase();
  const parts = [`This URL is ${riskLabel} based on the scan results.`];

  if (ruleResult.flags?.length) {
    const topFlags = ruleResult.flags
      .filter(flag => flag.type !== 'safe')
      .slice(0, 2)
      .map(flag => flag.title.toLowerCase())
      .join(' and ');
    if (topFlags) {
      parts.push(`The strongest signals were ${topFlags}.`);
    }
  }

  if (urlScan?.available && urlScan.malicious) {
    parts.push('URLScan.io also marked it as potentially malicious.');
  } else if (urlHaus?.available && urlHaus.found) {
    parts.push('URLHaus lists this URL in a malware or botnet-related feed.');
  } else if (mlResult?.available) {
    parts.push(`The ML model classified it as ${mlResult.prediction} with ${mlResult.confidence}% confidence.`);
  }

  parts.push('Do not enter credentials on this page and close it if you do not fully trust the source.');
  return parts.join(' ');
}

function buildFallbackChatReply(message, scanContext) {
  const text = message.toLowerCase();

  if (scanContext) {
    return `Based on the scan, this URL looks **${scanContext.verdict.toLowerCase()}** with a risk score of **${scanContext.score}/100**. If you want, I can explain the flags or tell you what to do next.`;
  }

  if (text.includes('clicked') || text.includes('suspicious link')) {
    return 'If you clicked a suspicious link, disconnect from sensitive accounts, change passwords from a clean device, enable MFA, and monitor the account for unusual activity.';
  }

  if (text.includes('phishing') || text.includes('url') || text.includes('link')) {
    return 'Phishing links often hide the real destination with lookalike domains, urgent wording, or fake login pages. Check the domain carefully, avoid opening shortened links, and verify the sender through a separate channel.';
  }

  return 'I can help with phishing, suspicious links, and URL safety. Share a link or ask about a specific security concern and I will break it down.';
}

async function generateExplanation({ url, ruleResult, urlScan, urlHaus, mlResult }) {
  if (!process.env.GROQ_API_KEY) {
    return {
      available: true,
      text: buildFallbackExplanation({ ruleResult, urlScan, urlHaus, mlResult })
    };
  }

  const urlScanSummary = urlScan?.available
    ? `URLScan.io verdict score: ${urlScan.verdict}/100. Malicious: ${urlScan.malicious}. Tags: ${urlScan.tags?.join(', ') || 'none'}.`
    : 'URLScan.io: not available.';

  const urlHausSummary = urlHaus?.available
    ? `URLHaus: ${urlHaus.found ? '⚠️ LISTED in malware database' : 'not listed'}. Status: ${urlHaus.status || 'unknown'}. Threat: ${urlHaus.threat || 'unknown'}.`
    : 'URLHaus: not available.';

  const mlSummary = mlResult?.available
    ? `ML model prediction: ${mlResult.prediction} (confidence: ${mlResult.confidence}%).`
    : '';

  const flagSummary = ruleResult.flags
    .filter(f => f.type !== 'safe')
    .map(f => `• ${f.title}: ${f.desc}`)
    .join('\n');

  const prompt = `You are a cybersecurity expert. Analyze this URL scan result and explain it clearly.

URL: ${url}
Overall risk score: ${ruleResult.score}/100
Verdict: ${ruleResult.verdict}

External API results:
${urlScanSummary}
${urlHausSummary}
${mlSummary}

Rule-based flags detected:
${flagSummary || '(none — URL appears clean)'}

Write a 3–5 sentence plain-English explanation for a non-technical user.
- Lead with the verdict and most critical finding
- Explain what attackers are trying to do (if phishing)
- Mention if external APIs confirmed the threat
- End with one specific actionable recommendation
- No bullet points, no markdown, no headers. Flowing prose only.
- Start with "This URL..."`;

  try {
    const client = getGroqClient();
    if (!client) {
      return {
        available: true,
        text: buildFallbackExplanation({ ruleResult, urlScan, urlHaus, mlResult })
      };
    }

    const msg = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      available: true,
      text: msg.choices?.[0]?.message?.content || buildFallbackExplanation({ ruleResult, urlScan, urlHaus, mlResult })
    };
  } catch (err) {
    console.error('[Groq] Error:', err.message);
    return { available: false, reason: err.message };
  }
}

async function chatResponse({ message, scanContext, history }) {
  if (!process.env.GROQ_API_KEY) {
    return {
      available: true,
      text: buildFallbackChatReply(message, scanContext)
    };
  }

  const systemPrompt = scanContext
    ? `You are a friendly cybersecurity expert assistant. The user just scanned this URL: ${scanContext.url}
Risk score: ${scanContext.score}/100. Verdict: ${scanContext.verdict}.
Flags: ${scanContext.flags?.map(f => f.title).join(', ')}.
Answer concisely in 2–4 sentences. No bullet points or markdown — plain conversational prose. Use <strong> for emphasis.`
    : `You are a friendly cybersecurity expert assistant specializing in phishing, URL safety, and online scams. 
Answer concisely in 2–4 sentences. No bullet points or markdown — plain conversational prose.`;

  const messages = [
    ...(history || []),
    { role: 'user', content: `${systemPrompt}\n\nUser message: ${message}` }
  ];

  try {
    const client = getGroqClient();
    if (!client) {
      return {
        available: true,
        text: buildFallbackChatReply(message, scanContext)
      };
    }

    const msg = await client.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 250,
      messages
    });

    return {
      available: true,
      text: msg.choices?.[0]?.message?.content || buildFallbackChatReply(message, scanContext)
    };
  } catch (err) {
    console.error('[Groq chat] Error:', err.message);
    return { available: false, reason: err.message };
  }
}

module.exports = { generateExplanation, chatResponse };
