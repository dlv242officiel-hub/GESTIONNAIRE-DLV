import { useState, useRef, useEffect } from "react";

const CONCEPTEUR_CREDS = { email:"admin@beautyos.app", password:"Beauty2026!" };
const TODAY_ISO = "2026-05-11";
const TODAY = new Date("2026-05-11T12:00:00");
const FR_MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const FR_DAYS  = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const FR_DAYS_LONG = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const HOURS = Array.from({length:28},(_,i)=>{ const h=Math.floor(i/2)+7; const m=i%2?"30":"00"; return `${String(h).padStart(2,"0")}:${m}`; });
const SLOT_H = 52;
const GRID_START = 7*60;
const PALETTE = ["#c084fc","#60a5fa","#34d399","#f472b6","#fbbf24","#fb923c","#818cf8","#2dd4bf"];
const STATUS_COLOR = { confirmé:"#34d399","en attente":"#fbbf24",annulé:"#f87171",payée:"#34d399" };
const ALL_MODULES = [
  {id:"dashboard",   label:"Tableau de bord",  icon:"⊞"},
  {id:"agenda",      label:"Agenda",            icon:"◑"},
  {id:"clients",     label:"Clients",           icon:"◉"},
  {id:"employes",    label:"Employés",          icon:"◈"},
  {id:"produits",    label:"Produits",          icon:"◇"},
  {id:"facturation", label:"Facturation",       icon:"◎"},
  {id:"suivi",       label:"Suivi clients",     icon:"◬"},
  {id:"budget",      label:"Budget",            icon:"◍"},
  {id:"acces",       label:"Accès",             icon:"◆"},
  {id:"portail",     label:"Portail client",    icon:"◐"},
];

