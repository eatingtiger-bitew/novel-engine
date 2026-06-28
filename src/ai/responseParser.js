// 解析 AI 回傳的劇情文字，提取選項、好感變化、支線觸發
export function parseStoryResponse(raw) {
  const lines = raw.split('\n');
  const choices = [];
  let sqTrigger = null;
  const affinityChanges = [];
  const storyLines = [];

  lines.forEach(line => {
    const t = line.trim();
    if (/^\[選項[ABCD]\]/.test(t)) {
      const text = t.replace(/^\[選項[ABCD]\]\s*/, '');
      if (text) choices.push(text);
    } else if (t.startsWith('[支線提示]')) {
      const parts = t.replace('[支線提示]', '').split('|');
      sqTrigger = { title: parts[0] || '未知支線', desc: parts[1] || '', reward: parts[2] || '' };
    } else if (t.startsWith('[好感變化]')) {
      const parts = t.replace('[好感變化]', '').split('|');
      affinityChanges.push({ raw: parts[0] || '', reason: parts[1] || '' });
    } else {
      storyLines.push(line);
    }
  });

  return {
    storyText: storyLines.join('\n').trim(),
    choices,
    sqTrigger,
    affinityChanges
  };
}
