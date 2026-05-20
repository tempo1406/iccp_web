interface PublicRenderOptions {
  orgSlug?: string;
}

const LEAD_FORM_MARKER = 'data-iccp-form="lead"';
const LEAD_FORM_NAME_ATTR = 'data-iccp-form-name';

function stripMarkdownFences(raw: string): string {
  const trimmed = raw
    .replace(/\r\n/g, '\n')
    .replace(/^\uFEFF/, '')
    .replace(/^\s*>+\s?/gm, '')
    .trim();
  const fenced = trimmed.match(/^```(?:html)?\s*\n?([\s\S]*?)\n?```\s*$/i);
  if (fenced) return fenced[1].trim();
  const fencedAnywhere = trimmed.match(/```(?:html)?\s*\n?([\s\S]*?)\n?```/i);
  if (fencedAnywhere) return fencedAnywhere[1].trim();
  return trimmed;
}

function stripAiHtmlArtifacts(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^\uFEFF/, '')
    .replace(/```(?:html)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

function stripLeadingArtifactText(fragment: string): string {
  const normalized = stripAiHtmlArtifacts(fragment).trimStart();
  const firstTagIndex = normalized.search(/<[a-z!][^>]*>/i);
  if (firstTagIndex <= 0) return normalized.trim();

  const prefix = normalized.slice(0, firstTagIndex).trim();
  if (!prefix) return normalized.slice(firstTagIndex).trim();

  if (prefix.length <= 240 || /^(html|title|doctype)/i.test(prefix)) {
    return normalized.slice(firstTagIndex).trim();
  }

  return normalized.trim();
}

export function extractRenderableHtmlDocument(raw: string): string {
  const fencedCandidate = raw.match(/```(?:html)?\s*\n?([\s\S]*?)\n?```/i)?.[1];
  const candidates = [fencedCandidate, raw].filter((value): value is string =>
    Boolean(value),
  );

  for (const candidate of candidates) {
    const cleaned = stripAiHtmlArtifacts(stripMarkdownFences(candidate));
    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();
    const structuralTagPatterns = [
      '<!doctype',
      '<html',
      '<body',
      '<main',
      '<header',
      '<nav',
      '<section',
      '<article',
      '<aside',
      '<div',
      '<style',
      '<script',
    ];
    const startCandidates = structuralTagPatterns
      .map((pattern) => lower.indexOf(pattern))
      .filter((index) => index >= 0);
    const genericTagIndex = cleaned.search(/<[a-z][^>]*>/i);
    if (genericTagIndex >= 0) startCandidates.push(genericTagIndex);
    const startIndex = startCandidates.length > 0 ? Math.min(...startCandidates) : -1;
    const sliced = startIndex >= 0 ? cleaned.slice(startIndex).trim() : cleaned;
    const lowerSliced = sliced.toLowerCase();
    const htmlEndIndex = lowerSliced.indexOf('</html>');
    const bodyEndIndex = lowerSliced.lastIndexOf('</body>');

    if (htmlEndIndex >= 0) {
      return stripLeadingArtifactText(sliced.slice(0, htmlEndIndex + '</html>'.length));
    }

    if (bodyEndIndex >= 0) {
      return stripLeadingArtifactText(sliced.slice(0, bodyEndIndex + '</body>'.length));
    }

    if (startIndex >= 0) {
      return stripLeadingArtifactText(sliced);
    }
  }

  return stripLeadingArtifactText(stripMarkdownFences(raw));
}

const PUBLIC_SIGNATURE_TEXT = 'In cooperation with ICCP Team @2026';

const LEAD_SIGNAL_PATTERNS = [
  /<(?:input|textarea)\b[^>]*type\s*=\s*["'](?:email|tel)["'][^>]*>/i,
  /<(?:input|textarea)\b[^>]*(?:name|id)\s*=\s*["'][^"']*(?:email|e-mail|phone|mobile|telephone|address|first[_-]?name|last[_-]?name|full[_-]?name|fullname)[^"']*["']/i,
  /<(?:input|textarea)\b[^>]*placeholder\s*=\s*["'][^"']*(?:mail|email|phone|mobile|telephone|address|first\s*name|last\s*name|full\s*name|họ|tên|địa chỉ)[^"']*["']/i,
];

function hasLeadSignalField(html: string): boolean {
  return LEAD_SIGNAL_PATTERNS.some((pattern) => pattern.test(html));
}

function injectLeadFormAttributes(openingTag: string, index: number): string {
  let nextTag = openingTag;

  if (!/data-iccp-form\s*=/i.test(nextTag)) {
    nextTag = nextTag.replace(/^<form\b/i, `<form ${LEAD_FORM_MARKER}`);
  }

  if (!new RegExp(`${LEAD_FORM_NAME_ATTR}\\s*=`, 'i').test(nextTag)) {
    nextTag = nextTag.replace(
      /^<form\b/i,
      `<form ${LEAD_FORM_NAME_ATTR}="auto-lead-form-${index}"`,
    );
  }

  return nextTag;
}

export function autoMarkLeadForms(html: string): string {
  if (!html.trim()) return html;

  let formIndex = 0;
  return html.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, (formHtml) => {
    if (!hasLeadSignalField(formHtml)) {
      return formHtml;
    }

    formIndex += 1;
    return formHtml.replace(/<form\b[^>]*>/i, (openingTag) =>
      injectLeadFormAttributes(openingTag, formIndex),
    );
  });
}

function injectBeforeClosingTag(
  html: string,
  tagName: string,
  snippet: string,
): string | null {
  const lowerHtml = html.toLowerCase();
  const closingTag = `</${tagName.toLowerCase()}>`;
  const index = lowerHtml.lastIndexOf(closingTag);
  if (index < 0) return null;
  return `${html.slice(0, index)}${snippet}${html.slice(index)}`;
}

function injectAnchorRuntime(html: string): string {
  if (!html.trim() || html.includes('data-iccp-anchor-runtime')) {
    return html;
  }

  const runtime = `<script data-iccp-anchor-runtime>(function(){document.addEventListener('click',function(event){var target=event.target;var anchor=target&&target.closest?target.closest('a[href^="#"]'):null;if(!anchor)return;var href=anchor.getAttribute('href')||'';if(!href||href==='#')return;var id=decodeURIComponent(href.slice(1));if(!id)return;var section=document.getElementById(id);if(!section)return;event.preventDefault();section.scrollIntoView({behavior:'smooth',block:'start'});if(window.history&&window.history.replaceState){window.history.replaceState(null,'',href);}else{window.location.hash=id;}});})();</script>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${runtime}</body>`);
  }

  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${runtime}</html>`);
  }

  return `${html}\n${runtime}`;
}

