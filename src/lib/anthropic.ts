import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;

export function getAnthropic() {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

// Backward-compatible proxy
export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getAnthropic() as any)[prop];
  },
});
