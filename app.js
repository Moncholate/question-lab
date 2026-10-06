/* ============================================================================
   Question Lab · La aplicación.
   ----------------------------------------------------------------------------
   Vivía dentro de index.html como <script> inline. Salió aquí porque era el
   archivo más tocado de la suite —el 82% de los commits de este repo aterrizaban
   en él— y con 3.000 líneas de JavaScript mezcladas con el marcado, cada cambio
   obligaba a recorrer el HTML entero para encontrarlas.

   SIGUE SIENDO UN <script> CLÁSICO, sin `type="module"` ni `defer`, y se carga
   en el MISMO sitio donde estaba: al final del <body>. Eso importa, y son dos
   cosas distintas. Una: el código llama a `$("id")` en el nivel superior (mira
   las últimas líneas), así que necesita el DOM ya parseado. Otra: comparte
   ámbito global con bank.js, answers.js y los demás, que se cargan antes en el
   <head>. Ponerle `defer` rompe la primera; convertirlo en módulo, las dos.

   QUIÉN LO PRUEBA. check-env.mjs lee este archivo y lo evalúa con `new Function`
   para exponer sus símbolos internos, que es lo que hace que los chequeos corran
   el código de verdad y no una copia. Antes lo sacaba de index.html con una
   expresión regular; ahora lee el archivo y ya. La garantía es la misma con un
   paso menos.

   Y QUIÉN LO PUBLICA. build.mjs lo pasa por su tokenizador para que el alumno no
   descargue estos comentarios (~50 KB). No está en la lista `ACTIVOS`, que se
   copia tal cual: si alguna vez vuelve ahí, los comentarios se publican.
   ============================================================================ */
/* ================================================================
   DICCIONARIOS
================================================================ */
const WH1 = ["what","where","when","why","who","whom","whose","which","how"];
const WH2 = {how:["many","much","often","long","old","far","fast"], what:["time","kind","color","colour"]};
const AUX_NEG = {
  do:"don't", does:"doesn't", did:"didn't",
  am:"'m not", is:"isn't", are:"aren't", was:"wasn't", were:"weren't",
  have:"haven't", has:"hasn't", had:"hadn't",
  will:"won't", would:"wouldn't", can:"can't", could:"couldn't",
  should:"shouldn't", shall:"shan't", may:"may not", might:"might not", must:"mustn't"
};
const AUXES = Object.keys(AUX_NEG);
/* Contracciones negativas -> auxiliar positivo (didn't -> did) */
const NEG_AUX = {cannot:"can"};
for(const [p,n] of Object.entries(AUX_NEG)){ if(n.includes("'") && !n.includes(" ")) NEG_AUX[n] = p; }
const isAuxTok = w => AUXES.includes(w) || !!NEG_AUX[w];
const MODALS = ["will","would","can","could","should","shall","may","might","must"];
const PRONOUNS = ["i","you","he","she","it","we","they"];
const DETS = ["the","a","an","my","your","his","her","its","our","their","this","that","these","those","some","any"];
const BE_AUX = ["am","is","are","was","were"];
const ADVS = ["ever","never","always","usually","often","already","just","still","also","really","sometimes","generally","recently"];
/* Adverbios de tiempo/lugar que NO pueden ser sujeto (para detectar "Where were yesterday?") */
const TIME_PLACE_ADV = new Set(["yesterday","today","tomorrow","tonight","now","then","here","there",
  "soon","later","early","late","again","home","abroad","outside","inside","away","everywhere","somewhere","anywhere","nowhere"]);

/* Verbos irregulares: base -> [pasado, participio] */
const IRR = {
  be:["was","been"], have:["had","had"], do:["did","done"], go:["went","gone"],
  get:["got","gotten"], make:["made","made"], know:["knew","known"], think:["thought","thought"],
  take:["took","taken"], see:["saw","seen"], come:["came","come"], give:["gave","given"],
  find:["found","found"], tell:["told","told"], become:["became","become"], leave:["left","left"],
  feel:["felt","felt"], put:["put","put"], bring:["brought","brought"], begin:["began","begun"],
  keep:["kept","kept"], hold:["held","held"], write:["wrote","written"], stand:["stood","stood"],
  hear:["heard","heard"], let:["let","let"], mean:["meant","meant"], set:["set","set"],
  meet:["met","met"], run:["ran","run"], pay:["paid","paid"], sit:["sat","sat"],
  speak:["spoke","spoken"], lead:["led","led"], read:["read","read"], grow:["grew","grown"],
  lose:["lost","lost"], fall:["fell","fallen"], send:["sent","sent"], build:["built","built"],
  understand:["understood","understood"], draw:["drew","drawn"], break:["broke","broken"],
  spend:["spent","spent"], cut:["cut","cut"], rise:["rose","risen"], drive:["drove","driven"],
  buy:["bought","bought"], wear:["wore","worn"], choose:["chose","chosen"], eat:["ate","eaten"],
  drink:["drank","drunk"], sleep:["slept","slept"], swim:["swam","swum"], sing:["sang","sung"],
  teach:["taught","taught"], catch:["caught","caught"], fly:["flew","flown"], win:["won","won"],
  forget:["forgot","forgotten"], say:["said","said"], sell:["sold","sold"], wake:["woke","woken"],
  // ── ampliación: irregulares comunes ──
  bite:["bit","bitten"], blow:["blew","blown"], ride:["rode","ridden"], shoot:["shot","shot"],
  hide:["hid","hidden"], feed:["fed","fed"], fight:["fought","fought"], throw:["threw","thrown"],
  lend:["lent","lent"], shake:["shook","shaken"], steal:["stole","stolen"], stick:["stuck","stuck"],
  sweep:["swept","swept"], swing:["swung","swung"], tear:["tore","torn"], quit:["quit","quit"],
  beat:["beat","beaten"], bend:["bent","bent"], dig:["dug","dug"], freeze:["froze","frozen"],
  hang:["hung","hung"], hit:["hit","hit"], hurt:["hurt","hurt"], lie:["lay","lain"],
  shine:["shone","shone"], shut:["shut","shut"], sink:["sank","sunk"], slide:["slid","slid"],
  spread:["spread","spread"], strike:["struck","struck"], seek:["sought","sought"], light:["lit","lit"]
};
const REG = ["like","live","work","play","study","travel","visit","cook","dance","listen","watch",
  "learn","want","need","love","hate","use","try","ask","call","talk","walk","open","close",
  "start","finish","help","clean","arrive","stay","enjoy","practice","wash","rain","happen",
  "look","move","plan","hope","wait","cost","change","believe","paint","invent","discover",
  "create","design","teach","order","prefer","remember","celebrate","graduate","exercise",
  "answer","explain","recommend","suggest","email","text","download","upload","program",
  // ── ampliación de léxico (verbos predominantemente verbales, bajo riesgo de homónimo-sustantivo) ──
  "smoke","communicate","decide","describe","prepare","imagine","invite","agree","jump","climb",
  "laugh","promise","relax","repeat","shout","smile","touch","wonder","allow","appear","apply",
  "attend","borrow","brush","collect","compare","complete","connect","continue","deliver","discuss",
  "earn","enter","escape","expect","explore","fail","follow","gather","ignore","improve","include",
  "increase","introduce","knock","lift","mention","notice","pour","prevent","produce","protect",
  "provide","raise","realize","receive","refuse","remain","remind","remove","repair","replace",
  "reply","rescue","respect","respond","scream","search","select","serve","solve","spell","stretch",
  "succeed","suffer","supply","support","suppose","surprise","survive","thank","treat","trust",
  "unlock","wander","warn","welcome","whisper","wipe","worry","wrap","yell","bark","belong","breathe",
  "chat","cheer","decorate","defend","depend","deserve","destroy","disappear","encourage","examine",
  "manage","marry","obey","organize","perform","pretend","punish","recognize","regret","ruin",
  // Homónimo sustantivo-verbo: no es motivo para dejar el verbo fuera. El
  // buscador de sujeto ya resuelve el par ("Where is the bus stop?" ≠ "Does the
  // bus stop here?"), y sin el verbo en la lista la pregunta ni siquiera se
  // parsea. Probado en pares mínimos con work/plan/call/watch/change/order.
  "accept","pass","stop",
  // `turn`, `pick` y `carry` FALTABAN, y se notó por los frasales: la lista
  // compartida trae «turn on/off», «pick up» y «carry on», pero sin la base en
  // este vocabulario la pregunta ni se parseaba. «Do you turn off the light?»
  // daba «you turn off the» de sujeto y «light» de verbo.
  // `turn` es además homónimo («Whose turn is it?»), así que va probado en pares
  // mínimos en check-basico, igual que work/plan/call/watch/change/order.
  "turn","pick","carry"];

const VERB_BASES = new Set([...Object.keys(IRR), ...REG]);
const PAST_FORMS = new Map();  // pasado -> base
const PART_FORMS = new Map();  // participio -> base
for(const [b,[p,pp]] of Object.entries(IRR)){ PAST_FORMS.set(p,b); PART_FORMS.set(pp,b); }
for(const b of REG){ const p = regPast(b); PAST_FORMS.set(p,b); PART_FORMS.set(p,b); }

function regPast(v){
  if(v.endsWith("e")) return v+"d";
  if(/[^aeiou]y$/.test(v)) return v.slice(0,-1)+"ied";
  return v+"ed";
}
function thirdPerson(v){
  if(/(o|ch|sh|ss|x|z)$/.test(v)) return v+"es";
  if(/[^aeiou]y$/.test(v)) return v.slice(0,-1)+"ies";
  return v+"s";
}
function pastOf(v){ return IRR[v] ? IRR[v][0] : regPast(v); }

/* Sustantivos en -ing (y similares) que NO son verbos */
const NOT_VERBS = new Set(["thing","something","anything","everything","nothing","morning",
  "evening","king","ring","wing","spring","string","sibling","ceiling","clothing","darling","during",
  // sustantivos en -ing SIN uso común como gerundio (los ambiguos como building/meeting/painting
  // se dejan fuera: romperían el presente continuo «Are you building a house?»)
  "lightning","wedding","pudding","earring"]);

/* ── Adjetivo en -ing vs. gerundio ────────────────────────────────────────────
   «Is your job interesting?» (adjetivo, to be) contra «Am I confusing you?»
   (gerundio, presente continuo). La regla «termina en -ing → es verbo» no los
   distingue, y meter las palabras en NOT_VERBS tampoco sirve: son las MISMAS
   palabras en los dos casos.
   La señal es estructural, no semántica. Todos estos son verbos psicológicos
   —X interesa a Y— y en progresivo piden objeto. Si no hay nada detrás, la
   lectura es la adjetiva. Es materia de AEF (interested / interesting).
   Lo que entra en la lista NO es «verbo psicológico» en sentido estricto, es
   algo más estrecho: verbos que necesitan objeto. «move» estuvo un rato aquí y
   fue un error — un tren se mueve solo, así que «Is the train moving?» pasó a
   leerse como adjetivo. Antes de agregar uno: ¿puede la acción no llevar
   objeto? Si sí, no va. */
const PSY_TRANS = new Set(["interest","bore","tire","amaze","excite","disappoint",
  "frighten","terrify","disgust","challenge","confuse","surprise","annoy",
  "embarrass","shock","fascinate","depress","satisfy","exhaust",
  // mismo criterio, y son los adjetivos en -ing más frecuentes del inglés de aula
  "refresh","reward","charm","demand","promise","mislead","overwhelm","disturb",
  "alarm","convince","encourage","discourage","entertain","inspire","thrill",
  "puzzle","irritate","frustrate","please","stun"]);
/* Estos además funcionan sin objeto («I relax»), así que el objeto no alcanza y
   hace falta mirar el sujeto: «Are you relaxing?» es continuo de verdad. */
const PSY_INTRANS = new Set(["relax","worry"]);
/* Adverbios de grado. Modifican adjetivos, NUNCA un progresivo: «Are you very
   working?» no existe. Así que uno de estos delante zanja la lectura sin
   consultar ninguna lista, y cubre los -ing que no están en ellas.
   «really» y «totally» quedan FUERA: «Are you really working?» es normal. */
const GRADO = new Set(["very","quite","extremely","incredibly","fairly","rather","pretty","so","too"]);
function psyBase(w){
  if(!w || !w.endsWith("ing")) return null;
  const s = w.slice(0,-3);
  for(const c of [s, s+"e", s.slice(0,-1)])       // annoy·ing · confus+e · runn→run
    if(PSY_TRANS.has(c) || PSY_INTRANS.has(c)) return c;
  return null;
}
/* ¿La palabra en -ing de la posición i es adjetivo (complemento del be) y no el
   verbo principal? Solo se pronuncia cuando hay señal; si no, se abstiene. */
function adjEnIng(lower, i, auxIdx, aux, n){
  if(!["am","is","are","was","were"].includes(aux)) return false;
  if(i <= auxIdx+1) return false;                 // sin sujeto en medio no hay nada que decidir
  if(!lower[i].endsWith("ing")) return false;
  if(GRADO.has(lower[i-1])) return true;          // «Is the drink very refreshing?»
  const base = psyBase(lower[i]);
  if(!base) return false;
  let fin = n-1;                                  // «tonight» no es objeto
  while(fin > i && TIME_PLACE_ADV.has(lower[fin])) fin--;
  if(fin > i) return false;                       // hay objeto detrás → progresivo
  if(PSY_INTRANS.has(base)){
    const subj = lower.slice(auxIdx+1, i);
    if(subj.length === 1 && PRONOUNS.includes(subj[0])) return false;
  }
  return true;
}

function isVerbCandidate(w){
  if(!w) return false;
  if(NOT_VERBS.has(w)) return false;
  if(VERB_BASES.has(w)) return true;
  if(PAST_FORMS.has(w) || PART_FORMS.has(w)) return true;
  if(w.length>4 && w.endsWith("ing")) return true;
  if(w.length>3 && w.endsWith("ed")) return true;
  if(w.endsWith("s") && VERB_BASES.has(w.slice(0,-1))) return true;
  if(w.endsWith("es") && VERB_BASES.has(w.slice(0,-2))) return true;
  if(w.endsWith("ies") && VERB_BASES.has(w.slice(0,-3)+"y")) return true;
  return false;
}
function baseOf(w){
  if(VERB_BASES.has(w)) return w;
  if(PAST_FORMS.has(w)) return PAST_FORMS.get(w);
  if(PART_FORMS.has(w)) return PART_FORMS.get(w);
  if(w.endsWith("ies") && VERB_BASES.has(w.slice(0,-3)+"y")) return w.slice(0,-3)+"y";
  if(w.endsWith("es") && VERB_BASES.has(w.slice(0,-2))) return w.slice(0,-2);
  if(w.endsWith("s") && VERB_BASES.has(w.slice(0,-1))) return w.slice(0,-1);
  if(w.endsWith("ing")) return w.slice(0,-3);
  if(w.endsWith("ed")) return w.slice(0,-2);
  return w;
}

/* ══════════════ VERBOS FRASALES ══════════════
   «What time do you get up during the week?» dejaba «get» de verbo y
   «up during the week» de complemento: la partícula es parte del VERBO, y sin
   ella el alumno ve mal justo la pieza que esta app enseña a reconocer.

   La lista NO se escribe aquí. Vive en Grammar HUB/phrasal-verbs.json y llega
   generada, la misma que consume Desgramatizador. Esa app ya lo hacía bien y
   esta no tenía ninguna noción de frasal: el reporte del profesor fue «pensé que
   habíamos solucionado el problema», y lo estaba, en la otra app.

   LA PARTE FINA es que hay partículas que también son preposiciones. «go on» es
   frasal, pero en «go on holiday» ese «on» es preposición y `holiday` no es el
   objeto de nada. Por eso una partícula ambigua solo se absorbe si detrás NO
   viene un adverbial de tiempo o lugar. Las puramente adverbiales (up, down,
   off, out, back) no tienen esa duda y se absorben siempre. */
