import React,{useEffect,useMemo,useRef,useState} from 'react';
import {STORE,seed,categories,statuses,collectionPoints,cap,validate,filterReports,possibleMatches,custody} from './logic.js';

const clean={title:'',category:'',status:'',location:'',description:''};
const noFilters={q:'',cat:'all',status:'all',mine:false};
const COLUMNS=[
 {key:'lost',title:'LOST',sub:'Searching for these things',icon:'↗'},
 {key:'found',title:'FOUND',sub:'Looking for the owners',icon:'⌁'},
 {key:'claimed',title:'CLAIMED',sub:'Back where they belong',icon:'✓'},
];
const LOCATION_LABEL={lost:'Where did you last have it?',found:'Where did you find it?'};
const DETAILS_HINT={
 lost:'Mention anything distinctive: colour, marks, stickers, what was inside.',
 found:'Describe it in general terms. Leave out names, ID numbers and one identifying detail, so staff can use it to verify the owner.',
};

function getSaved(){try{const s=JSON.parse(localStorage.getItem(STORE));return Array.isArray(s)?s:seed;}catch{return seed;}}

function Card({item,matchCount,onEdit,onMatches}){
 const hand=custody(item);
 return <article className="sticky">
  <div className="sticky-top">
   <span>{item.category}</span>
   {item.owner==='you'&&<span className="tag-mine">Your report</span>}
  </div>
  <div className="sticky-title"><span className="sticky-emoji" aria-hidden="true">{item.emoji}</span><h3>{item.title}</h3></div>
  {item.match==='similar'&&<p className="tag-similar">Similar title: not every search word matched</p>}
  <p className="sticky-desc">{item.description||'No additional description.'}</p>
  {hand&&<div className={'handover '+hand.kind}><strong>{hand.label}</strong><span>{hand.detail}</span></div>}
  <div className="sticky-bottom"><span><span aria-hidden="true">⌖ </span>{item.location||'Location not provided'}</span><small>{item.created}</small></div>
  {(item.owner==='you'||matchCount>0)&&<div className="sticky-actions">
   {matchCount>0&&<button className="link-action" onClick={()=>onMatches(item.id)}>See {matchCount} possible {matchCount===1?'match':'matches'}</button>}
   {item.owner==='you'&&<button className="edit-action" onClick={()=>onEdit(item)} aria-label={`Edit your report: ${item.title}`}>Edit</button>}
  </div>}
 </article>;
}

function Field({id,label,required,hint,error,extra,children}){
 return <div className={'field'+(error?' invalid':'')}>
  <label htmlFor={id}>{label}{required?<b aria-hidden="true"> *</b>:<span className="optional"> (optional)</span>}</label>
  {children}
  {hint&&<small id={`${id}-hint`} className="hint">{hint}</small>}
  {error&&<p id={`${id}-error`} className="field-error">{error}</p>}
  {extra}
 </div>;
}