const uid = () => Math.random().toString(36).slice(2)+Date.now();
const timeToMin = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };
const minToTime = m => `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const daysDiff = (isoA, isoB) => Math.round((new Date(isoB)-new Date(isoA))/(1000*60*60*24));

function getWeekDates(offset=0){
  const base = new Date(TODAY);
  const dow = base.getDay(); const mondayOff = dow===0?-6:1-dow;
  const mon = new Date(base); mon.setDate(base.getDate()+mondayOff+offset*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

const SEED_SALONS = [
  { id:1, nom:"Salon Lumière", ville:"Montréal", couleur:"#c084fc",
    email:"lumiere@beautyos.app", password:"Lumiere123",
    modules:["dashboard","agenda","clients","employes","produits","facturation","suivi","budget","acces","portail"],
    employes:[
      {id:1,nom:"Isabelle Roy",   poste:"Coiffeuse Senior",  acces:["agenda","clients","produits"],      status:"actif",email:"i.roy@lumiere.ca"},
      {id:2,nom:"Marc Leblanc",   poste:"Esthéticien",       acces:["agenda","clients"],                 status:"actif",email:"m.leblanc@lumiere.ca"},
      {id:3,nom:"Chloé Tremblay", poste:"Réceptionniste",    acces:["agenda","clients","facturation"],   status:"actif",email:"c.tremblay@lumiere.ca"},
    ],
    clients:[
      {id:1,nom:"Marie Gagnon",   email:"m.gagnon@email.com",  tel:"514-555-0101",notes:"Allergie nickel"},
      {id:2,nom:"Laura Fontaine", email:"l.fontaine@email.com", tel:"514-555-0234",notes:""},
      {id:3,nom:"Sophie Lacroix", email:"s.lacroix@email.com",  tel:"438-555-0187",notes:"Préfère Isabelle"},
      {id:4,nom:"Emma Dubois",    email:"e.dubois@email.com",   tel:"514-555-0399",notes:""},
    ],
    services:[
      {id:1,nom:"Coupe & Brushing",    prix:55, duree:60, cat:"Coiffure", couleur:"#c084fc"},
      {id:2,nom:"Coloration complète", prix:95, duree:120,cat:"Coiffure", couleur:"#818cf8"},
      {id:3,nom:"Soin du visage",      prix:75, duree:75, cat:"Soins",    couleur:"#34d399"},
      {id:4,nom:"Massage relaxant",    prix:80, duree:60, cat:"Bien-être",couleur:"#60a5fa"},
    ],
    produits:[
      {id:1,nom:"Shampooing Argan", prix:18,stock:24,cat:"Capillaire"},
      {id:2,nom:"Masque Kératine",  prix:32,stock:12,cat:"Capillaire"},
      {id:3,nom:"Crème hydratante", prix:28,stock:18,cat:"Soin visage"},
    ],
    rdvs:[
      {id:1,clientId:1,employeId:1,serviceId:1,date:"2026-04-18",debut:"09:00",fin:"10:00",statut:"confirmé",notes:"Cliente fidèle"},
      {id:2,clientId:2,employeId:2,serviceId:3,date:"2026-04-20",debut:"10:30",fin:"11:45",statut:"confirmé",notes:""},
      {id:3,clientId:3,employeId:1,serviceId:2,date:"2026-05-01",debut:"14:00",fin:"16:00",statut:"confirmé",notes:"Première coloration"},
      {id:4,clientId:1,employeId:3,serviceId:4,date:"2026-05-11",debut:"11:00",fin:"12:00",statut:"confirmé",notes:""},
      {id:5,clientId:2,employeId:2,serviceId:1,date:"2026-05-11",debut:"09:30",fin:"10:30",statut:"confirmé",notes:""},
      {id:6,clientId:4,employeId:1,serviceId:1,date:"2026-04-10",debut:"14:00",fin:"15:00",statut:"confirmé",notes:""},
    ],
    factures:[
      {id:"F-001",clientId:1,serviceId:1,montant:55,date:"2026-04-18",statut:"payée"},
      {id:"F-002",clientId:2,serviceId:3,montant:75,date:"2026-04-20",statut:"en attente"},
    ],
    relances:[],
    budgetObjectif: 4000,
  },
  { id:2, nom:"Studio Nova", ville:"Québec", couleur:"#34d399",
    email:"nova@beautyos.app", password:"Nova2026",
    modules:["dashboard","agenda","clients","employes","suivi","budget","facturation","portail"],
    employes:[
      {id:1,nom:"Anna Simard",  poste:"Esthéticienne",   acces:["agenda","clients"],status:"actif",email:"a.simard@nova.ca"},
      {id:2,nom:"Pierre Côté", poste:"Massothérapeute", acces:["agenda"],          status:"actif",email:"p.cote@nova.ca"},
    ],
    clients:[
      {id:1,nom:"Julie Morin",   email:"j.morin@email.com",   tel:"418-555-0201",notes:""},
      {id:2,nom:"Éric Bouchard", email:"e.bouchard@email.com", tel:"418-555-0312",notes:"Dos sensible"},
    ],
    services:[
      {id:1,nom:"Soin visage complet",prix:90,duree:90,cat:"Soins",    couleur:"#34d399"},
      {id:2,nom:"Massage dos",        prix:70,duree:60,cat:"Bien-être",couleur:"#60a5fa"},
    ],
    produits:[{id:1,nom:"Huile de rose",prix:22,stock:9,cat:"Soin corps"}],
    rdvs:[
      {id:1,clientId:1,employeId:1,serviceId:1,date:"2026-04-15",debut:"09:30",fin:"11:00",statut:"confirmé",notes:""},
      {id:2,clientId:2,employeId:2,serviceId:2,date:"2026-04-28",debut:"14:00",fin:"15:00",statut:"confirmé",notes:""},
    ],
    factures:[],
    relances:[],
    budgetObjectif: 3000,
  },
];

// ─── BASE UI ──────────────────────────────────────────────────────────────────
const inp = {width:"100%",background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"10px 14px",color:"#f1f5f9",fontSize:14,outline:"none",boxSizing:"border-box"};
const lbl = {color:"#94a3b8",fontSize:12,marginBottom:5,display:"block",letterSpacing:"0.05em",textTransform:"uppercase"};

const Badge = ({label,color}) => <span style={{background:color+"22",color,border:`1px solid ${color}44`,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</span>;
const Btn = ({children,color="#c084fc",ghost=false,danger=false,onClick,style={},disabled=false}) => {
  const bg=danger?"#ef4444":ghost?"transparent":color;
  return <button disabled={disabled} onClick={onClick} style={{background:bg,color:ghost?"#94a3b8":"#fff",border:ghost?"1px solid #334155":"none",borderRadius:9,padding:"8px 16px",cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:600,opacity:disabled?0.5:1,...style}}>{children}</button>;
};
const Card = ({children,style={}}) => <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:22,...style}}>{children}</div>;
const Inp = ({value,onChange,type="text",placeholder=""}) => <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inp}/>;
const Sel = ({value,onChange,children}) => <select value={value} onChange={onChange} style={inp}>{children}</select>;
const Textarea = ({value,onChange,placeholder="",rows=3}) => <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...inp,resize:"vertical"}}/>;

function Modal({title,onClose,children,wide=false}){
  return (
    <div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:20,padding:32,width:wide?720:500,maxWidth:"98vw",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h3 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:20,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:24}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ConfirmModal({msg,onConfirm,onCancel}){
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onCancel}>
      <div style={{background:"#0f172a",border:"1px solid #334155",borderRadius:18,padding:32,maxWidth:380,width:"90%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:40,marginBottom:14}}>⚠️</div>
        <div style={{color:"#f1f5f9",fontSize:16,fontWeight:600,marginBottom:8}}>Confirmer la suppression</div>
        <div style={{color:"#64748b",fontSize:14,marginBottom:24}}>{msg}</div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}><Btn ghost onClick={onCancel}>Annuler</Btn><Btn danger onClick={onConfirm}>Supprimer</Btn></div>
      </div>
    </div>
  );
}
function SectionHead({title,sub,action}){
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
      <div>
        <h2 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:4}}>{title}</h2>
        {sub&&<p style={{color:"#64748b",fontSize:14}}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function CrudTable({cols,rows,onEdit,onDelete}){
  return (
    <Card style={{padding:0,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"#1e293b"}}>{cols.map(c=><th key={c.key} style={{color:"#64748b",fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",padding:"12px 16px",textAlign:"left",whiteSpace:"nowrap"}}>{c.label}</th>)}<th style={{padding:"12px 16px"}}/></tr></thead>
        <tbody>{rows.map((r,i)=>(
          <tr key={i} style={{borderBottom:"1px solid #1e293b"}}>
            {cols.map(c=><td key={c.key} style={{padding:"12px 16px",color:"#f1f5f9",fontSize:13}}>{c.render?c.render(r[c.key],r):r[c.key]}</td>)}
            <td style={{padding:"12px 16px",textAlign:"right"}}>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <Btn ghost onClick={()=>onEdit(r)} style={{padding:"5px 12px",fontSize:12}}>Modifier</Btn>
                <Btn danger onClick={()=>onDelete(r)} style={{padding:"5px 12px",fontSize:12}}>Suppr.</Btn>
              </div>
            </td>
          </tr>
        ))}
        {rows.length===0&&<tr><td colSpan={cols.length+1} style={{padding:28,textAlign:"center",color:"#475569",fontSize:14}}>Aucun élément</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const [mode,setMode]=useState("choice");
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [error,setError]=useState("");const [showPwd,setShowPwd]=useState(false);
  const tryLogin=()=>{
    setError("");
    if(mode==="concepteur"){
      if(email===CONCEPTEUR_CREDS.email&&password===CONCEPTEUR_CREDS.password) onLogin({role:"concepteur"});
      else setError("Identifiants incorrects.");
    } else {
      const salon=SEED_SALONS.find(s=>s.email===email.trim().toLowerCase()&&s.password===password);
      if(salon) onLogin({role:"proprietaire",salonId:salon.id});
      else setError("Adresse ou mot de passe incorrect.");
    }
  };
  if(mode==="choice") return (
    <div style={{minHeight:"100vh",background:"#060d1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{color:"#c084fc",fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:12}}>Plateforme de gestion</div>
        <h1 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:46,marginBottom:10}}>BeautyOS ✦</h1>
        <p style={{color:"#64748b",fontSize:15}}>Connectez-vous pour accéder à votre espace</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,width:"100%",maxWidth:560}}>
        {[{key:"concepteur",title:"Espace Concepteur",sub:"Accès administrateur complet à tous les salons.",color:"#c084fc",icon:"◆"},{key:"salon",title:"Espace Salon",sub:"Connectez-vous avec vos identifiants salon.",color:"#60a5fa",icon:"✦"}].map(card=>(
          <div key={card.key} onClick={()=>{setMode(card.key);setError("");setEmail("");setPassword("");}} style={{background:"#0f172a",border:`1px solid ${card.color}44`,borderTop:`4px solid ${card.color}`,borderRadius:18,padding:28,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#1e293b"} onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}>
            <div style={{width:46,height:46,borderRadius:14,background:card.color+"22",display:"flex",alignItems:"center",justifyContent:"center",color:card.color,fontSize:22,marginBottom:16}}>{card.icon}</div>
            <div style={{color:"#f1f5f9",fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",marginBottom:6}}>{card.title}</div>
            <div style={{color:"#64748b",fontSize:13,lineHeight:1.6}}>{card.sub}</div>
            <div style={{color:card.color,fontSize:13,fontWeight:600,marginTop:14}}>Se connecter →</div>
          </div>
        ))}
      </div>
    </div>
  );
  const accent=mode==="concepteur"?"#c084fc":"#60a5fa";
  return (
    <div style={{minHeight:"100vh",background:"#060d1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
      <div style={{width:"100%",maxWidth:420}}>
        <button onClick={()=>setMode("choice")} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,marginBottom:32}}>← Retour</button>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:54,height:54,borderRadius:16,background:accent+"22",display:"flex",alignItems:"center",justifyContent:"center",color:accent,fontSize:26,margin:"0 auto 14px"}}>{mode==="concepteur"?"◆":"✦"}</div>
          <h2 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6}}>{mode==="concepteur"?"Connexion Concepteur":"Connexion Salon"}</h2>
        </div>
        <Card>
          <div style={{marginBottom:16}}><label style={lbl}>Adresse email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp} onKeyDown={e=>e.key==="Enter"&&tryLogin()}/></div>
          <div style={{marginBottom:8}}><label style={lbl}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <input type={showPwd?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} style={{...inp,paddingRight:44}} onKeyDown={e=>e.key==="Enter"&&tryLogin()}/>
              <button onClick={()=>setShowPwd(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:14}}>{showPwd?"🙈":"👁"}</button>
            </div>
          </div>
          {error&&<div style={{background:"#ef444422",border:"1px solid #ef4444",borderRadius:8,padding:"10px 14px",color:"#fca5a5",fontSize:13,margin:"12px 0"}}>{error}</div>}
          <button onClick={tryLogin} style={{width:"100%",background:accent,color:"#fff",border:"none",borderRadius:10,padding:"13px",cursor:"pointer",fontSize:15,fontWeight:700,marginTop:12}}>Se connecter</button>
        </Card>
        <div style={{marginTop:14,background:"#1e293b",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#64748b"}}>
          <span style={{color:"#94a3b8",fontWeight:600}}>Démo — </span>
          {mode==="concepteur"?"admin@beautyos.app / Beauty2026!":"lumiere@beautyos.app / Lumiere123  ·  nova@beautyos.app / Nova2026"}
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA ───────────────────────────────────────────────────────────────────
function AgendaModule({salon,setSalon,accent}){
  const [weekOffset,setWeekOffset]=useState(0);
  const [modal,setModal]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [form,setForm]=useState({});
  const scrollRef=useRef();
  const week=getWeekDates(weekOffset);
  const weekLabel=`${week[0].getDate()} – ${week[6].getDate()} ${FR_MONTHS[week[6].getMonth()]} ${week[6].getFullYear()}`;

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=SLOT_H*4; },[]);

  const emptyForm=()=>({clientId:"",serviceId:"",employeId:"",date:"",debut:"",fin:"",statut:"en attente",notes:""});
  const openCreate=(date,debut,empId)=>{
    setForm({...emptyForm(),date:date.toISOString().slice(0,10),debut,fin:minToTime(Math.min(timeToMin(debut)+60,21*60)),employeId:String(empId||"")});
    setModal({type:"create"});
  };
  const openEdit=rdv=>{
    const svc=salon.services.find(s=>s.id===rdv.serviceId);
    setForm({...rdv,fin:rdv.fin||minToTime(timeToMin(rdv.debut)+(svc?.duree||60)),clientId:String(rdv.clientId),serviceId:String(rdv.serviceId),employeId:String(rdv.employeId)});
    setModal({type:"edit",rdv});
  };
  const saveRdv=()=>{
    if(!form.clientId||!form.serviceId||!form.date||!form.debut) return;
    const r={...form,clientId:+form.clientId,serviceId:+form.serviceId,employeId:+form.employeId};
    if(modal.type==="create") setSalon(s=>({...s,rdvs:[...s.rdvs,{...r,id:uid()}]}));
    else setSalon(s=>({...s,rdvs:s.rdvs.map(x=>x.id===modal.rdv.id?{...r,id:x.id}:x)}));
    setModal(null);
  };
  const deleteRdv=id=>{setSalon(s=>({...s,rdvs:s.rdvs.filter(x=>x.id!==id)}));setConfirm(null);setModal(null);};

  const emps=salon.employes;
  const COL_W=Math.max(90, Math.floor(480/Math.max(emps.length,1)));

  return (
    <div>
      <SectionHead title="Agenda" sub={weekLabel} action={
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Btn ghost onClick={()=>setWeekOffset(p=>p-1)} style={{padding:"7px 14px"}}>‹</Btn>
          <Btn ghost onClick={()=>setWeekOffset(0)} style={{fontSize:12,padding:"7px 14px"}}>Aujourd'hui</Btn>
          <Btn ghost onClick={()=>setWeekOffset(p=>p+1)} style={{padding:"7px 14px"}}>›</Btn>
          <Btn color={accent} onClick={()=>{setForm(emptyForm());setModal({type:"create"});}}>+ Nouveau RDV</Btn>
        </div>
      }/>

      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,overflow:"hidden",fontSize:13}}>
        {/* ── Sticky header (jours + employés) ── */}
        <div style={{display:"flex",background:"#080f1e",borderBottom:"2px solid #1e293b",position:"sticky",top:0,zIndex:20}}>
          {/* Coin heure — même largeur que la colonne */}
          <div style={{width:58,flexShrink:0,borderRight:"1px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#334155",fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase"}}>h</span>
          </div>
          {/* 7 colonnes jours */}
          {week.map((d,di)=>{
            const iso=d.toISOString().slice(0,10);
            const isToday=iso===TODAY_ISO;
            const nbRdv=salon.rdvs.filter(r=>r.date===iso).length;
            return (
              <div key={di} style={{flex:`0 0 ${COL_W*emps.length}px`,minWidth:COL_W*emps.length,borderRight:di<6?"1px solid #1e293b":"none",maxWidth:COL_W*emps.length*1.5}}>
                <div style={{padding:"8px 8px 4px",borderBottom:"1px solid #1e293b22",textAlign:"center"}}>
                  <div style={{color:"#64748b",fontSize:10,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:3}}>{FR_DAYS_LONG[di]}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <div style={{background:isToday?accent:"transparent",color:isToday?"#fff":"#f1f5f9",width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15}}>{d.getDate()}</div>
                    {nbRdv>0&&<span style={{background:accent+"33",color:accent,borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{nbRdv}</span>}
                  </div>
                  <div style={{color:"#475569",fontSize:10,marginTop:2}}>{FR_MONTHS[d.getMonth()].slice(0,3)}.</div>
                </div>
                <div style={{display:"flex"}}>
                  {emps.map((e,ei)=>(
                    <div key={e.id} style={{flex:1,padding:"4px 4px",fontSize:10,color:"#475569",textAlign:"center",borderRight:ei<emps.length-1?"1px solid #1e293b18":"none",fontWeight:600,letterSpacing:"0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {e.nom.split(" ")[0][0]}.{e.nom.split(" ")[1]?.[0]}.
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Corps : heure fixe + scroll horizontal ── */}
        <div style={{display:"flex"}}>
          {/* Colonne heures — FIXE */}
          <div style={{width:58,flexShrink:0,borderRight:"1px solid #1e293b",background:"#080f1e",position:"sticky",left:0,zIndex:10}}>
            <div ref={scrollRef} style={{overflowY:"auto",maxHeight:520}}>
              {HOURS.map((h,i)=>(
                <div key={i} style={{height:SLOT_H,borderBottom:"1px solid #0f172a22",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:6,paddingTop:4}}>
                  {h.endsWith(":00")&&<span style={{color:"#475569",fontSize:11,fontWeight:600}}>{h}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Grille jours — scroll horizontal + vertical synchronisé */}
          <div style={{overflowX:"auto",overflowY:"hidden",flex:1}}>
            <div style={{display:"flex",minWidth:COL_W*emps.length*7}}>
              {week.map((d,di)=>{
                const iso=d.toISOString().slice(0,10);
                const isToday=iso===TODAY_ISO;
                return (
                  <div key={di} style={{flex:`0 0 ${COL_W*emps.length}px`,borderRight:di<6?"1px solid #1e293b":"none",display:"flex",background:isToday?"#c084fc06":"transparent"}}>
                    {emps.map((emp,ei)=>(
                      <div key={emp.id} style={{flex:1,position:"relative",borderRight:ei<emps.length-1?"1px solid #1e293b18":"none",overflowY:"auto",maxHeight:520}}>
                        {HOURS.map((h,hi)=>(
                          <div key={hi} onClick={()=>openCreate(d,h,emp.id)}
                            style={{height:SLOT_H,borderBottom:h.endsWith(":00")?"1px solid #1e293b22":"1px solid #1e293b0a",cursor:"pointer"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#1e293b55"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                          />
                        ))}
                        {salon.rdvs.filter(r=>r.date===iso&&r.employeId===emp.id).map(rdv=>{
                          const svc=salon.services.find(s=>s.id===rdv.serviceId);
                          const cl=salon.clients.find(c=>c.id===rdv.clientId);
                          const startMin=timeToMin(rdv.debut)-GRID_START;
                          const durMin=svc?.duree||60;
                          const top=(startMin/30)*SLOT_H;
                          const height=Math.max((durMin/30)*SLOT_H-3,28);
                          const color=svc?.couleur||accent;
                          return (
                            <div key={rdv.id} onClick={e=>{e.stopPropagation();openEdit(rdv);}}
                              style={{position:"absolute",left:2,right:2,top,height,background:`${color}33`,border:`1.5px solid ${color}88`,borderLeft:`3px solid ${color}`,borderRadius:7,padding:"3px 6px",cursor:"pointer",overflow:"hidden",zIndex:5}}>
                              <div style={{color,fontSize:10,fontWeight:700,lineHeight:1.2}}>{rdv.debut} – {rdv.fin||minToTime(timeToMin(rdv.debut)+durMin)}</div>
                              <div style={{color:"#f1f5f9",fontSize:11,fontWeight:700,lineHeight:1.3,marginTop:1}}>{cl?.nom||"—"}</div>
                              {height>46&&<div style={{color:"#94a3b8",fontSize:10}}>{svc?.nom}</div>}
                              {height>70&&rdv.notes&&<div style={{color:"#64748b",fontSize:10,fontStyle:"italic"}}>{rdv.notes}</div>}
                              {height>52&&<Badge label={rdv.statut} color={STATUS_COLOR[rdv.statut]||"#94a3b8"}/>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {modal&&(
        <Modal title={modal.type==="create"?"Nouveau rendez-vous":"Modifier le RDV"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><label style={lbl}>Client</label><Sel value={form.clientId} onChange={e=>setForm(p=>({...p,clientId:e.target.value}))}><option value="">Choisir…</option>{salon.clients.map(c=><option key={c.id} value={c.id}>{c.nom} — {c.tel}</option>)}</Sel></div>
            <div><label style={lbl}>Service</label><Sel value={form.serviceId} onChange={e=>{const svc=salon.services.find(s=>s.id===+e.target.value);const fin=form.debut?minToTime(Math.min(timeToMin(form.debut)+(svc?.duree||60),21*60)):form.fin;setForm(p=>({...p,serviceId:e.target.value,fin}));}}><option value="">Choisir…</option>{salon.services.map(s=><option key={s.id} value={s.id}>{s.nom} ({s.duree}min) — {s.prix}€</option>)}</Sel></div>
            <div><label style={lbl}>Employé</label><Sel value={form.employeId} onChange={e=>setForm(p=>({...p,employeId:e.target.value}))}><option value="">Choisir…</option>{salon.employes.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}</Sel></div>
            <div><label style={lbl}>Date</label><Inp type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div><label style={lbl}>Statut</label><Sel value={form.statut} onChange={e=>setForm(p=>({...p,statut:e.target.value}))}>{["confirmé","en attente","annulé"].map(s=><option key={s} value={s}>{s}</option>)}</Sel></div>
            <div><label style={lbl}>Début</label><Sel value={form.debut} onChange={e=>{const svc=salon.services.find(s=>s.id===+form.serviceId);const fin=minToTime(Math.min(timeToMin(e.target.value)+(svc?.duree||60),21*60));setForm(p=>({...p,debut:e.target.value,fin}));}}><option value="">--</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</Sel></div>
            <div><label style={lbl}>Fin</label><Sel value={form.fin} onChange={e=>setForm(p=>({...p,fin:e.target.value}))}><option value="">--</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</Sel></div>
            <div style={{gridColumn:"1/-1"}}><label style={lbl}>Notes</label><Textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Informations supplémentaires…"/></div>
          </div>
          {form.clientId&&form.serviceId&&form.date&&form.debut&&(()=>{
            const cl=salon.clients.find(c=>c.id===+form.clientId);
            const svc=salon.services.find(s=>s.id===+form.serviceId);
            const emp=salon.employes.find(e=>e.id===+form.employeId);
            const dateF=new Date(form.date+"T12:00:00");
            return (
              <div style={{marginTop:16,background:"#1e293b",borderRadius:12,padding:"14px 16px",borderLeft:`3px solid ${svc?.couleur||accent}`}}>
                <div style={{color:"#94a3b8",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Récapitulatif</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:13}}>
                  <div><span style={{color:"#64748b"}}>Client : </span><span style={{color:"#f1f5f9",fontWeight:600}}>{cl?.nom}</span></div>
                  <div><span style={{color:"#64748b"}}>Service : </span><span style={{color:svc?.couleur||accent,fontWeight:600}}>{svc?.nom}</span></div>
                  <div><span style={{color:"#64748b"}}>Date : </span><span style={{color:"#f1f5f9"}}>{FR_DAYS_LONG[dateF.getDay()===0?6:dateF.getDay()-1]} {dateF.getDate()} {FR_MONTHS[dateF.getMonth()]} {dateF.getFullYear()}</span></div>
                  <div><span style={{color:"#64748b"}}>Horaire : </span><span style={{color:"#f1f5f9"}}>{form.debut} → {form.fin}</span></div>
                  <div><span style={{color:"#64748b"}}>Employé : </span><span style={{color:"#f1f5f9"}}>{emp?.nom||"—"}</span></div>
                  <div><span style={{color:"#64748b"}}>Montant : </span><span style={{color:"#34d399",fontWeight:700}}>{svc?.prix}€</span></div>
                </div>
              </div>
            );
          })()}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}>
            {modal.type==="edit"&&<Btn danger onClick={()=>setConfirm({id:modal.rdv.id})}>Supprimer</Btn>}
            <Btn ghost onClick={()=>setModal(null)}>Annuler</Btn>
            <Btn color={accent} onClick={saveRdv}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal msg="Supprimer ce rendez-vous ?" onConfirm={()=>deleteRdv(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

// ─── SUIVI CLIENTS ────────────────────────────────────────────────────────────
function SuiviModule({salon,setSalon,accent}){
  const SEUIL=14;
  const relances=salon.relances||[];

  const inactifs=salon.clients.map(cl=>{
    const rdvsCl=salon.rdvs.filter(r=>r.clientId===cl.id).sort((a,b)=>b.date.localeCompare(a.date));
    const dernier=rdvsCl[0];
    if(!dernier) return {client:cl,joursSans:999,dernier:null,svc:null};
    const j=daysDiff(dernier.date,TODAY_ISO);
    const svc=salon.services.find(s=>s.id===dernier.serviceId);
    return {client:cl,joursSans:j,dernier,svc};
  }).filter(x=>x.joursSans>=SEUIL).sort((a,b)=>b.joursSans-a.joursSans);

  const isRelance=(clientId)=>relances.some(r=>r.clientId===clientId&&daysDiff(r.date,TODAY_ISO)<=14);
  const toggleRelance=(clientId)=>{
    setSalon(s=>{
      const rel=s.relances||[];
      if(rel.some(r=>r.clientId===clientId&&daysDiff(r.date,TODAY_ISO)<=14)){
        return {...s,relances:rel.filter(r=>!(r.clientId===clientId&&daysDiff(r.date,TODAY_ISO)<=14))};
      }
      return {...s,relances:[...rel,{clientId,date:TODAY_ISO}]};
    });
  };

  const relancés=inactifs.filter(x=>isRelance(x.client.id)).length;
  const aRelancer=inactifs.length-relancés;

  return (
    <div>
      <SectionHead title="Suivi clients" sub={`Clients sans RDV depuis ${SEUIL}+ jours`}/>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:28}}>
        {[
          {l:"À relancer",   v:aRelancer,  c:"#f87171"},
          {l:"Relancés (14j)",v:relancés,  c:"#34d399"},
          {l:"Total inactifs",v:inactifs.length,c:accent},
        ].map(s=>(
          <div key={s.l} style={{flex:1,minWidth:130,background:"#0f172a",border:"1px solid #1e293b",borderLeft:`4px solid ${s.c}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{color:"#64748b",fontSize:11,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
            <div style={{color:"#f1f5f9",fontSize:32,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{s.v}</div>
          </div>
        ))}
      </div>

      {inactifs.length===0&&<Card style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:14}}>✅</div><div style={{color:"#f1f5f9",fontSize:18,fontWeight:600}}>Tous les clients ont été vus récemment !</div></Card>}

      {inactifs.map(({client,joursSans,dernier,svc})=>{
        const relance=isRelance(client.id);
        const urgence=joursSans>=30?"#f87171":joursSans>=21?"#fbbf24":"#94a3b8";
        return (
          <Card key={client.id} style={{marginBottom:12,borderLeft:`3px solid ${urgence}`,display:"flex",gap:18,alignItems:"center"}}>
            <div style={{width:46,height:46,borderRadius:"50%",background:accent+"22",border:`2px solid ${accent}44`,display:"flex",alignItems:"center",justifyContent:"center",color:accent,fontSize:16,fontWeight:700,flexShrink:0}}>
              {client.nom.split(" ").map(n=>n[0]).join("")}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <span style={{color:"#f1f5f9",fontSize:15,fontWeight:600}}>{client.nom}</span>
                <Badge label={`${joursSans}j sans RDV`} color={urgence}/>
              </div>
              <div style={{color:"#64748b",fontSize:13}}>{client.email} · {client.tel}</div>
              {dernier?(
                <div style={{marginTop:6,background:"#1e293b",borderRadius:8,padding:"8px 12px",fontSize:12,display:"flex",gap:16,flexWrap:"wrap"}}>
                  <span style={{color:"#94a3b8"}}>Dernier RDV : <span style={{color:"#f1f5f9",fontWeight:600}}>{new Date(dernier.date+"T12:00:00").toLocaleDateString("fr-CA",{day:"numeric",month:"long",year:"numeric"})}</span></span>
                  <span style={{color:"#94a3b8"}}>Service : <span style={{color:svc?.couleur||accent,fontWeight:600}}>{svc?.nom||"—"}</span></span>
                  <span style={{color:"#94a3b8"}}>Heure : <span style={{color:"#f1f5f9"}}>{dernier.debut}</span></span>
                </div>
              ):<div style={{color:"#475569",fontSize:12,marginTop:4}}>Aucun RDV antérieur trouvé</div>}
            </div>
            <div style={{flexShrink:0,textAlign:"center"}}>
              <div onClick={()=>toggleRelance(client.id)} style={{width:28,height:28,borderRadius:8,background:relance?"#34d39922":"#1e293b",border:`2px solid ${relance?"#34d399":"#334155"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",margin:"0 auto 6px",fontSize:16}}>{relance?"✓":""}</div>
              <div style={{color:relance?"#34d399":"#64748b",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>Relancé</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── BUDGET ───────────────────────────────────────────────────────────────────
function BudgetModule({salon,setSalon,accent}){
  const [objectif,setObjectif]=useState(String(salon.budgetObjectif||4000));
  const [editing,setEditing]=useState(false);

  const saveObjectif=()=>{
    setSalon(s=>({...s,budgetObjectif:+objectif}));
    setEditing(false);
  };

  const obj=salon.budgetObjectif||4000;
  const ca=salon.factures.filter(f=>f.statut==="payée").reduce((s,f)=>s+Number(f.montant),0);
  const caAttendu=salon.factures.reduce((s,f)=>s+Number(f.montant),0);
  const reste=Math.max(0,obj-ca);
  const pct=Math.min(100,Math.round((ca/obj)*100));

  // Moyenne des services
  const servicesMoyens=salon.services.map(svc=>{
    const nb=salon.rdvs.filter(r=>r.serviceId===svc.id).length;
    return {...svc,nb};
  }).sort((a,b)=>b.nb-a.nb);
  const prixMoyen=salon.services.length>0?Math.round(salon.services.reduce((s,sv)=>s+sv.prix,0)/salon.services.length):0;

  const clientsNecessaires=prixMoyen>0?Math.ceil(reste/prixMoyen):0;
  const rdvsParSvc=salon.services.map(svc=>{
    const neces=prixMoyen>0?Math.ceil((reste*(svc.prix/salon.services.reduce((s,x)=>s+x.prix,0)))/svc.prix):0;
    return {...svc,neces};
  });

  const barColor=(p)=>p>=80?"#34d399":p>=50?"#60a5fa":"#fbbf24";

  return (
    <div>
      <SectionHead title="Budget & Objectifs" sub="Suivi de revenus et projection"/>

      {/* Objectif */}
      <Card style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{color:"#94a3b8",fontSize:12,letterSpacing:"0.07em",textTransform:"uppercase"}}>Objectif mensuel</div>
          {editing?(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input type="number" value={objectif} onChange={e=>setObjectif(e.target.value)} style={{...inp,width:120,padding:"6px 10px"}}/>
              <Btn color={accent} onClick={saveObjectif} style={{padding:"6px 14px"}}>OK</Btn>
              <Btn ghost onClick={()=>{setObjectif(String(obj));setEditing(false);}} style={{padding:"6px 14px"}}>✕</Btn>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{color:"#f1f5f9",fontSize:28,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{obj.toLocaleString()}€</span>
              <button onClick={()=>setEditing(true)} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12}}>Modifier</button>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#64748b",marginBottom:8}}>
            <span>Encaissé : <span style={{color:"#34d399",fontWeight:600}}>{ca.toLocaleString()}€</span></span>
            <span>{pct}% atteint</span>
          </div>
          <div style={{background:"#1e293b",borderRadius:99,height:14,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:barColor(pct),borderRadius:99,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#475569",marginTop:6}}>
            <span>0€</span><span style={{color:"#64748b"}}>{obj.toLocaleString()}€</span>
          </div>
        </div>

        <div style={{display:"flex",gap:14,marginTop:16,flexWrap:"wrap"}}>
          {[
            {l:"Restant",      v:`${reste.toLocaleString()}€`,  c:"#f87171"},
            {l:"En attente",   v:`${(caAttendu-ca).toLocaleString()}€`, c:"#fbbf24"},
            {l:"Encaissé",     v:`${ca.toLocaleString()}€`,    c:"#34d399"},
          ].map(s=>(
            <div key={s.l} style={{flex:1,minWidth:100,background:"#1e293b",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
              <div style={{color:"#64748b",fontSize:11,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
              <div style={{color:s.c,fontSize:22,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{s.v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Projection */}
      {reste>0&&(
        <Card style={{marginBottom:20,borderLeft:`3px solid ${accent}`}}>
          <div style={{color:"#94a3b8",fontSize:12,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:16}}>Projection pour atteindre l'objectif</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
            <div style={{flex:1,minWidth:140,background:"#1e293b",borderRadius:12,padding:"16px"}}>
              <div style={{color:"#64748b",fontSize:12,marginBottom:4}}>Prix moyen / service</div>
              <div style={{color:accent,fontSize:26,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{prixMoyen}€</div>
            </div>
            <div style={{flex:1,minWidth:140,background:"#1e293b",borderRadius:12,padding:"16px"}}>
              <div style={{color:"#64748b",fontSize:12,marginBottom:4}}>Clients encore nécessaires</div>
              <div style={{color:"#f1f5f9",fontSize:26,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{clientsNecessaires}</div>
              <div style={{color:"#475569",fontSize:11,marginTop:2}}>au prix moyen</div>
            </div>
          </div>

          <div style={{color:"#94a3b8",fontSize:12,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:12}}>Répartition par service</div>
          {salon.services.map(svc=>{
            const neces=Math.ceil(reste/svc.prix);
            const contrib=Math.round((svc.prix/salon.services.reduce((s,x)=>s+x.prix,0))*100);
            return (
              <div key={svc.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid #1e293b"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:svc.couleur||accent,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{color:"#f1f5f9",fontSize:13,fontWeight:600}}>{svc.nom}</div>
                  <div style={{color:"#64748b",fontSize:12}}>{svc.duree} min · {svc.prix}€</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:"#f1f5f9",fontSize:14,fontWeight:600}}>{neces} RDV</div>
                  <div style={{color:"#64748b",fontSize:11}}>pour {(neces*svc.prix).toLocaleString()}€</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Historique performances */}
      <Card>
        <div style={{color:"#94a3b8",fontSize:12,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:16}}>Performance par service</div>
        {servicesMoyens.map(svc=>{
          const contrib=obj>0?Math.min(100,Math.round((svc.nb*svc.prix/obj)*100)):0;
          return (
            <div key={svc.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid #1e293b"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:svc.couleur||accent,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:"#f1f5f9",fontSize:13,fontWeight:600}}>{svc.nom}</span>
                  <span style={{color:"#64748b",fontSize:12}}>{svc.nb} RDV · {svc.nb*svc.prix}€</span>
                </div>
                <div style={{background:"#1e293b",borderRadius:99,height:6}}>
                  <div style={{width:`${contrib}%`,height:"100%",background:svc.couleur||accent,borderRadius:99}}/>
                </div>
              </div>
              <div style={{color:svc.couleur||accent,fontSize:14,fontWeight:700,minWidth:40,textAlign:"right"}}>{contrib}%</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── AUTRES MODULES (compact) ─────────────────────────────────────────────────
function ClientsModule({salon,setSalon,accent}){
  const E={nom:"",email:"",tel:"",notes:""};
  const [modal,setModal]=useState(null);const [form,setForm]=useState(E);const [confirm,setConfirm]=useState(null);
  const open=item=>{setForm(item?{...item}:{...E});setModal({type:item?"edit":"add",item});};
  const save=()=>{if(!form.nom)return;modal.type==="add"?setSalon(s=>({...s,clients:[...s.clients,{...form,id:uid()}]})):setSalon(s=>({...s,clients:s.clients.map(c=>c.id===modal.item.id?{...form,id:c.id}:c)}));setModal(null);};
  const del=c=>{setSalon(s=>({...s,clients:s.clients.filter(x=>x.id!==c.id)}));setConfirm(null);};
  return(<div>
    <SectionHead title="Clients" sub={`${salon.clients.length} clients`} action={<Btn color={accent} onClick={()=>open(null)}>+ Ajouter</Btn>}/>
    <CrudTable cols={[{key:"nom",label:"Nom"},{key:"email",label:"Email"},{key:"tel",label:"Téléphone"},{key:"notes",label:"Notes",render:v=><span style={{color:"#64748b"}}>{v||"—"}</span>}]} rows={salon.clients} onEdit={open} onDelete={c=>setConfirm(c)}/>
    {modal&&<Modal title={modal.type==="add"?"Nouveau client":"Modifier"} onClose={()=>setModal(null)}>{["nom","email","tel","notes"].map(f=><div key={f} style={{marginBottom:14}}><label style={lbl}>{f}</label>{f==="notes"?<Textarea value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))}/>:<Inp value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))}/>}</div>)}<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setModal(null)}>Annuler</Btn><Btn color={accent} onClick={save}>Enregistrer</Btn></div></Modal>}
    {confirm&&<ConfirmModal msg={`Supprimer "${confirm.nom}" ?`} onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
  </div>);
}

function EmployesModule({salon,setSalon,accent}){
  const E={nom:"",poste:"",email:"",acces:[],status:"actif"};
  const [modal,setModal]=useState(null);const [form,setForm]=useState(E);const [confirm,setConfirm]=useState(null);
  const avail=salon.modules.filter(m=>!["acces","portail"].includes(m));
  const open=item=>{setForm(item?{...item,acces:[...item.acces]}:{...E});setModal({type:item?"edit":"add",item});};
  const toggle=id=>setForm(p=>({...p,acces:p.acces.includes(id)?p.acces.filter(x=>x!==id):[...p.acces,id]}));
  const save=()=>{if(!form.nom)return;modal.type==="add"?setSalon(s=>({...s,employes:[...s.employes,{...form,id:uid()}]})):setSalon(s=>({...s,employes:s.employes.map(e=>e.id===modal.item.id?{...form,id:e.id}:e)}));setModal(null);};
  const del=e=>{setSalon(s=>({...s,employes:s.employes.filter(x=>x.id!==e.id)}));setConfirm(null);};
  const SC={actif:"#34d399",congé:"#fbbf24",inactif:"#f87171"};
  return(<div>
    <SectionHead title="Employés" sub={`${salon.employes.length} membres`} action={<Btn color={accent} onClick={()=>open(null)}>+ Ajouter</Btn>}/>
    <CrudTable cols={[{key:"nom",label:"Nom"},{key:"poste",label:"Poste"},{key:"status",label:"Statut",render:v=><Badge label={v} color={SC[v]||"#94a3b8"}/>},{key:"acces",label:"Accès",render:v=><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{v.map(a=>{const m=ALL_MODULES.find(x=>x.id===a);return m?<Badge key={a} label={m.label} color={accent}/>:null;})}</div>}]} rows={salon.employes} onEdit={open} onDelete={e=>setConfirm(e)}/>
    {modal&&<Modal title={modal.type==="add"?"Nouvel employé":"Modifier"} onClose={()=>setModal(null)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>{[["nom","Nom","1/-1"],["poste","Poste","auto"],["email","Email","auto"]].map(([f,l,gc])=><div key={f} style={{gridColumn:gc}}><label style={lbl}>{l}</label><Inp value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))}/></div>)}<div><label style={lbl}>Statut</label><Sel value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{["actif","congé","inactif"].map(s=><option key={s} value={s}>{s}</option>)}</Sel></div></div><label style={{...lbl,marginBottom:10}}>Accès modules</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>{avail.map(mid=>{const m=ALL_MODULES.find(x=>x.id===mid);const on=form.acces.includes(mid);return(<div key={mid} onClick={()=>toggle(mid)} style={{background:on?accent+"18":"#1e293b",border:`1px solid ${on?accent:"#334155"}`,borderRadius:9,padding:"9px 12px",cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}><div style={{width:16,height:16,borderRadius:4,background:on?accent:"transparent",border:`2px solid ${on?accent:"#475569"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{on?"✓":""}</div><span style={{color:on?"#f1f5f9":"#64748b",fontSize:13}}>{m?.label}</span></div>);})}</div><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setModal(null)}>Annuler</Btn><Btn color={accent} onClick={save}>Enregistrer</Btn></div></Modal>}
    {confirm&&<ConfirmModal msg={`Supprimer "${confirm.nom}" ?`} onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
  </div>);
}

