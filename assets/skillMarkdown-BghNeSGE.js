function l(n){return n.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"")||"skill"}function h(n){return n.skillCode||l(n.name)}const p=(n,t)=>`## ${n}

${t}`;function f(n){const t=[];return n.steps?.length&&t.push(p("步驟",n.steps.map((e,s)=>`${s+1}. ${e}`).join(`
`))),n.exceptions?.length&&t.push(p("例外或特殊情況",n.exceptions.map(e=>`- ${e}`).join(`
`))),n.outputFormat&&t.push(p("固定輸出格式",n.outputFormat)),n.applicableScope&&t.push(p("適用範圍",n.applicableScope)),t.join(`

`)}const m=[[/^步驟$/,"steps"],[/^(例外(或特殊情況)?|特殊情況)$/,"exceptions"],[/^(固定)?輸出格式$/,"outputFormat"],[/^適用範圍$/,"applicableScope"]],$=/^#{1,6}\s*(.+?)\s*[：:]?\s*$/,a=/^\s*(\d+\s*[.、)）]|[-*•])\s*/;function S(n){const t={steps:[],exceptions:[],outputFormat:[],applicableScope:[]};let e=null,s=!1;for(const i of n.split(`
`)){const o=i.trim();if(!o)continue;const u=o.match($)?.[1];if(u){e=m.find(([r])=>r.test(u))?.[1]??null,s=!0;continue}e?t[e].push(o):!s&&a.test(o)&&t.steps.push(o)}const c=i=>i.map(o=>o.replace(a,"").trim()).filter(Boolean);return{steps:c(t.steps),exceptions:c(t.exceptions),outputFormat:t.outputFormat.join(`
`),applicableScope:t.applicableScope.join(`
`)}}function b(n){const t=[];n.description&&t.push(p("技能描述",n.description));const e=f(n);return e&&t.push(e),n.capabilities?.length&&t.push(p("覆蓋能力",n.capabilities.map(s=>`#${s}`).join(" "))),t.join(`

`)}function d(n){const t=[];t.push("---"),t.push(`name: ${h(n)}`),t.push(`description: ${n.description}`),t.push("---"),t.push(""),t.push(`# ${n.name}`);const e=b(n);return e&&(t.push(""),t.push(e)),`${t.join(`
`).trim()}
`}export{b as a,d as b,f as c,S as p,h as s};
