const WORD_MAP = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100,
};

const TENS_WORDS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const UNITS_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };

const MAX_VALID = 250;

export function parseSpoken(raw) {
  if (!raw) return null;
  const text = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const asInt = parseInt(text.replace(/\s/g, ''), 10);
  if (!isNaN(asInt) && asInt > 0 && asInt <= MAX_VALID) return asInt;

  const firstNumMatch = text.match(/\d{1,3}/);
  if (firstNumMatch) {
    const n = parseInt(firstNumMatch[0], 10);
    if (n > 0 && n <= MAX_VALID) return n;
  }

  const words = text.split(' ');

  let hundreds = 0;
  let rest = words;
  const hundredIdx = words.indexOf('hundred');
  if (hundredIdx !== -1) {
    const prev = words[hundredIdx - 1];
    hundreds = (prev && UNITS_WORDS[prev]) ? UNITS_WORDS[prev] * 100 : 100;
    rest = words.slice(hundredIdx + 1).filter(w => w !== 'and');
  }

  let remainder = 0;
  if (rest.length >= 2 && TENS_WORDS[rest[0]] && UNITS_WORDS[rest[1]]) {
    remainder = TENS_WORDS[rest[0]] + UNITS_WORDS[rest[1]];
  } else if (rest.length >= 1) {
    for (const w of rest) {
      if (w in WORD_MAP) { remainder = WORD_MAP[w]; break; }
    }
  }

  const total = hundreds + remainder;
  if (total > 0 && total <= MAX_VALID) return total;

  for (const w of words) {
    if (w in WORD_MAP && WORD_MAP[w] > 0) return WORD_MAP[w];
  }
  return null;
}