function ProduitsModule({salon,setSalon,accent}){
  const E={nom:"",prix:"",stock:"",cat:""};
  const [modal,setModal]=useState(null);const [form,setForm]=useState(E);const [confirm,setConfirm]=useState(null);
  const open=item=>{setForm(item?{...item,prix:String(item.prix),stock:String(item.stock)}:{...E});setModal({type:item?"edit":"add",item});};
  const save=()=>{if(!form.nom)return;const p={...form,prix:+form.prix,stock:+form.stock};modal.type==="add"?setSalon(s=>({...s,produits:[...s.produits,{...p,id:uid()}]})):setSalon(s=>({...s,produits:s.produits.map(x=>x.id===modal.item.id?{...p,id:x.id}:x)}));setModal(null);};
  const del=p=>{setSalon(s=>({...s,produits:s.produits.filter(x=>x.id!==p.id)}));setConfirm(null);};
  return(<div>
    <SectionHead title="Produits" sub={`${salon.produits.length} produits`} action={<Btn color={accent} onClick={()=>open(null)}>+ Ajouter</Btn>}/>
    <CrudTable cols={[{key:"nom",label:"Produit"},{key:"cat",label:"Catégorie",render:v=><Badge label={v||"—"} color={accent}/>},{key:"prix",label:"Prix",render:v=><span style={{color:accent,fontWeight:600}}>{v}€</span>},{key:"stock",label:"Stock"}]} rows={salon.produits} onEdit={open} onDelete={p=>setConfirm(p)}/>
    {modal&&<Modal title={modal.type==="add"?"Nouveau produit":"Modifier"} onClose={()=>setModal(null)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>{[["nom","Nom","1/-1"],["cat","Catégorie","auto"],["prix","Prix (€)","auto"],["stock","Stock","auto"]].map(([f,l,gc])=><div key={f} style={{gridColumn:gc}}><label style={lbl}>{l}</label><Inp type={["prix","stock"].includes(f)?"number":"text"} value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))}/></div>)}</div><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setModal(null)}>Annuler</Btn><Btn color={accent} onClick={save}>Enregistrer</Btn></div></Modal>}
    {confirm&&<ConfirmModal msg={`Supprimer "${confirm.nom}" ?`} onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
  </div>);
}

