import { S } from '../state/store.js';

async function callGemini(prompt){
  const model=S.settings.model.startsWith('claude')?'gemini-2.5-flash':S.settings.model;
  const key=S.settings.geminiKey;
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res=await fetch(url,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:2048}})
  });
  if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message||`HTTP ${res.status}`); }
  const data=await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text||'';
}

async function callGeminiChat(systemPrompt, messages){
  const model=S.settings.model.startsWith('claude')?'gemini-2.5-flash':S.settings.model;
  const key=S.settings.geminiKey;
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const contents=[
    {role:'user', parts:[{text:'[系統設定]\n'+systemPrompt+'\n\n[開始故事]'}]},
    {role:'model', parts:[{text:'好的，我已了解所有設定，準備開始推進故事。'}]},
    ...messages
  ];
  const res=await fetch(url,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({contents, generationConfig:{temperature:0.85,maxOutputTokens:2048}})
  });
  if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message||`HTTP ${res.status}`); }
  const data=await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text||'';
}

export { callGemini, callGeminiChat };