const PHRASAL = window.GRAMMAR_PHRASAL || {verbs:[], prepParticles:[], adverbialHeads:[], determiners:[]};
const PHRASAL_POR_VERBO = new Map();
for(const e of PHRASAL.verbs){
  if(!PHRASAL_POR_VERBO.has(e[0])) PHRASAL_POR_VERBO.set(e[0], []);
  PHRASAL_POR_VERBO.get(e[0]).push(e.slice(1));
}
const PREP_PART = new Set(PHRASAL.prepParticles);
const CABEZA_ADV = new Set(PHRASAL.adverbialHeads);
const DETERMINANTES = new Set(PHRASAL.determiners);
const limpiaPal = w => String(w || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* ¿Este complemento es un adverbial de TIEMPO?
   Hace falta para ordenar la respuesta modelo: el inglés coloca objeto, después
   LUGAR, después TIEMPO, y sin distinguir el tiempo del resto «Where did you eat
   today?» respondía «I ate today [+lugar]».
   Reconoce las tres formas en que aparece un tiempo:
     · suelto            → «today», «yesterday»
     · con cuantificador → «last week», «every day», «this morning»
     · con preposición   → «in the morning», «on Monday», «at 8», «in 2020»
   Con preposición se EXIGE que el núcleo sea temporal, porque `in`, `on` y `at`
   encabezan lugares igual de bien: «at home» y «at 8» empiezan igual y no son lo
   mismo. Las listas salen de phrasal-verbs.json, que ya era la fuente única de
   núcleos adverbiales para las dos apps que analizan. */
const ADV_T_SUELTO = new Set(PHRASAL.advTiempoSueltos || []);
const CUANT_T = new Set(PHRASAL.cuantificadoresTiempo || []);
const PREP_T = new Set(PHRASAL.preposicionesTiempo || []);
const NUCLEO_T = new Set(PHRASAL.adverbialHeadsTime || []);
const PREP_SEC = new Set(PHRASAL.preposicionesSecuencia || []);
const EVENTO_T = new Set(PHRASAL.nucleosDeEvento || []);
const esNucleoTiempo = w => NUCLEO_T.has(w) || /^(19|20)\d{2}$/.test(w) || /^\d{1,2}(:\d{2})?$/.test(w);
function esComplementoDeTiempo(tokens){
  if(!tokens || !tokens.length) return false;
  const p = tokens.map(limpiaPal).filter(Boolean);
  if(!p.length) return false;
  if(p.length === 1 && ADV_T_SUELTO.has(p[0])) return true;         // «today»
  if(CUANT_T.has(p[0]) && p[1] && esNucleoTiempo(p[1])) return true; // «last week»
  if(PREP_T.has(p[0])){                                              // «in the morning»
    let i = 1;
    if(DETERMINANTES.has(p[i])) i++;
    if(!p[i]) return false;
    if(esNucleoTiempo(p[i])) return true;
    /* «after class», «before dinner». Un nombre de evento solo es tiempo detrás
       de una preposición de SECUENCIA: «after school» es cuándo y «at school»
       es dónde, con el mismo sustantivo. */
    return PREP_SEC.has(p[0]) && EVENTO_T.has(p[i]);
  }
  return false;
}

function encabezaAdverbial(resto){
  if(!resto.length) return false;
  let h = limpiaPal(resto[0]);
  if(DETERMINANTES.has(h)){            // «on a holiday», «in the morning»
    if(resto.length < 2) return false;
    h = limpiaPal(resto[1]);
  }
  return CABEZA_ADV.has(h) || /^\d{2,4}$/.test(h);   // «in 2020»
}
/* Cuántos tokens de la cabeza del complemento son en realidad del verbo. 0 = ninguno.
   Prueba la más larga primero: «come up with» antes que «come up». */
function particulasDelVerbo(base, comp){
  const opciones = PHRASAL_POR_VERBO.get(base);
  if(!opciones || !comp || !comp.length) return 0;
  for(const parts of [...opciones].sort((a, b) => b.length - a.length)){
    if(parts.length > comp.length) continue;
    if(!parts.every((p, i) => limpiaPal(comp[i]) === p)) continue;
    if(PREP_PART.has(parts[parts.length - 1]) && encabezaAdverbial(comp.slice(parts.length))) continue;
    return parts.length;
  }
  return 0;
}

/* ================================================================
   PARSER
================================================================ */
function analyze(raw){
  const warnings = [];
  const notes = [];
  let advTokens = [];
  let q = raw.trim().replace(/[’‘]/g, "'");
  q = q.replace(/\b(what|where|who|when|why|which|how)'s\b/gi, "$1 is");   // What's / Where's / How's… → is
  if(!q) return {ok:false, error: lang==="en" ? "Type a question first. 😊" : "Escribe una pregunta primero. 😊"};
  if(!/\?\s*$/.test(q)) warnings.push(lang==="en" ? "Tip: questions in English end with \"?\"." : "Tip: las preguntas en inglés terminan con «?».");

  /* MAYÚSCULAS. Meses, días y nacionalidades — el conjunto donde el español y el
     inglés NO coinciden, que es de donde sale el error. El motor y la lista
     vienen de Grammar HUB; el porqué largo está en `capitals-engine.js`.
     Va en `warnings` y no en `notes` porque es una corrección de lo que el
     alumno ESCRIBIÓ, como el aviso del «?», y no una explicación de gramática.
     La primera palabra se salta: ahí la mayúscula la pide el inicio de oración,
     que es otra regla y ya la enseña cualquier profesor — marcarla aquí diría
     «los meses van en mayúscula» señalando algo que iría en mayúscula igual. */
  (function(){
    const C = (typeof window !== "undefined" && window.GH_CAPS) || null;
    if(!C) return;
    const inicio = q.search(/[A-Za-z]/);
    const hallazgos = C.revisarMayusculas(q, { canonico: C.CAPS_CANONICO, ambiguas: C.CAPS_AMBIGUAS })
      .filter(h => h.indice !== inicio);
    if(!hallazgos.length) return;
    const lista = hallazgos.map(h => `<b>${esc(h.sugerida)}</b>`).join(" · ");
    warnings.push(lang==="en"
      ? `In English, months, days and nationalities take a capital: ${lista}.`
      : `En inglés los meses, los días y las nacionalidades van con mayúscula: ${lista}.`);
  })();

  /* CONDICIÓN AL FRENTE: «If it rains, will you stay?». La pregunta de verdad es
     la SEGUNDA cláusula; el analizador miraba «If» al inicio, no encontraba ni
     wh-word ni auxiliar, y rechazaba la oración entera.
     En vez de abrir un camino paralelo, se reescribe con la condición al final y
     se analiza eso: así el volteo de pronombres y la respuesta salen del mismo
     código de siempre. Solo la pieza se mueve al frente para dibujarla en el
     orden en que se escribió. */
  const alFrente = q.match(RE_SUBORD_FRENTE);
  if(alFrente){
    const condTexto = (alFrente[1] + alFrente[2]).trim();
    /* La conjunción va en minúscula para el análisis: al reescribirla al final
       queda a mitad de frase, y la respuesta la copia tal cual — sin esto salía
       «I would viajar If I won the lottery». Cuando la pieza vuelve al frente se
       le devuelve la mayúscula, que es como se escribió. */
    const condMin = condTexto.charAt(0).toLowerCase() + condTexto.slice(1);
    const principal = alFrente[3].replace(/\s*\?+\s*$/, "");
    const r = analyze(principal + " " + condMin + "?");
    if(!r.ok || !r.parts) return r;
    const i = r.parts.findIndex(p => p.role === "cond" || p.label === "cláusula subordinada");
    if(i > 0){
      const p = r.parts.splice(i, 1)[0];
      p.text = p.text.charAt(0).toUpperCase() + p.text.slice(1);
      r.parts.unshift(p);
    }
    return r;
  }

  const tokens = q.replace(/[?.!,;:¿¡]+/g," ").trim().split(/\s+/).filter(Boolean);
  const lower = tokens.map(t=>t.toLowerCase());
  const n = tokens.length;
  if(n < 2) return {ok:false, error: lang==="en" ? "The question is too short: it needs at least an auxiliary and a subject." : "La pregunta es muy corta: necesita al menos un auxiliar y un sujeto."};

  // 1. Wh-word (1 o 2 palabras)
  let whLen = 0, whText = "";
  if(WH1.includes(lower[0])){
    whLen = 1;
    if(WH2[lower[0]] && WH2[lower[0]].includes(lower[1])) whLen = 2;
    whText = tokens.slice(0,whLen).join(" ");
  }
  const isOpen = whLen > 0;

  // 2. Auxiliar después de la wh (o al inicio)
  let auxIdx = whLen;
  let aux = lower[auxIdx];
  let negative = false;
  if(NEG_AUX[aux]){ negative = true; aux = NEG_AUX[aux]; }

  if(!AUXES.includes(aux) && isOpen){
    // ¿Wh extendida ("How many books DID you buy?") o pregunta de sujeto ("Who painted...?")
    let sIdx = whLen, extra = [];
    /* UN VERBO SEGUIDO DE AUXILIAR ES UN SUSTANTIVO. En «Whose turn is it?» la
       palabra `turn` también es verbo, así que este bucle paraba ahí, la wh no
       absorbía su sustantivo y la pregunta acababa analizada como si `turn`
       fuera el verbo principal. Pero en una pregunta el verbo principal NUNCA va
       antes del auxiliar: si detrás viene `is/are/did/has…`, lo de delante es el
       sustantivo de la wh.
       Ya fallaba con `work`, `plan` y `call`, que llevaban tiempo en la lista;
       se vio al añadir `turn` para los frasales. No toca las preguntas de
       sujeto: en «Who painted the Mona Lisa?» detrás de `painted` no hay
       auxiliar, así que el bucle sigue parando ahí. */
    while(sIdx < n && !isAuxTok(lower[sIdx]) && extra.length < 3
          && (!isVerbCandidate(lower[sIdx]) || (sIdx+1 < n && isAuxTok(lower[sIdx+1])))){
      extra.push(tokens[sIdx]); sIdx++;
    }
    if(sIdx < n && isAuxTok(lower[sIdx]) && extra.length && !PRONOUNS.includes(lower[whLen])){
      // La wh-word absorbe su sustantivo y el análisis sigue normal desde el auxiliar
      whText = whText + " " + extra.join(" ");
      whLen = sIdx; auxIdx = sIdx; aux = lower[auxIdx];
      if(NEG_AUX[aux]){ negative = true; aux = NEG_AUX[aux]; }
    } else if(PRONOUNS.includes(lower[whLen])){
      // Falta el auxiliar tras la wh: "Where you live?" → wh | ⟦falta aux⟧ | sujeto | verbo
      let vj = -1;
      for(let i = whLen+1; i < n; i++){ if(isVerbCandidate(lower[i])){ vj = i; break; } }
      const parts = [{role:"wh", text:whText, label:"wh-word"}, gapPart("aux","auxiliar","auxiliary")];
      if(vj > 0){
        /* También aquí, aunque la pregunta esté incompleta: el alumno está
           viendo las piezas y no puede aprender el frasal partido en una
           pantalla y entero en otra. */
        const compInc = tokens.slice(vj+1);
        const nInc = particulasDelVerbo(baseOf(lower[vj]), compInc);
        parts.push({role:"subj", text:tokens.slice(whLen, vj).join(" "), label:"sujeto"});
        parts.push({role:"verb", text:[tokens[vj], ...compInc.slice(0, nInc)].join(" "), label:"verbo"});
        if(compInc.length > nInc) parts.push({role:"comp", text:compInc.slice(nInc).join(" "), label:"complemento"});
      } else {
        parts.push({role:"subj", text:tokens.slice(whLen).join(" "), label:"sujeto"});
      }
      const note = lang==="en"
        ? `After the wh-word comes the <b>auxiliary</b> <span class="cdot" style="background:var(--aux)"></span>, then the subject: <i>${whText} <b>do/does/did</b> ${tokens.slice(whLen).join(" ")}?</i>. Check which one fits.`
        : `Después de la wh-word va el <b>auxiliar</b> <span class="cdot" style="background:var(--aux)"></span> y luego el sujeto: <i>${whText} <b>do/does/did</b> ${tokens.slice(whLen).join(" ")}?</i>. Revisa cuál corresponde.`;
      return incompleteResult(parts, [note]);
    } else if(sIdx < n && isVerbCandidate(lower[sIdx]) && ["who","what","which","whose","how"].includes(lower[0])){
      return analyzeSubjectQ(tokens, lower, whText, extra, sIdx, warnings);
    } else {
      return {ok:false, error: lang==="en"
        ? `I found the wh-word "${whText}" <span class="cdot" style="background:var(--wh)"></span> but I can't identify the <b>auxiliary</b> <span class="cdot" style="background:var(--aux)"></span> that should follow it. Is the question well formed?`
        : `Encontré la wh-word «${whText}» <span class="cdot" style="background:var(--wh)"></span> pero no logro identificar el <b>auxiliar</b> <span class="cdot" style="background:var(--aux)"></span> que debería seguirla. ¿Está bien armada la pregunta?`};
    }
  }
  if(!AUXES.includes(aux)){
    return {ok:false, error: lang==="en"
      ? "<b>Closed</b> questions start with an auxiliary (Do, Does, Did, Is, Are, Can, Will…) and <b>open</b> ones with a wh-word (What, Where, Who…). I can't find either at the start. 🤔"
      : "Las preguntas <b>cerradas</b> empiezan con un auxiliar (Do, Does, Did, Is, Are, Can, Will…) y las <b>abiertas</b> con una wh-word (What, Where, Who…). No encuentro ninguno al inicio. 🤔"};
  }

  // 3. Sujeto: desde después del aux hasta el primer verbo candidato
  let vIdx = -1;
  const esVerboEn = i => isVerbCandidate(lower[i]) && !DETS.includes(lower[i])
                         && !adjEnIng(lower, i, auxIdx, aux, n);
  /* El verbo principal está ANTES de cualquier subordinada: lo que viene después
     de «if» es el verbo de OTRA oración. Sin este corte, «What would you if you
     won the lottery?» —a la que le falta el verbo— tomaba el `won` de la
     condición y armaba una estructura inventada: sujeto «you if you», verbo
     «won». Peor que no analizar, porque enseñaba algo falso en vez de avisar de
     lo que faltaba. Con el corte cae al camino de «pregunta incompleta», que ya
     existía y dice exactamente qué falta. */
  const finPrincipal = (() => {
    for(let i = auxIdx+1; i < n; i++) if(CONJ_SUBORD.includes(lower[i])) return i;
    return n;
  })();
  /* DESPUÉS DE `be`, UNA FORMA BASE NO PUEDE SER EL VERBO PRINCIPAL.
     El verbo principal detrás de `is/are/was/were` es siempre -ing (continuo),
     participio (pasiva) o «going to». `be` no admite infinitivo pelado. Así que
     un candidato en forma base, con `be` de auxiliar, es un SUSTANTIVO.

     Sin esto, cualquier palabra que fuera a la vez sustantivo y verbo partía la
     oración: «Is the plan ready?» daba sujeto «the» y complemento «plan ready»,
     y «Is it your turn?» daba sujeto «it your». De 20 palabras probadas rompían
     13 — todas las que están en el léxico de verbos y se usan de sustantivo.

     Es gramática, no heurística, y por eso se prefiere a los dos guardias que ya
     había (mirar si hay determinante delante, o si queda otro verbo detrás):
     esos dejan huecos porque describen síntomas.
     Medido antes de escribirlo: arregla 8 de 10 casos rotos, no mueve ninguno de
     los 17 protegidos, y no cambia NINGUNA de las 300 preguntas del banco.

     La excepción real es `be + to +` infinitivo («Is he to blame?»): ahí el `to`
     va en medio, no está en el temario, y hoy tampoco se analiza bien. */
  const esFormaBase = w => VERB_BASES.has(w) && !w.endsWith("ing") && !w.endsWith("ed")
                           && !PART_FORMS.has(w) && !PAST_FORMS.has(w);
  /* SEMI-AUXILIARES: aquí termina el sujeto, y ningún guardia de abajo opina.
     `use/used to` y `going to` abren la zona verbal, pero los dos guardias que
     vienen después los tomaban por sustantivos y seguían buscando:

       «Where did your family use to go?»  -> sujeto «your family use to»
       «What is your family going to do?»  -> sujeto «your family going to do
                                              tonight», y de ahí una respuesta
                                              inventada: «My family going to do
                                              tonight is…»

     Con sujeto PRONOMBRE nunca se vio, porque el guardia del sustantivo deverbal
     solo entra si hay un determinante delante («your», «the»), y un pronombre no
     lo lleva. Por eso «Where did YOU use to go?» siempre estuvo bien y la
     familia y los niños no.

     Las condiciones son LAS MISMAS con las que se arma el semi-auxiliar más
     abajo (busca `goingTo = true` y `usedTo = true`): si un día cambian allí,
     tienen que cambiar aquí, o el sujeto volverá a comerse el «to». */
  const abreSemiAux = i => lower[i+1] === "to" && isVerbCandidate(lower[i+2])
    && (((lower[i] === "use" || lower[i] === "used") && aux === "did")
        || (lower[i] === "going" && BE_AUX.includes(aux)));
  for(let i = auxIdx+1; i < finPrincipal; i++){
    if(!esVerboEn(i)) continue;
    if(abreSemiAux(i)){ vIdx = i; break; }
    if(BE_AUX.includes(aux) && esFormaBase(lower[i])) continue;
    /* Sustantivo deverbal DENTRO del sujeto: «Is the plan working?» daba
       sujeto=«the» y complemento=«plan working», que además se ve en pantalla.
       Si la palabra va dentro de un sintagma abierto por un determinante y
       todavía queda otro verbo detrás, el verbo era el otro. Es la misma idea
       que «Does work start at eight?» —resuelto más abajo—, pero ahí el
       sustantivo va pelado y aquí lleva determinante, así que aquel guardia no
       llegaba. Sin otro verbo detrás no se toca nada: «Does the bus stop
       here?» y «Is the plan ready?» siguen como estaban. */
    /* «been» queda FUERA de este guardia: no es un sustantivo deverbal, no es
       nada más que verbo. Detrás de have/has/had solo puede abrir el perfecto
       continuo o la pasiva, así que dejarlo opinar aquí solo puede equivocarse.

       Sin la excepción, «Have the dogs been working at home?» salía con sujeto
       «the dogs been»: el guardia veía el determinante «the», encontraba
       «working» más atrás y saltaba el «been». Y al perderse el «been + -ing»,
       el tiempo se reconocía como perfecto simple en vez de continuo, o sea el
       fallo llegaba hasta lo que la app le enseña al alumno.

       Con sujeto pronombre nunca se vio («Have they been working?» siempre
       estuvo bien), que es exactamente el mismo punto ciego que el bloque de los
       semi-auxiliares aquí arriba ya documenta: sin determinante delante este
       guardia ni siquiera entra. */
    if(lower[i] !== "been" && lower.slice(auxIdx+1, i).some(w => DETS.includes(w))){
      let otro = -1;
      for(let j = i+1; j < n; j++){ if(esVerboEn(j)){ otro = j; break; } }
      if(otro !== -1) continue;
    }
    vIdx = i; break;
  }

  // Cláusula relativa escondida: "What is one thing (that) Mia has always loved?"
  // Un segundo auxiliar o un pronombre DENTRO de la zona del sujeto la delata.
  if(isOpen && ["am","is","are","was","were"].includes(aux)){
    const stop = vIdx === -1 ? n : vIdx;
    let embIdx = -1;
    for(let i = auxIdx+2; i < stop; i++){
      if(isAuxTok(lower[i]) || PRONOUNS.includes(lower[i])){ embIdx = i; break; }
    }
    if(embIdx !== -1){
      const subjT = tokens.slice(auxIdx+1).join(" ");
      const clauseStart = PRONOUNS.includes(lower[embIdx]) ? embIdx : Math.max(embIdx-1, auxIdx+2);
      const EMB_TENSES = {has:"Presente Perfecto", have:"Presente Perfecto", had:"Pasado Perfecto",
        did:"Pasado Simple", does:"Presente Simple", "do":"Presente Simple", will:"Futuro (will)",
        is:"Presente", are:"Presente", am:"Presente", was:"Pasado", were:"Pasado"};
      let embAux = null;
      for(let i = clauseStart; i < n; i++){ if(isAuxTok(lower[i])){ embAux = NEG_AUX[lower[i]] || lower[i]; break; } }
      const embTense = embAux ? EMB_TENSES[embAux] : null;
      const parts2 = [
        {role:"wh", text:whText, label:"wh-word"},
        {role:"verb", text:tokens[auxIdx], label:"verbo to be ⭐"},
        {role:"subj", text:subjT, label:"sujeto + cláusula relativa"}
      ];
      const relNotes = [
        `Esta pregunta esconde una <b>cláusula relativa</b>: «${tokens.slice(auxIdx+1, clauseStart).join(" ")} <i>(that)</i> ${tokens.slice(clauseStart).join(" ")}». Todo eso junto es el <b>sujeto</b>, y la pregunta principal es simple, con <b>to be</b>: «${whText} ${tokens[auxIdx]} …?».`
        + (embTense ? ` La cláusula lleva su propio tiempo por dentro (${embTense}), pero eso no cambia la estructura de la pregunta.` : "")
      ];
      // you -> I dentro de la cláusula ("something you enjoy" -> "something I enjoy")
      const flippedSubj = tokens.slice(auxIdx+1)
        .map(t => ({you:"I", your:"my", yours:"mine"}[t.toLowerCase()] || t)).join(" ");
      const hint2 = whHint(whText.toLowerCase());
      const relAnswer = {kind:"open", lines:[{pieces:[
        {role:"subj", text:cap(flippedSubj), label:"sujeto + cláusula"},
        {role:"verb", text:tokens[auxIdx].toLowerCase(), label:"verbo to be ⭐"},
        {role:"new", text:"+ " + hint2, label:"info nueva"}
      ], caption:"Estructura de la respuesta"}]};
      const beTense = (["was","were"].includes(aux) ? "Pasado" : "Presente") + " Simple (to be)";
      return {ok:true, type:"Abierta (Wh-question) con cláusula relativa", qtipo:"open", negative:false,
        tense:beTense, parts:parts2, answer:relAnswer, warnings, notes:relNotes};
    }
  }
  let subjTokens, verbTokens = [], compTokens = [];
  let beMain = false, verbForm = null, mainBase = null, goingTo = false, perfInf = false;
  let semiAuxText = null, usedTo = false, beLike = false, beLikeText = "";

  /* PREGUNTA DE SUJETO con tiempo compuesto: «Who is coming?», «What has
     changed?», «Who has been waiting?». El hueco entre el auxiliar y el verbo
     está vacío porque la wh-word YA ES el sujeto — no falta nada.
     Sin esto se leían de dos maneras, las dos malas: con «be» tomaba el
     gerundio como sujeto («Who is coming?» → to be presente, sujeto=coming), y
     con «has/have» disparaba el aviso de sujeto faltante, o sea le decía al
     alumno que su pregunta correcta estaba mal armada.
     El camino de `analyzeSubjectQ` solo cubre el verbo de una palabra («Who
     lives here?»), así que estas se resuelven aquí y aprovechan toda la lógica
     de tiempos de más abajo. */
  const whBaseSuj = whText.toLowerCase().split(" ")[0];
  /* «How many/much + sustantivo» TAMBIÉN puede ser el sujeto: «How many people
     are working?», «How much money has been spent?». Faltaban porque la lista
     mira la PRIMERA palabra y ahí dice «how», así que hay que mirar las dos.

     Sin esto la pregunta no entraba por la rama de sujeto y el análisis normal
     salía a buscar un sujeto detrás del auxiliar, quedándose con lo que hubiera:
     «How many people are working at home?» daba sujeto «working» y tiempo
     to-be-pres, y «How many people have worked at home?» acababa en «pregunta
     incompleta» con un hueco de sujeto — o sea, la app le decía al alumno que su
     pregunta correcta estaba mal armada, que es el peor resultado posible aquí.

     No hace falta guardia extra contra la wh de adjunto: «How many books did you
     buy?» tiene sujeto propio, así que el verbo NO va pegado al auxiliar y la
     condición `vIdx === auxIdx+1` de aquí arriba ya la deja fuera. */
  const whDosSuj = whText.toLowerCase().split(" ").slice(0, 2).join(" ");
  const whEsSujeto = isOpen && vIdx === auxIdx+1
    && (["who","what","which","whose"].includes(whBaseSuj)
        || ["how many","how much"].includes(whDosSuj))
    && auxIdx === whLen                       // el aux va pegado a la wh: no hay sujeto en medio
    && (
      (["am","is","are","was","were"].includes(aux) && lower[vIdx].endsWith("ing")) ||
      (["have","has","had"].includes(aux) &&
        (lower[vIdx] === "been" || PART_FORMS.has(lower[vIdx]) || lower[vIdx].endsWith("ed"))) ||
      /* Con MODAL: «Who will come?», «What will happen?», «Who can help?». La
         wh-word es el sujeto y el verbo va en base. Faltaba, y sin esto el
         guardia de «falta el sujeto» —que ahora sí cubre los modales— las
         denunciaba a todas. */
      (MODALS.includes(aux) && isVerbCandidate(lower[vIdx]))
    )
    /* «What would do?» es «What would YOU do?» sin sujeto, y «What would do if
       you won the lottery?» igual. Estructuralmente son idénticas a «What would
       happen?», que sí es pregunta de sujeto, así que la forma no las separa.
       Lo que las separa es `do`: como verbo principal EXIGE objeto («What would
       do the job?»). Sin nada detrás, el sujeto es lo que falta.
       Es una regla estrecha a propósito: solo `do`, y solo cuando no lleva
       complemento. Los demás verbos no se pueden distinguir y no se intenta. */
    && !(["do","does","did"].includes(lower[vIdx]) && vIdx + 1 >= finPrincipal);

  if(!whEsSujeto && vIdx === auxIdx+1 && ["is","are","am","was","were","do","does","did","have","has","had","will","can","could","would","should","may","might","must"].includes(aux)){
    // El token justo después del aux parece verbo pero debería ser sujeto (nombres como "work" o error)
    // Solo lo tratamos como sujeto si NO hay más verbos después; si hay, era sujeto-nombre.
    // No aplica a la pregunta de sujeto: ahí «going to» y «been» son parte del
    // verbo, y sin el guardia se los llevaba al sujeto.
    /* La rebusca se detiene en la subordinada por el mismo motivo que la
       primera: el verbo de la condición no puede justificar que la palabra
       pegada al auxiliar sea un sujeto-nombre. Sin el corte, «What would do if
       you won the lottery?» tomaba el `won` del `if` y armaba el sujeto
       «do if you». */
    let v2 = -1;
    for(let i = vIdx+1; i < finPrincipal; i++){ if(isVerbCandidate(lower[i])){ v2 = i; break; } }
    if(v2 > 0){ vIdx = v2; } // "Does work start at 8?" -> subj = work
  }

  /* Falta el sujeto: tras el auxiliar viene el verbo pegado, sin sujeto en medio
     y sin otro verbo después → la pregunta perdió el sujeto. Las preguntas bien
     armadas siempre llevan el sujeto entre el auxiliar y el verbo.
     LOS MODALES FALTABAN en esta lista, así que «What would do?» se daba por
     buena: caía al camino de «modal como verbo principal» y convertía el verbo
     en sujeto. Con `do/does/did` sí avisaba, y esa incoherencia es la que
     reportó el docente.
     No se lleva por delante el sujeto en gerundio («Would swimming help?»):
     cuando hay otro verbo después, la rebusca de arriba ya movió `vIdx` y este
     guardia no llega a dispararse. */
  if(!whEsSujeto && vIdx === auxIdx+1
     && (["do","does","did","have","has","had"].includes(aux) || MODALS.includes(aux))){
    const auxW = tokens[auxIdx], vW = tokens[vIdx];
    const parts = [];
    if(isOpen) parts.push({role:"wh", text:whText, label:"wh-word"});
    parts.push({role:"aux", text:auxW, label:"auxiliar"});
    parts.push(gapPart("subj","sujeto","subject"));
    const compFalta = tokens.slice(vIdx+1);
    const nFalta = particulasDelVerbo(baseOf(lower[vIdx]), compFalta);
    parts.push({role:"verb", text:[vW, ...compFalta.slice(0, nFalta)].join(" "), label:"verbo"});
    if(compFalta.length > nFalta) parts.push({role:"comp", text:compFalta.slice(nFalta).join(" "), label:"complemento"});
    const note = lang==="en"
      ? `Every question needs a <b>subject</b> <span class="cdot" style="background:var(--subj)"></span> between the auxiliary «${auxW}» and the verb «${vW}»: <i>${auxW} <b>[subject]</b> ${tokens.slice(vIdx).join(" ")}?</i>`
      : `Toda pregunta necesita un <b>sujeto</b> <span class="cdot" style="background:var(--subj)"></span> entre el auxiliar «${auxW}» y el verbo «${vW}»: <i>${auxW} <b>[sujeto]</b> ${tokens.slice(vIdx).join(" ")}?</i>`;
    return incompleteResult(parts, [note]);
  }

  /* ¿La palabra que ocupa el sitio del verbo es un verbo MAL ESCRITO?
     «Does she wrok at home?» no es una pregunta incompleta: el verbo está, con
     dos letras cruzadas. Decirle al alumno que le falta una pieza cuando lo
     único que hizo fue teclear rápido en el celular es el peor resultado
     posible, y es el mismo fallo que ya se corrigió dos veces en el analizador
     (el hueco falso de «How many people have worked…»).

     El pozo de candidatos son SOLO los verbos, no el diccionario entero: lo que
     falta aquí es un verbo por posición —do/does/did y los modales exigen uno—,
     así que el hueco ya dice de qué clase de palabra se trata. Es el mismo
     principio que en Grammaster hace que detrás de «be» se prefieran adjetivos.

     No corrige nada por su cuenta: propone. La decisión de si quiso decir
     «work» es del alumno, y equivocarse proponiendo cuesta mucho menos que
     acusar de incompleta una pregunta que no lo está. */
  function sugerenciaDeVerbo(palabra){
    const S = (typeof window !== "undefined" && window.GH_SPELL) || null;
    if(!S || !palabra) return [];
    const limpia = String(palabra).toLowerCase().replace(/[^a-z']/g, "");
    if(limpia.length < 3 || VERB_BASES.has(limpia)) return [];

    /* Una palabra funcional bien escrita NO es un verbo mal escrito. Sin este
       guardia, «What do you?» —a la que de verdad le falta el verbo— proponía
       que «you» era una errata de «do», y «Did he the book?» que «the» lo era de
       «be». Proponer de más en el caso que el mensaje ya diagnostica bien es
       peor que callar: confunde justo donde el aviso original acertaba. */
    if(PRONOUNS.includes(limpia) || DETS.includes(limpia) || MODALS.includes(limpia)
       || BE_AUX.includes(limpia) || ADVS.includes(limpia) || TIME_PLACE_ADV.has(limpia)
       || PREP_PART.has(limpia) || DETERMINANTES.has(limpia) || NOT_VERBS.has(limpia)
       || GRADO.has(limpia)) return [];

    /* `categoria:'verbo'` con el vocabulario del curso desempata entre
       candidatos que están a la MISMA distancia, sin adelantar nunca a uno más
       cercano. Es lo que separa «liek» → «like» de «liek» → «lie»: las dos
       están a una edición, pero «like» es un verbo que el curso enseña y «lie»
       no aparece en ningún nivel. Sin esto ganaba el orden alfabético, que aquí
       no significa nada. */
    return S.sugerenciasDe(limpia, {
      diccionario: [...VERB_BASES],
      categoriaDe: (typeof window !== "undefined" && window.VOCAB_CATEGORIA_DE) || null,
      categoria: "verbo",
      max: 3,
    });
  }

  // Falta el verbo principal: do/does/did y los modales exigen un verbo base.
  // Si no se encontró ningún verbo (vIdx===-1), el verbo falta. («be» sí va solo.)
  if(vIdx === -1 && (["do","does","did"].includes(aux) || MODALS.includes(aux))){
    const auxW = tokens[auxIdx];
    const after = tokens.slice(auxIdx+1);
    const parts = [];
    if(isOpen) parts.push({role:"wh", text:whText, label:"wh-word"});
    parts.push({role:"aux", text:auxW, label:"auxiliar"});
    let subjTxt = "", compAfter = [];
    if(after.length){
      if(PRONOUNS.includes(lower[auxIdx+1])){ subjTxt = tokens[auxIdx+1]; compAfter = after.slice(1); }
      else { subjTxt = after.join(" "); }
    }
    /* La primera palabra del complemento es la que ocupa el sitio del verbo, así
       que es la candidata a ser un verbo mal escrito. Si no hubo sujeto
       pronombre, `compAfter` va vacío y todo se fue al sujeto: ahí se mira la
       ÚLTIMA del sujeto, que es la que queda pegada al hueco. */
    const sospechosa = compAfter.length ? compAfter[0]
      : (subjTxt ? subjTxt.split(/\s+/).pop() : "");
    const erratas = sugerenciaDeVerbo(sospechosa);

    if(subjTxt) parts.push({role:"subj", text:subjTxt, label:"sujeto"});
    else parts.push(gapPart("subj","sujeto","subject"));
    parts.push(gapPart("verb","verbo","verb"));
    if(compAfter.length) parts.push({role:"comp", text:compAfter.join(" "), label:"complemento"});
    const shown = subjTxt || (lang==="en" ? "[subject]" : "[sujeto]");
    const note = lang==="en"
      ? `«${auxW}» needs a <b>main verb</b> <span class="cdot" style="background:var(--verb)"></span> after the subject: <i>${isOpen ? whText+" " : ""}${auxW} ${shown} <b>[verb]</b> …?</i>`
      : `«${auxW}» necesita un <b>verbo principal</b> <span class="cdot" style="background:var(--verb)"></span> después del sujeto: <i>${isOpen ? whText+" " : ""}${auxW} ${shown} <b>[verbo]</b> …?</i>`;

    /* La sugerencia va DELANTE del aviso de pieza faltante, no detrás: si el
       alumno solo escribió mal el verbo, lo primero que tiene que leer es eso,
       no un diagnóstico que no le corresponde. */
    if(erratas.length){
      const lista = erratas.map(v => `<b>${esc(v)}</b>`).join(lang==="en" ? " / " : " / ");
      const aviso = lang==="en"
        ? `Is «${esc(sospechosa)}» a typo? Maybe you meant ${lista} — that would be the <b>main verb</b> <span class="cdot" style="background:var(--verb)"></span> and the question would be complete.`
        : `¿«${esc(sospechosa)}» es una errata? Quizá quisiste escribir ${lista} — ahí iría el <b>verbo principal</b> <span class="cdot" style="background:var(--verb)"></span> y la pregunta quedaría completa.`;
      return incompleteResult(parts, [aviso, note]);
    }
    return incompleteResult(parts, [note]);
  }

  if(whEsSujeto){
    // La wh-word ocupa la casilla del sujeto; el resto sigue el camino normal,
    // así que la sección de tiempos de más abajo funciona sin tocarla.
    subjTokens = [whText];
    verbTokens = [tokens[vIdx]];
    compTokens = tokens.slice(vIdx+1);
  } else if(vIdx > auxIdx+1){
    subjTokens = tokens.slice(auxIdx+1, vIdx);
    verbTokens = [tokens[vIdx]];
    compTokens = tokens.slice(vIdx+1);
    // Adverbios (ever, always…) y "not" no son parte del sujeto
    const advs = [];
    while(subjTokens.length > 1){
      const last = subjTokens[subjTokens.length-1].toLowerCase();
      if(last === "not"){ negative = true; subjTokens.pop(); }
      else if(ADVS.includes(last)){ advs.unshift(subjTokens.pop()); }
      else break;
    }
    if(advs.length) advTokens = advs;   // el adverbio es su propia pieza, no parte del verbo
  } else if(vIdx === -1 || vIdx === auxIdx+1){
    // No hay verbo después del sujeto -> be/modal como verbo principal (Is she a doctor?)
    let sEnd = auxIdx+2;
    /* `this/that/these/those` son determinante Y pronombre, y estaban solo como
       determinante: el sujeto se comía la palabra siguiente. «Is this your
       plan?» daba sujeto «this your», y «Is this correct?» daba sujeto «this
       correct» y NINGÚN complemento, o sea que se tragaba la pieza que la
       pregunta enseña.
       Es determinante solo si de verdad determina un sustantivo: hacen falta al
       menos dos palabras detrás («Is this book new?») y la de al lado no puede
       ser otro determinante, porque «this your» no existe. En cualquier otro
       caso es pronombre y el sujeto termina en él. */
    const DEMOS = ["this","that","these","those"];
    const esDeterminante = DETS.includes(lower[auxIdx+1])
      && !(DEMOS.includes(lower[auxIdx+1])
           && (n - (auxIdx+2) < 2 || DETS.includes(lower[auxIdx+2])));
    if(esDeterminante) sEnd = auxIdx+3;
    // Pregunta de identidad ("What is your favorite food?"): todo el resto es el sujeto
    const whBase0 = whText.toLowerCase().split(" ")[0];
    if(isOpen && vIdx === -1 && !PRONOUNS.includes(lower[auxIdx+1])
      && ["what","who","which","whose","where","when"].includes(whBase0)) sEnd = n;
    subjTokens = tokens.slice(auxIdx+1, Math.min(sEnd, n));
    compTokens = tokens.slice(Math.min(sEnd, n));
    if(compTokens.length && compTokens[0].toLowerCase() === "not"){ negative = true; compTokens = compTokens.slice(1); }
    beMain = true;
  }

  if(!subjTokens || subjTokens.length === 0){
    return {ok:false, error: lang==="en"
      ? `I found the auxiliary "${aux}" <span class="cdot" style="background:var(--aux)"></span> but I can't see the <b>subject</b> <span class="cdot" style="background:var(--subj)"></span> that should follow it.`
      : `Encontré el auxiliar «${aux}» <span class="cdot" style="background:var(--aux)"></span> pero no logro ver el <b>sujeto</b> <span class="cdot" style="background:var(--subj)"></span> que debería seguirlo.`};
  }
  const subjText = subjTokens.join(" ");
  const subjLower = subjText.toLowerCase();

  // Falta el sujeto con "be": "Where were yesterday?" — con where/when, si lo que
  // sigue al be es solo un adverbio de tiempo/lugar (no un sujeto), falta el sujeto.
  // (No aplica a "How was yesterday?", donde "yesterday" SÍ es el sujeto.)
  if(beMain && isOpen && ["where","when"].includes(whText.toLowerCase().split(" ")[0])
     && subjTokens.every(w => TIME_PLACE_ADV.has(w.toLowerCase()))){
    const auxW = tokens[auxIdx];
    const parts = [{role:"wh", text:whText, label:"wh-word"},
      {role:"verb", text:auxW, label:"verbo to be ⭐"},
      gapPart("subj","sujeto","subject"),
      {role:"comp", text:[...subjTokens, ...compTokens].join(" "), label:"adverbial"}];
    const note = lang==="en"
      ? `With «be» you still need a <b>subject</b> <span class="cdot" style="background:var(--subj)"></span> (who/what): «${subjText}» is an adverbial, not a subject. <i>${whText} ${auxW} <b>[subject]</b> ${subjText}?</i>`
      : `Con «be» igual necesitas un <b>sujeto</b> <span class="cdot" style="background:var(--subj)"></span> (quién/qué): «${subjText}» es un adverbial, no un sujeto. <i>${whText} ${auxW} <b>[sujeto]</b> ${subjText}?</i>`;
    return incompleteResult(parts, [note]);
  }

  // 4. Analizar el verbo principal
  if(!beMain){
    const v = lower[vIdx];
    if(v === "going" && lower[vIdx+1] === "to" && isVerbCandidate(lower[vIdx+2]) && ["am","is","are","was","were"].includes(aux)){
      // be (aux oficial) + going to (semi-aux) + verbo base
      goingTo = true;
      semiAuxText = tokens.slice(vIdx, vIdx+2).join(" ");
      verbTokens = [tokens[vIdx+2]];
      mainBase = baseOf(lower[vIdx+2]);
      compTokens = tokens.slice(vIdx+3);
    } else if((v === "use" || v === "used") && lower[vIdx+1] === "to" && isVerbCandidate(lower[vIdx+2]) && aux === "did"){
      // did (aux, se lleva la carga temporal) + use to (semi-aux) + verbo base
      usedTo = true;
      semiAuxText = tokens[vIdx] + " to";
      verbTokens = [tokens[vIdx+2]];
      mainBase = baseOf(lower[vIdx+2]);
      compTokens = tokens.slice(vIdx+3);
    } else if(v === "like" && ["am","is","are","was","were"].includes(aux) && isOpen && whText.toLowerCase() === "what"){
      // Molde "What + be + sujeto + like?" — like es pareja del what, no el verbo gustar
      beLike = true; beMain = true;
      beLikeText = tokens[vIdx];
      verbTokens = [];
      compTokens = tokens.slice(vIdx+1);
    } else if(v === "have" && MODALS.includes(aux) && lower[vIdx+1]
              && (PART_FORMS.has(lower[vIdx+1]) || lower[vIdx+1].endsWith("ed"))){
      /* INFINITIVO PERFECTO: modal + have + participio («would have done»).
         Sin esto el analizador tomaba «have» como verbo principal y dejaba el
         participio en el complemento: «[verbo] have [comp] done». Roto en TODA
         la app, no solo en la 3ª condicional — «Where would she have gone?»
         daba lo mismo. El presente perfecto («What have you done?») nunca falló
         porque ahí `have` SÍ es el auxiliar; el caso que faltaba es cuando ya
         hay un modal delante y `have` pasa a formar parte del grupo auxiliar. */
      perfInf = true;
      verbTokens = [tokens[vIdx+1]];
      mainBase = baseOf(lower[vIdx+1]);
      verbForm = "part";
      compTokens = tokens.slice(vIdx+2);
    } else if(v === "been" && lower[vIdx+1] && lower[vIdx+1].endsWith("ing")){
      verbTokens = tokens.slice(vIdx, vIdx+2);
      mainBase = baseOf(lower[vIdx+1]);
      verbForm = "perfCont";
      compTokens = tokens.slice(vIdx+2);
    } else {
      mainBase = baseOf(v);
      if(v.endsWith("ing") && v.length>4) verbForm = "ing";
      else if(PART_FORMS.has(v) || v.endsWith("ed")) verbForm = "part";
      else verbForm = "base";
      // will be + ing (futuro continuo)
      if(aux === "will" && v === "be" && lower[vIdx+1] && lower[vIdx+1].endsWith("ing")){
        verbTokens = tokens.slice(vIdx, vIdx+2);
        mainBase = baseOf(lower[vIdx+1]);
        verbForm = "willCont";
        compTokens = tokens.slice(vIdx+2);
      }
    }
  }

  // 5. Tiempo gramatical
  let tense = "", tenseNote = "";
  if(aux === "do" || aux === "does"){ tense = "Presente Simple"; }
  else if(aux === "did"){ tense = usedTo ? "Pasado (hábito con «used to»)" : "Pasado Simple"; }
  else if(["am","is","are"].includes(aux)){
    if(goingTo) tense = "Futuro con «going to»";
    else if(verbForm === "ing") tense = "Presente Continuo";
    else {
      tense = "Presente Simple (to be)"; beMain = true;
      if(verbTokens.length){ compTokens = [...verbTokens, ...compTokens]; verbTokens = []; }
    }
  }
  else if(["was","were"].includes(aux)){
    if(verbForm === "ing") tense = "Pasado Continuo";
    else {
      tense = "Pasado Simple (to be)"; beMain = true;
      if(verbTokens.length){ compTokens = [...verbTokens, ...compTokens]; verbTokens = []; }
    }
  }
  else if(aux === "have" || aux === "has"){
    if(verbForm === "perfCont") tense = "Presente Perfecto Continuo";
    else tense = "Presente Perfecto";
  }
  else if(aux === "had"){ tense = "Pasado Perfecto"; }
  else if(aux === "will"){ tense = verbForm === "willCont" ? "Futuro Continuo" : "Futuro Simple (will)"; }
  else if(aux === "would" && perfInf){
    /* «would have + participio» es el resultado de la 3ª condicional: habla de
       algo que YA no puede pasar. Merece nombre propio y no el de «would» a
       secas, que es el de la 2ª. */
    tense = "Would have (3ª condicional)";
    tenseNote = "«Would have» + participio: el resultado de una condición que ya no puede cumplirse. «What would you have done?»";
  }
  else if(aux === "would"){
    tense = "Would (ofrecimientos / condicional)";
    tenseNote = "«Would» para ofrecer/invitar (Would you like…?) y para el 2º condicional.";
  }
  else if(MODALS.includes(aux) && perfInf){
    tense = `Modal perfecto («${aux} have»)`;
    tenseNote = "Modal + have + participio: mira hacia atrás y opina sobre algo que ya pasó. «You should have called».";
  }
  else if(MODALS.includes(aux)){
    tense = `Verbo modal («${aux}»)`;
    tenseNote = "Los modales no marcan el tiempo por sí solos: el contexto lo hace.";
  }

  // 6. Concordancia sujeto-auxiliar (pedagógico)
  const agr = checkAgreement(aux, subjLower);
  if(agr) warnings.push(agr);

  // 7. Componentes visuales
  const parts = [];
  // En la pregunta de sujeto la wh-word ES el sujeto: una sola pieza, no dos.
  if(isOpen) parts.push({role:"wh", text:whText, label: whEsSujeto ? "wh = sujeto" : "wh-word"});
  /* El rótulo dice el nombre GRAMATICAL, como el resto de las piezas (sujeto,
     verbo, complemento). Decía «conectora prestada», que es lenguaje de la
     analogía y en el chip aparece SOLO, sin la Guía al lado que lo explique.
     «Prestado» se queda porque ahí está lo que hay que aprender —do/does/did se
     piden prestados y el sello del tiempo se les pasa—, pero ahora cuelga de un
     sustantivo que el alumno reconoce aunque no haya leído la analogía. */
  let auxLabel = beMain ? "verbo to be ⭐"
    : ["do","does","did"].includes(aux) ? "auxiliar prestado"
    : "auxiliar";
  if(negative) auxLabel += " ⛔";
  // Si el "not" venía separado ("did … not"), lo mostramos junto al auxiliar
  /* Con el infinitivo perfecto, el `have` es parte del GRUPO auxiliar: la pieza
     lo recoge en vez de dejarlo sin dueño. Va con «…» porque en una pregunta el
     sujeto SE METE EN MEDIO («Would you have helped?»), y escribirlo pegado
     enseñaría un orden de palabras que no existe. Es la misma convención que ya
     usa el «did … not» de la negativa separada. */
  const auxBase = perfInf ? tokens[auxIdx] + " … " + tokens[vIdx] : tokens[auxIdx];
  const auxText = negative && !NEG_AUX[lower[auxIdx]] ? auxBase + " … not" : auxBase;
  // Cuando "be" es el verbo principal (no hay otro verbo), pinta como verbo, no como auxiliar
  parts.push({role: beMain ? "verb" : "aux", text:auxText, label: auxLabel});
  if(!whEsSujeto) parts.push({role:"subj", text:subjText, label:"sujeto"});
  if(beLike) parts.push({role:"wh", text:beLikeText, label:"pareja del what"});
  if(!beMain && semiAuxText) parts.push({role:"semiaux", text:semiAuxText, label:"semi-aux"});
  if(advTokens.length) parts.push({role:"adv", text:advTokens.join(" "), label:"adverbio"});
  /* La partícula del frasal se pasa del complemento al verbo. Va aquí, después
     de que `beMain` haya podido vaciar `verbTokens` («Are you up?» no es frasal)
     y antes de pintar Y de armar la respuesta, que también usa `compTokens`. */
  if(!beMain && verbTokens.length && compTokens.length){
    const nPart = particulasDelVerbo(mainBase, compTokens);
    if(nPart){
      verbTokens = [...verbTokens, ...compTokens.slice(0, nPart)];
      compTokens = compTokens.slice(nPart);
    }
  }
  if(!beMain && verbTokens.length){
    if(verbForm === "perfCont" && verbTokens.length >= 2){
      // Perfecto continuo: "been" es parte del auxiliar (have/has/had been), no del verbo
      parts.push({role:"aux", text:verbTokens[0], label:"auxiliar (be)"});
      parts.push({role:"verb", text:verbTokens.slice(1).join(" "), label:"verbo -ing"});
    } else {
      parts.push({role:"verb", text:verbTokens.join(" "), label:"verbo"});
    }
  }
  /* La subordinada sale del bloque gris y es su propia pieza. Antes «if you won
     the lottery» quedaba dentro del complemento y el alumno no veía ni que era
     una condición ni qué tiempo llevaba — justo lo que la condicional enseña. */
  const sub = partirSubordinada(compTokens, mainBase);
  if(sub){
    if(sub.antes.length) parts.push({role:"comp", text:sub.antes.join(" "), label:"complemento"});
    parts.push({role: sub.esCondicion ? "cond" : "comp",
                text: sub.conj + " " + sub.sub.join(" "),
                label: sub.esCondicion ? "condición" : "cláusula subordinada"});
  } else if(compTokens.length){
    parts.push({role:"comp", text:compTokens.join(" "), label:"complemento"});
  }

  // 8. Respuesta: qué piezas vuelven
  const answer = buildAnswer({isOpen, whText: whText.toLowerCase(), aux, subjLower, subjText,
    beMain, goingTo, usedTo, semiAuxText, negative, beLike, verbForm, mainBase, verbTokens, compTokens, perfInf, notes});

  if(beLike) notes.push("«What + be + sujeto + <b>like</b>?» es un molde fijo para pedir <b>descripciones</b> (¿cómo es/era…?). Ese «like» no es el verbo gustar: hace pareja con el «what», y en la respuesta <b>desaparece</b>: «She was friendly and a bit shy».");

  if(negative && !isOpen) notes.push("Pregunta <b>negativa</b>: expresa sorpresa o busca confirmación («¿No te gusta…?»). En inglés respondes según la <b>realidad</b>, sin importar el «not»: «Yes, I do» = sí me gusta · «No, I don't» = no me gusta.");
  if(negative && isOpen) notes.push("Pregunta <b>negativa</b>: la respuesta devuelve la negación tal cual. El auxiliar negativo conserva el <b>sello del tiempo</b>, así que el verbo se queda en forma base: «He <b>didn't like</b> it because…».");

  if(goingTo) notes.push("Aquí el <b>be</b> es el auxiliar oficial <span class=\"cdot\" style=\"background:var(--aux)\"></span> (él hace la pregunta y la negación) y «going to» es su <b>ayudante</b> (semi-auxiliar): juntos forman el futuro. El verbo principal queda en forma base.");
  if(usedTo) notes.push("«used to» = hábitos del pasado que ya no ocurren. Funciona como <b>semi-auxiliar</b>: en la pregunta, «did» se lleva la carga temporal y queda «use to»; al responder en positivo, sueltas el «did» y su carga <b>pasa al semi-auxiliar</b>: «I <b>used to</b> play…».");

  if(beMain) notes.push("El verbo <b>to be</b> es el punki 🎸, el rey 👑, la estrella ⭐ de los verbos: rompe todas las reglas y hace el trabajo duro él solito. Es la pieza que <b>se conecta sola</b>, no le pide prestado a nadie. Él mismo pregunta, niega y responde: «Yes, she <b>is</b>».");
  if(!isOpen && ["do","does","did"].includes(aux)){
    const exSubj = aux === "does" ? "she" : "I";
    const exVerb = aux === "does" ? "likes" : "like";
    notes.push(`Tiempo simple = una sola pieza. Para preguntar tuvo que <b>pedir prestado un auxiliar</b> («${aux}»), y el sello del tiempo se pasó a ella. En la respuesta <b>corta</b> el auxiliar se queda («Yes, ${exSubj} <b>${aux}</b>»); en la <b>larga</b> ya no hace falta, así que la devuelves y el sello vuelve al verbo: «Yes, ${exSubj} <b>${exVerb}</b> coffee a lot».`);
  }
  if(!isOpen && !beMain && ["have","has","had","am","is","are","was","were","will"].includes(aux)) notes.push("Tiempo compuesto = dos piezas: el auxiliar «" + aux + "» viene <b>de fábrica</b>, no se pide prestada a nadie. La respuesta corta siempre devuelve esa primera pieza (el auxiliar).");
  if(tenseNote) notes.push(tenseNote);

  /* Pregunta de sujeto: la respuesta NO agrega un dato al final, NOMBRA al
     sujeto. Sin esto salía «He/she/it is coming + una persona 🧑 tonight», que
     enseña justo lo contrario de lo que hay que aprender aquí. */
  let answerFinal = answer, typeStr;
  if(whEsSujeto){
    const auxCorto = tokens[auxIdx].toLowerCase();
    const largas = [
      {role:"new", text:"[sujeto real]", label:"info nueva"},
      {role:"aux", text:auxCorto, label:"auxiliar"}
    ];
    if(semiAuxText) largas.push({role:"semiaux", text:semiAuxText, label:"semi-aux"});
    if(verbTokens.length) largas.push({role:"verb", text:verbTokens.join(" "), label:"verbo"});
    if(compTokens.length) largas.push({role:"comp", text:compTokens.join(" "), label:"complemento"});
    answerFinal = {kind:"subject", lines:[
      {pieces:[
        {role:"new", text:"[sujeto real]", label:"info nueva"},
        {role:"aux", text:auxCorto + ".", label:"auxiliar"}
      ], caption:"Respuesta corta"},
      {pieces:largas, caption:"Respuesta larga"}
    ]};
    notes.unshift(
      `<b>Pregunta de sujeto</b>: «${whText}» no pide un dato al final: <b>ES el sujeto</b>. Por eso entre «${tokens[auxIdx]}» y «${verbTokens.join(" ")}» no hay nadie: el hueco no está vacío por error, lo ocupa la wh-word.`,
      `Se responde <b>nombrando</b> a quien hace la acción: «Ana ${auxCorto}${compTokens.length || verbTokens.length ? " " + [semiAuxText, verbTokens.join(" "), compTokens.join(" ")].filter(Boolean).join(" ") : ""}». En español pasa igual: «¿Quién viene?» → «Viene Ana», no «Ana viene alguien».`
    );
    typeStr = "Abierta (de sujeto)";
  } else {
    typeStr = isOpen ? "Abierta (Wh-question)" : "Cerrada (Yes/No)";
  }
  /* La negativa ya no se pega al texto del tipo («· negativa ⛔»): son dos ejes
     distintos y ahora cada uno tiene su ranura en el chip. */
  return {ok:true, type: typeStr, qtipo: isOpen ? "open" : "closed", negative,
    tense, parts, answer: answerFinal, warnings, notes};
}

function analyzeSubjectQ(tokens, lower, whText, extra, vIdx, warnings){
  const v = lower[vIdx];
  /* «Who picked up the phone?» también parte el frasal si no se mira aquí: esta
     es la rama de las preguntas de sujeto, que no pasa por el camino normal. */
  let compTokens = tokens.slice(vIdx+1);
  let verbText = tokens[vIdx];
  const nPartSubj = particulasDelVerbo(baseOf(v), compTokens);
  if(nPartSubj){
    verbText = [verbText, ...compTokens.slice(0, nPartSubj)].join(" ");
    compTokens = compTokens.slice(nPartSubj);
  }
  let tense = "Presente Simple";
  let auxShort = "does";
  const auxIsMainVerb = (v === "is" || v === "are");
  /* «Who used to work here?» — el hábito pasado también existe sin auxiliar, y
     esta rama solo sabía de verbos de UNA palabra, así que se quedaba con «used»
     y lo daba por Pasado Simple, dejando «to work» en el complemento. Es el
     mismo fallo que el declarativo del Desgramatizador tenía con «did not use
     to»: la perífrasis partida por la mitad.
     El «did» de la respuesta corta ya es el correcto («Maria did»), así que solo
     hay que agrupar el verbo y nombrar bien el tiempo. */
  const usedToSubj = v === "used" && lower[vIdx+1] === "to" && isVerbCandidate(lower[vIdx+2]);
  if(usedToSubj){
    /* LA MISMA cadena que usa la ruta con auxiliar («Did you use to work?»), no
       una equivalente: `tenseIdOf` la reconoce por el «used to» en MINÚSCULA, y
       un «Used to» capitalizado se le escapa y cae en el simple-present de
       reserva. El tiempo saldría mal en la pantalla y en la telemetría de
       gamificación, que también se apoya en ese id. */
    tense = "Pasado (hábito con «used to»)"; auxShort = "did";
    verbText = tokens.slice(vIdx, vIdx+3).join(" ");
    compTokens = tokens.slice(vIdx+3);
  }
  else if(PAST_FORMS.has(v) || (v.endsWith("ed") && !VERB_BASES.has(v))){ tense = "Pasado Simple"; auxShort = "did"; }
  else if(auxIsMainVerb){ tense = "Presente Simple (to be)"; auxShort = v; }
  const whSubj = whText + (extra.length ? " " + extra.join(" ") : "");
  const parts = [
    {role:"wh", text: whSubj, label:"wh = sujeto"},
    {role:"verb", text: verbText, label:"verbo"}
  ];
  if(compTokens.length) parts.push({role:"comp", text: compTokens.join(" "), label:"complemento"});
  const notes = [
    "<b>Pregunta de sujeto</b>: la wh-word ES el sujeto, por eso <b>no lleva auxiliar</b>. Preguntas por «quién/qué hace la acción».",
    `Se responde nombrando al sujeto real: corta con auxiliar («Leonardo da Vinci <b>${auxShort}</b>») o larga repitiendo el verbo.`
  ];
  const answer = {
    kind:"subject",
    lines:[
      {pieces:[
        {role:"new", text:"[sujeto real]", label:"info nueva"},
        {role: auxIsMainVerb ? "verb" : "aux", text:auxShort+".", label:"auxiliar"}
      ], caption:"Respuesta corta"},
      {pieces:[
        {role:"new", text:"[sujeto real]", label:"info nueva"},
        /* `verbText` y no `tokens[vIdx]`: la respuesta larga repite el verbo
           ENTERO. Con la palabra suelta, «Who used to work here?» respondía
           «[sujeto real] used here» y «Who picked up the phone?» perdía la
           partícula — justo las dos formas que la pieza de arriba ya agrupa. */
        {role:"verb", text:verbText, label:"verbo"},
        ...(compTokens.length ? [{role:"comp", text:compTokens.join(" "), label:"complemento"}] : [])
      ], caption:"Respuesta larga"}
    ]
  };
  return {ok:true, type:"Abierta (de sujeto, ¡sin auxiliar!)", qtipo:"open", negative:false,
    tense, parts, answer, warnings, notes};
}

function checkAgreement(aux, subj){
  const third = ["he","she","it"];
  const notThird = ["i","you","we","they"];
  const g = (es, en) => lang==="en" ? en : es;
  if(aux==="does" && notThird.includes(subj)) return g(`Ojo: «does» se usa con <b>he/she/it</b>. Con «${subj}» corresponde «do».`, `Careful: "does" is used with <b>he/she/it</b>. With "${subj}" you need "do".`);
  if(aux==="do" && third.includes(subj)) return g(`Ojo: «do» se usa con <b>I/you/we/they</b>. Con «${subj}» corresponde «does».`, `Careful: "do" is used with <b>I/you/we/they</b>. With "${subj}" you need "does".`);
  if(aux==="is" && ["you","we","they"].includes(subj)) return g(`Ojo: «is» se usa con <b>he/she/it</b>. Con «${subj}» corresponde «are».`, `Careful: "is" is used with <b>he/she/it</b>. With "${subj}" you need "are".`);
  if(aux==="is" && subj==="i") return g("Ojo: con «I» corresponde «am».", `Careful: with "I" you need "am".`);
  if(aux==="are" && [...third,"i"].includes(subj)) return g(`Ojo: «are» se usa con <b>you/we/they</b>.`, `Careful: "are" is used with <b>you/we/they</b>.`);
  if(aux==="am" && subj!=="i") return g("Ojo: «am» solo se usa con «I».", `Careful: "am" is only used with "I".`);
  if(aux==="was" && ["you","we","they"].includes(subj)) return g(`Ojo: «was» se usa con <b>I/he/she/it</b>. Con «${subj}» corresponde «were».`, `Careful: "was" is used with <b>I/he/she/it</b>. With "${subj}" you need "were".`);
  if(aux==="were" && [...third,"i"].includes(subj)) return g(`Ojo: «were» se usa con <b>you/we/they</b>.`, `Careful: "were" is used with <b>you/we/they</b>.`);
  if(aux==="has" && notThird.includes(subj)) return g(`Ojo: «has» se usa con <b>he/she/it</b>. Con «${subj}» corresponde «have».`, `Careful: "has" is used with <b>he/she/it</b>. With "${subj}" you need "have".`);
  if(aux==="have" && third.includes(subj)) return g(`Ojo: como auxiliar, «have» va con <b>I/you/we/they</b>; con «${subj}» corresponde «has».`, `Careful: as an auxiliary, "have" goes with <b>I/you/we/they</b>; with "${subj}" you need "has".`);
  return null;
}

/* ---- Generación de la respuesta: qué piezas vuelven ---- */
const FLIP_SUBJ = {i:"you", you:"I", we:"we", they:"they", he:"he", she:"she", it:"it"};
const FLIP_AUX_TO_I = {are:"am", is:"am", were:"was", does:"do", has:"have"};
const FLIP_AUX_TO_YOU = {am:"are", is:"are", was:"were", does:"do", has:"have"};
const FLIP_COMP = {your:"my", my:"your", yours:"mine", mine:"yours", you:"me", me:"you"};
/* Qué pronombres caben cuando el sujeto NO es pronombre («your mother», «the
   book») y hay que ofrecerle opciones al alumno. La lista tiene que CONCORDAR
   con el auxiliar que ya está en pantalla: ofrecer «they» al lado de «is» invita
   a escribir «They is cooking», y enseñar ese error es lo contrario de para lo
   que existe esto. Se ofrecen opciones a propósito —la pista pide que el alumno
   elija el pronombre—, pero todas tienen que ser correctas.

   Los modales, `did` y `had` no marcan número, así que ahí caben los cuatro y el
   comodín se queda entero. `am` no aparece: solo va con «I», que es pronombre y
   no llega a esta rama. */
const PRON_SEGUN_AUX = {
  is:"he / she / it", was:"he / she / it", does:"he / she / it", has:"he / she / it",
  are:"they", were:"they", do:"they", have:"they",
};
const PRON_COMODIN = "he / she / it / they";
const WH_HINTS = {
  where:"un lugar 📍", when:"un momento 🕐", who:"una persona 🧑", whom:"una persona 🧑",
  what:"una cosa / idea 💡", why:"because + una razón 💬", which:"una opción ✅",
  whose:"un dueño (…'s) 🔑", how:"una manera ✨", "how many":"una cantidad 🔢",
  "how much":"una cantidad 💰", "how often":"una frecuencia 🔁", "how long":"una duración ⏳",
  "how old":"una edad 🎂", "how far":"una distancia 🗺️", "how fast":"una velocidad 🚀",
  "what time":"una hora 🕒", "what kind":"un tipo 🏷️", "what color":"un color 🎨", "what colour":"un color 🎨"
};

/* SUBORDINADAS dentro del complemento.
   `if`/`unless` abren una CONDICIÓN y se explican: son el contenido que se
   enseña (1ª, 2ª y 3ª condicional). Las demás se detectan pero se presentan sin
   desarrollo — decisión del docente: verlas por encima, sin el detalle de
   cláusulas que sí lleva el `if`. Si algún día se quiere explicarlas, el sitio
   es este: basta con darles rótulo y nota propios.

   Detectarlas TODAS no es opcional aunque solo se explique el `if`: el volteo de
   pronombres de la respuesta necesita saber dónde empieza otra oración con su
   propio sujeto. Sin eso, «when I am busy» se quedaba tal cual y «if I call you»
   salía como «if I call me». */
const CONJ_CONDICION = ["if", "unless"];
const CONJ_SUBORD = [...CONJ_CONDICION, "when", "while", "because", "before", "after", "until", "since", "although"];
/* Una sola regla para «cláusula subordinada al frente, coma, y luego la
   pregunta de verdad». La usan `analyze` y `whBaseOf`: si cada uno tuviera la
   suya, el análisis y la pista de Responde podrían discrepar. */
const RE_SUBORD_FRENTE = new RegExp("^\\s*(" + CONJ_SUBORD.join("|") + ")\\b([^,]*),\\s*(.+)$", "i");
/* «Do you know IF he is coming?» — aquí `if` es «whether» y NO es condición: es
   el objeto del verbo. Mismo criterio que Desgramatizador. */
/* `say` NO está aquí: «What would you say if I left?» es una condición de manual,
   y meterlo hacía que la app no la reconociera. La lista es corta a propósito. */
const VERBOS_WHETHER = ["know", "ask", "wonder", "check", "remember", "forget", "decide"];

function partirSubordinada(compTokens, mainBase){
  const i = compTokens.findIndex(t => CONJ_SUBORD.includes(t.toLowerCase()));
  if(i === -1) return null;
  const conj = compTokens[i].toLowerCase();
  const sub = compTokens.slice(i + 1);
  if(!sub.length) return null;                         // «…if» suelto no es cláusula
  /* El guardia del «whether» cambia la ETIQUETA, no impide el corte. Cortar
     siempre es lo que hace que el volteo de pronombres funcione, y eso hace
     falta igual en «Do you know if I am late?» → «…if you are late». */
  const whether = CONJ_CONDICION.includes(conj)
    && VERBOS_WHETHER.includes(String(mainBase || "").toLowerCase());
  return { antes: compTokens.slice(0, i), conj: compTokens[i], sub,
           esCondicion: CONJ_CONDICION.includes(conj) && !whether };
}

const flipObjetos = ts => ts.map(t => FLIP_COMP[t.toLowerCase()] || t);

/* Voltea UNA cláusula subordinada: su sujeto es suyo, no el de la principal.
   «What would you do if I left?» se responde «I would … if YOU left», no «if I
   left»: el `I` de la condición es quien pregunta, así que al responder pasa a
   ser `you`. Y la concordancia lo sigue: «when I am busy» → «when you ARE busy». */
function flipClausula(ts, esCondicion){
  if(!ts.length) return ts;
  const primero = ts[0].toLowerCase();
  if(!PRONOUNS.includes(primero)) return flipObjetos(ts);   // sujeto no pronominal: no cambia
  const nuevoSujeto = primero === "i" ? "you" : FLIP_SUBJ[primero];
  const resto = ts.slice(1);
  if(resto.length){
    const v = resto[0].toLowerCase();
    /* El `were` del subjuntivo NO se toca en una condición: «If I were rich» es
       la forma que se enseña, y bajarlo a «was» enseñaría lo contrario. */
    const dejarWere = esCondicion && v === "were";
    if(!dejarWere){
      if(nuevoSujeto === "I" && FLIP_AUX_TO_I[v]) resto[0] = FLIP_AUX_TO_I[v];
      else if(nuevoSujeto === "you" && FLIP_AUX_TO_YOU[v]) resto[0] = FLIP_AUX_TO_YOU[v];
    }
  }
  return [nuevoSujeto, ...flipObjetos(resto)];
}

/* Cuántos tokens del inicio del complemento son un gerundio o un «to + verbo»
   que cuelga del verbo principal: «love DOING …», «like TO EAT …». 0 = ninguno.
   Se queda con las partículas de un frasal («enjoy getting up early»), porque
   son parte de esa misma pieza verbal. */
function cabezaVerbal(comp){
  if(!comp || !comp.length) return 0;
  const p0 = limpiaPal(comp[0]);
  let n = 0, base = null;
  if(p0.length > 4 && p0.endsWith("ing") && !NOT_VERBS.has(p0)){
    const s = p0.slice(0, -3);
    base = [s, s + "e", s.slice(0, -1)].find(c => VERB_BASES.has(c));
    if(!base) return 0;
    n = 1;
  } else if(p0 === "to" && comp[1] && VERB_BASES.has(limpiaPal(comp[1]))){
    base = limpiaPal(comp[1]);
    n = 2;
  } else return 0;
  return n + particulasDelVerbo(base, comp.slice(n));
}
/* ¿La cabeza verbal es «doing» / «to do» a secas? Con partícula («doing up»)
   ya es otro verbo y no se reemplaza. */
function cabezaEsDo(comp, n){
  const c = comp.slice(0, n).map(limpiaPal).join(" ");
  return c === "doing" || c === "to do";
}

function flipComp(compTokens){
  /* Sin `mainBase`: aquí da igual si el `if` es condición o «whether». Lo que
     importa es que después de la conjunción empieza otra oración con su propio
     sujeto, y eso vale para las dos. */
  const p = partirSubordinada(compTokens, null);
  if(!p) return flipObjetos(compTokens).join(" ");
  return [...flipObjetos(p.antes), p.conj, ...flipClausula(p.sub, p.esCondicion)].join(" ");
}

function buildAnswer(ctx){
  const {isOpen, whText, aux, subjLower, subjText, beMain, goingTo, usedTo, semiAuxText, negative, beLike, verbForm, mainBase, verbTokens, compTokens, perfInf} = ctx;

  // Nuevo sujeto (flip de pronombres)
  let newSubj, subjNote = "";
  if(PRONOUNS.includes(subjLower)){
    newSubj = FLIP_SUBJ[subjLower];
    if(subjLower === "i") newSubj = "you";
    if(newSubj === "I" || newSubj === "i") newSubj = "I";
  } else if(isOpen && beMain){
    // Identidad con be: el sujeto completo vuelve ("your favorite food" -> "my favorite food")
    newSubj = subjText.split(" ").map(t => ({you:"I", your:"my", yours:"mine"}[t.toLowerCase()] || t)).join(" ");
  } else {
    newSubj = PRON_SEGUN_AUX[String(aux || "").toLowerCase()] || PRON_COMODIN;
    /* Con un solo pronombre posible («they») ya no hay nada que elegir, así que
       la pista sobra: se queda solo cuando de verdad hay opciones. */
    if(newSubj.includes(" / "))
      subjNote = lang==="en" ? `Replace "${subjText}" with the matching pronoun.` : `Reemplaza «${subjText}» por el pronombre que corresponda.`;
  }
  // Ajuste del auxiliar según el nuevo sujeto
  let newAux = aux;
  if(newSubj === "I" && FLIP_AUX_TO_I[aux]) newAux = FLIP_AUX_TO_I[aux];
  if(newSubj === "you" && FLIP_AUX_TO_YOU[aux]) newAux = FLIP_AUX_TO_YOU[aux];
  let newNeg = AUX_NEG[newAux] || (newAux + " not");
  const compFlipped = compTokens.length ? flipComp(compTokens) : "";

  if(!isOpen){
    // ---- CERRADA: Yes/No + Sujeto + Aux ----
    // Si "be" es el verbo principal, esta pieza pinta y se etiqueta como verbo, no como auxiliar
    const auxRole = beMain ? "verb" : "aux";
    const auxPieceLabel = beMain ? "verbo to be ⭐" : "auxiliar";
    const yesLine = {signo:"affirmative", pieces:[
      {role:"new", text:"Yes,", label:"info nueva"},
      {role:"subj", text:cap(newSubj), label:"sujeto"},
      {role:auxRole, text:newAux+".", label:auxPieceLabel}
    ], caption:"Afirmativa"};
    let noPieces;
    if(newAux === "am"){
      noPieces = [{role:"new", text:"No,", label:"info nueva"},
        {role:"subj", text:"I'm", label:"sujeto"},
        {role:auxRole, text:"not.", label:auxPieceLabel}];
    } else {
      noPieces = [{role:"new", text:"No,", label:"info nueva"},
        {role:"subj", text:cap(newSubj), label:"sujeto"},
        {role:auxRole, text:newNeg+".", label:auxPieceLabel}];
    }
    const lines = [yesLine, {signo:"negative", pieces:noPieces, caption:"Negativa"}];
    return {kind:"closed", lines, subjNote};
  }

  // ---- ABIERTA: Sujeto + verbo(s) + info nueva que responde la WH ----
  let verbPhrase;
  // "What do you DO?" — do es verbo principal Y la wh pregunta por la acción misma.
  // (En "Where are you doing your homework?" el doing sí se devuelve: se pregunta el lugar.)
  const doMain = !beMain && mainBase === "do" && whText === "what";
  const notes2 = [];
  if(negative){
    // La negación se devuelve tal cual: el aux negativo conserva la carga temporal
    const negAuxText = newNeg === "'m not" ? "am not" : newNeg;
    if(beMain){
      verbPhrase = [{role:"verb", text:negAuxText, label:"be negativo"}];
    } else {
      const perfC = verbForm === "perfCont" && verbTokens.length >= 2;
      verbPhrase = [
        // Igual en negativo: «wouldn't have done», no «wouldn't done».
        {role:"aux", text: perfInf ? negAuxText + " have" : negAuxText, label:"aux negativo"},
        ...(usedTo ? [{role:"semiaux", text:"use to", label:"semi-aux"}] : []),
        ...(goingTo ? [{role:"semiaux", text:"going to", label:"semi-aux"}] : []),
        ...(perfC ? [{role:"aux", text:verbTokens[0].toLowerCase(), label:"auxiliar (be)"}] : []),
        {role:"verb", text: perfC ? verbTokens.slice(1).join(" ")
          : (["do","does","did"].includes(aux) && !usedTo ? mainBase : verbTokens.join(" ")), label:"verbo"}
      ];
    }
  } else if(doMain){
    // Excepción: do como verbo principal NO se devuelve; se reemplaza por la acción real
    const isThird = !["I","you","we","they"].includes(newSubj);
    if(usedTo){
      verbPhrase = [{role:"semiaux", text:"used to", label:"semi-aux"},
        {role:"new", text:"[la acción: play, watch…]", label:"verbo nuevo"}];
    } else if(aux === "do" || aux === "does"){
      verbPhrase = [{role:"new", text: isThird ? "[la acción: works, studies…]" : "[la acción: work, study…]", label:"verbo nuevo"}];
    } else if(aux === "did"){
      verbPhrase = [{role:"new", text:"[la acción en pasado: played, went…]", label:"verbo nuevo"}];
    } else if(goingTo){
      verbPhrase = [{role:"aux", text:newAux, label:"auxiliar"},
        {role:"semiaux", text:"going to", label:"semi-aux"},
        {role:"new", text:"[la acción: travel, study…]", label:"verbo nuevo"}];
    } else if(verbForm === "ing"){
      verbPhrase = [{role:"aux", text:newAux, label:"auxiliar"},
        {role:"new", text:"[la acción-ing: cooking, reading…]", label:"verbo nuevo"}];
    } else if(["have","has","had"].includes(aux)){
      verbPhrase = [{role:"aux", text:newAux, label:"auxiliar"},
        {role:"new", text:"[participio: visited, eaten…]", label:"verbo nuevo"}];
    } else { // will y modales
      verbPhrase = [{role:"aux", text:newAux, label:"auxiliar"},
        {role:"new", text:"[la acción: travel, study…]", label:"verbo nuevo"}];
    }
    notes2.push("Excepción del <b>do</b> como verbo principal: la pieza «do» no se devuelve: se reemplaza por el verbo de la acción que se hizo, hace o hará: «What did you <b>do</b>?» → «I <b>played</b> football».");
  } else if(beMain){
    verbPhrase = [{role:"verb", text:newAux, label:"verbo to be ⭐"}];
  } else if(aux === "do"){
    verbPhrase = [{role:"verb", text:mainBase, label:"verbo"}];
  } else if(aux === "does"){
    const conj = (newSubj==="I"||newSubj==="you"||newSubj==="we"||newSubj==="they") ? mainBase : thirdPerson(mainBase);
    verbPhrase = [{role:"verb", text:conj, label:"verbo conjugado"}];
  } else if(aux === "did"){
    if(usedTo){
      // did devuelve la carga temporal: use to -> used to
      verbPhrase = [{role:"semiaux", text:"used to", label:"semi-aux"},
        {role:"verb", text:mainBase, label:"verbo base"}];
    } else {
      verbPhrase = [{role:"verb", text:pastOf(mainBase), label:"verbo en pasado"}];
    }
  } else if(verbForm === "perfCont" && verbTokens.length >= 2){
    // Perfecto continuo: aux (have/has) + "been" (aux be) + verbo -ing
    verbPhrase = [
      {role:"aux", text:newAux, label:"auxiliar"},
      {role:"aux", text:verbTokens[0].toLowerCase(), label:"auxiliar (be)"},
      {role:"verb", text:verbTokens.slice(1).join(" "), label:"verbo -ing"}
    ];
  } else {
    // be continuo, perfecto, will, modales: aux (+ semi-aux) + verbo tal cual
    verbPhrase = [
      /* Con el infinitivo perfecto el `have` VUELVE en la respuesta: «What would
         you have done?» → «I would HAVE done…». En la pregunta el sujeto lo
         separaba del modal; aquí van juntos, y sin esto salía «I would done». */
      {role:"aux", text: perfInf ? newAux + " have" : newAux, label:"auxiliar"},
      ...(semiAuxText && goingTo ? [{role:"semiaux", text:"going to", label:"semi-aux"}] : []),
      {role:"verb", text:verbTokens.join(" "), label:"verbo"}
    ];
  }
  // Base de la wh: "how many books" -> "how many"; "what kind of music" -> "what kind"
  const whBase = Object.keys(WH_HINTS)
    .filter(k => whText === k || whText.startsWith(k + " "))
    .sort((a,b) => b.length - a.length)[0] || whText.split(" ")[0];
  const hint = beLike ? (lang==="en" ? "a description: friendly, shy… ✨" : "una descripción: friendly, shy… ✨") : whHint(whBase);
  // La info nueva va en el "hueco" que dejó la wh-word:
  //  - wh de argumento (what/who/which/whose/how many…) pregunta por el objeto
  //    del verbo -> el hueco está justo después del verbo, ANTES del complemento.
  //  - wh de circunstancia (where/when/why/how…) -> el hueco está al final.
  //  - complemento que termina en preposición colgada ("live with…?") -> al final.
  const ARG_WH = ["what","who","whom","which","whose","how many","how much","what kind","what color","what colour"];
  const STRAND_PREPS = ["about","with","to","for","at","in","on","from","of","by","like"];
  const lastComp = compTokens.length ? compTokens[compTokens.length-1].toLowerCase() : null;
  /* EL REPARTO ERA BINARIO Y EL ORDEN DEL INGLÉS ES TERNARIO.
     Arriba solo se distinguía «wh de argumento» de «todo lo demás», y con eso
     `where` caía en el mismo saco que `when`. Pero la secuencia es
     sujeto + verbo + OBJETO + LUGAR + TIEMPO, así que un lugar va ANTES de un
     tiempo, no después: «I ate at home today», no «I ate today at home».
     Sin este tercer escalón, «Where did you eat today?» respondía
     «I ate today [+un lugar]». Lo reportó el profesor, y lo diagnosticó él
     mismo: «cambia la wh por what y te darás cuenta».
     Solo entran `where` (lugar) y `how` (modo), que en la secuencia van delante
     del tiempo. `why` NO: su respuesta es una cláusula con «because» y esas van
     al final igual. Y las wh temporales tampoco, por razones obvias. */
  const WH_ANTES_DEL_TIEMPO = ["where", "how"];
  const compEsTiempo = esComplementoDeTiempo(compTokens);
  // En "What was Sarah like at school?" el hueco también va tras el be: "She was ___ at school"
  const gapAfterVerb = !doMain && compFlipped && !STRAND_PREPS.includes(lastComp)
    && ((!beMain && ARG_WH.includes(whBase)) || beLike
        || (compEsTiempo && WH_ANTES_DEL_TIEMPO.includes(whBase)));

  /* EL HUECO PUEDE ESTAR DENTRO DEL COMPLEMENTO. En «Where are you planning to
     travel next week?» todo «to travel next week» se trataba como un bloque, y
     el lugar caía al final: «I am planning to travel next week [+lugar]». Pero
     el lugar es de «travel», no de «planning», y va antes del tiempo: «I am
     planning to travel [lugar] next week». Lo mismo con un objeto: «What do you
     like to eat for breakfast?» → «I like to eat [cosa] for breakfast». Lo
     reportó el profesor trabajando verbos + gerundio / infinitivo.
     Si el complemento EMPIEZA por un gerundio o por «to + verbo», esa pieza va
     pegada al verbo principal y el hueco se busca en lo que queda detrás, con
     las mismas reglas: objeto justo después, y lugar/modo antes de un tiempo.
     La preposición colgada sigue mandando: «What do you like to talk about?»
     deja el hueco al final. Y si la pieza es «doing» / «to do», ni siquiera
     vuelve: la reemplaza la acción, como al «do» principal (ver más abajo). */
  const nVerbal = (doMain || beMain || beLike || STRAND_PREPS.includes(lastComp)) ? 0 : cabezaVerbal(compTokens);
  const restoComp = compTokens.slice(nVerbal);
  const gapAfterVerbal = nVerbal > 0 && restoComp.length > 0
    && (ARG_WH.includes(whBase) || (esComplementoDeTiempo(restoComp) && WH_ANTES_DEL_TIEMPO.includes(whBase)));

  const subjPiece = {role:"subj", text:cap(newSubj), label:"sujeto"};
  const compPiece = compFlipped ? {role:"comp", text:compFlipped, label:"complemento"} : null;
  const newPiece = {role:"new", text:`+ ${hint}`, label:"info nueva"};
  let pieces;
  if(doMain){
    // el verbo nuevo ya responde la wh: no hace falta más info nueva
    pieces = [subjPiece, ...verbPhrase, ...(compPiece ? [compPiece] : [])];
  } else if(nVerbal > 0 && whBase === "what" && cabezaEsDo(compTokens, nVerbal)){
    /* La misma excepción del «do» principal, una pieza más adentro: en «What
       do you love doing?» o «What do you like to do?» el «do» no vuelve, lo
       reemplaza la acción. «I love doing [+cosa]» no es la respuesta; lo es
       «I love cooking». El «to» del infinitivo sí se queda. */
    const ing = nVerbal === 1;
    const restoPiece = restoComp.length ? {role:"comp", text:flipComp(restoComp), label:"complemento"} : null;
    pieces = [subjPiece, ...verbPhrase,
      ...(ing ? [] : [{role:"comp", text:"to", label:"complemento"}]),
      {role:"new", text: ing ? "[la acción-ing: cooking, reading…]" : "[la acción: travel, study…]", label:"verbo nuevo"},
      ...(restoPiece ? [restoPiece] : [])];
    notes2.push(`Excepción del <b>do</b>: «${compTokens.slice(0, nVerbal).join(" ")}» no se devuelve, se reemplaza por la acción: «What do you love <b>doing</b>?» → «I love <b>cooking</b>».`);
  } else if(nVerbal > 0){
    const verbalPiece = {role:"comp", text:flipComp(compTokens.slice(0, nVerbal)), label:"complemento"};
    const restoPiece = restoComp.length ? {role:"comp", text:flipComp(restoComp), label:"complemento"} : null;
    pieces = gapAfterVerbal
      ? [subjPiece, ...verbPhrase, verbalPiece, newPiece, restoPiece]
      : [subjPiece, ...verbPhrase, verbalPiece, ...(restoPiece ? [restoPiece] : []), newPiece];
    if(gapAfterVerbal && ARG_WH.includes(whBase)) notes2.push(`Tu respuesta ocupa el <b>hueco</b> que dejó «${whText}»: aquí no pregunta por el objeto de «${verbPhrase.map(p => p.text).join(" ")}», sino por el de «${verbalPiece.text}». Por eso la info nueva va <b>después</b> de esa pieza, antes del resto del complemento.`);
  } else if(gapAfterVerb){
    pieces = [subjPiece, ...verbPhrase, newPiece, compPiece];
  } else {
    pieces = [subjPiece, ...verbPhrase, ...(compPiece ? [compPiece] : []), newPiece];
  }
  if(gapAfterVerb && !beLike && !nVerbal) notes2.push(`Tu respuesta ocupa el <b>hueco</b> que dejó «${whText}»: como preguntaba por el objeto del verbo, la info nueva va justo después del verbo, antes del complemento.`);
  if(!doMain && !usedTo && !negative && aux==="did") notes2.push(`Devuelves el auxiliar prestado: «did» ya no hace falta, y el sello del tiempo que llevaba vuelve al verbo: «did … ${mainBase}» → «${pastOf(mainBase)}».`);
  if(!doMain && usedTo && !negative) notes2.push("Devuelves el auxiliar prestado: «did» ya no hace falta, y el sello del tiempo que llevaba pasa al semi-auxiliar: «did … use to» → «used to».");
  if(!doMain && !negative && aux==="does") notes2.push("Devuelves el auxiliar prestado: «does» ya no hace falta, y la «-s» de tercera persona que llevaba vuelve al verbo.");
  if(!doMain && !negative && aux==="do") notes2.push("Devuelves el auxiliar prestado: en la respuesta afirmativa el «do» ya no hace falta: queda solo el verbo.");
  return {kind:"open", lines:[{pieces, caption:"Estructura de la respuesta"}], subjNote, extraNotes:notes2};
}

function cap(s){ return s === "I" ? "I" : s.charAt(0).toUpperCase()+s.slice(1); }

/* ================================================================
   RENDER — ANALIZA
================================================================ */
const $ = id => document.getElementById(id);
/* Versión para el reporte de errores. `document.lastModified` es la fecha del
   propio index.html servido, así que no hay nada que subir a mano: una
   constante escrita se queda vieja el primer día que nadie se acuerda, y
   entonces MIENTE, que es peor que no estar. */
const APP_BUILD = document.lastModified;

/* Tabs — se registran primero para que siempre funcionen */
/* Navegación: Analizar (default) · Guía · Práctica (menú → modos) · Progreso.
   Los modos de práctica (build/identify/respond) mantienen activo el nav "Práctica". */
const NAV_OF = {analyze:"analyze", guide:"guide", practice:"practice", build:"practice", identify:"practice", respond:"practice", fillpiece:"practice", progress:"progress"};
function showPanel(id){
  document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));
  const p = $(id); if(p) p.classList.add("active");
  const nav = NAV_OF[id] || id;
  document.querySelectorAll(".tabbtn").forEach(x=>x.classList.toggle("active", x.dataset.nav === nav));
  const sa = document.querySelector(".scrollarea"); if(sa) sa.scrollTop = 0;
  if(id === "progress") renderProgress();
  /* El botón de reportar depende del panel: se recalcula aquí además de después
     de cada interacción. `typeof` porque `showPanel` puede correr antes de que
     se declare —está más abajo en el archivo— y un ReferenceError aquí dejaría
     la app sin pestañas. */
  if(typeof refrescarReporte === "function") refrescarReporte();
}
document.querySelectorAll(".tabbtn").forEach(b=> b.addEventListener("click", ()=> showPanel(b.dataset.panel)));
document.querySelectorAll("[data-goto]").forEach(b=> b.addEventListener("click", ()=> showPanel(b.dataset.goto)));
/* Panel de progreso: racha de días + galería de insignias (gamificación de suite) */
function renderProgress(){
  const el = $("progressBody"); if(!el) return;
  const G = window.GH_GAME;
  if(!G){ el.innerHTML = `<p class="hint">${t("progEmpty")}</p>`; return; }
  if(!ghProgress) ghProgress = G.loadProgress(localStorage);
  const p = ghProgress;
  const streak = (p.dayStreak && p.dayStreak.count) || 0, best = (p.dayStreak && p.dayStreak.best) || 0;
  const bmap = p.badges || {};
  const isOn = b => b.perTense ? Object.keys(bmap).some(k => k.startsWith(b.id + ":")) : !!bmap[b.id];
  const unlocked = G.BADGES.filter(isOn).length;
  const streakCard = `<div class="pstreak ${streak > 0 ? "hot" : ""}"><span class="psi">${streak > 0 ? "🔥" : "💤"}</span><div><b>${streak} ${esc(t("progDays"))}</b><small>${esc(t("progBest"))}: ${best}</small></div></div>`;
  /* Rachas por modo: las actuales ya se persisten (ql_streak / ql_id_streak /
     ql_r_streak / ql_pieza_streak); la mejor histórica viene de ql_best_streaks.
     «Falta una pieza» FALTABA aquí: su racha se calculaba, se guardaba y
     alimentaba la mejor histórica, pero el panel no la mostraba. El modo se
     creó después que este panel y nadie volvió a mirarlo — el mismo despiste
     que dejó ese modo fuera del reporte de errores. Al agregar un modo hay que
     barrer TODO lo que enumera los modos, no solo el menú. */
  const cur = k => { try{ return parseInt(localStorage.getItem(k)||"0",10)||0; }catch(e){ return 0; } };
  let bests = {}; try{ bests = JSON.parse(localStorage.getItem("ql_best_streaks")||"{}"); }catch(e){}
  const modeRows = [
    { k:"b",  icon:'<svg class="lego" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8.5" width="18" height="11" rx="1.8" fill="currentColor"/><rect x="6.6" y="6.5" width="4.3" height="4.1" rx="1.2" fill="currentColor"/><rect x="13.2" y="6.5" width="4.3" height="4.1" rx="1.2" fill="currentColor"/></svg>', name:t("navBuild"),    now:cur("ql_streak") },
    { k:"id", icon:"🎯", name:t("navIdentify"), now:cur("ql_id_streak") },
    { k:"r",  icon:"💬", name:t("navRespond"),  now:cur("ql_r_streak") },
    { k:"w",  icon:"🔍", name:t("navFillPiece"), now:cur("ql_pieza_streak") },
  ].map(m => {
    /* "Mejor" solo cuando de verdad aporta. Si la racha actual YA es la mejor,
       imprimir el mismo número dos veces es ruido en un panel que se mira de
       reojo: eran 6 cifras para 3 modos. */
    const bst = Math.max(bests[m.k]||0, m.now);
    const bestBit = bst > m.now ? ` <small>· ${esc(t("progBest"))}: ${bst}</small>` : "";
    return `<div class="pmrow"><span class="pmri" aria-hidden="true">${m.icon}</span><b>${esc(m.name)}</b><span class="pmrv">${m.now}${bestBit}</span></div>`;
  }).join("");
  const modesCard = `<p class="hint" style="margin:.9rem 0 .4rem">${esc(t("progModes"))}</p><div class="pmodes">${modeRows}</div>`;
  /* Las insignias van en filas con su descripción, no en fichas con solo el
     nombre: antes se veía "🔒 Analista" y no había forma de saber qué era ni
     dónde se conseguía. Bloqueada muestra `where` si lo trae (el candado deja
     de ser un muro y pasa a ser una pista). */
  const grid = G.BADGES.map(b => {
    const on = isOn(b);
    const name = (lang === "en" ? b.name.en : b.name.es).replace("{tense}", "…");
    const desc = lang === "en" ? b.desc.en : b.desc.es;
    const where = !on && b.where ? (lang === "en" ? b.where.en : b.where.es) : "";
    return `<div class="pbadge ${on ? "on" : ""}"><span class="pbi" aria-hidden="true">${on ? b.icon : "🔒"}</span>`
      + `<div class="pbt"><b>${esc(name)}</b><small>${esc(where || desc)}</small></div></div>`;
  }).join("");
  el.innerHTML = streakCard + modesCard + `<p class="hint" style="margin:.9rem 0 .4rem">${esc(t("progBadges"))}: ${unlocked}/${G.BADGES.length}</p><div class="pbadges">${grid}</div>`;
}

// Ejemplos REPRESENTATIVOS del nivel (no acumulativos): 2-3 por nivel.
// La app igual analiza gramática de niveles anteriores; aquí mostramos lo nuevo del nivel.
const EXAMPLES = [
  // Básico I — verbo to be + presente simple
  {q:"Where do you live?", c:"basico1"},
  {q:"Do you like coffee?", c:"basico1"},
  {q:"Is she a doctor?", c:"basico1"},
  // Básico II — presente continuo, pasado simple, to be pasado, can
  {q:"What are you doing right now?", c:"basico2"},
  {q:"Why didn't he like the class?", c:"basico2"},
  {q:"Can you swim?", c:"basico2"},
  {q:"Would you like a coffee?", c:"basico2"},
  // Elemental I — comparativos, have to
  {q:"Is English more difficult than Spanish?", c:"elemental1"},
  {q:"Do you have to wear a uniform?", c:"elemental1"},
  // Elemental II — going to, presente perfecto
  {q:"What are you going to do this weekend?", c:"elemental2"},
  {q:"Have you ever visited Chiloé?", c:"elemental2"},
  // Intermedio I — pasado continuo, will
  {q:"What were you doing at eight?", c:"intermedio1"},
  {q:"Will you help me?", c:"intermedio1"},
  // Intermedio II — pasado perfecto, used to, pregunta de sujeto
  {q:"Did you use to play football?", c:"intermedio2"},
  {q:"Who painted the Mona Lisa?", c:"intermedio2"},
  // Intermedio Alto — presente perfecto continuo
  {q:"How long have you been working here?", c:"avanzado"},
  {q:"Have you been waiting long?", c:"avanzado"}
];

function blockHTML(p){
  if(p.role === "gap"){
    // Chip de hueco: borde/texto punteado con el color del rol que falta
    return `<span class="block gap" style="color:var(--${p.gapRole})">${esc(p.text)}<small>${esc(p.label)}</small></span>`;
  }
  return `<span class="block ${p.role}">${esc(p.text)}<small>${esc(trLabel(p.label||p.role))}</small></span>`;
}
/* Pieza "hueco" para un elemento faltante + resultado incompleto (chip + aviso) */
function gapPart(gapRole, es, en){
  return {role:"gap", gapRole, text: lang==="en" ? `⟦ missing ⟧` : `⟦ falta ⟧`,
    label: lang==="en" ? `missing ${en}` : `falta: ${es}`};
}
function incompleteResult(parts, notes){
  return {ok:true, incomplete:true,
    type: lang==="en" ? "Incomplete question" : "Pregunta incompleta",
    tense: lang==="en" ? "no tense yet" : "sin tiempo aún", parts, answer:null, warnings:[], notes:notes||[]};
}
/* Chip de los dos ejes. Las clases y los colores vienen generados en tokens.css
   desde design-tokens; aquí solo se decide QUÉ signos van.
   En Question Lab todo lo analizado es una pregunta, así que el `?` siempre está
   y el `+` no aparece nunca: la afirmativa es el caso por defecto y marcarla no
   diría nada. La negativa sí se marca, porque es el caso marcado — antes era el
   texto «· negativa ⛔» pegado dentro del badge de tipo. */
/* Las respuestas a una pregunta cerrada van marcadas con el MISMO signo que usa
   el chip de forma: la de «Yes» es afirmativa y la de «No» es negativa, que es
   exactamente lo que ese eje significa. Antes llevaban ✅ y ❌, o sea dos emoji
   diciendo con otro idioma lo que el rótulo de la línea («Afirmativa» /
   «Negativa») y las propias piezas («Yes,» / «No,») ya decían.
   Las respuestas abiertas no llevan signo: no son ni una cosa ni la otra. */
function lineSign(line){
  if(!line.signo) return "";
  return `<span class="tag ghf__g" data-form="${line.signo}" aria-hidden="true">`
       + (line.signo === "negative" ? "−" : "+") + `</span>`;
}
function formChip(r){
  if(!r) return "";
  const signo = f => `<span class="ghf__g" data-form="${f}" aria-hidden="true">${f === "negative" ? "−" : "?"}</span>`;
  const signos = [signo("interrogative")].concat(r.negative ? [signo("negative")] : []);
  /* Sin `qtipo` (pregunta incompleta) el tramo va NEUTRO: todavía es una
     pregunta, pero aún no se sabe si abierta o cerrada, y pintarla de un color
     que significa «la abre tal pieza» sería afirmar lo que no se sabe. */
  const tipo = r.qtipo ? ` data-type="${esc(r.qtipo)}"` : "";
  const rotulo = trType(r.type) + (r.negative ? ` · ${t("formNegative")}` : "");
  return `<span class="ghf"><span class="ghf__sign">${signos.join("")}</span>`
       + `<span class="ghf__slot"${tipo}>${esc(rotulo)}</span></span>`;
}
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

function renderResult(r, container){
  if(!r.ok){
    container.innerHTML = `<div class="card"><div class="errbox">${r.error}</div>
      <p class="hint" style="margin-top:.6rem">${t('recipeHint')}</p></div>`;
    return;
  }
  let html = `<div class="card">
    <div class="badges">
      ${formChip(r)}
      <span class="badge">${esc(trTense(r.tense))}</span>
    </div>
    <h2>${t('piecesTitle')}</h2>
    <div class="blocks">${r.parts.map((p,i)=>blockHTML(p)).join("")}</div>`;

  if(r.incomplete || !r.answer){
    for(const nt of (r.notes||[])) html += `<div class="note">📌 ${nt}</div>`;
    html += `</div>`;
    container.innerHTML = html;
    return;
  }

  html += `<div class="answerbox"><h3>${t('answerHeading')}</h3>`;
  if(r.answer.kind === "open"){
    html += `<p class="hint">${t('renderHint')}</p>`;
  }
  for(const line of r.answer.lines){
    html += `<p class="hint" style="margin-top:.4rem">${esc(trCap(line.caption))}:</p>
      <div class="ansline">${lineSign(line)}${line.pieces.map(blockHTML).join("")}</div>`;
  }
  if(r.answer.subjNote) html += `<p class="hint" style="margin-top:.4rem">💡 ${esc(r.answer.subjNote)}</p>`;
  html += `</div>`;

  const allNotes = [...(r.notes||[]), ...((r.answer.extraNotes)||[])];
  for(const w of r.warnings || []) html += `<div class="note">⚠️ ${w}</div>`;
  for(const nt of allNotes) html += `<div class="note">📌 ${nt}</div>`;
  html += `</div>`;
  container.innerHTML = html;
}

/* El campo crece con lo que se escribe, hasta el max-height del CSS (5 líneas);
   pasado eso se desplaza. Se resetea antes de medir porque scrollHeight nunca
   baja solo: sin eso el campo crecería al borrar texto pero no se encogería. */
function autoGrow(){
  const el = $("qin"); if(!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
$("goBtn").addEventListener("click", ()=> goAnalyze($("qin").value));
$("qin").addEventListener("input", autoGrow);
/* Enter analiza, como siempre. En un <textarea> hay que impedir el salto de
   línea a mano, porque una pregunta no lleva ninguno. Shift+Enter sí lo deja
   pasar, por si alguien pega algo de varias líneas. */
$("qin").addEventListener("keydown", e=>{
  if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); goAnalyze($("qin").value); }
});
/* Borrado: vacía la pregunta, limpia el resultado y vuelve a mostrar los ejemplos */
function clearAnalyze(){
  $("qin").value = "";
  autoGrow();
  $("result").innerHTML = "";
  const w = $("exWrap"); if(w) w.style.display = "";
  $("qin").focus();
}
$("clearBtn").addEventListener("click", clearAnalyze);
$("examples").addEventListener("click", e=>{
  if(e.target.classList.contains("chip")){
    $("qin").value = e.target.textContent;
    autoGrow();
    goAnalyze(e.target.textContent);
  }
});

/* ================================================================
   MODO CONSTRUYE
================================================================ */
const CHALLENGES = [
  {t:"simple-present", prompt:"☕ Pregúntale a un compañero si le gusta el café.", pe:"☕ Ask a classmate if they like coffee.",
   blocks:[["Do","aux"],["you","subj"],["like","verb"],["coffee?","comp"]]},
  {t:"simple-present", prompt:"📍 Pregúntale dónde vive.", pe:"📍 Ask where they live.",
   blocks:[["Where","wh"],["do","aux"],["you","subj"],["live?","verb"]]},
  {t:"present-continuous", prompt:"⏰ Pregúntale qué está haciendo en este momento.", pe:"⏰ Ask what they're doing right now.",
   blocks:[["What","wh"],["are","aux"],["you","subj"],["doing","verb"],["right now?","comp"]]},
  {t:"simple-past", prompt:"✈️ Pregunta si ella viajó a Perú.", pe:"✈️ Ask if she traveled to Peru.",
   blocks:[["Did","aux"],["she","subj"],["travel","verb"],["to Peru?","comp"]]},
  {t:"simple-past", prompt:"🕐 Pregunta cuándo llegaron ellos.", pe:"🕐 Ask when they arrived.",
   blocks:[["When","wh"],["did","aux"],["they","subj"],["arrive?","verb"]]},
  {t:"simple-future", prompt:"🎓 Pregúntale si vendrá a clases mañana.", pe:"🎓 Ask if they'll come to class tomorrow.",
   blocks:[["Will","aux"],["you","subj"],["come","verb"],["to class tomorrow?","comp"]]},
  {t:"future-going-to", prompt:"📅 Pregúntale qué va a hacer este fin de semana (going to).", pe:"📅 Ask what they're going to do this weekend (going to).",
   blocks:[["What","wh"],["are","aux"],["you","subj"],["going to","semiaux"],["do","verb"],["this weekend?","comp"]]},
  {t:"present-perfect", prompt:"🏝️ Pregúntale si ha visitado Chiloé.", pe:"🏝️ Ask if they've visited Chiloé.",
   blocks:[["Have","aux"],["you","subj"],["visited","verb"],["Chiloé?","comp"]]},
  /* Estos tres iban con `c:` (nivel literal) en vez de `t:` (contenido). Con el
     nivel bastaba; con la UNIDAD no, porque un nivel suelto no dice de qué
     contenido es el desafío y no se puede saber si la clase ya lo vio. */
  {t:"modal", prompt:"🏊 Pregúntale si sabe nadar.", pe:"🏊 Ask if they can swim.",
   blocks:[["Can","aux"],["you","subj"],["swim?","verb"]]},
  {t:"to-be-pres", prompt:"🩺 Pregunta si ella es doctora (¡be es aux y verbo a la vez!).", pe:"🩺 Ask if she is a doctor (be is aux and verb at once!).",
   blocks:[["Is","aux"],["she","subj"],["a doctor?","comp"]]},
  {t:"subject-question", prompt:"🎨 Pregunta quién pintó la Mona Lisa (¡ojo: sin auxiliar!).", pe:"🎨 Ask who painted the Mona Lisa (careful: no auxiliary!).",
   blocks:[["Who","wh"],["painted","verb"],["the Mona Lisa?","comp"]]},
  {t:"present-perfect", prompt:"📖 Pregúntale cuánto tiempo ha estudiado inglés.", pe:"📖 Ask how long they've studied English.",
   blocks:[["How long","wh"],["have","aux"],["you","subj"],["studied","verb"],["English?","comp"]]},
  {t:"used-to", prompt:"⚽ Pregúntale si jugaba fútbol cuando era niño (used to).", pe:"⚽ Ask if they used to play football as a child (used to).",
   blocks:[["Did","aux"],["you","subj"],["use to","semiaux"],["play","verb"],["football as a child?","comp"]]}
];

/* ══════════════ RONDAS DE PRÁCTICA ══════════════
   Los tres modos generaban ejercicios sin fin. Peor: Construye mostraba
   "Desafío 3 de 13" pero con `bIdx % length`, así que al llegar a 13 volvía a 1
   y seguía — una meta que se corre sola es peor que ninguna.
   Ahora cada sesión son 10 ejercicios, con la cuenta a la vista y una tarjeta
   de cierre al terminar. El alumno sabe cuánto le falta y decide si encadena
   otra ronda o la retoma después, que es justo lo que pedía el docente.
   Construye usa el mínimo entre 10 y los desafíos de su nivel: repetir dentro
   de la misma ronda no sería practicar, sería rellenar. */
const RONDA = 10;
/* `verificado` = el ejercicio en pantalla ya se respondió y se está mostrando la
   corrección. Sin este dato el rótulo se calculaba como hechos+1 y saltaba al
   verificar: "Ejercicio 2 de 10" aparecía con la corrección del 1 y otra vez con
   el enunciado del 2, y la ronda parecía de 11. */
const rondaCero = () => ({ hechos:0, ok:0, mejor:0, verificado:false });
const rondas = { b:rondaCero(), id:rondaCero(), r:rondaCero(), w:rondaCero() };
const MODOS = {
  b:  { ejer:"bCard",  barra:"bBar",  prog:"bProg",  fin:"bEnd",  reveal:"bResult", nombre:()=>t("navBuild"),    otra:()=>{ bIdx++; loadChallenge(); } },
  id: { ejer:"idCard", barra:"idBar", prog:"idProg", fin:"idEnd", reveal:"idReveal", nombre:()=>t("navIdentify"), otra:()=>renderId(true) },
  r:  { ejer:"rCard",  barra:"rBar",  prog:"rProg",  fin:"rEnd",  reveal:"rReveal",  nombre:()=>t("navRespond"),  otra:()=>renderR(true) },
  w:  { ejer:"fpCard", barra:"fpBar", prog:"fpProg", fin:"fpEnd", reveal:"fpReveal", nombre:()=>t("navFillPiece"), otra:()=>renderF(true) },
};
const rondaTotal = m => m === "b" ? Math.min(RONDA, activeChallenges.length || RONDA) : RONDA;
function rondaSuma(m, acerto, rachaActual){
  const r = rondas[m];
  r.hechos++; if(acerto) r.ok++;
  r.verificado = true;
  r.mejor = Math.max(r.mejor, rachaActual || 0);
}
/* Dos cuentas distintas a propósito: el rótulo nombra el ejercicio que está en
   pantalla (no cambia hasta que el alumno pide el siguiente) y la barra mide los
   terminados (sí avanza al verificar, porque ese ya lo hizo). */
function rondaPinta(m){
  const r = rondas[m], tot = rondaTotal(m);
  const prog = $(MODOS[m].prog);
  const enPantalla = Math.min(r.hechos + (r.verificado ? 0 : 1), tot);
  if(prog) prog.textContent = t("roundOf").replace("{n}", enPantalla).replace("{t}", tot);
  const barra = $(MODOS[m].barra);
  if(barra && barra.firstElementChild) barra.firstElementChild.style.width = (r.hechos / tot * 100) + "%";
}
const rondaTerminada = m => rondas[m].hechos >= rondaTotal(m);
/* Mostrar u ocultar el ejercicio por ID y no caminando el DOM: 
   se rompe en cuanto alguien mueve un div de sitio, y ya lo hizo. */
function rondaVista(m, mostrandoResumen){
  const ejer = $(MODOS[m].ejer), rev = $(MODOS[m].reveal), fin = $(MODOS[m].fin);
  if(ejer) ejer.style.display = mostrandoResumen ? "none" : "";
  if(rev)  rev.style.display  = mostrandoResumen ? "none" : "";
  if(fin)  fin.style.display  = mostrandoResumen ? "" : "none";
}
/* Cierre: se oculta el ejercicio y su revelado, y queda solo el resumen. */
function rondaFin(m){
  const r = rondas[m], tot = rondaTotal(m);
  const perfecto = r.ok === tot;
  $(MODOS[m].fin).innerHTML =
    `<div class="rescore">${r.ok} / ${tot}</div>` +
    `<div class="restot">${esc(t("roundDone"))} · ${esc(MODOS[m].nombre())}</div>` +
    (r.mejor > 1 ? `<div class="resmeta">🔥 ${esc(t("roundBest"))}: ${r.mejor}</div>` : "") +
    (perfecto ? `<div class="resmeta">⭐ ${esc(t("roundPerfect"))}</div>` : "") +
    `<div class="resbtns">` +
      `<button class="primary" id="${m}Again">${esc(t("roundAgain"))}</button>` +
      `<button class="pexit" data-goto="practice">${esc(t("roundBack"))}</button>` +
    `</div>`;
  /* La ronda cerrada es un logro en sí: se registra en el progreso compartido
     y puede desbloquear la insignia 💎 de ronda perfecta. */
  if(window.GH_GAME && window.GH_GAME.recordRound){
    const G = window.GH_GAME;
    if(!ghProgress) ghProgress = G.loadProgress(localStorage);
    G.recordRound(ghProgress, { app:"questionlab", ok:r.ok, total:tot });
    G.evaluateBadges(ghProgress, G.BADGES, []).newly.forEach(showBadgeToast);
    G.saveProgress(localStorage, ghProgress);
  }
  rondaVista(m, true);
  $(m + "Again").addEventListener("click", ()=> rondaReinicia(m));
  $(MODOS[m].fin).querySelector("[data-goto]").addEventListener("click", ()=> showPanel("practice"));
}
function rondaReinicia(m){
  rondas[m] = rondaCero();
  rondaVista(m, false);
  const rev = $(MODOS[m].reveal); if(rev) rev.innerHTML = "";
  MODOS[m].otra();
  rondaPinta(m);
}
/* Lo que hace el botón "Siguiente": o el ejercicio que sigue, o cerrar la ronda.
   Bajar `verificado` antes de pintar es lo que hace avanzar el rótulo: recién
   aquí el alumno dejó atrás la corrección y pasa al ejercicio siguiente. */
function rondaAvanza(m){
  if(rondaTerminada(m)){ rondaFin(m); return; }
  rondas[m].verificado = false;
  MODOS[m].otra();
  rondaPinta(m);
}

let bIdx = 0, bPlaced = [], bPool = [], bFailed = false, bScored = false, activeChallenges = CHALLENGES, curCh = null;
/* localStorage puede estar bloqueado (modo privado, file://) — nunca debe romper la app */
function loadStreak(){ try{ return parseInt(localStorage.getItem("ql_streak")||"0",10)||0; }catch(e){ return 0; } }
function saveStreak(v){ try{ localStorage.setItem("ql_streak", v); }catch(e){} }
let streak = loadStreak();

/* Mejor racha histórica por modo (b=Construye, id=Identifica, r=Responde) —
   alimenta el panel de Progreso; las rachas actuales ya se persistían. */
function bumpBestStreak(mode, val){
  try{
    const b = JSON.parse(localStorage.getItem("ql_best_streaks")||"{}");
    if(val > (b[mode]||0)){ b[mode] = val; localStorage.setItem("ql_best_streaks", JSON.stringify(b)); }
  }catch(e){}
}

function shuffle(a){
  const r = [...a];
  for(let i=r.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; }
  return r;
}
function loadChallenge(){
  if(!activeChallenges.length){
    curCh = null;
    $("bPrompt").textContent = t("bEmpty");
    $("bSlots").innerHTML = ""; $("bPool").innerHTML = "";
    $("bMsg").textContent = ""; $("bMsg").className = "buildmsg";
    $("bResult").innerHTML = "";
    return;
  }
  const ch = activeChallenges[bIdx % activeChallenges.length];
  curCh = ch;
  bPlaced = []; bFailed = false; bScored = false;
  do { bPool = shuffle(ch.blocks.map((b,i)=>({text:b[0], role:b[1], id:i}))); }
  while(bPool.length>2 && bPool.every((b,i)=>b.id===i));
  $("bPrompt").textContent = (lang === "en" && ch.pe) ? ch.pe : ch.prompt;
  $("bMsg").textContent = ""; $("bMsg").className = "buildmsg";
  $("bResult").innerHTML = "";
  $("bSlots").className = "slotarea";
  renderBuild();
}
function renderBuild(){
  $("bSlots").innerHTML = bPlaced.length
    ? bPlaced.map((b,i)=>`<span class="block ${b.role}" data-slot="${i}">${esc(b.text)}<small>${trLabel(roleLabel(b.role))}</small></span>`).join("")
    : `<span class="hint" style="padding:.4rem">${t('emptyBuild')}</span>`;
  $("bPool").innerHTML = bPool.map((b,i)=>`<span class="block ${b.role}" data-pool="${i}">${esc(b.text)}<small>${trLabel(roleLabel(b.role))}</small></span>`).join("");
  setStreak($("bStreak"), streak);
  rondaPinta("b");
}
function roleLabel(r){ return {wh:"wh-word", aux:"auxiliar", semiaux:"semi-aux", subj:"sujeto", verb:"verbo", comp:"complemento"}[r] || r; }

$("bPool").addEventListener("click", e=>{
  const el = e.target.closest("[data-pool]"); if(!el) return;
  const i = +el.dataset.pool;
  bPlaced.push(bPool[i]); bPool.splice(i,1);
  renderBuild();
  if(bPool.length === 0) checkBuild();
});
$("bSlots").addEventListener("click", e=>{
  const el = e.target.closest("[data-slot]"); if(!el) return;
  const i = +el.dataset.slot;
  bPool.push(bPlaced[i]); bPlaced.splice(i,1);
  $("bSlots").className = "slotarea";
  $("bMsg").textContent = ""; $("bMsg").className = "buildmsg";
  renderBuild();
});
function checkBuild(){
  const ok = bPlaced.every((b,i)=>b.id===i);
  const msg = $("bMsg");
  if(ok){
    $("bSlots").className = "slotarea correct";
    if(!bFailed){ streak++; bumpBestStreak("b", streak); }
    rondaSuma("b", !bFailed, streak);
    saveStreak(streak);
    msg.textContent = t('buildOk');
    msg.className = "buildmsg ok";
    const q = bPlaced.map(b=>b.text).join(" ");
    renderResult(analyze(q), $("bResult"));
    const G = window.GH_GAME;
    if(G && !bScored){
      bScored = true;
      const rr = analyze(q); const btid = rr.ok ? tenseIdOf(rr.tense) : null;
      if(!ghProgress) ghProgress = G.loadProgress(localStorage);
      G.recordAttempt(ghProgress, { app:"questionlab", mode:"build", tenseId: btid, correct: !bFailed, answerStreak: streak });
      G.evaluateBadges(ghProgress, G.BADGES, btid ? [btid] : []).newly.forEach(showBadgeToast);
      G.saveProgress(localStorage, ghProgress);
    }
    $("bResult").insertAdjacentHTML("beforeend",
      `<div style="text-align:center; margin-bottom:1rem">
        <button class="primary" id="bNext">${t('nextChallenge')}</button></div>`);
    $("bNext").addEventListener("click", ()=> rondaAvanza("b"));
    renderBuild();
    scrollReveal($("bResult"));
  } else {
    bFailed = true; streak = 0;
    saveStreak(streak);
    $("bSlots").className = "slotarea wrong";
    msg.textContent = t('buildBad');
    msg.className = "buildmsg bad";
    renderBuild();
  }
}
$("bReset").addEventListener("click", ()=>{
  const ch = activeChallenges[bIdx % activeChallenges.length];
  bPool = shuffle([...bPlaced, ...bPool]); bPlaced = [];
  $("bSlots").className = "slotarea";
  $("bMsg").textContent = ""; $("bMsg").className = "buildmsg";
  renderBuild();
});
/* El guardia es `verificado`, no `bScored`: bScored solo se pone cuando existe
   GH_GAME, así que sin el motor de progreso saltar después de acertar contaba el
   mismo ejercicio dos veces y la ronda terminaba antes. */
$("bSkip").addEventListener("click", ()=>{ if(!rondas.b.verificado) rondaSuma("b", false, 0); rondaAvanza("b"); });

/* ================================================================
   NIVELES CEFR  (fuente: Grammar HUB/curriculum.json → cefr.generated.js)
================================================================ */
/* PWA: registro del service worker (network-first — nunca sirve versión vieja
   con red; ver sw.js). Hace la app instalable; el aviso de instalar queda en
   manos del navegador, sin banner propio. Solo en producción: en file:// o
   localhost sin la ruta /question-lab/ el scope no calza. */
if ('serviceWorker' in navigator && location.pathname.startsWith('/question-lab/')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/question-lab/sw.js', { scope: '/question-lab/' })
      .catch(err => console.warn('SW registration failed:', err));
  });
}

