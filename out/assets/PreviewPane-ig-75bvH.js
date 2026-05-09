import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{p as t,u as n}from"./vendor-react-CEyzDJmD.js";import{n as r,r as i,t as a}from"./vendor-math-DlRRnTGY.js";var o=n(),s=e(t(),1);function c(e){var t=e.content,n=(0,s.useRef)(null);return(0,s.useEffect)(function(){if(n.current){var e=i.parse(t);e=e.replace(/\$\$(.*?)\$\$/g,function(e,t){try{return a.renderToString(t,{displayMode:!0,throwOnError:!1})}catch{return`<span style="color: var(--color-error)">LaTeX Error: ${t}</span>`}}),e=e.replace(/\$(.*?)\$/g,function(e,t){try{return a.renderToString(t,{displayMode:!1,throwOnError:!1})}catch{return`<span style="color: var(--color-error)">${t}</span>`}});var o=r.sanitize(e);n.current.innerHTML=o}},[t]),(0,o.jsx)(`div`,{ref:n,className:`p-6 max-w-none text-text-primary
        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
        [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5
        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
        [&_p]:mb-3 [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
        [&_li]:mb-1
        [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
        [&_pre]:bg-surface [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:mb-3
        [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80
        [&_strong]:font-semibold
        [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
        [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-surface
        [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2`})}export{c as default};