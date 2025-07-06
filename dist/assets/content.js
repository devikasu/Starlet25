console.log("Starlet25 content script loaded");let g=!1;chrome.runtime.onMessage.addListener((t,r,e)=>{if(t.action==="EXTRACT_TEXT"){const n=b();e({text:n,url:window.location.href,title:document.title})}if(t.action==="START_VOICE_ASSISTANT"&&(console.log("🎤 Starlet25: Received START_VOICE_ASSISTANT command in content script"),e({success:!0,message:"Voice assistant ready"})),t.action==="EXTRACT_CURRENT_PAGE"){const n=O(),o=D(n);e({success:!0,text:n,processed:o})}else if(t.action==="SHOW_FLASHCARD_OVERLAY")console.log("Content script: Received SHOW_FLASHCARD_OVERLAY message"),console.log("Content script: Flashcards:",t.flashcards),console.log("Content script: Summary:",t.summary),N(t.flashcards,t.summary),e({success:!0});else if(t.action==="SHOW_VOICE_FLASHCARD")$(t.content),e({success:!0});else if(t.action==="HIDE_OVERLAY")I(),e({success:!0});else if(t.action==="APPLY_SATURATION_FILTER"){console.log("🎨 Starlet25: Received APPLY_SATURATION_FILTER command in content script");try{const{saturation:n}=t;console.log("🎨 Starlet25: Applying saturation filter:",n+"%");const o=document.getElementById("starlet25-saturation-filter");if(o&&o.remove(),document.documentElement.style.filter="",document.body.style.filter="",n!==100)try{const s=document.createElement("style");s.id="starlet25-saturation-filter",s.textContent=`
            html {
              filter: saturate(${n}%) !important;
            }
          `,document.head.appendChild(s),console.log("🎨 Starlet25: Saturation filter applied via style element")}catch(s){console.warn("🎨 Style element method failed, trying inline:",s);try{document.documentElement.style.filter=`saturate(${n}%)`,console.log("🎨 Starlet25: Saturation filter applied via inline style")}catch(i){console.warn("🎨 Inline style method failed, trying body:",i),document.body.style.filter=`saturate(${n}%)`,console.log("🎨 Starlet25: Saturation filter applied via body style")}}else console.log("🎨 Starlet25: Saturation reset to normal (100%)");e({success:!0})}catch(n){console.error("🎨 Starlet25: Error applying saturation filter:",n),e({success:!1,error:"Failed to apply saturation filter"})}}return!0});function A(){const t=["main","article",'[role="main"]',".main-content",".content",".post-content",".entry-content","#content","#main"];for(const e of t){const n=document.querySelector(e);if(n)return n}return Array.from(document.querySelectorAll("div, section, p")).filter(e=>(e.textContent||"").length>200&&!e.querySelector("nav, header, footer, aside")).sort((e,n)=>(n.textContent?.length||0)-(e.textContent?.length||0))[0]||null}function L(t){["nav","header","footer","aside",".nav",".navigation",".menu",".sidebar",".footer",".header",'[role="navigation"]','[role="banner"]','[role="contentinfo"]','[role="complementary"]'].forEach(o=>{t.querySelectorAll(o).forEach(i=>i.remove())}),[".ad",".advertisement",".banner",".popup",".modal",".overlay",".cookie-banner",".newsletter-signup",".social-share",".comments",".related-posts",".recommendations"].forEach(o=>{t.querySelectorAll(o).forEach(i=>i.remove())}),t.querySelectorAll("script, style, noscript").forEach(o=>o.remove())}function R(t){return t.replace(/\s+/g," ").replace(/\n\s*\n/g,`
`).trim()}function b(){const t=A();if(!t)return"";const r=t.cloneNode(!0);L(r);let e=r.innerText||r.textContent||"";return e=R(e),e.split(`
`).filter(o=>{const s=o.trim();return s.length>10||s.length===0}).join(`
`).trim()}function h(){const t=b();if(t.length<50){console.log("Starlet25: Not enough text content found");return}const r={type:"PAGE_TEXT",text:t,url:window.location.href,title:document.title,timestamp:Date.now()};chrome.runtime.sendMessage(r,e=>{chrome.runtime.lastError?console.log("Starlet25: Error sending message to background:",chrome.runtime.lastError.message):e&&console.log("Starlet25: Message sent successfully to background")}),console.log("Starlet25: Extracted text length:",t.length)}function O(){const t=["nav","header","footer","aside","menu",".navigation",".header",".footer",".sidebar",".menu",".ad",".advertisement",".banner",".popup","script","style","noscript"],r=document.body.cloneNode(!0);t.forEach(n=>{r.querySelectorAll(n).forEach(s=>s.remove())});let e=r.textContent||"";return e=e.replace(/\s+/g," ").replace(/\n+/g,`
`).trim(),e}function D(t){const r=t.split(/\s+/).length,e=t.length,n=Math.ceil(r/200);return{wordCount:r,characterCount:e,estimatedReadingTime:n,language:"en",hasCode:/<code>|<pre>|function|class|const|let|var/.test(t),hasLinks:/<a\s+href/.test(t),keywords:_(t)}}function _(t){const r=t.toLowerCase().match(/\b\w+\b/g)||[],e={};return r.forEach(n=>{n.length>3&&(e[n]=(e[n]||0)+1)}),Object.entries(e).sort(([,n],[,o])=>o-n).slice(0,5).map(([n])=>n)}function N(t,r){if(g)return;const e=document.createElement("div");e.id="starlet25-flashcard-overlay",e.innerHTML=`
    <div class="starlet25-overlay-container">
      <div class="starlet25-flashcard-content">
        <div class="starlet25-header">
          <h2>Study Notes</h2>
          <button class="starlet25-close-btn">×</button>
        </div>
        <div class="starlet25-card-content">
          <p class="starlet25-card-text">${t[0]||"No content available"}</p>
        </div>
        <div class="starlet25-navigation">
          <button class="starlet25-nav-btn starlet25-prev-btn">← Previous</button>
          <div class="starlet25-progress">
            ${t.map((a,c)=>`<span class="starlet25-dot${c===0?" active":""}" data-index="${c}"></span>`).join("")}
          </div>
          <button class="starlet25-nav-btn starlet25-next-btn">Next →</button>
        </div>
        ${r?`
        <div class="starlet25-summary-section">
          <button class="starlet25-summary-toggle">📋 Show Summary</button>
          <div class="starlet25-summary-content" style="display: none;">
            <h3>�� Page Summary</h3>
            <p>${r}</p>
            <div class="starlet25-summary-actions">
              <button class="starlet25-speak-summary">🔊 Read</button>
              <button class="starlet25-download-summary">📥 Download</button>
              <button class="starlet25-download-braille">📄 Download for Braille</button>
            </div>
          </div>
        </div>
        `:""}
      </div>
    </div>
  `;const n=document.createElement("style");n.textContent=`
    #starlet25-flashcard-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(4px);
    }
    
    .starlet25-overlay-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
      width: 95%;
      max-width: 900px;
      min-height: 85vh;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      padding: 40px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .starlet25-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 24px;
    }
    
    .starlet25-header h2 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    
    .starlet25-close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    
    .starlet25-close-btn:hover {
      opacity: 1;
    }
    
    .starlet25-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      min-height: 300px;
      padding: 20px 0;
    }
    
    .starlet25-card-text {
      font-size: clamp(20px, 4vw, 32px);
      font-weight: 600;
      text-align: center;
      line-height: 1.5;
      margin: 0;
      max-width: 100%;
      word-wrap: break-word;
      hyphens: auto;
    }
    
    .starlet25-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: 32px;
    }
    
    .starlet25-nav-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-weight: 500;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      backdrop-filter: blur(8px);
    }
    
    .starlet25-nav-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .starlet25-nav-btn:disabled {
      background: rgba(255, 255, 255, 0.1);
      cursor: not-allowed;
    }
    
    .starlet25-progress {
      display: flex;
      gap: 8px;
    }
    
    .starlet25-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .starlet25-dot.active {
      background: white;
    }
    
    .starlet25-dot:hover {
      background: rgba(255, 255, 255, 0.6);
    }
    
    .starlet25-summary-section {
      width: 100%;
      margin-top: 24px;
    }
    
    .starlet25-summary-toggle {
      width: 100%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      backdrop-filter: blur(8px);
    }
    
    .starlet25-summary-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .starlet25-summary-content {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      padding: 24px;
      margin-top: 16px;
      color: #333;
    }
    
    .starlet25-summary-content h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
    
    .starlet25-summary-content p {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    
    .starlet25-summary-actions {
      display: flex;
      gap: 8px;
    }
    
    .starlet25-summary-actions button {
      background: #3b82f6;
      border: none;
      color: white;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .starlet25-summary-actions button:hover {
      background: #2563eb;
    }
    
    .starlet25-download-braille {
      background: #059669 !important;
    }
    
    .starlet25-download-braille:hover {
      background: #047857 !important;
    }
  `,document.head.appendChild(n),document.body.appendChild(e);let o=0;const s=e.querySelector(".starlet25-card-text"),i=e.querySelectorAll(".starlet25-dot"),m=e.querySelector(".starlet25-summary-content"),p=e.querySelector(".starlet25-summary-toggle");console.log("Debug - summaryToggle found:",!!p),console.log("Debug - summaryContent found:",!!m),console.log("Debug - summary text:",r),console.log("Debug - Overlay created and appended to body"),console.log("Debug - Overlay element:",e);const w=e.querySelector(".starlet25-prev-btn"),E=e.querySelector(".starlet25-next-btn"),k=e.querySelector(".starlet25-close-btn"),y=e.querySelector(".starlet25-speak-summary"),f=e.querySelector(".starlet25-download-summary"),v=e.querySelector(".starlet25-download-braille");w?.addEventListener("click",()=>{o>0&&(o--,d())}),E?.addEventListener("click",()=>{o<t.length-1&&(o++,d())}),i.forEach((a,c)=>{a.addEventListener("click",()=>{o=c,d()})}),k?.addEventListener("click",()=>{e.remove()}),p?(console.log("Debug - Adding event listener to summary toggle"),p.addEventListener("click",()=>{if(console.log("Debug - Summary toggle clicked!"),!m){console.warn("Summary content element not found!");return}const a=m.style.display!=="none";console.log("Debug - Current visibility:",a),m.style.display=a?"none":"block",p.textContent=a?"📋 Show Summary":"📋 Hide Summary",console.log("Summary toggle clicked. Now visible:",!a)})):console.warn("Debug - Summary toggle button not found!"),y&&y.addEventListener("click",()=>{if("speechSynthesis"in window){const a=new SpeechSynthesisUtterance(r);window.speechSynthesis.speak(a)}}),f&&f.addEventListener("click",()=>{const a=`Page Summary
${"=".repeat(50)}

${r}

Study Notes
${"=".repeat(50)}

${t.map((C,T)=>`${T+1}. ${C}`).join(`

`)}

Generated on: ${new Date().toLocaleString()}`,c=new Blob([a],{type:"text/plain;charset=utf-8"}),u=URL.createObjectURL(c),l=document.createElement("a");l.href=u,l.download=`study_notes_${new Date().toISOString().split("T")[0]}.txt`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(u)}),v&&v.addEventListener("click",()=>{const a=B(r||"No summary available",t),c=new Blob([a],{type:"text/plain;charset=utf-8"}),u=URL.createObjectURL(c),l=document.createElement("a");l.href=u,l.download=`braille_study_notes_${new Date().toISOString().split("T")[0]}.txt`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(u)});function d(){s.textContent=t[o]||"No content available",i.forEach((a,c)=>{a.classList.toggle("active",c===o)})}const x=a=>{switch(a.key){case"ArrowRight":case" ":a.preventDefault(),o<t.length-1&&(o++,d());break;case"ArrowLeft":a.preventDefault(),o>0&&(o--,d());break;case"Escape":a.preventDefault(),e.remove();break}};document.addEventListener("keydown",x),e.addEventListener("remove",()=>{document.removeEventListener("keydown",x),g=!1}),g=!0}function $(t){console.log("Voice flashcard requested for content:",t)}function I(){const t=document.getElementById("starlet25-flashcard-overlay");t&&(t.remove(),g=!1)}function B(t,r){const e=[];e.push("STUDY NOTES FOR BRAILLE CONVERSION"),e.push("=".repeat(40)),e.push(""),e.push("PAGE SUMMARY"),e.push("-".repeat(20)),e.push("");const n=t.split(". ").map(o=>o.trim()).filter(o=>o.length>0).map(o=>o+".");return e.push(...n),e.push(""),e.push("STUDY FLASHCARDS"),e.push("-".repeat(20)),e.push(""),r.forEach((o,s)=>{e.push(`CARD ${s+1}:`),e.push(o),e.push("")}),e.push("END OF STUDY NOTES"),e.push("=".repeat(40)),e.push(`Generated on: ${new Date().toLocaleString()}`),e.push("Formatted for Braille conversion"),e.join(`
`)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{h()}):h();let S=0;const F=new MutationObserver(()=>{const t=b();Math.abs(t.length-S)>100&&(S=t.length,h())});F.observe(document.body,{childList:!0,subtree:!0});