const CEFR = window.GRAMMAR_CEFR || {levels:["basico1","basico2","elemental1","elemental2","intermedio1","intermedio2","avanzado"], labels:{}, tenses:{}};
const LV = CEFR.levels;
const fromHub = window.self !== window.top;
const itemCefr = o => o.t ? CEFR.tenses[o.t] : o.c;   // {t} deriva de la fuente común; {c} es literal de QL
const cefrIdx = c => LV.indexOf(c);
let curLevel = LV[LV.length-1];                        // standalone: por defecto muestra todo
/* gh_level = clave compartida de la suite (QL usa los mismos 7 ids);
   ql_level queda como legado de versiones anteriores. */
try{ const s = localStorage.getItem("gh_level") || localStorage.getItem("ql_level"); if(s && LV.includes(s)) curLevel = s; }catch(e){}
const visibleAt = c => !c || cefrIdx(c) <= cefrIdx(curLevel);

/* ══════════════ UNIDAD DEL CURSO ══════════════
   El nivel solo no basta. Un alumno de Intermedio II en la semana 3 recibía
   Pasado Perfecto, que es la 12A: fallaba, PERDÍA LA RACHA y no sumaba
   insignia. La gamificación lo castigaba por no saber algo que nadie le había
   enseñado. Un curso avanza ~una unidad por clase y casi todos tienen dos
   clases por semana, así que entre la semana 3 y la 6 hay media asignatura.

   Solo acota la PRÁCTICA. Analiza y la Guía siguen enteros: ahí el alumno mira
   lo que quiera y nadie le corrige. La diferencia es que la práctica puntúa.

   `gh_unidad` es clave compartida con las otras apps de la suite, igual que
   `gh_level`. `null` = todavía no ha contestado; "" = todo el curso. */