function buildLeadEndpoint(orgSlug: string): string {
  return `/api/org/${orgSlug}/landing-page-leads`;
}

function injectLeadFormRuntime(html: string, orgSlug?: string): string {
  if (!html.trim() || html.includes('data-iccp-lead-runtime') || !orgSlug) {
    return html;
  }

  const endpoint = JSON.stringify(buildLeadEndpoint(orgSlug));
  const runtime = `<script data-iccp-lead-runtime>(function(){if(window.__iccpLeadRuntimeBound)return;window.__iccpLeadRuntimeBound=true;var endpoint=${endpoint};var statusSelector='[data-iccp-form-status]';var processedAttr='data-iccp-lead-bound';var currentPageUrl=window.location&&window.location.href&&window.location.href!=='about:srcdoc'?window.location.href:(document.referrer||'');function normalizeText(value){return typeof value==='string'?value.trim():'';}function foldText(value){return normalizeText(value).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}function sanitizeKey(value,fallback){var key=foldText(value).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');return key||fallback;}function isSubmitLike(element){if(!element)return false;var tag=element.tagName;if(tag==='BUTTON')return true;if(tag==='INPUT'){var type=(element.getAttribute('type')||'').toLowerCase();return type==='submit'||type==='button';}if(tag==='A'){return element.hasAttribute('data-iccp-submit')||element.classList.contains('btn')||/#?$/.test(element.getAttribute('href')||'');}return element.getAttribute('role')==='button';}function getStatusNode(root){var node=root.querySelector(statusSelector);if(node)return node;node=document.createElement('div');node.setAttribute('data-iccp-form-status','1');node.style.marginTop='12px';node.style.fontSize='13px';node.style.lineHeight='1.5';node.style.fontFamily='Inter,Segoe UI,Arial,sans-serif';node.style.textAlign='center';root.appendChild(node);return node;}function setStatus(root,type,message){var node=getStatusNode(root);node.textContent=message;node.style.color=type==='error'?'#dc2626':type==='success'?'#059669':'#475569';}function getFieldElements(root){if(root.tagName==='FORM'&&root.elements){return Array.prototype.slice.call(root.elements);}return Array.prototype.slice.call(root.querySelectorAll('input, textarea, select'));}function deriveFieldKey(field,index){return sanitizeKey(field.name||field.id||field.getAttribute('placeholder')||field.getAttribute('aria-label')||field.type,'field_'+String(index+1));}function matchesLeadSignal(field){if(!field)return false;var tag=(field.tagName||'').toLowerCase();if(tag!=='input'&&tag!=='textarea')return false;var type=foldText(field.type);if(type==='email'||type==='tel')return true;var haystacks=[field.name,field.id,field.getAttribute('placeholder'),field.getAttribute('aria-label')].map(foldText).filter(Boolean);if(haystacks.length===0)return false;return haystacks.some(function(value){return /(?:^|[^a-z])(email|e-mail|mail|phone|mobile|telephone|address|first[\\s_-]*name|last[\\s_-]*name|full[\\s_-]*name|ho|ten|dia\\s*chi)(?:$|[^a-z])/.test(value);});}function findLeadSignalField(root){var fields=getFieldElements(root);for(var i=0;i<fields.length;i+=1){if(matchesLeadSignal(fields[i]))return fields[i];}return null;}function collectFields(root){var fields={};getFieldElements(root).forEach(function(field,index){if(!field||field.disabled)return;var tag=(field.tagName||'').toLowerCase();var type=normalizeText(field.type).toLowerCase();if(type==='submit'||type==='button'||type==='reset'||type==='image'||tag==='button')return;if((type==='checkbox'||type==='radio')&&!field.checked)return;var value='';if(tag==='select'){value=normalizeText(field.value);}else if(type==='checkbox'){value=field.value||'true';}else{value=normalizeText(field.value);}if(!value)return;fields[deriveFieldKey(field,index)]=value;});return fields;}function getSubmitControl(root){var candidates=Array.prototype.slice.call(root.querySelectorAll('[data-iccp-submit], button[type=\"submit\"], input[type=\"submit\"], button, a, [role=\"button\"]'));for(var i=0;i<candidates.length;i+=1){if(isSubmitLike(candidates[i]))return candidates[i];}return null;}function findHeuristicRoot(signalField){if(!signalField)return null;if(signalField.closest('[data-iccp-form]'))return signalField.closest('[data-iccp-form]');if(signalField.form)return signalField.form;var current=signalField.parentElement;while(current&&current!==document.body){if(current.hasAttribute(processedAttr))return current;var fieldCount=current.querySelectorAll('input, textarea, select').length;var signalCount=getFieldElements(current).filter(matchesLeadSignal).length;var nestedForms=current.querySelectorAll('form').length;var submitControl=getSubmitControl(current);if(submitControl&&signalCount>=1&&fieldCount<=8&&nestedForms===0){return current;}current=current.parentElement;}return null;}function getFieldValue(fields,keys){for(var i=0;i<keys.length;i+=1){var value=normalizeText(fields[keys[i]]);if(value)return value;}return '';}function buildPayload(root){var fields=collectFields(root);var email=normalizeText(getFieldValue(fields,['email','contact_email','email_address'])).toLowerCase();var firstName=getFieldValue(fields,['first_name','firstname','firstName','ho']);var lastName=getFieldValue(fields,['last_name','lastname','lastName','ten']);var fullName=normalizeText(getFieldValue(fields,['full_name','fullname','fullName','name'])||((firstName+' '+lastName).trim()));var phone=getFieldValue(fields,['phone','phone_number','mobile','telephone']);var address=getFieldValue(fields,['address','dia_chi']);var message=getFieldValue(fields,['message','note','notes','description','request']);var formType=normalizeText(root.getAttribute('data-iccp-form')||'lead');var formName=normalizeText(root.getAttribute('data-iccp-form-name')||root.getAttribute('name')||'');if(!email&&!phone&&!address&&!fullName&&Object.keys(fields).length===0)return null;return{formType:formType||'lead',formName:formName||undefined,fullName:fullName||undefined,email:email||undefined,phone:phone||undefined,message:message||address||undefined,pageUrl:currentPageUrl||undefined,fields:fields};}async function parseError(response){try{var payload=await response.json();return normalizeText(payload&&payload.message)||'Submit failed.';}catch(error){return 'Submit failed.';}}function setPendingState(control,isPending){if(!control)return;if('disabled' in control){control.disabled=isPending;}control.style.opacity=isPending?'0.7':'1';control.style.pointerEvents=isPending?'none':'';}function clearFields(root){if(root.tagName==='FORM'&&typeof root.reset==='function'){root.reset();return;}getFieldElements(root).forEach(function(field){if(!field||field.disabled)return;var tag=(field.tagName||'').toLowerCase();var type=normalizeText(field.type).toLowerCase();if(type==='submit'||type==='button'||type==='reset'||type==='image'||tag==='button')return;if(type==='checkbox'||type==='radio'){field.checked=false;return;}field.value='';});}function bindRoot(root){if(!root||root.getAttribute(processedAttr)==='1')return;var leadSignalField=findLeadSignalField(root);if(!leadSignalField)return;var isForm=root.tagName==='FORM';var submitControl=isForm?null:getSubmitControl(root);if(!isForm&&!submitControl)return;root.setAttribute(processedAttr,'1');var handleSubmit=async function(event){event.preventDefault();if(root.getAttribute('data-iccp-lead-submitting')==='1')return;var payload=buildPayload(root);if(!payload){setStatus(root,'error','Please fill in at least one contact field.');return;}root.setAttribute('data-iccp-lead-submitting','1');setPendingState(submitControl,true);setStatus(root,'info','Submitting...');try{var response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok){throw new Error(await parseError(response));}clearFields(root);setStatus(root,'success','Submitted successfully. The organization admin will receive your information.');}catch(error){setStatus(root,'error',error instanceof Error&&error.message?error.message:'Submit failed.');}finally{root.removeAttribute('data-iccp-lead-submitting');setPendingState(submitControl,false);}};if(isForm){root.addEventListener('submit',handleSubmit);return;}submitControl.addEventListener('click',handleSubmit);leadSignalField.addEventListener('keydown',function(event){if(event.key==='Enter'){handleSubmit(event);}});}function bootstrap(){Array.prototype.forEach.call(document.querySelectorAll('[data-iccp-form=\"lead\"], form'),function(root){if(root.tagName==='FORM'){if(findLeadSignalField(root))bindRoot(root);return;}bindRoot(root);});getFieldElements(document).filter(matchesLeadSignal).forEach(function(field){var root=findHeuristicRoot(field);if(root)bindRoot(root);});}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',bootstrap);}else{bootstrap();}})();</script>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${runtime}</body>`);
  }

  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${runtime}</html>`);
  }

  return `${html}\n${runtime}`;
}

function injectPublicSignature(html: string): string {
  if (!html.trim() || html.includes('data-iccp-public-signature')) {
    return html;
  }

  const signature = `<div data-iccp-public-signature style="display:flex;align-items:center;justify-content:center;width:100%;padding:8px 0;margin:0;border-top:1px solid rgba(148,163,184,0.28);text-align:center;font:600 11px/1 Inter,Segoe UI,Arial,sans-serif;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;box-sizing:border-box;">${PUBLIC_SIGNATURE_TEXT}</div>`;

  const injectedIntoFooter = injectBeforeClosingTag(html, 'footer', signature);
  if (injectedIntoFooter) {
    return injectedIntoFooter;
  }

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${signature}</body>`);
  }

  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${signature}</html>`);
  }

  return `${html}\n${signature}`;
}

export function normalizeLandingPageHtmlForPublicRender(
  rawHtml: string,
  options: PublicRenderOptions = {},
): string {
  const extracted = extractRenderableHtmlDocument(rawHtml);
  if (!extracted.trim()) return '';
  return injectPublicSignature(
    injectLeadFormRuntime(
      injectAnchorRuntime(autoMarkLeadForms(extracted)),
      options.orgSlug,
    ),
  );
}
