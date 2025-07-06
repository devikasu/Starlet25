console.log("Starlet25 content script loaded");function T(){const t=["main","article",'[role="main"]',".main-content",".content",".post-content",".entry-content","#content","#main"];for(const e of t){const n=document.querySelector(e);if(n)return n}return Array.from(document.querySelectorAll("div, section, p")).filter(e=>(e.textContent||"").length>200&&!e.querySelector("nav, header, footer, aside")).sort((e,n)=>(n.textContent?.length||0)-(e.textContent?.length||0))[0]||null}function A(t){["nav","header","footer","aside",".nav",".navigation",".menu",".sidebar",".footer",".header",'[role="navigation"]','[role="banner"]','[role="contentinfo"]','[role="complementary"]'].forEach(r=>{t.querySelectorAll(r).forEach(l=>l.remove())}),[".ad",".advertisement",".banner",".popup",".modal",".overlay",".cookie-banner",".newsletter-signup",".social-share",".comments",".related-posts",".recommendations"].forEach(r=>{t.querySelectorAll(r).forEach(l=>l.remove())}),t.querySelectorAll("script, style, noscript").forEach(r=>r.remove())}function L(t){return t.replace(/\s+/g," ").replace(/\n\s*\n/g,`
`).trim()}function y(){const t=T();if(!t)return"";const o=t.cloneNode(!0);A(o);let e=o.innerText||o.textContent||"";return e=L(e),e.split(`
`).filter(r=>{const s=r.trim();return s.length>10||s.length===0}).join(`
`).trim()}function p(){const t=y();if(t.length<50){console.log("Starlet25: Not enough text content found");return}const o={type:"PAGE_TEXT",text:t,url:window.location.href,title:document.title,timestamp:Date.now()};chrome.runtime.sendMessage(o,e=>{chrome.runtime.lastError?console.log("Starlet25: Error sending message to background:",chrome.runtime.lastError.message):e&&console.log("Starlet25: Message sent successfully to background")}),console.log("Starlet25: Extracted text length:",t.length)}chrome.runtime.onMessage.addListener((t,o,e)=>{if(t.action==="EXTRACT_TEXT"){const n=y();e({text:n,url:window.location.href,title:document.title})}if(t.action==="START_VOICE_ASSISTANT"&&(console.log("🎤 Starlet25: Received START_VOICE_ASSISTANT command in content script"),e({success:!0,message:"Voice assistant ready"})),t.action==="APPLY_SATURATION_FILTER"){console.log("🎨 Starlet25: Received APPLY_SATURATION_FILTER command in content script");try{const{saturation:n}=t;console.log("🎨 Starlet25: Applying saturation filter:",n+"%");const r=document.getElementById("starlet25-saturation-filter");if(r&&r.remove(),document.documentElement.style.filter="",document.body.style.filter="",n!==100)try{const s=document.createElement("style");s.id="starlet25-saturation-filter",s.textContent=`
            html {
              filter: saturate(${n}%) !important;
            }
          `,document.head.appendChild(s),console.log("🎨 Starlet25: Saturation filter applied via style element")}catch(s){console.warn("🎨 Style element method failed, trying inline:",s);try{document.documentElement.style.filter=`saturate(${n}%)`,console.log("🎨 Starlet25: Saturation filter applied via inline style")}catch(l){console.warn("🎨 Inline style method failed, trying body:",l),document.body.style.filter=`saturate(${n}%)`,console.log("🎨 Starlet25: Saturation filter applied via body style")}}else console.log("🎨 Starlet25: Saturation reset to normal (100%)");e({success:!0})}catch(n){console.error("🎨 Starlet25: Error applying saturation filter:",n),e({success:!1,error:"Failed to apply saturation filter"})}}});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{p()}):p();let x=0;const _=new MutationObserver(()=>{const t=y();Math.abs(t.length-x)>100&&(x=t.length,p())});_.observe(document.body,{childList:!0,subtree:!0});let m=!1;chrome.runtime.onMessage.addListener((t,o,e)=>{if(t.action==="EXTRACT_CURRENT_PAGE"){const n=R(),r=I(n);e({success:!0,text:n,processed:r})}else t.action==="SHOW_FLASHCARD_OVERLAY"?(D(t.flashcards,t.summary),e({success:!0})):t.action==="SHOW_VOICE_FLASHCARD"?($(t.content),e({success:!0})):t.action==="HIDE_OVERLAY"?(N(),e({success:!0})):t.action==="APPLY_SATURATION_FILTER"&&(P(t.saturation),e({success:!0}));return!0});function R(){const t=["nav","header","footer","aside","menu",".navigation",".header",".footer",".sidebar",".menu",".ad",".advertisement",".banner",".popup","script","style","noscript"],o=document.body.cloneNode(!0);t.forEach(n=>{o.querySelectorAll(n).forEach(s=>s.remove())});let e=o.textContent||"";return e=e.replace(/\s+/g," ").replace(/\n+/g,`
`).trim(),e}function I(t){const o=t.split(/\s+/).length,e=t.length,n=Math.ceil(o/200);return{wordCount:o,characterCount:e,estimatedReadingTime:n,language:"en",hasCode:/<code>|<pre>|function|class|const|let|var/.test(t),hasLinks:/<a\s+href/.test(t),keywords:O(t)}}function O(t){const o=t.toLowerCase().match(/\b\w+\b/g)||[],e={};return o.forEach(n=>{n.length>3&&(e[n]=(e[n]||0)+1)}),Object.entries(e).sort(([,n],[,r])=>r-n).slice(0,5).map(([n])=>n)}function D(t,o){if(m)return;const e=document.createElement("div");e.id="starlet25-flashcard-overlay",e.innerHTML=`
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
        ${o?`
        <div class="starlet25-summary-section">
          <button class="starlet25-summary-toggle">📋 Show Summary</button>
          <div class="starlet25-summary-content" style="display: none;">
            <h3>📋 Page Summary</h3>
            <p>${o}</p>
            <div class="starlet25-summary-actions">
              <button class="starlet25-speak-summary">🔊 Read</button>
              <button class="starlet25-download-summary">📥 Download</button>
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
      background: rgba(0, 0, 0, 0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .starlet25-overlay-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      padding: 24px;
      color: white;
      position: relative;
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
      min-height: 200px;
      overflow-y: auto;
    }
    
    .starlet25-card-text {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      line-height: 1.6;
      margin: 0;
      max-width: 100%;
      word-wrap: break-word;
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
  `,document.head.appendChild(n),document.body.appendChild(e);let r=0;const s=e.querySelector(".starlet25-card-text"),l=e.querySelectorAll(".starlet25-dot"),d=e.querySelector(".starlet25-summary-content"),u=e.querySelector(".starlet25-summary-toggle");console.log("Debug - summaryToggle found:",!!u),console.log("Debug - summaryContent found:",!!d),console.log("Debug - summary text:",o);const S=e.querySelector(".starlet25-prev-btn"),w=e.querySelector(".starlet25-next-btn"),E=e.querySelector(".starlet25-close-btn"),f=e.querySelector(".starlet25-speak-summary"),h=e.querySelector(".starlet25-download-summary");S?.addEventListener("click",()=>{r>0&&(r--,g())}),w?.addEventListener("click",()=>{r<t.length-1&&(r++,g())}),l.forEach((a,c)=>{a.addEventListener("click",()=>{r=c,g()})}),E?.addEventListener("click",()=>{e.remove()}),u?(console.log("Debug - Adding event listener to summary toggle"),u.addEventListener("click",()=>{if(console.log("Debug - Summary toggle clicked!"),!d){console.warn("Summary content element not found!");return}const a=d.style.display!=="none";console.log("Debug - Current visibility:",a),d.style.display=a?"none":"block",u.textContent=a?"📋 Show Summary":"📋 Hide Summary",console.log("Summary toggle clicked. Now visible:",!a)})):console.warn("Debug - Summary toggle button not found!"),f&&f.addEventListener("click",()=>{if("speechSynthesis"in window){const a=new SpeechSynthesisUtterance(o);window.speechSynthesis.speak(a)}}),h&&h.addEventListener("click",()=>{const a=`Page Summary
${"=".repeat(50)}

${o}

Study Notes
${"=".repeat(50)}

${t.map((k,C)=>`${C+1}. ${k}`).join(`

`)}

Generated on: ${new Date().toLocaleString()}`,c=new Blob([a],{type:"text/plain;charset=utf-8"}),v=URL.createObjectURL(c),i=document.createElement("a");i.href=v,i.download=`study_notes_${new Date().toISOString().split("T")[0]}.txt`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(v)});function g(){s.textContent=t[r]||"No content available",l.forEach((a,c)=>{a.classList.toggle("active",c===r)})}const b=a=>{switch(a.key){case"ArrowRight":case" ":a.preventDefault(),window.starlet25NextCard();break;case"ArrowLeft":a.preventDefault(),window.starlet25PrevCard();break;case"Escape":a.preventDefault(),e.remove();break}};document.addEventListener("keydown",b),e.addEventListener("remove",()=>{document.removeEventListener("keydown",b),m=!1}),m=!0}function $(t){console.log("Voice flashcard requested for content:",t)}function N(){const t=document.getElementById("starlet25-flashcard-overlay");t&&(t.remove(),m=!1)}function P(t){const o=document.getElementById("starlet25-saturation-filter")||document.createElement("style");o.id="starlet25-saturation-filter",o.textContent=`* { filter: saturate(${t}%) !important; }`,document.getElementById("starlet25-saturation-filter")||document.head.appendChild(o)}