const UNITS = CEFR.units || {};
const CONTENT = CEFR.content || {};
let curUnidad = null;
try{ const u = localStorage.getItem("gh_unidad"); if(u !== null) curUnidad = u; }catch(e){}
/* ── REVISIÓN PERIÓDICA ──
   Este dato caduca solo. El curso avanza ~una unidad por clase y hay dos clases
   por semana (los intensivos, tres o cuatro), así que a los siete días está
   corrido y nadie lo mueve: el alumno no tiene por qué acordarse de un ajuste
   que puso una vez.
   Y el fallo es SILENCIOSO Y SIEMPRE HACIA EL MISMO LADO: una unidad vieja solo
   puede hacer la app más chica. No sale ningún error; sale una app congelada en
   la semana 3 que esconde justo lo que se vio en la última clase, que es cuando
   más se querría practicar.
   Por eso a los 7 días la línea vuelve a ser tarjeta y pregunta si siguen ahí.
   Confirmar es un toque, y re-sella la fecha.
   Con "" (todo el curso) NO se pregunta: ahí no hay nada escondido, así que no
   hay nada que se pueda quedar viejo.
   Sin fecha guardada = por revisar. Es exactamente el caso de quien ya tenía
   una unidad puesta antes de que esto existiera, y su valor es el más viejo de
   todos los que hay.
   `gh_unidad_fecha` se LEE del almacenamiento cada vez, no se guarda en una
   variable: es clave compartida de la suite igual que `gh_unidad`, así que si
   el alumno confirma en Grammaster, aquí no se le puede volver a preguntar.
   El PLAZO viene de curriculum.json, no escrito aquí: es la misma decisión de
   temario en las dos apps, y dos números que dicen lo mismo terminan diciendo
   cosas distintas. */
