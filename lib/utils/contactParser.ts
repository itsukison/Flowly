/**
 * Contact information parser for Japanese 特定商取引法 pages
 * Extracts email, phone, address, and representative name
 */

export interface ContactInfo {
  email: string | null;
  phone: string | null;
  address: string | null;
  representative: string | null;
  confidence: number;
}

/**
 * Parse contact information from markdown text using regex patterns
 * Uses multi-pass approach: strict patterns first, then loose patterns
 */
export function parseContactInfo(markdown: string): ContactInfo {
  console.log('=== REGEX PARSING START ===');
  console.log('Input markdown length:', markdown.length);
  console.log('First 500 chars:', markdown.substring(0, 500));
  
  const result: ContactInfo = {
    email: null,
    phone: null,
    address: null,
    representative: null,
    confidence: 0,
  };

  // Email pattern - comprehensive
  const emailPatterns = [
    /(?:メールアドレス|Email|E-mail|mail|メール|e-mail|Eメール)[:：\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i, // Fallback: any email pattern
  ];
  
  for (const pattern of emailPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      result.email = match[1].trim();
      result.confidence += 30;
      console.log('✓ Email found:', result.email);
      break;
    }
  }
  if (!result.email) console.log('✗ Email not found');

  // Phone pattern (Japanese format) - comprehensive
  const phonePatterns = [
    /(?:電話番号|TEL|Tel|電話|℡|tel|Phone|phone)[:：\s]*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/i,
    /(?:電話|TEL|tel)(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/i, // No delimiter
  ];
  
  for (const pattern of phonePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      result.phone = normalizePhone(match[1]);
      result.confidence += 30;
      console.log('✓ Phone found:', result.phone);
      break;
    }
  }
  if (!result.phone) console.log('✗ Phone not found');

  // Address pattern - comprehensive
  const addressPatterns = [
    /(?:住所|所在地|Address|本社所在地|address|事業所所在地)[:：\s]*([^\n]{10,150})/i,
    /(?:〒|郵便番号)[\s]*\d{3}[-\s]?\d{4}[\s]*([^\n]{10,150})/i, // Postal code format
  ];
  
  for (const pattern of addressPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      result.address = match[1].trim();
      result.confidence += 20;
      console.log('✓ Address found:', result.address);
      break;
    }
  }
  if (!result.address) console.log('✗ Address not found');

  // Representative name pattern - comprehensive with multi-pass
  const repPatterns = [
    // Strict patterns with delimiter
    /(?:事業者の名称|事業者名|代表者|代表取締役|CEO|代表|責任者|担当者|販売責任者名|販売責任者|氏名|名前|運営責任者|店舗運営責任者)[:：\s]+([^\n]{2,30})/i,
    // Loose patterns without delimiter (for concatenated cases like "名称石本")
    /(?:名称|代表者|責任者|氏名)([^\n]{2,30})/i,
    // Markdown header format
    /##\s*(?:事業者の名称|事業者名|代表者|氏名)\s*\n\s*([^\n]{2,30})/i,
  ];
  
  for (const pattern of repPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const name = match[1].trim();
      // Validate: should not be a label itself or too generic
      if (name && !name.match(/^(?:名称|代表|責任者|氏名|担当)$/i)) {
        result.representative = name;
        result.confidence += 20;
        console.log('✓ Representative found:', result.representative);
        break;
      }
    }
  }
  if (!result.representative) console.log('✗ Representative not found');

  console.log('Final confidence:', result.confidence);
  console.log('=== REGEX PARSING END ===\n');

  return result;
}

/**
 * Normalize Japanese phone number format
 */
function normalizePhone(phone: string): string {
  // Convert full-width to half-width
  phone = phone.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );

  // Remove spaces
  phone = phone.replace(/\s/g, '');

  // Add hyphens if missing
  if (!phone.includes('-')) {
    if (phone.startsWith('0')) {
      const areaCode = phone.length === 10 ? phone.slice(0, 3) : phone.slice(0, 4);
      const middle = phone.slice(areaCode.length, -4);
      const last = phone.slice(-4);
      phone = `${areaCode}-${middle}-${last}`;
    }
  }

  return phone;
}

/**
 * Extract relevant section from markdown for AI parsing
 * Returns full markdown if under 8000 chars, otherwise extracts relevant section
 */
export function extractRelevantSection(markdown: string): string {
  // If markdown is short enough, send it all (Gemini can handle it)
  if (markdown.length <= 8000) {
    console.log('Sending full markdown to Gemini (length:', markdown.length, ')');
    return markdown;
  }

  console.log('Markdown too long, extracting relevant section...');
  
  const keywords = [
    '特定商取引', '特商法', '会社概要', '販売業者', '運営会社', 
    '法に基づく', '事業者', '販売者', '運営者', '店舗情報',
    'ショップ情報', '会社情報', '企業情報'
  ];
  const lines = markdown.split('\n');

  // Find line with keywords
  let startIdx = lines.findIndex(line =>
    keywords.some(kw => line.includes(kw))
  );

  if (startIdx === -1) {
    // If no keyword found, try to find contact-related content
    startIdx = lines.findIndex(line =>
      line.includes('メール') || line.includes('電話') || 
      line.includes('住所') || line.includes('代表')
    );
  }

  if (startIdx === -1) startIdx = 0;

  // Take 100 lines from that point (more context)
  const endIdx = Math.min(startIdx + 100, lines.length);
  return lines.slice(startIdx, endIdx).join('\n');
}

/**
 * Parse contact info using Gemini API as fallback
 */
export async function parseWithGemini(markdown: string): Promise<Partial<ContactInfo>> {
  console.log('=== GEMINI PARSING START ===');
  const relevantText = extractRelevantSection(markdown);
  console.log('Relevant text length:', relevantText.length);
  console.log('Relevant text:', relevantText);

  const requestBody = {
    contents: [{
      parts: [{
        text: `あなたは日本の会社情報を抽出する専門家です。以下のテキストから連絡先情報を抽出してください。

テキスト:
${relevantText}

以下の情報を探してください：
1. メールアドレス（例：info@example.com, customer@company.jp）
2. 電話番号（例：03-1234-5678, 0120-123-456）
3. 住所（例：〒100-0001 東京都千代田区...）
4. 代表者名・責任者名（例：山田太郎、事業者の名称：石本長治）

注意：
- 「事業者の名称」「事業者名」「販売責任者名」「代表者」などのラベルの後の名前を抽出してください
- ラベルと値の間に区切り文字がない場合もあります（例：「名称石本長治」）
- 見つからない場合はnullを返してください

必ず以下のJSON形式で返してください（マークダウンのコードブロックは使わないでください）：
{
  "email": "email@example.com or null",
  "phone": "03-1234-5678 or null",
  "address": "full address or null",
  "representative": "name or null"
}`
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1000,
    }
  };

  console.log('Sending to Gemini...');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log('Gemini response:', JSON.stringify(data, null, 2));
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  console.log('Gemini extracted text:', text);

  // Remove markdown code fences if present
  const cleanJson = text.replace(/```json\n?|```/g, '').trim();
  console.log('Clean JSON:', cleanJson);

  const parsed = JSON.parse(cleanJson);
  console.log('Parsed result:', parsed);
  console.log('=== GEMINI PARSING END ===\n');

  return parsed;
}