export default function App(){
 const [items,setItems]=useState(getSaved);
 const [page,setPage]=useState('board');
 const [filters,setFilters]=useState(noFilters);
 const [current,setCurrent]=useState(null);
 const [form,setForm]=useState(clean);
 const [attempted,setAttempted]=useState(false);
 const [message,setMessage]=useState(null); // {text, matchFor?}
 const [matchFor,setMatchFor]=useState(null);
 const matchHeading=useRef(null);
 useEffect(()=>localStorage.setItem(STORE,JSON.stringify(items)),[items]);
 useEffect(()=>{if(matchFor&&matchHeading.current){matchHeading.current.focus();}},[matchFor]);

 const filtered=useMemo(()=>filterReports(items,filters),[items,filters]);
 const matchMap=useMemo(()=>new Map(items.map(x=>[x.id,possibleMatches(x,items)])),[items]);
 const matchItem=matchFor&&items.find(x=>x.id===matchFor);
 const setFilter=patch=>setFilters(f=>({...f,...patch}));
 const active=filters.q.trim()||filters.cat!=='all'||filters.status!=='all'||filters.mine;
 const similarCount=filtered.filter(r=>r.match==='similar').length;

 // Errors appear after the first submit attempt, then update live as each field is corrected.
 const errors=attempted?validate(form,items,current):{};
 const errorFields=['status','title','category'].filter(k=>errors[k]);
 const describedBy=(id,hasHint)=>[hasHint&&`${id}-hint`,errors[id]&&`${id}-error`].filter(Boolean).join(' ')||undefined;

 function openForm(next,id){setCurrent(id);setForm(next);setAttempted(false);setMessage(null);setMatchFor(null);setPage('form');}
 function create(){openForm({...clean},null);}
 function edit(row){if(row.owner!=='you')return;openForm({title:row.title,category:row.category,status:row.status,location:row.location||'',description:row.description||''},row.id);}
 function showBoard(patch){if(patch)setFilter(patch);setMatchFor(null);setPage('board');}
 function submit(e){
  e.preventDefault();
  const found=validate(form,items,current);
  const invalid=['status','title','category'].filter(k=>found[k]);
  if(invalid.length){
   setAttempted(true);
   // Move focus to the first problem, so the error is seen and read by screen readers.
   document.getElementById(invalid[0])?.focus();
   return;
  }
  const d={...form,title:form.title.trim(),location:form.location.trim(),description:form.description.trim()};
  let saved;
  if(current){
   saved={...items.find(x=>x.id===current),...d};
   setItems(items.map(x=>x.id===current?saved:x));
   setMessage({text:'Report updated.'});
  }else{
   saved={id:`f-${Date.now()}`,...d,owner:'you',created:'Today',emoji:'📌',collectionPoint:'',handoverStatus:'reported'};
   const next=[saved,...items];
   setItems(next);
   const count=possibleMatches(saved,next).length;
   if(saved.status==='found')setMessage({text:`Your report has been posted. Please hand the item to a collection point (${collectionPoints.join(', ')}). The notice shows "Not confirmed" until staff record it.`,matchFor:count?saved.id:null,count});
   else setMessage({text:'Your report has been posted.',matchFor:count?saved.id:null,count});
  }
  // Clear the filters so the report just saved is visible on the board.
  setFilters(noFilters);setMatchFor(null);setPage('board');setCurrent(null);setAttempted(false);
 }
 function reset(){setItems(seed);setPage('board');setFilters(noFilters);setMatchFor(null);setMessage({text:'Example reports restored.'});}
 function viewDuplicate(row){setFilters({...noFilters,q:row.title});setMatchFor(null);setCurrent(null);setPage('board');}

 const navCurrent=s=>page==='board'&&filters.status===s&&!filters.mine?'page':undefined;
 const summary=[
  filters.q.trim()&&`"${filters.q.trim()}"`,
  filters.cat!=='all'&&cap(filters.cat),
  filters.status!=='all'&&cap(filters.status),
  filters.mine&&'My reports',
 ].filter(Boolean).join(' · ');

 return <div className="notice-app">
  <header className="header">
   <div className="headline"><span className="sun" aria-hidden="true">✺</span><button onClick={()=>showBoard({status:'all',mine:false})} className="wordmark">FOUND<span>on campus</span></button><p>Community noticeboard</p></div>
   <nav className="header-links" aria-label="Report views">
    <button aria-current={navCurrent('all')} onClick={()=>showBoard({status:'all',mine:false})}>Noticeboard</button>
    <button aria-current={navCurrent('lost')} onClick={()=>showBoard({status:'lost',mine:false})}>Missing items</button>
    <button aria-current={navCurrent('found')} onClick={()=>showBoard({status:'found',mine:false})}>Recently found</button>
    <button aria-current={page==='board'&&filters.mine?'page':undefined} onClick={()=>showBoard({status:'all',mine:true})}>My reports</button>
   </nav>
   <button className="report-button" onClick={create}>+ Post a report</button>
  </header>
  <div className="ruleline"><span>SEARCH • DISCOVER • REUNITE</span><span>Helping lost things find their way back.</span></div>

  {page==='board'?<main className="workspace">
   <aside className="filters">
    <p className="kicker">YOUR NOTICEBOARD</p>
    <h1>Lost something?<br/><em>You're in the right place.</em></h1>
    <p className="intro">Search what the campus community has shared. Found items at a collection point can be recovered once staff verify ownership.</p>
    <div className="filterbox">
     <h2>Browse reports</h2>
     <label>Search items<input type="search" value={filters.q} onChange={e=>setFilter({q:e.target.value})} placeholder="e.g., blue bottle"/></label>
     <label>Item category<select value={filters.cat} onChange={e=>setFilter({cat:e.target.value})}><option value="all">All categories</option>{categories.slice(1).map(c=><option key={c} value={c}>{cap(c)}</option>)}</select></label>
     <label>Report status<select value={filters.status} onChange={e=>setFilter({status:e.target.value})}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select></label>
     <label className="check"><input type="checkbox" checked={filters.mine} onChange={e=>setFilter({mine:e.target.checked})}/>Only my reports</label>
     <div className="filterbuttons"><button disabled={!active} onClick={()=>setFilters(noFilters)}>Clear filters</button></div>
    </div>
    <div className="side-message"><span aria-hidden="true">📍</span><strong>Lost or found something?</strong><p>Every report gets us a little closer.</p><button onClick={create}>Share your report →</button></div>
    <button className="reset" onClick={reset}>Reset demo data</button>
   </aside>

   <section className="board">
    <div className="board-top"><div><p className="kicker">CAMPUS COMMUNITY</p><h2>Latest notices</h2></div></div>
    <p className="result-count" role="status">
     Showing <strong>{filtered.length}</strong> of {items.length} reports{summary&&<> for {summary}</>}{similarCount>0&&<> ({filtered.length-similarCount} exact, {similarCount} similar)</>}
    </p>
    {message&&<div className="message" role="status">
     <span>{message.text}</span>
     <span className="message-actions">
      {message.matchFor&&<button className="link-action" onClick={()=>{setMatchFor(message.matchFor);}}>See {message.count} possible {message.count===1?'match':'matches'}</button>}
      <button className="dismiss" aria-label="Dismiss message" onClick={()=>setMessage(null)}>✕</button>
     </span>
    </div>}

    {matchItem&&<section className="match-panel" aria-labelledby="match-heading">
     <div className="match-head">
      <div>
       <p className="kicker">POSSIBLE MATCHES</p>
       <h2 id="match-heading" ref={matchHeading} tabIndex={-1}>Could one of these be “{matchItem.title}”?</h2>
       <p>{matchItem.status==='lost'?'Found reports':'Lost reports'} in the same category with similar details. These are suggestions only: staff confirm ownership at the collection point.</p>
      </div>
      <button className="plain-button" onClick={()=>setMatchFor(null)}>Close</button>
     </div>
     <div className="match-grid">{(matchMap.get(matchItem.id)||[]).map(r=><Card key={r.id} item={r} matchCount={0} onEdit={edit} onMatches={setMatchFor}/>)}</div>
     {!(matchMap.get(matchItem.id)||[]).length&&<p className="empty-column">No possible matches right now.</p>}
    </section>}

    {filtered.length===0?<div className="empty-board">
     <h3>No reports match{summary?<> {summary}</>:''}</h3>
     <p>Try fewer or different words, or clear the filters. If your item is not listed, post a report so that a finder can spot it.</p>
     <div className="empty-actions"><button className="plain-button" onClick={()=>setFilters(noFilters)}>Clear filters</button><button className="report-button" onClick={create}>+ Post a report</button></div>
    </div>:<div className="board-grid">{COLUMNS.filter(col=>filters.status==='all'||filters.status===col.key).map(col=>{
     const rows=filtered.filter(r=>r.status===col.key);
     return <div className="board-column" key={col.key}>
      <div className="column-head"><span className={'col-icon '+col.key} aria-hidden="true">{col.icon}</span><div><strong>{col.title}</strong><small>{col.sub}</small></div><span className="col-count">{rows.length}</span></div>
      <div className="sticky-list">{rows.map(item=><Card key={item.id} item={item} matchCount={(matchMap.get(item.id)||[]).length} onEdit={edit} onMatches={setMatchFor}/>)}{rows.length===0&&<div className="empty-column">Nothing here yet</div>}</div>
     </div>;
    })}</div>}
   </section>
  </main>:<main className="report-page">
   <div className="crumbs"><button onClick={()=>showBoard()}>← Noticeboard</button><span>/</span><span>{current?'Edit your report':'Report an item'}</span></div>
   <div className="report-layout">
    <div className="report-intro">
     <span className="seal" aria-hidden="true">✺</span>
     <p className="kicker">HELP THE COMMUNITY</p>
     <h1>{current?'Update your report':'Tell us what happened.'}</h1>
     <p>Small details can help someone recognize their belongings.</p>
     <div className="paper-note">Your report will appear on the public campus noticeboard with the details you provide.</div>
    </div>
    <section className="form-paper">
     <header><p>{current?'YOUR NOTICE':'NEW NOTICE'}</p><h2>{current?'Edit report':'Report an item'}</h2><small className="hint">Fields marked * are required.</small></header>
     <form onSubmit={submit} noValidate>
      <Field id="status" label="Status" required error={errors.status}>
       <select id="status" value={form.status} aria-invalid={!!errors.status} aria-describedby={describedBy('status')} aria-required="true" onChange={e=>setForm(s=>({...s,status:e.target.value}))}><option value="">Choose one</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select>
      </Field>
      {form.status==='found'&&custody({...items.find(x=>x.id===current),status:'found'}).kind==='unconfirmed'&&<div className="handover-guide">
       <strong>Found an item? Hand it to a collection point:</strong>
       <ul>{collectionPoints.map(p=><li key={p}>{p}</li>)}</ul>
       <span>Your notice will say “Not confirmed at a collection point” until staff record that they have received it.</span>
      </div>}
      <Field id="title" label="Item title" required error={errors.title} extra={errors.duplicate&&<div className="duplicate"><span>Already posted: <strong>{errors.duplicate.title}</strong> at {errors.duplicate.location||'no stated location'} ({errors.duplicate.status}, {errors.duplicate.owner==='you'?'your report':'by another student'}). Change the title or location if this is a different item.</span><button type="button" className="link-action" onClick={()=>viewDuplicate(errors.duplicate)}>View the existing report</button></div>}>
       <input id="title" value={form.title} aria-invalid={!!errors.title} aria-describedby={describedBy('title')} aria-required="true" onChange={e=>setForm(s=>({...s,title:e.target.value}))} placeholder="e.g., Black backpack"/>
      </Field>
      <Field id="category" label="Category" required error={errors.category}>
       <select id="category" value={form.category} aria-invalid={!!errors.category} aria-describedby={describedBy('category')} aria-required="true" onChange={e=>setForm(s=>({...s,category:e.target.value}))}><option value="">Select item category</option>{categories.slice(1).map(s=><option key={s} value={s}>{cap(s)}</option>)}</select>
      </Field>
      <Field id="location" label={LOCATION_LABEL[form.status]||'Location'}>
       <input id="location" value={form.location} onChange={e=>setForm(s=>({...s,location:e.target.value}))} placeholder="e.g., Library - second floor"/>
      </Field>
      <Field id="description" label="Description" hint={DETAILS_HINT[form.status]}>
       <textarea id="description" rows="5" value={form.description} aria-describedby={describedBy('description',!!DETAILS_HINT[form.status])} onChange={e=>setForm(s=>({...s,description:e.target.value}))} placeholder="Describe the item"/>
      </Field>
      {errorFields.length>0&&<div className="form-error" role="alert">Not posted yet. {errorFields.length===1?'1 field needs':`${errorFields.length} fields need`} attention: {errorFields.map(cap).join(', ')}.</div>}
      <div className="form-actions"><button type="button" onClick={()=>showBoard()}>Cancel</button><button className="report-button" type="submit">{current?'Save changes':'Post report'}</button></div>
     </form>
    </section>
   </div>
  </main>}
  <footer className="pagefooter"><span>FOUND / Campus noticeboard</span><span>Community project • Demo only</span></footer>
 </div>;
}