const DIAS_REVISION = (CEFR.revision && CEFR.revision.dias) || 7;
const leerUnidadFecha = () => { try{ return localStorage.getItem("gh_unidad_fecha"); }catch(e){ return null; } };
const sellarUnidadFecha = () => {
  const hoy = window.GH_GAME ? window.GH_GAME.todayISO() : null;
  if(hoy) try{ localStorage.setItem("gh_unidad_fecha", hoy); }catch(e){}
  return hoy;
};
function unidadPorRevisar(){
  if(!curUnidad) return false;          // null = sin responder · "" = todo el curso
  const G = window.GH_GAME; if(!G) return false;
  const fecha = leerUnidadFecha();
  if(!fecha) return true;
  return G.dayGap(fecha, G.todayISO()) >= DIAS_REVISION;
}
/* Orden DENTRO del curso: comparar como texto daría «10A» < «9B». Sin unidad
   devuelve -1 = disponible desde el principio. */
const unidadIndice = u => { const m = /^(\d+)([A-Z])$/.exec(String(u || ""));
  return m ? Number(m[1]) * 10 + (m[2].charCodeAt(0) - 65) : -1; };
const unidadTope = () => (curUnidad ? unidadIndice(curUnidad) : Infinity);

/* La unidad que le toca a un contenido EN QUESTION LAB. Aquí todo es una
   pregunta, así que del presente simple no vale la 5A —donde solo se ven (+) y
   (−)— sino la 5B, que es cuando el libro enseña a preguntar. Esa distinción no
   existe en Grammaster, donde también se practica la afirmativa. */
const unidadDe = tid => { const c = CONTENT[tid]; if(!c) return null;
  return c.unitQuestions || c.unit || null; };
/* Un contenido está VISTO si es de un curso anterior (entero) o del actual y su
   unidad no pasa de donde va la clase. */
function visto(tid){
  const c = CONTENT[tid];
  if(!c) return true;                                   // sin datos, no se estorba
  const i = cefrIdx(c.level), actual = cefrIdx(curLevel);
  if(i < actual) return true;                           // curso anterior: visto entero
  if(i > actual) return false;
  return unidadIndice(unidadDe(tid)) <= unidadTope();
}
/* La tercera persona del singular es una clase aparte (6A). Entre la 5B y la 6A
   el alumno pregunta con `do`, no con `does`, así que las del banco que lo usan
   se quedan fuera un par de clases. Se mira el texto porque es donde está el
   dato: `does`/`doesn't` solo aparece en presente simple 3ª persona. */