function FacturationModule({salon,setSalon,accent}){
  const E={clientId:"",serviceId:"",montant:"",date:"",statut:"en attente"};
  const [modal,setModal]=useState(null);const [form,setForm]=useState(E);const [confirm,setConfirm]=useState(null);
  const open=item=>{setForm(item?{...item,clientId:String(item.clientId),serviceId:String(item.serviceId),montant:String(item.montant)}:{...E});setModal({type:item?"edit":"add",item});};
  const save=()=>{if(!form.clientId||!form.date)return;const f={...form,clientId:+form.clientId,serviceId:+form.serviceId,montant:+form.montant};modal.type==="add"?setSalon(s=>({...s,factures:[...s.factures,{...f,id:`F-${String(s.factures.length+1).padStart(3,"0")}`}]})):setSalon(s=>({...s,factures:s.factures.map(x=>x.id===modal.item.id?{...f,id:x.id}:x)}));setModal(null);};
  const del=f=>{setSalon(s=>({...s,factures:s.factures.filter(x=>x.id!==f.id)}));setConfirm(null);};
  return(<div>
    <SectionHead title="Facturation" sub={`${salon.factures.length} factures`} action={<Btn color={accent} onClick={()=>open(null)}>+ Facture</Btn>}/>
    <CrudTable cols={[{key:"id",label:"N°",render:v=><span style={{color:accent,fontFamily:"monospace"}}>{v}</span>},{key:"clientId",label:"Client",render:v=>salon.clients.find(c=>c.id===v)?.nom||"—"},{key:"serviceId",label:"Service",render:v=>salon.services.find(s=>s.id===v)?.nom||"—"},{key:"montant",label:"Montant",render:v=><span style={{color:accent,fontWeight:600}}>{v}€</span>},{key:"date",label:"Date"},{key:"statut",label:"Statut",render:v=><Badge label={v} color={STATUS_COLOR[v]||"#94a3b8"}/>}]} rows={salon.factures} onEdit={open} onDelete={f=>setConfirm(f)}/>
    {modal&&<Modal title={modal.type==="add"?"Nouvelle facture":"Modifier"} onClose={()=>setModal(null)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}><div><label style={lbl}>Client</label><Sel value={form.clientId} onChange={e=>setForm(p=>({...p,clientId:e.target.value}))}><option value="">Choisir…</option>{salon.clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</Sel></div><div><label style={lbl}>Service</label><Sel value={form.serviceId} onChange={e=>{const s=salon.services.find(x=>x.id===+e.target.value);setForm(p=>({...p,serviceId:e.target.value,montant:s?String(s.prix):p.montant}));}}><option value="">Choisir…</option>{salon.services.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}</Sel></div><div><label style={lbl}>Montant (€)</label><Inp type="number" value={form.montant} onChange={e=>setForm(p=>({...p,montant:e.target.value}))}/></div><div><label style={lbl}>Date</label><Inp type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div><div style={{gridColumn:"1/-1"}}><label style={lbl}>Statut</label><Sel value={form.statut} onChange={e=>setForm(p=>({...p,statut:e.target.value}))}>{["en attente","payée","annulé"].map(s=><option key={s} value={s}>{s}</option>)}</Sel></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setModal(null)}>Annuler</Btn><Btn color={accent} onClick={save}>Enregistrer</Btn></div></Modal>}
    {confirm&&<ConfirmModal msg={`Supprimer la facture "${confirm.id}" ?`} onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
  </div>);
}

function AccesModule({salon,setSalon,accent}){
  const [empModal,setEmpModal]=useState(null);const [tmp,setTmp]=useState([]);
  const avail=salon.modules.filter(m=>!["acces","portail"].includes(m));
  return(<div><SectionHead title="Gestion des accès" sub="Permissions par employé"/>
    {salon.employes.map(e=>(
      <Card key={e.id} style={{marginBottom:12,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:accent+"33",border:`2px solid ${accent}`,display:"flex",alignItems:"center",justifyContent:"center",color:accent,fontSize:14,fontWeight:700,flexShrink:0}}>{e.nom.split(" ").map(n=>n[0]).join("")}</div>
        <div style={{flex:1}}><div style={{color:"#f1f5f9",fontSize:15,fontWeight:600}}>{e.nom}</div><div style={{color:"#64748b",fontSize:12}}>{e.poste}</div></div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{e.acces.map(a=>{const m=ALL_MODULES.find(x=>x.id===a);return m?<Badge key={a} label={m.label} color={accent}/>:null;})}</div>
        <Btn ghost onClick={()=>{setEmpModal(e);setTmp([...e.acces]);}}>Modifier</Btn>
      </Card>
    ))}
    {empModal&&<Modal title={`Accès — ${empModal.nom}`} onClose={()=>setEmpModal(null)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>{avail.map(mid=>{const m=ALL_MODULES.find(x=>x.id===mid);const on=tmp.includes(mid);return(<div key={mid} onClick={()=>setTmp(p=>on?p.filter(x=>x!==mid):[...p,mid])} style={{background:on?accent+"18":"#1e293b",border:`1px solid ${on?accent:"#334155"}`,borderRadius:9,padding:"10px 14px",cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}><div style={{width:16,height:16,borderRadius:4,background:on?accent:"transparent",border:`2px solid ${on?accent:"#475569"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{on?"✓":""}</div><span style={{color:on?"#f1f5f9":"#64748b",fontSize:13}}>{m?.label}</span></div>);})}</div><Btn color={accent} style={{width:"100%"}} onClick={()=>{setSalon(s=>({...s,employes:s.employes.map(e=>e.id===empModal.id?{...e,acces:tmp}:e)}));setEmpModal(null);}}>Enregistrer</Btn></Modal>}
  </div>);
}

function DashboardModule({salon,accent}){
  const ca=salon.factures.filter(f=>f.statut==="payée").reduce((s,f)=>s+Number(f.montant),0);
  const obj=salon.budgetObjectif||0;
  const pct=obj>0?Math.min(100,Math.round((ca/obj)*100)):0;
  return(<div>
    <SectionHead title={salon.nom} sub={salon.ville}/>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:28}}>
      {[{l:"CA encaissé",v:`${ca}€`,c:accent},{l:"Clients",v:salon.clients.length,c:"#60a5fa"},{l:"RDV",v:salon.rdvs.length,c:"#34d399"},{l:"Employés",v:salon.employes.length,c:"#fbbf24"}].map(s=>(
        <div key={s.l} style={{flex:1,minWidth:130,background:"#0f172a",border:"1px solid #1e293b",borderLeft:`4px solid ${s.c}`,borderRadius:16,padding:"20px 22px"}}>
          <div style={{color:"#64748b",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{s.l}</div>
          <div style={{color:"#f1f5f9",fontSize:30,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{s.v}</div>
        </div>
      ))}
    </div>
    {obj>0&&<Card style={{marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:13}}>
        <span style={{color:"#94a3b8"}}>Objectif mensuel</span>
        <span style={{color:accent,fontWeight:600}}>{pct}% — {ca}€ / {obj}€</span>
      </div>
      <div style={{background:"#1e293b",borderRadius:99,height:10}}>
        <div style={{width:`${pct}%`,height:"100%",background:pct>=80?"#34d399":pct>=50?"#60a5fa":"#fbbf24",borderRadius:99,transition:"width 0.6s"}}/>
      </div>
    </Card>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <div style={{color:"#94a3b8",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Prochains RDV</div>
        {salon.rdvs.slice(0,4).map(r=>{const cl=salon.clients.find(c=>c.id===r.clientId);const sv=salon.services.find(s=>s.id===r.serviceId);return(
          <div key={r.id} style={{display:"flex",gap:12,alignItems:"center",padding:"9px 0",borderBottom:"1px solid #1e293b"}}>
            <div style={{background:"#1e293b",borderRadius:8,padding:"6px 10px",minWidth:52,textAlign:"center"}}><div style={{color:sv?.couleur||accent,fontSize:13,fontWeight:700}}>{r.debut}</div><div style={{color:"#64748b",fontSize:10}}>{r.date?.slice(5)}</div></div>
            <div style={{flex:1}}><div style={{color:"#f1f5f9",fontSize:13}}>{cl?.nom}</div><div style={{color:"#64748b",fontSize:12}}>{sv?.nom}</div></div>
            <Badge label={r.statut} color={STATUS_COLOR[r.statut]||"#94a3b8"}/>
          </div>
        );})}
      </Card>
      <Card>
        <div style={{color:"#94a3b8",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Services</div>
        {salon.services.map(s=>(
          <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #1e293b"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:10,height:10,borderRadius:"50%",background:s.couleur||accent}}/><span style={{color:"#f1f5f9",fontSize:13}}>{s.nom}</span></div>
            <span style={{color:s.couleur||accent,fontWeight:600}}>{s.prix}€</span>
          </div>
        ))}
      </Card>
    </div>
  </div>);
}

function PortailModule({salon,setSalon,accent}){
  const [tab,setTab]=useState("rdv");const [form,setForm]=useState({serviceId:"",date:"",heure:"",notes:""});
  const [sent,setSent]=useState(false);const [panier,setPanier]=useState([]);const [cmdSent,setCmdSent]=useState(false);
  const [cForm,setCForm]=useState({nom:"",email:"",message:""});const [cSent,setCSent]=useState(false);
  const booked=salon.rdvs.filter(r=>r.date===form.date).map(r=>r.debut);
  const SLOTS=["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00"];
  const total=panier.reduce((s,p)=>s+p.prix*p.qty,0);
  const book=()=>{if(!form.serviceId||!form.date||!form.heure)return;setSalon(s=>({...s,rdvs:[...s.rdvs,{id:uid(),clientId:s.clients[0]?.id||0,serviceId:+form.serviceId,employeId:s.employes[0]?.id||0,date:form.date,debut:form.heure,fin:"",statut:"en attente",notes:form.notes}]}));setSent(true);};
  return(<div style={{background:"#060d1a",minHeight:"100%"}}>
    <div style={{background:`linear-gradient(135deg,${accent}22,#0f172a)`,borderBottom:"1px solid #1e293b",padding:"20px 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{color:accent,fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Espace client</div><div style={{color:"#f1f5f9",fontSize:22,fontFamily:"'Playfair Display',serif",fontWeight:700}}>{salon.nom} ✦</div></div>
      <div style={{color:"#94a3b8",fontSize:13}}>Bienvenue 👋</div>
    </div>
    <div style={{display:"flex",borderBottom:"1px solid #1e293b",background:"#0a1628"}}>{[{id:"rdv",l:"📅 RDV"},{id:"produits",l:"🛍 Boutique"},{id:"consult",l:"💬 Consultation"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"#0f172a":"transparent",color:tab===t.id?accent:"#64748b",border:"none",borderBottom:tab===t.id?`2px solid ${accent}`:"2px solid transparent",padding:"14px 24px",cursor:"pointer",fontSize:14,fontWeight:tab===t.id?600:400}}>{t.l}</button>)}</div>
    <div style={{padding:28,maxWidth:700,margin:"0 auto"}}>
      {tab==="rdv"&&(sent?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:14}}>✅</div><div style={{color:"#f1f5f9",fontSize:18,fontWeight:600,marginBottom:8}}>Demande envoyée !</div><Btn color={accent} onClick={()=>{setSent(false);setForm({serviceId:"",date:"",heure:"",notes:""});}}>Nouveau RDV</Btn></Card>:(<div>
        <h3 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:16}}>Prendre rendez-vous</h3>
        <label style={lbl}>Service</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>{salon.services.map(s=><div key={s.id} onClick={()=>setForm(p=>({...p,serviceId:s.id}))} style={{background:form.serviceId===s.id?(s.couleur||accent)+"22":"#1e293b",border:`1px solid ${form.serviceId===s.id?(s.couleur||accent):"#334155"}`,borderRadius:12,padding:"12px 14px",cursor:"pointer"}}><div style={{color:form.serviceId===s.id?"#f1f5f9":"#94a3b8",fontSize:13,fontWeight:600}}>{s.nom}</div><div style={{color:"#64748b",fontSize:12,marginTop:3}}>{s.duree}min · <span style={{color:s.couleur||accent}}>{s.prix}€</span></div></div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
          <div><label style={lbl}>Date</label><Inp type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
          <div><label style={lbl}>Plage</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{SLOTS.map(h=>{const dis=booked.includes(h);const sel=form.heure===h;return <div key={h} onClick={()=>!dis&&setForm(p=>({...p,heure:h}))} style={{padding:"5px 10px",borderRadius:7,fontSize:12,cursor:dis?"not-allowed":"pointer",border:`1px solid ${sel?accent:dis?"#1e293b":"#334155"}`,background:sel?accent+"22":dis?"#0a1628":"#1e293b",color:sel?accent:dis?"#334155":"#94a3b8"}}>{h}</div>;})}</div></div>
        </div>
        <div style={{marginBottom:20}}><label style={lbl}>Notes</label><Inp value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Allergie, préférence…"/></div>
        <Btn color={accent} onClick={book} style={{width:"100%",padding:"13px"}}>Confirmer</Btn>
      </div>))}
      {tab==="produits"&&<div><h3 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:16}}>Boutique</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>{salon.produits.map(p=><Card key={p.id}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><Badge label={p.cat||"—"} color={accent}/><span style={{color:accent,fontWeight:700}}>{p.prix}€</span></div><div style={{color:"#f1f5f9",fontSize:14,fontWeight:600,marginBottom:8}}>{p.nom}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:"#475569",fontSize:11}}>Stock:{p.stock}</span><Btn color={accent} onClick={()=>setPanier(pr=>{const ex=pr.find(x=>x.id===p.id);return ex?pr.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...pr,{...p,qty:1}];})} style={{padding:"5px 12px",fontSize:12}}>+ Panier</Btn></div></Card>)}</div>{panier.length>0&&(cmdSent?<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:36,marginBottom:8}}>🎉</div><div style={{color:"#f1f5f9",fontWeight:600}}>Commande envoyée !</div></Card>:<Card style={{borderTop:`3px solid ${accent}`}}><div style={{color:"#f1f5f9",fontWeight:600,marginBottom:12}}>🛒 Panier</div>{panier.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1e293b"}}><span style={{color:"#94a3b8"}}>{p.nom}</span><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{color:"#64748b"}}>×{p.qty}</span><span style={{color:"#f1f5f9",fontWeight:600}}>{p.prix*p.qty}€</span><button onClick={()=>setPanier(pr=>pr.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer"}}>×</button></div></div>)}<div style={{display:"flex",justifyContent:"space-between",marginTop:12}}><span style={{color:"#f1f5f9",fontWeight:600}}>Total: {total}€</span><Btn color={accent} onClick={()=>{setCmdSent(true);setPanier([]);}}>Commander</Btn></div></Card>)}</div>}
      {tab==="consult"&&(cSent?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:14}}>💬</div><div style={{color:"#f1f5f9",fontSize:18,fontWeight:600}}>Demande envoyée !</div></Card>:<div><h3 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:16}}>Demander une consultation</h3>{["nom","email"].map(f=><div key={f} style={{marginBottom:14}}><label style={lbl}>{f==="nom"?"Nom":"Email"}</label><Inp value={cForm[f]} onChange={e=>setCForm(p=>({...p,[f]:e.target.value}))}/></div>)}<div style={{marginBottom:20}}><label style={lbl}>Votre demande</label><Textarea value={cForm.message} onChange={e=>setCForm(p=>({...p,message:e.target.value}))} placeholder="Décrivez votre besoin…" rows={4}/></div><Btn color={accent} onClick={()=>setCSent(true)} style={{width:"100%",padding:"13px"}}>Envoyer</Btn></div>)}
    </div>
  </div>);
}

// ─── CONCEPTEUR ───────────────────────────────────────────────────────────────
function ConcepteurPanel({salons,setSalons,onEnter,onLogout}){
  const [modal,setModal]=useState(null);const [form,setForm]=useState({nom:"",ville:"",email:"",password:"",couleur:PALETTE[0],modules:[]});const [confirm,setConfirm]=useState(null);
  const emptyF=()=>({nom:"",ville:"",email:"",password:"",couleur:PALETTE[0],modules:["dashboard","agenda","clients","portail"]});
  const open=item=>{setForm(item?{...item}:emptyF());setModal({type:item?"edit":"add",item});};
  const toggle=id=>setForm(p=>({...p,modules:p.modules.includes(id)?p.modules.filter(x=>x!==id):[...p.modules,id]}));
  const save=()=>{if(!form.nom)return;modal.type==="add"?setSalons(p=>[...p,{...form,id:uid(),employes:[],clients:[],services:[],produits:[],rdvs:[],factures:[],relances:[],budgetObjectif:3000}]):setSalons(p=>p.map(s=>s.id===modal.item.id?{...s,...form}:s));setModal(null);};
  const del=s=>{setSalons(p=>p.filter(x=>x.id!==s.id));setConfirm(null);};
  return(<div style={{minHeight:"100vh",background:"#060d1a"}}>
    <div style={{background:"#0a1628",borderBottom:"1px solid #1e293b",padding:"18px 40px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{color:"#c084fc",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Mode Concepteur</div><h1 style={{color:"#f1f5f9",fontFamily:"'Playfair Display',serif",fontSize:26}}>BeautyOS — Gestion des salons</h1></div>
      <div style={{display:"flex",gap:10}}><Btn color="#c084fc" onClick={()=>open(null)}>+ Nouveau salon</Btn><Btn ghost onClick={onLogout}>Déconnexion</Btn></div>
    </div>
    <div style={{padding:40,maxWidth:1000,margin:"0 auto"}}><div style={{display:"grid",gap:14}}>{salons.map(s=>(
      <div key={s.id} style={{background:"#0f172a",border:`1px solid ${s.couleur}44`,borderLeft:`4px solid ${s.couleur}`,borderRadius:16,padding:"20px 24px",display:"flex",alignItems:"center",gap:20}}>
        <div style={{width:48,height:48,borderRadius:14,background:s.couleur+"22",display:"flex",alignItems:"center",justifyContent:"center",color:s.couleur,fontSize:20,fontWeight:700,flexShrink:0}}>{s.nom[0]}</div>
        <div style={{flex:1}}><div style={{color:"#f1f5f9",fontSize:17,fontWeight:600,marginBottom:2}}>{s.nom} <span style={{color:"#64748b",fontSize:13,fontWeight:400}}>— {s.ville}</span></div><div style={{color:"#475569",fontSize:12,marginBottom:8}}>🔑 {s.email} · {s.employes.length} emp. · {s.clients.length} clients · {s.rdvs.length} RDV</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{s.modules.map(mid=>{const m=ALL_MODULES.find(x=>x.id===mid);return m?<Badge key={mid} label={m.label} color={s.couleur}/>:null;})}</div></div>
        <div style={{display:"flex",gap:8,flexShrink:0}}><Btn ghost onClick={()=>open(s)}>Configurer</Btn><Btn color={s.couleur} onClick={()=>onEnter(s)}>Ouvrir →</Btn><Btn danger onClick={()=>setConfirm(s)} style={{padding:"8px 12px"}}>✕</Btn></div>
      </div>
    ))}</div></div>
    {modal&&<Modal title={modal.type==="add"?"Nouveau salon":"Configurer"} onClose={()=>setModal(null)} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>{[["nom","Nom du salon","1/-1"],["ville","Ville","auto"],["email","Email connexion","auto"],["password","Mot de passe","auto"]].map(([f,l,gc])=><div key={f} style={{gridColumn:gc}}><label style={lbl}>{l}</label><Inp value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))}/></div>)}</div>
      <label style={{...lbl,marginBottom:10}}>Couleur</label>
      <div style={{display:"flex",gap:12,marginBottom:24}}>{PALETTE.map(c=><div key={c} onClick={()=>setForm(p=>({...p,couleur:c}))} style={{width:34,height:34,borderRadius:"50%",background:c,cursor:"pointer",border:form.couleur===c?"3px solid #fff":"3px solid transparent",boxShadow:form.couleur===c?`0 0 0 2px ${c}`:"none"}}/>)}</div>
      <label style={{...lbl,marginBottom:12}}>Modules activés</label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>{ALL_MODULES.map(m=>{const on=form.modules.includes(m.id);return(<div key={m.id} onClick={()=>toggle(m.id)} style={{background:on?form.couleur+"18":"#1e293b",border:`1px solid ${on?form.couleur:"#334155"}`,borderRadius:10,padding:"11px 14px",cursor:"pointer",display:"flex",gap:12,alignItems:"center"}}><div style={{width:18,height:18,borderRadius:4,background:on?form.couleur:"transparent",border:`2px solid ${on?form.couleur:"#475569"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>{on?"✓":""}</div><span style={{color:on?"#f1f5f9":"#64748b",fontSize:13}}>{m.icon} {m.label}</span></div>);})}</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setModal(null)}>Annuler</Btn><Btn color={form.couleur} onClick={save}>Enregistrer</Btn></div>
    </Modal>}
    {confirm&&<ConfirmModal msg={`Supprimer "${confirm.nom}" ?`} onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)}/>}
  </div>);
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App(){
  const [salons,setSalons]=useState(SEED_SALONS);
  const [session,setSession]=useState(null);
  const [page,setPage]=useState("dashboard");

  const setSalonById=id=>fn=>setSalons(p=>p.map(s=>s.id===id?fn(s):s));
  const logout=()=>{setSession(null);setPage("dashboard");};

  if(!session) return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{background:#060d1a;font-family:'DM Sans',sans-serif;}`}</style><LoginPage onLogin={s=>{setSession(s);setPage("dashboard");}}/></>);
  if(session.role==="concepteur") return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}`}</style><ConcepteurPanel salons={salons} setSalons={setSalons} onLogout={logout} onEnter={s=>{setSession({role:"proprietaire",salonId:s.id,fromConcepteur:true});setPage("dashboard");}}/></>);

  const salon=salons.find(s=>s.id===session.salonId);
  if(!salon) return null;
  const setSalon=setSalonById(salon.id);
  const accent=salon.couleur;
  const sideItems=ALL_MODULES.filter(m=>salon.modules.includes(m.id));
  const safePage=salon.modules.includes(page)?page:salon.modules[0]||"dashboard";

  const content={
    dashboard:<DashboardModule salon={salon} accent={accent}/>,
    agenda:<AgendaModule salon={salon} setSalon={setSalon} accent={accent}/>,
    clients:<ClientsModule salon={salon} setSalon={setSalon} accent={accent}/>,
    employes:<EmployesModule salon={salon} setSalon={setSalon} accent={accent}/>,
    produits:<ProduitsModule salon={salon} setSalon={setSalon} accent={accent}/>,
    facturation:<FacturationModule salon={salon} setSalon={setSalon} accent={accent}/>,
    suivi:<SuiviModule salon={salon} setSalon={setSalon} accent={accent}/>,
    budget:<BudgetModule salon={salon} setSalon={setSalon} accent={accent}/>,
    acces:<AccesModule salon={salon} setSalon={setSalon} accent={accent}/>,
    portail:<PortailModule salon={salon} setSalon={setSalon} accent={accent}/>,
  };

  return(<>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px;}`}</style>
    <div style={{display:"flex",height:"100vh",background:"#060d1a",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:230,background:"#0a1628",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"20px 18px 14px"}}>
          <div style={{color:accent,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>BeautyOS ✦</div>
          <div style={{color:"#f1f5f9",fontSize:17,fontFamily:"'Playfair Display',serif",fontWeight:700,marginBottom:4}}>{salon.nom}</div>
          <div style={{color:"#64748b",fontSize:12}}>{salon.ville}</div>
        </div>
        <nav style={{flex:1,padding:"6px 10px",overflowY:"auto"}}>
          {sideItems.map(n=>{const active=safePage===n.id;return(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:11,width:"100%",background:active?"#1e293b":"none",border:"none",borderRadius:10,padding:"10px 12px",cursor:"pointer",color:active?"#f1f5f9":"#64748b",fontSize:13,fontFamily:"'DM Sans',sans-serif",textAlign:"left",borderLeft:active?`3px solid ${accent}`:"3px solid transparent",marginBottom:2}}>
              <span style={{color:active?accent:"#334155",fontSize:15}}>{n.icon}</span>{n.label}
            </button>
          );})}
        </nav>
        <div style={{padding:"10px 14px",borderTop:"1px solid #1e293b",display:"flex",flexDirection:"column",gap:8}}>
          {session.fromConcepteur&&<Btn ghost onClick={()=>setSession({role:"concepteur"})} style={{fontSize:12,padding:"7px"}}>⚙ Retour Concepteur</Btn>}
          <Btn ghost onClick={logout} style={{fontSize:12,padding:"7px"}}>← Déconnexion</Btn>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {safePage==="portail"?content["portail"]:<div style={{padding:"34px 38px"}}>{content[safePage]}</div>}
      </div>
    </div>
  </>);
}