function terceraPersonaPendiente(tid){
  const c = CONTENT[tid];
  return !!(c && c.unitThirdPerson && cefrIdx(c.level) === cefrIdx(curLevel)
            && unidadIndice(c.unitThirdPerson) > unidadTope());
}
const usaTercera = q => /\bdoes(n't)?\b/i.test(q);
/* Filtro único para las tres actividades. `q` es opcional: sin texto solo mira
   el contenido; con texto mira también la etapa de la 3ª persona.
   `esSujeto` gatea «Who painted the Mona Lisa?», que es la 12C de Int. II: sin
   esto, un alumno de Intermedio II en la 8A recibía preguntas sin auxiliar. */
function vistoEjercicio(tid, q, esSujeto){
  if(!visto(tid)) return false;
  if(esSujeto && !visto("subject-question")) return false;
  if(q && usaTercera(q) && terceraPersonaPendiente(tid)) return false;
  return true;
}
/* LA WH TAMBIÉN TIENE SU UNIDAD. El grueso sale de Básico I 2B («Wh- and How
   questions with be»), pero el libro sitúa varias aparte: `how often` con los
   adverbios de frecuencia, `whose` con el posesivo, `how much`/`how many` con
   los cuantificadores y `how long` con el present perfect + for/since.
   Hace falta desde que existe el modo «Falta la wh», donde la wh ES la
   respuesta del ejercicio: sin esto, Básico I en la 2B podía tener que escribir
   «how much», que es la 9B de Elemental II. En Identifica no aplica —ahí se
   pide el tiempo— pero en Responde sí, porque pregunta por el TIPO de
   información, que es el significado de la wh. */
const idDeWh = w => "wh-" + String(w).trim().toLowerCase().replace(/\s+/g, "-");
const vistoWh = q => visto(idDeWh(whBaseOf(q)));

function renderExamples(){
  $("examples").innerHTML = EXAMPLES.filter(o=>itemCefr(o) === curLevel)
    .map(o=>`<button class="chip">${o.q}</button>`).join("");
  const w=$("exWrap"); if(w) w.style.display="";
}
function refilterChallenges(){
  /* Ya no hay red de seguridad «si queda vacío, muéstralo todo»: con el nivel
     solo, vacío era imposible; con la unidad sí puede pasar (Básico I unidad 1A
     todavía no ha visto nada). Y volver a mostrarlo todo sería justo lo que
     esto viene a impedir, en silencio. Vacío se dice, no se rellena. */
  activeChallenges = CHALLENGES.filter(o => o.t ? visto(o.t) : visibleAt(o.c));
  bIdx = 0; loadChallenge();
}
/* Guía — agrupa las tarjetas de tiempo en secciones colapsables por familia.
   Etiquetas perezosas: FAM_ORDER/FAM_LABEL se definen más abajo, así que se
   leen dentro de las funciones (llamadas en init), no como const de nivel raíz. */
function guideGroups(){ return [...FAM_ORDER, "special"]; }
function guideLabel(fam){
  const L = { ...FAM_LABEL, special:{es:"Casos especiales", en:"Special cases"} };
  return lang === "en" ? L[fam].en : L[fam].es;
}
/* Guía — hace colapsable la tabla Wh-words (referencia). Conserva el h2 como
   título de la tarjeta (como la de Tiempos) y deja la tabla en una fila
   desplegable con el mismo aspecto que una familia. */
function buildGuideWh(){
  const table = document.querySelector("#guide .gtable");
  const card = table ? table.closest(".card") : null;
  if(!card || card.querySelector(".gwh")) return;   // ya construido
  const rows = table.querySelectorAll("tr").length;
  const det = document.createElement("details");
  det.className = "gwh";   // colapsada por defecto (material de referencia)
  det.innerHTML = `<summary><span class="gdot" style="background:var(--wh)"></span><span class="gwhlabel"></span><span class="gcount">${rows}</span><span class="gcaret">▸</span></summary>`;
  det.appendChild(table);
  card.appendChild(det);   // el h2 sigue arriba como título de la tarjeta
  updateGuideWh();
}
function updateGuideWh(){
  const lab = document.querySelector("#guide .gwhlabel");
  if(lab) lab.textContent = lang === "en" ? "Reference table" : "Tabla de referencia";
}
function buildGuideAccordion(){
  const h2 = document.querySelector('#guide [data-i18n="tensesH2"]');
  const card = h2 ? h2.closest(".card") : null;
  if(!card || card.querySelector(".gfam")) return;   // ya construido
  const tenses = [...card.querySelectorAll(".tense")];
  guideGroups().forEach(fam => {
    const items = tenses.filter(el => (el.dataset.fam || "special") === fam);
    if(!items.length) return;
    const det = document.createElement("details");
    det.className = "gfam"; det.dataset.fam = fam;   // todas colapsadas al inicio
    det.innerHTML = `<summary><span class="gdot"></span><span class="glabel"></span><span class="gcount"></span><span class="gcaret">▸</span></summary>`;
    items.forEach(el => det.appendChild(el));
    card.appendChild(det);
  });
  updateGuideAccordion();
}
/* Actualiza etiqueta (idioma) + conteo visible por familia y oculta las vacías */
function updateGuideAccordion(){
  document.querySelectorAll("#guide .gfam").forEach(det => {
    const vis = [...det.querySelectorAll(".tense")].filter(el => el.style.display !== "none");
    det.hidden = vis.length === 0;
    const lab = det.querySelector(".glabel"); if(lab) lab.textContent = guideLabel(det.dataset.fam);
    const cnt = det.querySelector(".gcount"); if(cnt) cnt.textContent = vis.length;
  });
}
function applyLevel(){
  document.querySelectorAll("#guide .tense").forEach(el=>{
    const c = el.dataset.tense ? CEFR.tenses[el.dataset.tense] : el.dataset.cefr;
    el.style.display = visibleAt(c) ? "" : "none";
  });
  updateGuideAccordion();
  renderExamples();
  renderUnitUI();
  refilterChallenges();
  /* Cambiar de nivel cambia el banco de ejercicios, así que la ronda en curso
     deja de tener sentido: se reinician las tres y se cierra cualquier resumen
     que hubiera quedado abierto. */
  ["b","id","r","w"].forEach(m=>{
    rondas[m] = rondaCero();
    rondaVista(m, false);
    rondaPinta(m);   // Construye ya se redibujó arriba: sin esto su cuenta queda con el total viejo
  });
  buildIdPool(); renderId(true);
  buildRPool(); renderR(true);
  buildFPool(); renderF(true);
}
function setLevel(id){
  if(!LV.includes(id)) return;
  /* Cambiar de curso reinicia la unidad: «9A» de Intermedio II no significa
     nada en Básico I, y arrastrarla dejaría un filtro silencioso y falso.
     Pero SOLO si cambia de verdad: el Hub reenvía el nivel por postMessage cada
     vez que carga el iframe, y sin esta guarda cada visita desde el Hub
     borraría la unidad — el alumno la pone y desaparece sola. */
  if(id !== curLevel){
    curUnidad = null;
    try{ localStorage.removeItem("gh_unidad"); }catch(e){}
  }
  curLevel = id;
  try{ localStorage.setItem("gh_level", id); localStorage.setItem("ql_level", id); }catch(e){}
  if($("levelSel")) $("levelSel").value = id;
  applyLevel();
}
/* La unidad se pregunta UNA vez y después queda como una línea: el curso avanza
   cada semana, así que el dato se queda viejo y tiene que ser fácil de mover.
   "" = todo el curso; null = todavía no ha contestado. */
function setUnidad(u){
  curUnidad = u;
  try{ localStorage.setItem("gh_unidad", u); }catch(e){}
  sellarUnidadFecha();
  applyLevel();
}
/* «Sí, seguimos ahí»: re-sella la fecha y no toca la unidad. No pasa por
   `applyLevel` porque el contenido no cambió; lo único que cambia es la caja. */
function confirmarUnidad(){ sellarUnidadFecha(); renderUnitUI(); }
function renderUnitUI(){
  const box = $("unitBox"); if(!box) return;
  const sinResponder = curUnidad === null;
  const lista = UNITS[curLevel] || [];
  const opciones = `<option value="">${esc(t("unidadTodo"))}</option>` +
    lista.map(u => `<option value="${u}"${u === curUnidad ? " selected" : ""}>${u}</option>`).join("");
  const sel = `<select class="unitsel" id="unitSel" aria-label="${esc(t("unidadPregunta"))}">` +
    (sinResponder ? `<option value="__" selected disabled>${esc(t("unidadElige"))}</option>` : "") +
    opciones + `</select>`;
  /* Tres estados con el MISMO select. La revisión repite la forma de tarjeta de
     la primera vez a propósito: es la única forma que el alumno ya aprendió a
     leer como «esto te pregunta algo». La línea gris no la lee nadie. */
  box.innerHTML = sinResponder
    ? `<div class="unitask"><b>${esc(t("unidadPregunta"))}</b><small>${esc(t("unidadPorQue"))}</small>${sel}</div>`
    : unidadPorRevisar()
    ? `<div class="unitask"><b>${esc(t("unidadRevisar").replace("{u}", curUnidad))}</b>` +
      `<small>${esc(t("unidadRevisarPorQue"))}</small>` +
      `<div class="unitrow"><button type="button" class="unitok" id="unitKeep">${esc(t("unidadSeguimos"))}</button>${sel}</div></div>`
    : `<div class="unitline"><span>${esc(curUnidad ? t("unidadVas") : t("unidadTodoCurso"))}</span>${sel}</div>`;
  const s = $("unitSel");
  if(s) s.addEventListener("change", () => { if(s.value !== "__") setUnidad(s.value); });
  const keep = $("unitKeep");
  if(keep) keep.addEventListener("click", confirmarUnidad);
}
/* Selector standalone — se oculta dentro del hub, que controla el nivel */
(function initLevelUI(){
  const sel = $("levelSel");
  if(sel){
    sel.innerHTML = LV.map(id=>`<option value="${id}">${(CEFR.labels[id]&&CEFR.labels[id].es)||id}</option>`).join("");
    sel.value = curLevel;
    sel.addEventListener("change", ()=>setLevel(sel.value));
  }
  /* DESDE EL HUB LA CABECERA ENTERA SE VA. El nivel, el idioma, la marca y el
     tema ya están en la barra del hub —antes estaban en las DOS, apiladas, y
     entre ambas se llevaban más de cien píxeles de alto—, así que la esconde
     el CSS con `:root.gh-en-hub .apphead`.

     REPORTAR SE MUEVE, NO SE DUPLICA. Es el MISMO nodo: `refrescarReporte()`
     lo enciende y lo apaga por `id`, y una copia habría dejado la mitad de las
     veces el botón equivocado en pantalla. Se cuelga arriba del contenido, sin
     borde ni fondo; cuando no hay nada que reportar sigue apagándose solo.

     Y se apaga con `style.display`, no con `hidden`: la regla del navegador
     para `[hidden]` pierde contra `.reportbtn{display:inline-flex}`. Ya costó
     una vez. */
  if(fromHub){
    if($("lvlWrap")) $("lvlWrap").style.display = "none";
    if($("langTog")) $("langTog").style.display = "none";

    /* LA CABECERA NO SE ESCONDE HASTA QUE EL BOTÓN ESTÉ A SALVO, y el orden es
       la parte que importa. Si el CSS la escondiera por su cuenta y la mudanza
       fallara —un DOM que no es el del navegador, algo que cambió de nombre—,
       Reportar se quedaría dentro de algo invisible y no habría forma de
       llegar a él. Encendiendo la clase DESPUÉS, lo peor que puede pasar es
       que todo siga como antes de este cambio.
       Por eso se apila con `appendChild` y no con `prepend`: es lo que existe
       en cualquier DOM, incluido el de las sondas. */
    try {
      const rep = $("reportTog"), wrap = document.querySelector(".scrollarea .wrap");
      if(rep && wrap && wrap.firstChild !== undefined){
        const fila = document.createElement("div");
        fila.className = "reportfuera";
        fila.appendChild(rep);
        if(wrap.insertBefore) wrap.insertBefore(fila, wrap.firstChild);
        else wrap.appendChild(fila);
        document.documentElement.classList.add("gh-sin-cabecera");
      }
    } catch(e){ /* se queda la cabecera de siempre, que funciona */ }
  }
})();
/* El hub manda nivel e idioma por postMessage */
window.addEventListener("message", e=>{
  const d = e.data;
  if(d && d.type === "GRAMMAR_HUB_LEVEL" && LV.includes(d.level)) setLevel(d.level);
  if(d && d.type === "GRAMMAR_HUB_LANG" && (d.lang === "es" || d.lang === "en")) setLang(d.lang);
});

/* ================================================================
   i18n — capas 1–2 (interfaz + referencia). Las notas largas del
   análisis quedan en español.
================================================================ */
const I18N = {
  es: {
    subtitle:"Arma preguntas en inglés pieza por pieza. Respóndelas con las mismas piezas.",
    navAnalyze:"Analiza", navBuild:"Construye", navIdentify:"Identifica", navRespond:"Responde", navGuide:"Guía",
    navPractice:"Práctica", navProgress:"Progreso",
    practiceTitle:"Práctica", practiceIntro:"Elige un modo para practicar:",
    pdBuild:"Ordena las piezas para armar la pregunta.",
    pdIdentify:"Reconoce si es abierta/cerrada y qué tiempo verbal es.",
    pdRespond:"Devuelve las piezas de la pregunta y agrega la tuya.",
    progressTitle:"Progreso", progDays:"días de racha", progBest:"Mejor", progBadges:"Insignias", progModes:"Rachas por modo", progEmpty:"Empieza a practicar para sumar racha e insignias 🌱",
    legendSummary:"¿Qué significa cada pieza?",
    pWh:"Wh-word", pWhD:"Lo que se pregunta (el tipo de pregunta).",
    pAux:"Auxiliar", pAuxD:"Verbo ayudante: lleva la información de tiempo.",
    pSemi:"Semi-aux", pSemiD:"Ayuda extra para ciertos casos (going to, used to).",
    pSubj:"Sujeto", pSubjD:"De quién se habla, o quién hace la acción.",
    pVerb:"Verbo principal", pVerbD:"Acción o estado que se realiza.",
    pComp:"Complemento", pCompD:"Información adicional de la oración.",
    pAdv:"Adverbio", pAdvD:"Modifica al verbo (ever, never, always, often…).",
    pCond:"Condición", pCondD:"La cláusula con «if»: de qué depende el resultado. Fija el tiempo de las dos mitades.",
    pNew:"+ Info nueva", pNewD:"Lo que tú agregas al responder: no viene de la pregunta.",
    analyzeTitle:"Escribe una pregunta en inglés",
    btnAnalyze:"Analizar", btnReset:"Borrar", btnSkip:"Saltar →",
    footer:"Herramienta pedagógica de análisis por reglas; puede equivocarse con preguntas muy complejas. 🇨🇱",
    whH2:`<span class="cdot" style="background:var(--wh)"></span> Wh-words: la pieza que pregunta`,
    tensesH2:"⏱️ Tiempos: cuándo se usa cada uno",
    gPiezasSum:"Qué piezas se devuelven al responder",
    gPiezasP1:`Una conversación se construye <b>entre dos</b>. La pregunta te pasa unas piezas; al responder devuelves esas mismas y <b>agregas la tuya</b>: la que el otro no tenía.`,
    gPiezasP2:`Las piezas que <b>vuelven</b> de la pregunta a la respuesta son: el <b>sujeto</b> <span class="cdot" style="background:var(--subj)"></span> (aunque cambie de persona: <i>you → I</i>), el <b>verbo principal</b> <span class="cdot" style="background:var(--verb)"></span>, el <b>auxiliar</b> <span class="cdot" style="background:var(--aux)"></span> (a veces: en las cerradas siempre, en las abiertas solo si el tiempo es compuesto) y el <b>complemento</b> <span class="cdot" style="background:var(--comp)"></span>.`,
    gPiezasP3:`La <b>wh-word</b> <span class="cdot" style="background:var(--wh)"></span> <b>no vuelve</b>: nunca aparece en la respuesta. Es la <b>etiqueta del hueco vacío</b>; te dice qué tipo de pieza va ahí: un lugar si preguntó «where», una persona si preguntó «who».`,
    gPiezasP4:`Esa pieza nueva 🆕 es la única que <b>no viene de la pregunta</b>: es tu aporte, lo que tú sabes y el otro no.`,
    gSelloSum:"Dónde va el sello del tiempo: simple o compuesto",
    gSelloP1:`Todo tiempo verbal lleva su <b>sello</b> estampado en alguna pieza. La diferencia entre simple y compuesto es <b>en cuál</b>.`,
    gSelloP2:`En los <b>simples</b> hay una sola pieza y el sello va en ella: <i>work → work<b>s</b></i>, <i>play → play<b>ed</b></i>.`,
    gSelloP3:`Pero en <b>negativo</b> e <b>interrogativo</b> esa pieza no se sostiene sola: hay que <b>pedir prestada una pieza</b>, un <b>auxiliar</b> (<b>do / does / did</b>), y el <b>sello se pasa a ella</b>. Por eso el verbo vuelve a su forma base: <i>did</i> se lleva el pasado, <i>does</i> se lleva la <i>-s</i>. Al responder en positivo <b>devuelves</b> ese auxiliar y el sello vuelve al verbo: <i>When <b>did</b> they arrive?</i> → <i>They arriv<b>ed</b>…</i>`,
    gSelloP4:`Los <b>compuestos</b> traen su auxiliar <b>de fábrica</b> y no lo sueltan nunca: está en positivo, negativo e interrogativo. El sello va en esa primera pieza y el verbo se queda en su forma fija: <i>She <b>is</b> sleeping. / She <b>isn't</b> sleeping. / <b>Is</b> she sleeping?</i>`,
    gSelloP5:`¿Y el verbo <b>to be</b>? Es la pieza que <b>se conecta sola</b> 🎸: no le pide prestado a nadie, pregunta y responde por su cuenta. <i>Is she a doctor?</i> → <i>Yes, she <b>is</b>.</i>`,
    wd_what:"cosas, ideas, acciones", wd_where:"lugares", wd_when:"tiempo, fechas",
    wd_why:"razones (→ because…)", wd_who:"personas", wd_whose:"posesión (¿de quién?)",
    wd_which:"opción entre pocas", wd_how:"manera, estado", wd_howmany:"cantidad (contable)",
    wd_howmuch:"cantidad (incontable), precio", wd_howoften:"frecuencia", wd_howlong:"duración",
    wd_howold:"edad", wd_whattime:"hora exacta",
    mSubj:"sujeto", mBase:"verbo base", mIng:"verbo-ing", mPart:"participio", mConj:"verbo conjugado",
    tSimplePresent:`Presente Simple <span class="hint">· una pieza · pide un auxiliar prestado</span>`,
    tToBePresent:`Presente de «to be» 👑 <span class="hint">(el punki: no pide prestado)</span>`,
    tPresentCont:`Presente Continuo <span class="hint">· dos piezas</span>`,
    tSimplePast:`Pasado Simple <span class="hint">· una pieza · pide un auxiliar prestado</span>`,
    tToBePast:"Pasado de «to be» 👑",
    tPastCont:`Pasado Continuo <span class="hint">· dos piezas</span>`,
    tPresentPerfect:`Presente Perfecto <span class="hint">· dos piezas</span>`,
    tPastPerfect:`Pasado Perfecto <span class="hint">· dos piezas</span>`,
    tFutureWill:`Futuro con «will» <span class="hint">· dos piezas</span>`,
    tFutureGoing:`Futuro con «going to» <span class="hint">· dos piezas</span>`,
    tUsedTo:`Hábito pasado con «used to» <span class="hint">· una pieza</span>`,
    tModals:`Modales <span class="hint">· dos piezas</span> <span class="hint">(can, could, should, would…)</span>`,
    tSubjectQ:`Pregunta de sujeto 🕵️ <span class="hint">(la excepción sin auxiliar)</span>`,
    uSimplePresent:"Rutinas, hábitos, hechos generales, gustos.",
    uToBePresent:"Identidad, estados, descripciones, nacionalidad, profesión.",
    uPresentCont:"Lo que pasa ahora mismo; también planes ya agendados.",
    uSimplePast:"Acciones terminadas en un momento específico del pasado.",
    uToBePast:"Estados y descripciones en el pasado.",
    uPastCont:"Acción en progreso en el pasado, a menudo interrumpida por otra.",
    uPresentPerfect:"Experiencias de vida (sin fecha específica) y acciones pasadas con efecto en el presente.",
    uPastPerfect:"Lo que pasó <b>antes</b> de otra acción en el pasado.",
    uFutureWill:"Decisiones espontáneas, promesas, predicciones.",
    uFutureGoing:"Planes e intenciones ya decididos. El «be» es el auxiliar oficial; «going to» es su ayudante (semi-aux).",
    uUsedTo:"Hábitos o estados del pasado que ya no ocurren. En positivo el semi-aux recupera la carga temporal: I <b>used to</b> play football.",
    uModals:"Habilidad, permiso, consejos, posibilidad, cortesía. No marcan tiempo por sí solos.",
    uSubjectQ:"Cuando la wh-word ES el sujeto, no se usa auxiliar y el verbo va conjugado.",
    piecesTitle:"Piezas de tu pregunta",
    answerHeading:"Qué piezas se devuelven al responder:",
    renderHint:`<span class="cdot" style="background:var(--wh)"></span> La wh-word <b>no vuelve</b>. Es la <b>etiqueta del hueco</b>: dice qué tipo de pieza nueva agregar. Las que sí vuelven: <span class="cdot" style="background:var(--subj)"></span> sujeto, <span class="cdot" style="background:var(--verb)"></span> verbo, <span class="cdot" style="background:var(--aux)"></span> auxiliar (a veces) y <span class="cdot" style="background:var(--comp)"></span> complemento.`,
    recipeHint:`Recuerda la receta: <b>(Wh) + Auxiliar + Sujeto + Verbo + Complemento</b>`,
    buildOk:"🎉 ¡Perfecto! Ahora mira cómo se responde…",
    buildBad:"Casi… el orden no es el correcto. Recuerda: (Wh) + Auxiliar + Sujeto + Verbo + Complemento. Toca una pieza para devolverla.",
    emptyBuild:"Toca las piezas en orden para armar la pregunta…",
    btnSalir:"Salir del ejercicio",
    roundOf:"Ejercicio {n} de {t}", roundDone:"Ronda terminada", roundBest:"Mejor racha", roundPerfect:"¡Ronda perfecta!", roundAgain:"Otra ronda", roundBack:"Volver a Práctica",
    streak:"🔥 Racha: ", nextChallenge:"Siguiente desafío →",
    idTypeQ:"¿Abierta o cerrada?", idTenseQ:"¿Qué tiempo?", idOpen:"Abierta", idClosed:"Cerrada",
    idPickFam:"Elige primero una familia ↑", idCheck:"Comprobar", idNext:"Siguiente →",
    idPickBoth:"Marca las dos: tipo y tiempo.", idCorrect:"🎉 ¡Correcto!", idWrong:"Casi… mira la corrección abajo.",
    idWhyOpen:"Empieza con wh-word → abierta", idWhyClosed:"Empieza con auxiliar → cerrada",
    formNegative:"negativa",
    idEmpty:"Todavía no hay preguntas de lo que han visto en clase.",
    /* Unidad del curso. Mismo texto que Grammaster: es la misma pregunta y el
       alumno la ve en las dos apps. */
    unidadPregunta:"¿Hasta qué unidad han llegado en clase?",
    unidadPorQue:"La práctica corrige y puntúa, así que solo pregunta por lo que ya viste. Puedes cambiarlo cuando avance el curso.",
    unidadElige:"Elige la unidad…",
    unidadTodo:"Todo el curso",
    unidadTodoCurso:"Practicando todo el curso",
    unidadVas:"Practicando hasta la unidad",
    unidadRevisar:"La última vez ibas en la unidad {u}. ¿Siguen ahí?",
    unidadRevisarPorQue:"Si ya avanzaron en clase, cámbialo aquí y la práctica se pone al día.",
    unidadSeguimos:"Sí, seguimos ahí",
    autoria:"Question Lab · © 2026 Víctor Manuel Morales Muñoz · Todos los derechos reservados",
    /* Reportar. Mismo texto que Grammaster: es el mismo trámite y el alumno lo
       ve en las dos apps. */
    /* Falta la pieza. «Falta la wh» y no «Adivina la wh»: no se adivina, se
       deduce de la respuesta, que es justo lo que el modo enseña. */
    navFillPiece:"Falta una pieza",
    pdFillPiece:"Mira la respuesta y escribe la palabra que abre la pregunta.",
    fpHint:"Escribe la palabra que falta al principio de la pregunta.",
    btnPista:"Pista",
    fwPista:"La respuesta da {tipo}",
    faPista:"El tiempo verbal es {tiempo}",
    fMal:"Casi… era «{pieza}».",
    fOtras:"También valía: {otras}",
    fOkPista:"🎉 ¡Correcto! Con pista, así que la racha no sube.",
    reportar:"Reportar un problema", reportarCorto:"Reportar",
    reporteAyuda:"Cuéntame qué esperabas que hiciera la app. Lo de abajo se rellena solo: dice en qué estado estaba cuando falló.",
    reportePaso1:"Copia el informe",
    reportePaso2:"Escribe abajo del todo qué esperabas",
    reportePaso3:"Mándamelo por correo",
    copiar:"Copiar", copiado:"Copiado", abrirCorreo:"Abrir correo", cerrar:"Cerrar",
    bEmpty:"Todavía no hay desafíos de lo que han visto en clase.",
    achievement:"¡Logro!",
    exHint:"O prueba con una de estas:",
    rHint:"Devuelve las piezas: escribe la respuesta corta (Yes / No).",
    rWrite:"Escribe tu respuesta.", rGood:"🎉 ¡Bien armada!",
    rTry:"Casi… mira la respuesta correcta abajo.",
    rEmpty:"Todavía no hay preguntas de lo que han visto en clase.",
    rTypeQ:"¿Qué tipo de información pide?",
    rHintOpen:"Escribe la respuesta: empieza con el sujeto + verbo correctos (el resto es libre).",
    rPickType:"Elige el tipo de información."
  },
  en: {
    subtitle:"Build questions in English piece by piece. Answer them with the same pieces.",
    navAnalyze:"Analyze", navBuild:"Build", navIdentify:"Identify", navRespond:"Respond", navGuide:"Guide",
    navPractice:"Practice", navProgress:"Progress",
    practiceTitle:"Practice", practiceIntro:"Choose a mode to practice:",
    pdBuild:"Arrange the pieces to build the question.",
    pdIdentify:"Tell if it's open/closed and which tense it is.",
    pdRespond:"Send back the question's pieces and add your own.",
    progressTitle:"Progress", progDays:"day streak", progBest:"Best", progBadges:"Badges", progModes:"Streaks by mode", progEmpty:"Start practising to build your streak and badges 🌱",
    legendSummary:"What does each piece mean?",
    pWh:"Wh-word", pWhD:"What is being asked (the type of question).",
    pAux:"Auxiliary", pAuxD:"Helper verb: it carries the tense information.",
    pSemi:"Semi-aux", pSemiD:"Extra helper for certain cases (going to, used to).",
    pSubj:"Subject", pSubjD:"Who is being talked about, or who does the action.",
    pVerb:"Main verb", pVerbD:"The action or state taking place.",
    pComp:"Complement", pCompD:"Additional information in the sentence.",
    pAdv:"Adverb", pAdvD:"Modifies the verb (ever, never, always, often…).",
    pCond:"Condition", pCondD:"The «if» clause: what the result depends on. It fixes the tense of both halves.",
    pNew:"+ New info", pNewD:"What you add when answering: it doesn't come from the question.",
    analyzeTitle:"Write a question in English",
    btnAnalyze:"Analyze", btnReset:"Clear", btnSkip:"Skip →",
    footer:"Rule-based analysis teaching tool; it may get very complex questions wrong. 🇨🇱",
    whH2:`<span class="cdot" style="background:var(--wh)"></span> Wh-words: the piece that asks`,
    tensesH2:"⏱️ Tenses: when to use each one",
    gPiezasSum:"Which pieces come back in the answer",
    gPiezasP1:`A conversation is built <b>by two people</b>. The question hands you some pieces; when you answer you hand those back and <b>add your own</b>: the one the other person did not have.`,
    gPiezasP2:`The pieces that <b>come back</b> from question to answer are: the <b>subject</b> <span class="cdot" style="background:var(--subj)"></span> (even if the person changes: <i>you → I</i>), the <b>main verb</b> <span class="cdot" style="background:var(--verb)"></span>, the <b>auxiliary</b> <span class="cdot" style="background:var(--aux)"></span> (sometimes: always in closed questions, in open ones only if the tense is compound) and the <b>complement</b> <span class="cdot" style="background:var(--comp)"></span>.`,
    gPiezasP3:`The <b>wh-word</b> <span class="cdot" style="background:var(--wh)"></span> <b>does not come back</b>: it never shows up in the answer. It is the <b>label on the empty slot</b>; it tells you what kind of piece goes there: a place if it asked "where", a person if it asked "who".`,
    gPiezasP4:`That new piece 🆕 is the only one that <b>does not come from the question</b>: it is your contribution, what you know and the other person does not.`,
    gSelloSum:"Where the tense stamp goes: simple or compound",
    gSelloP1:`Every tense carries its <b>stamp</b> on one of the pieces. The difference between simple and compound is <b>which one</b>.`,
    gSelloP2:`In <b>simple</b> tenses there is one piece and the stamp is on it: <i>work → work<b>s</b></i>, <i>play → play<b>ed</b></i>.`,
    gSelloP3:`But in the <b>negative</b> and the <b>question</b> that piece cannot stand on its own: you have to <b>borrow a piece</b>, an <b>auxiliary</b> (<b>do / does / did</b>), and the <b>stamp moves onto it</b>. That is why the verb goes back to its base form: <i>did</i> takes the past, <i>does</i> takes the <i>-s</i>. When you answer in the positive you <b>give that auxiliary back</b> and the stamp returns to the verb: <i>When <b>did</b> they arrive?</i> → <i>They arriv<b>ed</b>…</i>`,
    gSelloP4:`<b>Compound</b> tenses come with their auxiliary <b>built in</b> and never let it go: it is there in the positive, the negative and the question. The stamp goes on that first piece and the verb stays in its fixed form: <i>She <b>is</b> sleeping. / She <b>isn't</b> sleeping. / <b>Is</b> she sleeping?</i>`,
    gSelloP5:`And the verb <b>to be</b>? It is the piece that <b>connects on its own</b> 🎸: it borrows from nobody, it asks and answers by itself. <i>Is she a doctor?</i> → <i>Yes, she <b>is</b>.</i>`,
    wd_what:"things, ideas, actions", wd_where:"places", wd_when:"time, dates",
    wd_why:"reasons (→ because…)", wd_who:"people", wd_whose:"possession (whose?)",
    wd_which:"choice among a few", wd_how:"manner, state", wd_howmany:"quantity (countable)",
    wd_howmuch:"quantity (uncountable), price", wd_howoften:"frequency", wd_howlong:"duration",
    wd_howold:"age", wd_whattime:"exact time",
    mSubj:"subject", mBase:"base verb", mIng:"verb-ing", mPart:"participle", mConj:"conjugated verb",
    tSimplePresent:`Simple Present <span class="hint">· one piece · borrows an auxiliary</span>`,
    tToBePresent:`Present of "to be" 👑 <span class="hint">(the punk: never borrows)</span>`,
    tPresentCont:`Present Continuous <span class="hint">· two pieces</span>`,
    tSimplePast:`Simple Past <span class="hint">· one piece · borrows an auxiliary</span>`,
    tToBePast:`Past of "to be" 👑`,
    tPastCont:`Past Continuous <span class="hint">· two pieces</span>`,
    tPresentPerfect:`Present Perfect <span class="hint">· two pieces</span>`,
    tPastPerfect:`Past Perfect <span class="hint">· two pieces</span>`,
    tFutureWill:`Future with "will" <span class="hint">· two pieces</span>`,
    tFutureGoing:`Future with "going to" <span class="hint">· two pieces</span>`,
    tUsedTo:`Past habit with "used to" <span class="hint">· one piece</span>`,
    tModals:`Modals <span class="hint">· two pieces</span> <span class="hint">(can, could, should, would…)</span>`,
    tSubjectQ:`Subject question 🕵️ <span class="hint">(the no-auxiliary exception)</span>`,
    uSimplePresent:"Routines, habits, general facts, likes.",
    uToBePresent:"Identity, states, descriptions, nationality, profession.",
    uPresentCont:"What is happening right now; also plans already scheduled.",
    uSimplePast:"Completed actions at a specific moment in the past.",
    uToBePast:"States and descriptions in the past.",
    uPastCont:"An action in progress in the past, often interrupted by another.",
    uPresentPerfect:"Life experiences (no specific date) and past actions with a present effect.",
    uPastPerfect:"What happened <b>before</b> another past action.",
    uFutureWill:"Spontaneous decisions, promises, predictions.",
    uFutureGoing:`Plans and intentions already decided. "be" is the official auxiliary; "going to" is its helper (semi-aux).`,
    uUsedTo:"Past habits or states that no longer happen. In the positive, the semi-aux takes back the tense: I <b>used to</b> play football.",
    uModals:"Ability, permission, advice, possibility, politeness. They don't mark tense on their own.",
    uSubjectQ:"When the wh-word IS the subject, no auxiliary is used and the verb is conjugated.",
    piecesTitle:"Pieces of your question",
    answerHeading:"Which pieces come back in the answer:",
    renderHint:`<span class="cdot" style="background:var(--wh)"></span> The wh-word <b>doesn't go back</b>. It's the <b>label on the gap</b>: it tells you what kind of new piece to add. The ones that do go back: <span class="cdot" style="background:var(--subj)"></span> subject, <span class="cdot" style="background:var(--verb)"></span> verb, <span class="cdot" style="background:var(--aux)"></span> auxiliary (sometimes) and <span class="cdot" style="background:var(--comp)"></span> complement.`,
    recipeHint:`Remember the recipe: <b>(Wh) + Auxiliary + Subject + Verb + Complement</b>`,
    buildOk:"🎉 Perfect! Now see how it's answered…",
    buildBad:"Almost… the order isn't right. Remember: (Wh) + Auxiliary + Subject + Verb + Complement. Tap a piece to send it back.",
    emptyBuild:"Tap the pieces in order to build the question…",
    btnSalir:"Exit exercise",
    roundOf:"Exercise {n} of {t}", roundDone:"Round complete", roundBest:"Best streak", roundPerfect:"Perfect round!", roundAgain:"Another round", roundBack:"Back to Practice",
    streak:"🔥 Streak: ", nextChallenge:"Next challenge →",
    idTypeQ:"Open or closed?", idTenseQ:"Which tense?", idOpen:"Open", idClosed:"Closed",
    idPickFam:"Pick a family first ↑",
    idCheck:"Check", idNext:"Next →",
    idPickBoth:"Pick both: type and tense.", idCorrect:"🎉 Correct!", idWrong:"Almost… see the breakdown below.",
    idWhyOpen:"Starts with a wh-word → open", idWhyClosed:"Starts with an auxiliary → closed",
    formNegative:"negative",
    idEmpty:"No questions yet from what you've covered in class.",
    unidadPregunta:"How far have you gotten in class?",
    unidadPorQue:"Practice marks and scores your answers, so it only asks about what you have already covered. You can change this as the course moves on.",
    unidadElige:"Pick the unit…",
    unidadTodo:"Whole course",
    unidadTodoCurso:"Practising the whole course",
    unidadVas:"Practising up to unit",
    unidadRevisar:"Last time you were on unit {u}. Still there?",
    unidadRevisarPorQue:"If your class has moved on, change it here and practice catches up.",
    unidadSeguimos:"Yes, still there",
    autoria:"Question Lab · © 2026 Víctor Manuel Morales Muñoz · All rights reserved",
    navFillPiece:"Missing piece",
    pdFillPiece:"Look at the answer and type the word that opens the question.",
    fpHint:"Type the word missing at the start of the question.",
    btnPista:"Hint",
    fwPista:"The answer gives {tipo}",
    faPista:"The tense is {tiempo}",
    fMal:"Almost… it was “{pieza}”.",
    fOtras:"These also worked: {otras}",
    fOkPista:"🎉 Correct! With a hint, so the streak stays put.",
    reportar:"Report a problem", reportarCorto:"Report",
    reporteAyuda:"Tell me what you expected the app to do. The part below fills in on its own: it says what state the app was in when it failed.",
    reportePaso1:"Copy the report",
    reportePaso2:"Write what you expected at the bottom",
    reportePaso3:"Send it to me by email",
    copiar:"Copy", copiado:"Copied", abrirCorreo:"Open email", cerrar:"Close",
    bEmpty:"No challenges yet from what you've covered in class.",
    achievement:"Achievement!",
    exHint:"Or try one of these:",
    rHint:"Send the pieces back: type the short answer (Yes / No).",
    rWrite:"Type your answer.", rGood:"🎉 Nicely built!",
    rTry:"Almost… see the correct answer below.",
    rEmpty:"No questions yet from what you've covered in class.",
    rTypeQ:"What type of information does it ask for?",
    rHintOpen:"Type the answer: start with the correct subject + verb (the rest is free).",
    rPickType:"Pick the type of information."
  }
};
let lang = "es";
/* gh_lang = clave compartida de la suite; ql_lang queda como legado. */
try{ const s = localStorage.getItem("gh_lang") || localStorage.getItem("ql_lang"); if(s === "es" || s === "en") lang = s; }catch(e){}
function t(k){ return (I18N[lang] && I18N[lang][k]) || I18N.es[k] || k; }

/* Traducción de la salida del análisis: etiquetas de piezas, captions, tiempo,
   tipo y wh-hints. Las NOTAS largas y las metáforas quedan en español. */
const LBL = { "wh-word":"wh-word", "wh = sujeto":"wh = subject", "auxiliar":"auxiliary",
  "auxiliar prestado":"borrowed auxiliary", "auxiliar (be)":"auxiliary (be)",
  "verbo to be ⭐":"'to be' verb ⭐", "semi-aux":"semi-aux",
  "verbo":"verb", "verbo conjugado":"conjugated verb", "verbo base":"base verb",
  "verbo en pasado":"past verb", "sujeto":"subject", "sujeto + cláusula relativa":"subject + relative clause",
  "sujeto + cláusula":"subject + clause", "complemento":"complement", "adverbio":"adverb", "info nueva":"new info",
  "condición":"condition", "cláusula subordinada":"subordinate clause",
  "pareja del what":"pair of 'what'", "be negativo":"negative be", "aux negativo":"negative aux",
  "verbo nuevo":"new verb" };
const CAP = { "Afirmativa":"Affirmative", "Negativa":"Negative", "Respuesta corta":"Short answer",
  "Respuesta larga":"Long answer", "Estructura de la respuesta":"Answer structure" };
const TENSE_TR = { "Presente Simple":"Simple Present", "Pasado Simple":"Simple Past",
  "Pasado (hábito con «used to»)":"Past (\'used to\' habit)", "Presente Continuo":"Present Continuous",
  "Presente Simple (to be)":"Simple Present (to be)", "Pasado Continuo":"Past Continuous",
  "Pasado Simple (to be)":"Simple Past (to be)", "Presente Perfecto":"Present Perfect",
  "Presente Perfecto Continuo":"Present Perfect Continuous", "Pasado Perfecto":"Past Perfect",
  "Futuro Simple (will)":"Simple Future (will)", "Futuro Continuo":"Future Continuous",
  "Futuro con «going to»":"Future with 'going to'",
  "Would (ofrecimientos / condicional)":"Would (offers / conditional)" };
const WH_HINTS_EN = { where:"a place 📍", when:"a time 🕐", who:"a person 🧑", whom:"a person 🧑",
  what:"a thing / idea 💡", why:"because + a reason 💬", which:"an option ✅", whose:"an owner (…'s) 🔑",
  how:"a way ✨", "how many":"a quantity 🔢", "how much":"an amount 💰", "how often":"a frequency 🔁",
  "how long":"a duration ⏳", "how old":"an age 🎂", "how far":"a distance 🗺️", "how fast":"a speed 🚀",
  "what time":"a time 🕒", "what kind":"a kind 🏷️", "what color":"a color 🎨", "what colour":"a colour 🎨" };
function trLabel(s){ if(lang==="es") return s; let suf=""; if(s.endsWith(" ⛔")){ suf=" ⛔"; s=s.slice(0,-2); } return (LBL[s]||s)+suf; }
function trCap(s){ return lang==="es" ? s : (CAP[s]||s); }
function trTense(s){ if(lang==="es") return s; const m=s.match(/^Verbo modal \(«(.+)»\)$/); if(m) return `Modal verb ("${m[1]}")`; return TENSE_TR[s]||s; }
/* El orden importa SOLO en el par de «Wh-question»: la corta es prefijo de la
   larga, así que si subiera se comería el prefijo y dejaría «con cláusula
   relativa» en español. En «de sujeto» ya da igual desde que el matiz va entre
   paréntesis: «Abierta (de sujeto)» dejó de ser prefijo de la variante larga. */
function trType(s){ if(lang==="es") return s;
  return s.replace("Abierta (Wh-question) con cláusula relativa","Open (Wh-question) with relative clause")
          .replace("Abierta (Wh-question)","Open (Wh-question)")
          .replace("Abierta (de sujeto, ¡sin auxiliar!)","Open (subject question, no auxiliary!)")
          .replace("Abierta (de sujeto)","Open (subject question)")
          .replace("Cerrada (Yes/No)","Closed (Yes/No)"); }
function whHint(k){ const H = lang==="en" ? WH_HINTS_EN : WH_HINTS; return H[k] || (lang==="en" ? "your info 💬" : "tu información 💬"); }
function levelLabel(id){ const L = CEFR.labels[id]; return (L && (L[lang] || L.es)) || id; }

/* ══════════════ REPORTAR UN PROBLEMA ══════════════
   Igual que en Grammaster. La app es un archivo estático en GitHub Pages: no
   hay servidor, así que no puede enviar nada por su cuenta. Lo que sí puede es
   volcar el ESTADO EXACTO con el que falló, que se pega tal cual en un test.
   El panel que está abierto decide qué datos importan: en Analiza, lo que
   escribió el alumno; en cada modo de práctica, el ejercicio que tenía delante. */
const panelActivo = () => {
  const p = document.querySelector(".panel.active");
  return p ? p.id : "?";
};
/* ¿HAY ALGO QUE REPORTAR?
   El botón salía en todos los paneles, también en la Guía o en Progreso, y ahí
   el informe era el encabezado y nada más: curso, unidad, idioma y el nombre del
   panel. Un botón que no hace nada enseña a no tocarlo, y el día que sí haga
   falta ya nadie lo usa.
   Se reporta lo que la app PUSO DELANTE: un análisis hecho o el ejercicio que
   está en pantalla. Sin eso no hay nada que contar. */
function hayQueReportar(){
  const p = panelActivo();
  if(p === "analyze")   return !!ultimoAnalisis;
  if(p === "build")     return !!curCh;
  if(p === "identify")  return !!idCurrent;
  if(p === "respond")   return !!rCurrent;
  if(p === "fillpiece") return !!(fEstado && fEstado.cur);
  return false;   // guía, menú de práctica y progreso no producen nada reportable
}
function refrescarReporte(){
  const b = $("reportTog");
  /* `style.display` y no el atributo `hidden`: la regla del navegador para
     [hidden] pierde contra el `display:inline-flex` que .reportbtn trae en el
     CSS, así que el botón se quedaba a la vista igual. */
  if(b) b.style.display = hayQueReportar() ? "" : "none";
}
/* El estado que decide vive en cinco variables que cambian en muchos sitios
   —analizar, sacar ejercicio, corregir, vaciarse el pozo—. En vez de acordarse
   de refrescar en cada uno, y olvidarse en el próximo modo que se añada, se
   refresca DESPUÉS de cada interacción: en captura y con un `setTimeout` de 0
   para que corra cuando los manejadores de la app ya hicieron lo suyo. */
["click", "keyup"].forEach(ev =>
  document.addEventListener(ev, () => setTimeout(refrescarReporte, 0), true));

function construirReporte(){
  const linea = (k, v) => (v === null || v === undefined || v === "" ? null : `${k}: ${v}`);
  const p = panelActivo();
  const filas = [
    `Question Lab ${APP_BUILD}`,
    linea("Curso", curLevel),
    linea("Unidad", curUnidad || (curUnidad === "" ? "todo el curso" : "sin responder")),
    linea("Idioma", lang),
    `— ${p.toUpperCase()} —`,
  ];
  /* LAS ETIQUETAS, no solo la oración. Un reporte que dice «esta palabra está
     mal pintada» sin decir DE QUÉ la pintó no se puede ni leer ni convertir en
     un test. Cada pieza va como `palabra=rol`. */
  const conRoles = a => a && a.parts && a.parts.length
    ? a.parts.map(x => `${x.text}=${x.role}`).join(" ") : null;
  const sinHtml = s => s == null ? s : String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const tipoEs = tp => tp === "open" ? "abierta" : tp === "closed" ? "cerrada" : tp;

  if(p === "analyze") filas.push(
    linea("Escrito", ($("qin") || {}).value),
    linea("La app leyó", conRoles(ultimoAnalisis)),
    linea("Tipo", ultimoAnalisis && tipoEs(ultimoAnalisis.qtipo)),
    linea("Tiempo", ultimoAnalisis && ultimoAnalisis.tense),
    /* Sin las etiquetas: los avisos llevan `<b>` para la pantalla y el reporte
       viaja como texto plano dentro de un correo. */
    linea("Aviso", sinHtml(ultimoAnalisis && (ultimoAnalisis.error || ultimoAnalisis.msg
                    || (ultimoAnalisis.incomplete ? "la dio por incompleta" : null)))));
  if(p === "build" && curCh) filas.push(
    linea("Desafío", curCh.t || curCh.c),
    linea("Consigna", lang === "en" && curCh.pe ? curCh.pe : curCh.prompt),
    /* Con el rol de cada pieza: en Construye el error típico es que una pieza
       venga con el rol equivocado, y sin el rol eso no se ve. */
    linea("Puesto", bPlaced.length ? bPlaced.map(b => `${b.text}=${b.role}`).join(" ") : "nada todavía"),
    linea("Sin poner", bPool.length ? bPool.map(b => `${b.text}=${b.role}`).join(" ") : "nada"),
    linea("Orden correcto", [...bPlaced, ...bPool].sort((a, b) => a.id - b.id).map(b => b.text).join(" ")),
    linea("Corregido", bScored ? (bFailed ? "sí, lo dio por malo" : "sí, lo dio por bueno") : "todavía no"));
  if(p === "build" && !curCh) filas.push(linea("Desafío", "ninguno: el pozo salió vacío"));
  if(p === "identify") filas.push(
    linea("Pregunta", idCurrent && idCurrent.q),
    linea("Es", idCurrent && `${tipoEs(idCurrent.type)} · ${idCurrent.tid}`),
    linea("Marcó", `${idType ? tipoEs(idType) : "—"} · ${idTense || "—"}`),
    linea("Corregido", idChecked ? "sí" : "todavía no"));
  if(p === "respond" && rCurrent) filas.push(
    linea("Pregunta", rCurrent.q),
    linea("Es", `${tipoEs(rCurrent.type)} · ${rCurrent.tid}`),
    linea("Respondió", ($("rInput") || {}).value),
    /* Lo que la app daba por bueno. Es la mitad que faltaba: sin esto el reporte
       decía qué escribió el alumno, pero no contra qué se comparó. */
    linea("Esperaba", rCurrent.type === "closed"
      ? (expectedAnswers(analyze(rCurrent.q)) || []).join(" / ")
      : `información de tipo ${rCorrectType || "?"}`),
    linea("Marcó el tipo", rTypePick || null),
    linea("Corregido", rChecked ? "sí" : "todavía no"));
  if(p === "respond" && !rCurrent) filas.push(linea("Ejercicio", "ninguno: el pozo salió vacío"));
  /* «Falta una pieza» se quedó FUERA del reporte cuando se creó el modo, así que
     reportar desde aquí no decía absolutamente nada: solo el nombre del panel. */
  if(p === "fillpiece" && fEstado.cur){
    const c = fEstado.cur;
    filas.push(
      linea("Hueco", fHueco(c)),
      linea("Pregunta entera", c.q),
      linea("Pieza que falta", c.k === "wh" ? "una wh-word (abierta)" : "el auxiliar (cerrada)"),
      linea("Evidencia mostrada", FALTA[c.k].respuesta(c)),
      linea("Pista", fEstado.pista ? FALTA[c.k].pista(c) : "no la pidió"),
      linea("Escribió", ($("fpInput") || {}).value),
      linea("Aceptaba", (FALTA[c.k].acepta(c) || []).join(" / ")),
      linea("Corregido", fEstado.checked ? "sí" : "todavía no"));
  }
  if(p === "fillpiece" && !fEstado.cur) filas.push(linea("Ejercicio", "ninguno: el pozo salió vacío"));
  /* La ronda, en los cuatro modos: sitúa el fallo dentro de la sesión y dice si
     venía de una racha, que es lo que el alumno acaba de perder. */
  const claveRonda = { build:"b", identify:"id", respond:"r", fillpiece:"w" }[p];
  if(claveRonda && rondas[claveRonda]) filas.push(
    linea("Ronda", `${rondas[claveRonda].hechos}/${rondaTotal(claveRonda)} · ${rondas[claveRonda].ok} bien · mejor racha ${rondas[claveRonda].mejor}`));
  filas.push("—", linea("Navegador", navigator.userAgent), "",
             lang === "en" ? "What I expected instead:" : "Qué esperaba en vez de eso:", "");
  return filas.filter(Boolean).join("\n");
}
function abrirReporte(){
  const texto = construirReporte();
  const box = document.createElement("div");
  box.className = "rmask";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", t("reportar"));
  box.innerHTML =
    `<div class="rbox">
       <h3>${esc(t("reportar"))}</h3>
       <p class="hint">${esc(t("reporteAyuda"))}</p>
       <ol class="rsteps">
         <li>${esc(t("reportePaso1"))}</li>
         <li>${esc(t("reportePaso2"))}</li>
         <li>${esc(t("reportePaso3"))}</li>
       </ol>
       <textarea rows="11" readonly>${esc(texto)}</textarea>
       <div class="rbtns">
         <button type="button" class="primary" data-r="copy">${esc(t("copiar"))}</button>
         <button type="button" class="ghost" data-r="mail">${esc(t("abrirCorreo"))}</button>
         <button type="button" class="ghost" data-r="close">${esc(t("cerrar"))}</button>
       </div>
     </div>`;
  const cerrar = () => box.remove();
  box.addEventListener("click", e => {
    if(e.target === box) return cerrar();           // clic fuera
    const b = e.target.closest("[data-r]"); if(!b) return;
    if(b.dataset.r === "close") return cerrar();
    if(b.dataset.r === "copy"){
      navigator.clipboard.writeText(texto)
        .then(() => { b.textContent = t("copiado"); })
        .catch(() => { box.querySelector("textarea").select(); });
      return;
    }
    /* La dirección se arma aquí y NO está escrita entera en el HTML publicado:
       los rastreadores de spam leen el código de las páginas. */
    const destino = ["v.moralesm", "profesor.duoc.cl"].join("@");
    const asunto = lang === "en" ? "Question Lab: problem report" : "Question Lab: reporte de un problema";
    location.href = `mailto:${destino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
  });
  addEventListener("keydown", function esc2(e){
    if(e.key === "Escape"){ cerrar(); removeEventListener("keydown", esc2); }
  });
  document.body.appendChild(box);
}
if($("reportTog")) $("reportTog").addEventListener("click", abrirReporte);
function populateLevelSel(){
  const sel = $("levelSel"); if(!sel) return;
  sel.innerHTML = LV.map(id=>`<option value="${id}">${levelLabel(id)}</option>`).join("");
  sel.value = curLevel;
}
function applyI18n(){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach(el=>{ el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-title]").forEach(el=>{ const s = t(el.dataset.i18nTitle); el.title = s; el.setAttribute("aria-label", s); });
  populateLevelSel();
  renderUnitUI();   // se pinta desde JS, así que `data-i18n` no lo alcanza
  document.querySelectorAll("#langTog button").forEach(b=> b.classList.toggle("on", b.dataset.lang === lang));
}
function setLang(l){
  if(l !== "es" && l !== "en") return;
  lang = l;
  try{ localStorage.setItem("gh_lang", l); localStorage.setItem("ql_lang", l); }catch(e){}
  applyI18n();
  if(curCh) $("bPrompt").textContent = (lang === "en" && curCh.pe) ? curCh.pe : curCh.prompt;
  const q = $("qin") && $("qin").value.trim();
  if(q) renderResult(analyze(q), $("result"));
  /* Un ejercicio ya corregido no se vuelve a dibujar: renderId/renderR lo dejan
     como si no se hubiera respondido, y entonces el alumno lo contestaba de
     nuevo y contaba dos veces en la ronda. Las opciones de ese ejercicio quedan
     en el idioma anterior hasta el siguiente; la pregunta es en inglés igual. */
  if(!rondas.id.verificado) renderId(false);
  if(!rondas.r.verificado)  renderR(false);
  updateGuideAccordion();   // etiquetas del acordeón de la Guía en el idioma nuevo
  updateGuideWh();
  updateThemeBtn();
}
document.querySelectorAll("#langTog button").forEach(b=> b.addEventListener("click", ()=> setLang(b.dataset.lang)));
/* Toggle de tema de la suite (auto → claro → oscuro), compartido vía window.ghTheme */
/* Embebida en el Hub: el tema se maneja desde la barra del Hub, no desde acá —
   en celular esta cabecera queda cargada y el botón compite con el título.
   Standalone / PWA es el único que hay, así que se mantiene. */
const enElHub = (() => { try { return window.self !== window.top; } catch(e) { return false; } })();
if(enElHub && $("themeTog")) $("themeTog").style.display = "none";

const SVG_SOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const SVG_LUNA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>';
function updateThemeBtn(){
  const el = $("themeTog"); if(!el || !window.ghTheme) return;
  const target = window.ghTheme.effective() === "dark" ? "light" : "dark";   // modo al que puedes cambiar
  const name = lang === "en" ? (target === "dark" ? "Dark" : "Light") : (target === "dark" ? "Oscuro" : "Claro");
  /* El rótulo va en su propio span, como el `.rlabel` del botón Reportar, para
     que CSS pueda esconderlo en pantalla de teléfono. Suelto como nodo de texto
     no había forma de alcanzarlo, y era lo que empujaba a «Reportar» fuera de
     la pantalla a 375px. El `title` sigue diciendo la acción completa. */
  /* ICONO DE LÍNEA, NO EMOJI, igual que las cuatro pestañas de abajo y que el
     mismo botón en Grammaster, Desgramatizador y el hub. Son los trazos de
     lucide `sun` y `moon`, sacados del paquete instalado en las otras apps y
     no copiados a ojo: aquí van a mano porque esta app es vanilla.
     El emoji además no se teñía con el botón; esto sí, por `currentColor`. */
  el.innerHTML = `<span class="ticono">${target === "dark" ? SVG_LUNA : SVG_SOL}</span><span class="tlabel">${esc(name)}</span>`;
  el.title = (lang === "en" ? "Switch to " : "Cambiar a modo ") + name.toLowerCase();
}
if($("themeTog")) $("themeTog").addEventListener("click", () => { if(window.ghTheme){ window.ghTheme.toggle(); updateThemeBtn(); } });
addEventListener("storage", e => { if(e.key === "gh_theme") updateThemeBtn(); });
if(window.matchMedia){ const mq = window.matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener ? mq.addEventListener("change", updateThemeBtn) : mq.addListener(updateThemeBtn); }

/* ================================================================
   IDENTIFICA — identificar tipo (abierta/cerrada) + tiempo
================================================================ */
/* El NIVEL ya no se escribe aquí: sale de `CEFR.tenses`, que genera
   `Grammar HUB/curriculum.json`. Estaba a mano en esta lista Y en Grammaster, y
   así fue como `would` acabó un curso y medio tarde en las dos a la vez: quien
   lo corrigiera en una no tocaba la otra. Aquí quedan solo los nombres. */
const ID_TENSES = [
  { id:"to-be-pres",     es:"Presente Simple (to be)",en:"Simple Present (to be)" },
  { id:"simple-present", es:"Presente Simple",       en:"Simple Present" },
  { id:"present-continuous", es:"Presente Continuo", en:"Present Continuous" },
  { id:"simple-past",    es:"Pasado Simple",         en:"Simple Past" },
  { id:"to-be-past",     es:"Pasado Simple (to be)", en:"Simple Past (to be)" },
  { id:"modal",          es:"Verbo modal (can, could…)",en:"Modal verb (can, could…)" },
  { id:"would",          es:"Would (ofrecimientos / condicional)",en:"Would (offers / conditional)" },
  { id:"future-going-to",es:"Futuro (going to)",     en:"Future (going to)" },
  { id:"present-perfect",es:"Presente Perfecto",     en:"Present Perfect" },
  { id:"past-continuous",es:"Pasado Continuo",       en:"Past Continuous" },
  { id:"simple-future",  es:"Futuro (will)",         en:"Future (will)" },
  { id:"past-perfect",   es:"Pasado Perfecto",       en:"Past Perfect" },
  { id:"used-to",        es:"Used to",               en:"Used to" },
  { id:"present-perfect-continuous", es:"Pres. Perf. Continuo",en:"Present Perfect Continuous" }
].map(o => ({ ...o, cefr: CEFR.tenses[o.id] }));
const ID_HINT = {
  "to-be-pres":{es:"El verbo to be hace el trabajo solo (am/is/are).",en:"The verb to be does it alone (am/is/are)."},
  "to-be-past":{es:"to be en pasado (was/were).",en:"to be in the past (was/were)."},
  "simple-present":{es:"do/does + verbo base.",en:"do/does + base verb."},
  "simple-past":{es:"did + verbo base.",en:"did + base verb."},
  "present-continuous":{es:"am/is/are + verbo-ing.",en:"am/is/are + verb-ing."},
  "past-continuous":{es:"was/were + verbo-ing.",en:"was/were + verb-ing."},
  "present-perfect":{es:"have/has + participio.",en:"have/has + past participle."},
  "past-perfect":{es:"had + participio.",en:"had + past participle."},
  "present-perfect-continuous":{es:"have/has been + verbo-ing.",en:"have/has been + verb-ing."},
  "future-going-to":{es:"am/is/are + going to + verbo base.",en:"am/is/are + going to + base verb."},
  "simple-future":{es:"will + verbo base.",en:"will + base verb."},
  "used-to":{es:"did + use to + verbo base.",en:"did + use to + base verb."},
  "modal":{es:"Modal (can, should…) + verbo base.",en:"Modal (can, should…) + base verb."},
  "would":{es:"would + verbo base (ofrecer, invitar, hipótesis).",en:"would + base verb (offer, invite, hypothesis)."}
};
/* Familias de tiempos (design-tokens): tono = tiempo, ícono = aspecto (● simple ◐ continuo ◆ perfecto ◈ perf.cont) */
const ASP_ICON = ["●","◐","◆","◈"];
const ID_FAM = {
  "to-be-pres":{fam:"present",asp:0}, "simple-present":{fam:"present",asp:0},
  "present-continuous":{fam:"present",asp:1}, "present-perfect":{fam:"present",asp:2},
  "present-perfect-continuous":{fam:"present",asp:3},
  "simple-past":{fam:"past",asp:0}, "to-be-past":{fam:"past",asp:0}, "used-to":{fam:"past",asp:0},
  "past-continuous":{fam:"past",asp:1}, "past-perfect":{fam:"past",asp:2},
  "future-going-to":{fam:"future",asp:0}, "simple-future":{fam:"future",asp:0},
  "modal":{fam:"modal",asp:0}, "would":{fam:"modal",asp:0}
};
function famOf(tid){ return ID_FAM[tid] || {fam:"modal",asp:0}; }
function famInline(tid){ const {fam,asp}=famOf(tid); const lvl=Math.min(asp+1,3);
  return `--f:var(--t-${fam}); --fbg:var(--t-${fam}-${lvl}); --fink:var(--t-${fam}-ink)`; }
function aspIcon(tid){ return ASP_ICON[famOf(tid).asp]; }
/* Familias para el selector en dos pasos de Identifica */
const FAM_ORDER = ["present","past","future","modal"];
const FAM_LABEL = {
  present:{es:"Presente",en:"Present"}, past:{es:"Pasado",en:"Past"},
  future:{es:"Futuro",en:"Future"}, modal:{es:"Modales",en:"Modals"}
};
function famChipInline(fam){ return `--f:var(--t-${fam}); --fbg:var(--t-${fam}-1); --fink:var(--t-${fam}-ink)`; }
/* familias que tienen ≥1 tiempo visible en el nivel actual */
function visibleFams(){
  const set = new Set(ID_TENSES.filter(o => visto(o.id)).map(o => famOf(o.id).fam));
  return FAM_ORDER.filter(f => set.has(f));
}
/* Racha vibrante: pill con acento cálido --play cuando hay racha (>0) */
function setStreak(el, n){ if(!el) return; el.textContent = t("streak") + n; el.classList.toggle("hot", n > 0); }
/* Trae la revelación a la vista al comprobar (útil en móvil); respeta reduce-motion */
function scrollReveal(el){
  if(!el || !el.scrollIntoView) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try{ el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }); }catch(e){}
}
/* El último análisis se guarda para el REPORTE. Sin esto el reporte contaba la
   mitad: decía qué escribió el alumno pero no qué leyó la app, y el desacuerdo
   entre las dos cosas es justamente lo que se está reportando. */
let ultimoAnalisis = null;
function goAnalyze(text){ ultimoAnalisis = analyze(text); renderResult(ultimoAnalisis, $("result")); scrollReveal($("result")); const w=$("exWrap"); if(w) w.style.display="none"; }
/* Gamificación (suite): progreso compartido + toast de logro */
let ghProgress = null;
function showBadgeToast(key){
  const G = window.GH_GAME; if(!G) return;
  const i = key.indexOf(":"); const bid = i < 0 ? key : key.slice(0, i); const tid = i < 0 ? null : key.slice(i + 1);
  const b = G.BADGES.find(x => x.id === bid); if(!b) return;
  let name = lang === "en" ? b.name.en : b.name.es;
  if(tid){ const o = ID_TENSES.find(x => x.id === tid); name = name.replace("{tense}", o ? (lang === "en" ? o.en : o.es) : tid); }
  const el = document.createElement("div"); el.className = "gtoast"; el.setAttribute("role", "status");
  el.innerHTML = `<span class="gicon">${b.icon}</span><span class="gtxt"><b>${t("achievement")}</b>${esc(name)}</span>`;
  $("gtoasts").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 420); }, 3800);
}
function tenseIdOf(s){
  if(/\(to be\)/.test(s)) return /Pasado/.test(s) ? "to-be-past" : "to-be-pres";
  if(/^Would/.test(s)) return "would";
  if(/Perfecto Continuo/.test(s)) return "present-perfect-continuous";
  if(/Presente Perfecto/.test(s)) return "present-perfect";
  if(/Pasado Perfecto/.test(s)) return "past-perfect";
  if(/Presente Continuo/.test(s)) return "present-continuous";
  if(/Pasado Continuo/.test(s)) return "past-continuous";
  if(/Presente Simple/.test(s)) return "simple-present";
  if(/Pasado Simple/.test(s)) return "simple-past";
  if(/going to/.test(s)) return "future-going-to";
  if(/Futuro/.test(s)) return "simple-future";
  if(/used to/.test(s)) return "used-to";
  if(/modal/.test(s)) return "modal";
  return "simple-present";
}
let idPool = [], idShown = {tense:{}, type:{}}, idCurrent = null;
let idType = null, idTense = null, idFam = null, idChecked = false;
let idStreak = 0;
try{ idStreak = parseInt(localStorage.getItem("ql_id_streak")||"0",10)||0; }catch(e){}
function saveIdStreak(){ try{ localStorage.setItem("ql_id_streak", idStreak); }catch(e){} }

function buildIdPool(){
  idPool = []; idShown = {tense:{}, type:{}};
  const bank = window.QUESTION_BANK || {};
  for(const lvl of LV){
    if(!visibleAt(lvl)) continue;                 // acumulativo: niveles <= nivel actual
    for(const q of (bank[lvl] || [])){
      const r = analyze(q);
      /* `incompleteResult` devuelve ok:true, así que sin pedir `qtipo` una
         pregunta incompleta entraba igual — y como su texto no dice «Abierta»,
         la vieja clasificación por subcadena la daba por CERRADA en silencio. */
      if(!r.ok || !r.qtipo) continue;
      const tid = tenseIdOf(r.tense);
      if(!vistoEjercicio(tid, q, r.answer && r.answer.kind === "subject")) continue;
      idPool.push({ q, type: r.qtipo, tid });
    }
  }
}
/* Selector con azar controlado: equilibra tiempos y tipos (abierta/cerrada) */
function pickId(){
  if(!idPool.length) return null;
  const pool = idPool.length > 1 && idCurrent ? idPool.filter(p => p.q !== idCurrent.q) : idPool;
  const minT = Math.min(...pool.map(p => idShown.tense[p.tid] || 0));
  let cand = pool.filter(p => (idShown.tense[p.tid] || 0) === minT);
  const minTy = Math.min(...cand.map(p => idShown.type[p.type] || 0));
  cand = cand.filter(p => (idShown.type[p.type] || 0) === minTy);
  const pick = cand[Math.floor(Math.random() * cand.length)];
  idShown.tense[pick.tid] = (idShown.tense[pick.tid] || 0) + 1;
  idShown.type[pick.type] = (idShown.type[pick.type] || 0) + 1;
  return pick;
}
/* Paso 1: botones de familia (solo las visibles en el nivel) */
function renderIdFams(){
  $("idFamOpts").innerHTML = visibleFams()
    .map(f => `<button class="idopt fam" data-fam="${f}" style="${famChipInline(f)}"><span class="asp">●</span>${lang === "en" ? FAM_LABEL[f].en : FAM_LABEL[f].es}</button>`).join("");
}
/* Paso 2: tiempos de la familia elegida (visibles en el nivel) */
function renderIdTenses(){
  const box = $("idTenseOpts");
  if(!idFam){ box.innerHTML = `<span class="idhint">${t("idPickFam")}</span>`; return; }
  /* Las opciones son las VISTAS, no las del nivel: ofrecer como alternativa un
     tiempo que la clase no ha dado convierte el ejercicio en adivinanza. */
  box.innerHTML = ID_TENSES.filter(o => visto(o.id) && famOf(o.id).fam === idFam)
    .map(o => `<button class="idopt fam" data-tense="${o.id}" style="${famInline(o.id)}"><span class="asp">${aspIcon(o.id)}</span>${lang === "en" ? o.en : o.es}</button>`).join("");
}
function renderId(pickNew){
  if(pickNew || !idCurrent) idCurrent = pickId();
  idType = null; idTense = null; idFam = null; idChecked = false;
  $("idMsg").textContent = ""; $("idMsg").className = "buildmsg";
  $("idReveal").innerHTML = "";
  $("idNext").style.display = "none"; $("idCheck").style.display = "";
  setStreak($("idStreak"), idStreak);
  rondaPinta("id");
  if(!idCurrent){
    $("idQuestion").textContent = t("idEmpty");
    $("idTypeOpts").innerHTML = ""; $("idFamOpts").innerHTML = ""; $("idTenseOpts").innerHTML = ""; $("idCheck").style.display = "none";
    return;
  }
  $("idQuestion").textContent = idCurrent.q;
  $("idTypeOpts").innerHTML = [["open", t("idOpen")], ["closed", t("idClosed")]]
    .map(([v, l]) => `<button class="idopt" data-type="${v}">${l}</button>`).join("");
  renderIdFams();
  renderIdTenses();
}
function idDiagnostic(r){
  const why = r.qtipo === "open" ? t("idWhyOpen") : t("idWhyClosed");
  const h = ID_HINT[tenseIdOf(r.tense)];
  return why + (h ? " · " + (lang === "en" ? h.en : h.es) : "");
}
function checkId(){
  if(idChecked || !idCurrent) return;
  if(!idType || !idTense){ $("idMsg").textContent = t("idPickBoth"); $("idMsg").className = "buildmsg bad"; return; }
  idChecked = true;
  [...$("idTypeOpts").children].forEach(x => {
    if(x.dataset.type === idCurrent.type) x.classList.add("correct");
    else if(x.dataset.type === idType) x.classList.add("wrong");
  });
  // Paso 1 — familia: marca la correcta y, si difiere, la elegida
  const correctFam = famOf(idCurrent.tid).fam, userFam = famOf(idTense).fam;
  [...$("idFamOpts").children].forEach(x => {
    if(x.dataset.fam === correctFam) x.classList.add("correct");
    else if(x.dataset.fam === userFam) x.classList.add("wrong");
  });
  // Paso 2 — abre la familia correcta para mostrar el tiempo correcto marcado
  idFam = correctFam; renderIdTenses();
  [...$("idTenseOpts").children].forEach(x => {
    if(x.dataset.tense === idCurrent.tid) x.classList.add("correct");
    else if(x.dataset.tense === idTense) x.classList.add("wrong");
  });
  const ok = idType === idCurrent.type && idTense === idCurrent.tid;
  rondaSuma("id", ok, ok ? idStreak + 1 : idStreak);
  rondaPinta("id");   // avanza la barra; el rótulo se queda en este ejercicio
  if(ok){ idStreak++; bumpBestStreak("id", idStreak); $("idMsg").textContent = t("idCorrect"); $("idMsg").className = "buildmsg ok"; }
  else { idStreak = 0; $("idMsg").textContent = t("idWrong"); $("idMsg").className = "buildmsg bad"; }
  saveIdStreak();
  setStreak($("idStreak"), idStreak);
  const G = window.GH_GAME;
  if(G){
    if(!ghProgress) ghProgress = G.loadProgress(localStorage);
    G.recordAttempt(ghProgress, { app:"questionlab", mode:"identify", tenseId: idCurrent.tid, correct: ok, answerStreak: idStreak });
    G.evaluateBadges(ghProgress, G.BADGES, [idCurrent.tid]).newly.forEach(showBadgeToast);
    G.saveProgress(localStorage, ghProgress);
  }
  const r = analyze(idCurrent.q);
  if(r.ok){
    const tid = idCurrent.tid;
    $("idReveal").innerHTML = `<div class="card"><div class="badges">${formChip(r)}<span class="badge fam" style="${famInline(tid)}"><span class="asp">${aspIcon(tid)}</span>${esc(trTense(r.tense))}</span></div>`
      + `<div class="blocks">${r.parts.map(blockHTML).join("")}</div>`
      + `<div class="note">📌 ${idDiagnostic(r)}</div></div>`;
  }
  $("idCheck").style.display = "none"; $("idNext").style.display = "";
  scrollReveal($("idReveal"));
}
$("idTypeOpts").addEventListener("click", e => {
  const b = e.target.closest("[data-type]"); if(!b || idChecked) return;
  idType = b.dataset.type;
  [...$("idTypeOpts").children].forEach(x => x.classList.toggle("sel", x === b));
});
$("idFamOpts").addEventListener("click", e => {
  const b = e.target.closest("[data-fam]"); if(!b || idChecked) return;
  idFam = b.dataset.fam; idTense = null;
  [...$("idFamOpts").children].forEach(x => x.classList.toggle("sel", x === b));
  renderIdTenses();
});
$("idTenseOpts").addEventListener("click", e => {
  const b = e.target.closest("[data-tense]"); if(!b || idChecked) return;
  idTense = b.dataset.tense;
  [...$("idTenseOpts").children].forEach(x => x.classList.toggle("sel", x === b));
});
$("idCheck").addEventListener("click", checkId);
$("idNext").addEventListener("click", () => rondaAvanza("id"));

/* ================================================================
   RESPONDE — devuelve las piezas (respuesta corta a preguntas cerradas)
================================================================ */
let rPool = [], rShown = {}, rCurrent = null, rChecked = false, rStreak = 0, rTypePick = null, rCorrectType = null;
try{ rStreak = parseInt(localStorage.getItem("ql_r_streak")||"0",10)||0; }catch(e){}
function buildRPool(){
  rPool = []; rShown = {};
  const bank = window.QUESTION_BANK || {};
  for(const lvl of LV){
    if(!visibleAt(lvl)) continue;
    for(const q of (bank[lvl]||[])){
      const r = analyze(q);
      if(!r.ok || !r.qtipo) continue;
      /* Las preguntas de sujeto NO entran en Responde: su respuesta empieza por
         un nombre libre («Ana will.»), así que no hay un inicio esperado contra
         el que corregir. Sí se analizan y sí entran en Identifica. */
      if(r.answer && r.answer.kind === "subject") continue;
      const tid = tenseIdOf(r.tense);
      if(!vistoEjercicio(tid, q, false)) continue;
      /* En las abiertas se pregunta por el TIPO de información, que es lo que
         significa la wh: si la wh no se ha visto, la pregunta tampoco toca. */
      if(r.qtipo === "open" && !vistoWh(q)) continue;
      rPool.push({ q, tid, type: r.qtipo });
    }
  }
}
function pickR(){
  if(!rPool.length) return null;
  const pool = rPool.length > 1 && rCurrent ? rPool.filter(p => p.q !== rCurrent.q) : rPool;
  const key = p => p.tid + "|" + p.type;   // balancea tiempo Y tipo (abierta/cerrada)
  const min = Math.min(...pool.map(p => rShown[key(p)] || 0));
  const cand = pool.filter(p => (rShown[key(p)] || 0) === min);
  const pick = cand[Math.floor(Math.random() * cand.length)];
  rShown[key(pick)] = (rShown[key(pick)] || 0) + 1;
  return pick;
}
const R_CONTRACT = {"don't":"do not","doesn't":"does not","didn't":"did not","isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"were not","won't":"will not","haven't":"have not","hasn't":"has not","hadn't":"had not","can't":"cannot","couldn't":"could not","wouldn't":"would not","shouldn't":"should not","i'm":"i am"};
function normAns(s){
  s = " " + s.toLowerCase().replace(/[.,!¡?¿]/g," ") + " ";
  for(const k in R_CONTRACT) s = s.split(k).join(R_CONTRACT[k]);
  return s.replace(/\s+/g," ").trim();
}
function expectedAnswers(r){
  if(!r.ok || !r.answer || r.answer.kind !== "closed") return [];
  return r.answer.lines.map(l => l.pieces.map(p => p.text).join(" "))
                       .map(bajaSujeto).map(segunPreferencia);
}
/* «Yes, He does.» → «Yes, he does.» El sujeto que devuelve la respuesta va a
   MITAD de oración, detrás de «Yes,» o «No,», así que ahí no lleva mayúscula.
   Salió al montar el modo del auxiliar, donde esa línea es lo que el alumno
   lee para deducir la pieza, pero el fallo estaba desde antes: Responde la
   enseñaba igual como respuesta modelo, o sea enseñando una falta de
   ortografía. Solo toca cómo se MUESTRA: el comparador ya pasa todo a
   minúsculas, así que ninguna respuesta que antes valía deja de valer.
   `I` se conserva, que en inglés va siempre en mayúscula. */
function bajaSujeto(s){
  return s.replace(/^((?:Yes|No), )([A-Z][a-z]+)\b/, (m, ini, pal) => ini + pal.toLowerCase());
}
/* CONTRACCIÓN, compartida con Grammaster (`gh_contraccion`). El profesor puede
   querer la forma entera para explicar la estructura, y esa decisión no puede
   valer en una app y no en la otra: el alumno es el mismo y vería «isn't» aquí
   y «is not» allá sin ningún motivo. Por defecto contraída, que es lo natural.
   Solo cambia lo que se MUESTRA: `normAns` expande las contracciones antes de
   comparar, así que se sigue aceptando lo que el alumno escriba de las dos. */
const NEG_ENTERA = {"isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"were not",
  "haven't":"have not","hasn't":"has not","hadn't":"had not","don't":"do not","doesn't":"does not",
  "didn't":"did not","won't":"will not","can't":"cannot","couldn't":"could not",
  "shouldn't":"should not","wouldn't":"would not","mustn't":"must not"};
const contraeNeg = () => { try{ return localStorage.getItem("gh_contraccion") !== "entera"; }catch(e){ return true; } };
function segunPreferencia(s){
  if(contraeNeg()) return s;
  return String(s == null ? "" : s).replace(/\b[A-Za-z]+n['’]t\b/g, m => {
    const r = NEG_ENTERA[m.toLowerCase().replace("’", "'")];
    if(!r) return m;
    return /^[A-Z]/.test(m) ? r.charAt(0).toUpperCase() + r.slice(1) : r;
  });
}
/* wh-base de la pregunta (la más larga que matchee: "how many", "what time"…)
   El wh contraído se desarma primero: sin esto "What's your name?" daba la base
   «what's», que no está en la tabla, y Responde caía al comodín "tu información".
   Como el comodín es el único que no sale de WH_HINTS, quedaba de regalo entre
   los distractores. Y son las preguntas más naturales del nivel básico. */
function whBaseOf(q){
  /* Con la condición al frente la wh está en la SEGUNDA cláusula: «If I had
     told you, WHAT would you have said?». Sin esto la pista de Responde buscaba
     «if» en la tabla, no lo encontraba y caía al comodín «tu información». */
  const fr = q.match(RE_SUBORD_FRENTE);
  if(fr) return whBaseOf(fr[3]);
  const s = q.toLowerCase().replace(/[¿?]/g, "").trim()
             .replace(/\b(what|where|who|when|how|why|which)['’]s\b/g, "$1 is");
  const keys = Object.keys(WH_HINTS).sort((a, b) => b.length - a.length);
  for(const k of keys){ if(s === k || s.startsWith(k + " ")) return k; }
  return s.split(/\s+/)[0];
}
/* inicio esperado de la respuesta abierta = sujeto + verbo(s) que vuelven (sin el hueco libre) */
function openExpected(r){
  if(!r.ok || !r.answer || r.answer.kind !== "open") return null;
  const pieces = (r.answer.lines[0] && r.answer.lines[0].pieces) || [];
  return pieces.filter(p => ["subj","aux","semiaux","verb"].includes(p.role)).map(p => p.text).join(" ");
}
function renderR(pickNew){
  if(pickNew || !rCurrent) rCurrent = pickR();
  rChecked = false; rTypePick = null; rCorrectType = null;
  $("rMsg").textContent = ""; $("rMsg").className = "buildmsg";
  $("rReveal").innerHTML = "";
  $("rInput").value = ""; $("rInput").disabled = false;
  $("rNext").style.display = "none"; $("rCheck").style.display = "";
  setStreak($("rStreak"), rStreak);
  rondaPinta("r");
  if(!rCurrent){
    $("rQuestion").textContent = t("rEmpty");
    $("rInput").style.display = "none"; $("rCheck").style.display = "none"; $("rTypeRow").style.display = "none";
    return;
  }
  $("rInput").style.display = "";
  $("rQuestion").textContent = rCurrent.q;
  if(rCurrent.type === "open"){
    $("rHint").textContent = t("rHintOpen");
    $("rInput").placeholder = "I live in…";
    $("rTypeRow").style.display = "";
    const langHints = lang === "en" ? WH_HINTS_EN : WH_HINTS;
    rCorrectType = whHint(whBaseOf(rCurrent.q));
    const distract = [...new Set(Object.values(langHints))].filter(x => x !== rCorrectType).sort(() => Math.random() - .5).slice(0, 3);
    const opts = [rCorrectType, ...distract].sort(() => Math.random() - .5);
    $("rTypeOpts").innerHTML = opts.map(o => `<button class="idopt" type="button">${esc(o)}</button>`).join("");
  } else {
    $("rHint").textContent = t("rHint");
    $("rInput").placeholder = "Yes, I do.";
    $("rTypeRow").style.display = "none"; $("rTypeOpts").innerHTML = "";
  }
}
function checkR(){
  if(rChecked || !rCurrent) return;
  const val = $("rInput").value.trim();
  const r = analyze(rCurrent.q);
  let ok;
  if(rCurrent.type === "closed"){
    if(!val){ $("rMsg").textContent = t("rWrite"); $("rMsg").className = "buildmsg bad"; return; }
    ok = expectedAnswers(r).map(normAns).includes(normAns(val));
  } else {
    if(!rTypePick){ $("rMsg").textContent = t("rPickType"); $("rMsg").className = "buildmsg bad"; return; }
    if(!val){ $("rMsg").textContent = t("rWrite"); $("rMsg").className = "buildmsg bad"; return; }
    const expOpen = openExpected(r);
    ok = (rTypePick === rCorrectType) && (!expOpen || normAns(val).startsWith(normAns(expOpen)));
    [...$("rTypeOpts").children].forEach(b => {
      if(b.textContent === rCorrectType) b.classList.add("correct");
      else if(b.textContent === rTypePick) b.classList.add("wrong");
    });
  }
  rChecked = true; $("rInput").disabled = true;
  rondaSuma("r", ok, ok ? rStreak + 1 : rStreak);
  rondaPinta("r");    // avanza la barra; el rótulo se queda en este ejercicio
  if(ok){ rStreak++; bumpBestStreak("r", rStreak); $("rMsg").textContent = t("rGood"); $("rMsg").className = "buildmsg ok"; }
  else { rStreak = 0; $("rMsg").textContent = t("rTry"); $("rMsg").className = "buildmsg bad"; }
  try{ localStorage.setItem("ql_r_streak", rStreak); }catch(e){}
  setStreak($("rStreak"), rStreak);
  renderResult(r, $("rReveal"));
  const G = window.GH_GAME;
  if(G){
    if(!ghProgress) ghProgress = G.loadProgress(localStorage);
    G.recordAttempt(ghProgress, { app:"questionlab", mode:"respond", tenseId: rCurrent.tid, correct: ok, answerStreak: rStreak });
    G.evaluateBadges(ghProgress, G.BADGES, [rCurrent.tid]).newly.forEach(showBadgeToast);
    G.saveProgress(localStorage, ghProgress);
  }
  $("rCheck").style.display = "none"; $("rNext").style.display = "";
  scrollReveal($("rReveal"));
}
$("rCheck").addEventListener("click", checkR);
$("rNext").addEventListener("click", () => rondaAvanza("r"));
$("rInput").addEventListener("keydown", e => { if(e.key === "Enter" && !rChecked) checkR(); });
$("rTypeOpts").addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b || rChecked) return;
  rTypePick = b.textContent;
  [...$("rTypeOpts").children].forEach(x => x.classList.toggle("sel", x === b));
});

/* ================================================================
   FALTA LA PIEZA — wh (abiertas) · auxiliar (cerradas)
   ----------------------------------------------------------------
   Los dos modos son la MISMA mecánica: se tapa la primera pieza de la pregunta
   y se muestra la respuesta, que es lo que permite deducirla. Por eso comparten
   motor y solo se declaran las diferencias en `FALTA`.

   Por qué hace falta la respuesta: quitarle la wh a una pregunta NO deja un
   ejercicio con solución única. «___ do you live?» admite where, why, how y
   when, y las cuatro dan una pregunta buena. Se midió sobre el banco entero
   antes de construir esto. Con la respuesta delante, la wh queda fijada.

   En el auxiliar pasa lo mismo con el tiempo: «___ she a teacher?» admite Is y
   Was. La respuesta corta lo cierra («Yes, she is»), y además enseña justo lo
   que dice la app: la respuesta DEVUELVE la misma pieza. La alternativa era
   marcadores temporales, idea del profesor, pero solo 11 de 119 preguntas
   ambiguas del banco traen uno; la respuesta corta la genera la app para todas. */
const FALTA = {
  wh: {
    /* La respuesta la escribió el profesor: sin ella no hay ejercicio. */
    respuesta: p => (window.QUESTION_ANSWERS[p.q] || {}).a,
    /* La wh puede ser de dos palabras («how old»), así que la pieza tapada no
       es «la primera palabra» sino la wh entera que reconoce `whBaseOf`. */
    pieza: resto => whBaseOf(resto),
    acepta: p => [partirPregunta(p).pieza.toLowerCase(),
                  ...((window.QUESTION_ANSWERS[p.q] || {}).alt || [])],
    /* La pista da el TIPO de información que pide la respuesta: es la evidencia
       de verdad, no un adorno. */
    pista: p => t("fwPista").replace("{tipo}", whHint(whBaseOf(p.q))),
  },
  ax: {
    /* Aquí NO hace falta escribir nada: `expectedAnswers` ya produce el
       «Yes, she is.» de cada cerrada. */
    respuesta: p => (expectedAnswers(p.r) || [])[0],
    pieza: resto => resto.split(/\s+/)[0],
    acepta: p => [partirPregunta(p).pieza.toLowerCase()],
    pista: p => t("faPista").replace("{tiempo}", tenseLabel(p.tid)),
  },
};

/* Parte la pregunta en «lo de antes del hueco · la pieza · lo que sigue».
   Dos cosas que no son obvias y que salieron probando:
   · CON UNA SUBORDINADA AL FRENTE la pieza NO es la primera palabra de la
     oración. «If I call you, will you answer?» tapaba el «If» y le pedía al
     alumno escribirlo como si fuera un auxiliar. El hueco va en la pregunta de
     verdad, que es la segunda cláusula, igual que ya hacía `whBaseOf`.
   · LA WH CONTRAÍDA ocupa más letras que su forma base: en «What's your name?»
     la wh es «what» pero el texto dice «What's», así que detrás queda «'s» y hay
     que pegarlo SIN espacio o sale «____ 's your name?». */
function partirPregunta(p){
  const q = p.q;
  const fr = q.match(RE_SUBORD_FRENTE);
  const resto = fr ? fr[3] : q;
  const antes = fr ? q.slice(0, q.length - resto.length) : "";
  const pieza = FALTA[p.k].pieza(resto) || "";
  return { antes, pieza, despues: resto.slice(pieza.length) };
}
/* La pregunta con el hueco. El resto se conserva TAL CUAL, incluida la
   mayúscula que ya no toca, porque cambiarla sería una pista de regalo. */
function fHueco(p){
  const { antes, despues } = partirPregunta(p);
  const sep = /^['’]/.test(despues) ? "" : " ";     // «____'s your name?»
  return antes + "____" + sep + despues.trim();
}
const tenseLabel = tid => { const o = ID_TENSES.find(x => x.id === tid);
  return o ? (lang === "en" ? o.en : o.es) : tid; };

/* UN SOLO ESTADO: los dos tipos comparten pozo, ronda y racha. `cur.k` dice
   cuál es el de turno. */
const fEstado = { pool:[], shown:{}, cur:null, checked:false, streak:0, pista:false };
try{ fEstado.streak = parseInt(localStorage.getItem("ql_pieza_streak")||"0",10)||0; }catch(e){}

function buildFPool(){
  const S = fEstado;
  S.pool = []; S.shown = {};
  const bank = window.QUESTION_BANK || {};
  for(const lvl of LV){
    if(!visibleAt(lvl)) continue;
    for(const q of (bank[lvl] || [])){
      const r = analyze(q);
      if(!r.ok || !r.qtipo) continue;
      const k = r.qtipo === "open" ? "wh" : "ax";
      const F = FALTA[k];
      const tid = tenseIdOf(r.tense);
      /* Mismo filtro por unidad que los otros modos: este también corrige y
         puntúa, así que tampoco puede preguntar por lo que no se ha visto. */
      if(!vistoEjercicio(tid, q, r.answer && r.answer.kind === "subject")) continue;
      /* En las abiertas la wh ES la respuesta, así que su unidad manda tanto
         como la del tiempo verbal. Sin esto pedía «how much» en Básico I. */
      if(k === "wh" && !vistoWh(q)) continue;
      const p = { q, r, tid, k };
      /* Sin respuesta no entra: preferimos que falte el ejercicio a mostrarlo
         sin la evidencia que lo hace resoluble. `check-respuestas` impide que
         eso ocurra por descuido. */
      const resp = F.respuesta(p);
      if(!resp) continue;
      /* Y tampoco entra si la respuesta trae el comodín de sujeto desconocido
         («Yes, he / she / it / they is»). En Responde tiene sentido, porque ahí
         se listan todas las formas que se aceptan; aquí la respuesta es la
         PISTA que hay que leer de un vistazo, y una barra con cuatro pronombres
         no se lee. Se pierden unos pocos ejercicios y se gana claridad. */
      if(resp.includes(" / ")) continue;
      /* Ni si no se puede sacar una pieza limpia. Con `partirPregunta` ya no
         debería pasar, pero si algún día una pregunta rara se cuela, mejor que
         falte el ejercicio a que tape la palabra equivocada. */
      if(!partirPregunta(p).pieza) continue;
      S.pool.push(p);
    }
  }
}
/* Azar equilibrado por PIEZA: sin esto salían nueve «what» seguidos, porque es
   la wh más frecuente del banco y el sorteo plano sigue la frecuencia. Al ir
   mezclados los dos tipos, esto además reparte solo entre abiertas y cerradas:
   la pieza de una cerrada es su auxiliar y la de una abierta su wh. */
function pickF(){
  const S = fEstado;
  if(!S.pool.length) return null;
  const pool = S.pool.length > 1 && S.cur ? S.pool.filter(p => p.q !== S.cur.q) : S.pool;
  const clave = p => partirPregunta(p).pieza.toLowerCase();
  const min = Math.min(...pool.map(p => S.shown[clave(p)] || 0));
  const cand = pool.filter(p => (S.shown[clave(p)] || 0) === min);
  const pick = cand[Math.floor(Math.random() * cand.length)];
  S.shown[clave(pick)] = (S.shown[clave(pick)] || 0) + 1;
  return pick;
}
function renderF(nuevo){
  const S = fEstado;
  if(nuevo || !S.cur) S.cur = pickF();
  S.checked = false; S.pista = false;
  $("fpMsg").textContent = ""; $("fpMsg").className = "buildmsg";
  $("fpReveal").innerHTML = "";
  $("fpInput").value = ""; $("fpInput").disabled = false;
  $("fpNext").style.display = "none"; $("fpCheck").style.display = "";
  $("fpPista").style.display = "";
  setStreak($("fpStreak"), S.streak);
  rondaPinta("w");
  if(!S.cur){
    $("fpQuestion").textContent = t("idEmpty");
    $("fpAnswer").textContent = "";
    $("fpInput").style.display = "none"; $("fpCheck").style.display = "none"; $("fpPista").style.display = "none";
    return;
  }
  $("fpInput").style.display = "";
  $("fpQuestion").textContent = fHueco(S.cur);
  $("fpAnswer").textContent = "— " + FALTA[S.cur.k].respuesta(S.cur);
}
function pistaF(){
  const S = fEstado;
  if(!S.cur || S.checked) return;
  S.pista = true;
  $("fpMsg").textContent = FALTA[S.cur.k].pista(S.cur);
  $("fpMsg").className = "buildmsg pista";
}
function checkF(){
  const S = fEstado;
  if(!S.cur || S.checked) return;
  const F = FALTA[S.cur.k];
  const dado = $("fpInput").value.trim().toLowerCase().replace(/[?¿.]/g, "");
  if(!dado){ $("fpMsg").textContent = t("rWrite"); $("fpMsg").className = "buildmsg bad"; return; }
  S.checked = true;
  const acepta = F.acepta(S.cur).map(x => x.toLowerCase());
  const ok = acepta.includes(dado);
  /* Usar la pista NO invalida el acierto: es material de apoyo, no una trampa.
     Sí corta la racha, que es lo que mide hacerlo sin ayuda. */
  if(ok && !S.pista){ S.streak++; bumpBestStreak("w", S.streak); }
  else S.streak = 0;
  try{ localStorage.setItem("ql_pieza_streak", S.streak); }catch(e){}
  setStreak($("fpStreak"), S.streak);
  const correcta = partirPregunta(S.cur).pieza;
  const otras = acepta.filter(x => x !== correcta.toLowerCase());
  if(ok){
    /* Dos llamadas con la clave literal y no `t(cond ? a : b)`: `check-i18n`
       busca `t("…")` en el código y con el ternario no ve ninguna de las dos. */
    $("fpMsg").textContent = S.pista ? t("fOkPista") : t("idCorrect");
    $("fpMsg").className = "buildmsg ok";
  } else {
    $("fpMsg").textContent = t("fMal").replace("{pieza}", correcta);
    $("fpMsg").className = "buildmsg bad";
  }
  /* El análisis completo de la pregunta, como en los otros modos, y encima la
     pregunta entera. Cuando había más de una wh válida se DICE: el alumno tiene
     que saber que su «what time» también servía, o aprende que estaba mal.
     `renderResult` reemplaza el contenido del contenedor, así que la tarjeta de
     arriba se inserta DESPUÉS, no antes. */
  renderResult(S.cur.r, $("fpReveal"));
  const otrasHtml = otras.length ? `<p class="hint">${esc(t("fOtras").replace("{otras}", otras.join(", ")))}</p>` : "";
  $("fpReveal").insertAdjacentHTML("afterbegin",
    `<div class="card"><p class="prompt">${esc(S.cur.q)}</p>${otrasHtml}</div>`);
  const G = window.GH_GAME;
  if(G){
    if(!ghProgress) ghProgress = G.loadProgress(localStorage);
    G.recordAttempt(ghProgress, { app:"questionlab", mode:"fill-piece", tenseId:S.cur.tid, correct:ok, answerStreak:S.streak });
    G.evaluateBadges(ghProgress, G.BADGES, [S.cur.tid]).newly.forEach(showBadgeToast);
    G.saveProgress(localStorage, ghProgress);
  }
  rondaSuma("w", ok, S.streak);
  rondaPinta("w");   // avanza la barra; el rótulo se queda en este ejercicio
  $("fpCheck").style.display = "none"; $("fpPista").style.display = "none"; $("fpNext").style.display = "";
  scrollReveal($("fpReveal"));
}
$("fpCheck").addEventListener("click", () => checkF());
$("fpPista").addEventListener("click", () => pistaF());
$("fpNext").addEventListener("click", () => rondaAvanza("w"));
$("fpInput").addEventListener("keydown", e => { if(e.key === "Enter" && !fEstado.checked) checkF(); });

applyI18n();
buildGuideWh();          // tabla Wh-words colapsable
buildGuideAccordion();   // agrupa los tiempos de la Guía en acordeones por familia
updateThemeBtn();        // ícono inicial del toggle de tema
applyLevel();   // primer render: rellena ejemplos y carga el primer desafío del nivel
refrescarReporte();      // el botón de reportar arranca según lo que haya en pantalla
