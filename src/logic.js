// Data and rules for the noticeboard.

export const STORE='acl-foundboard-v3';
// Fictional campus locations for this standalone teaching demo.
// A found report can exist before the item has been received by staff.
export const seed=[
 {id:'f1',title:'Black backpack',category:'accessories',status:'lost',location:'Library - second floor',description:'Black backpack with a small red keychain. Left near the study desks.',owner:'you',created:'Oct 23',emoji:'🎒'},
 {id:'f2',title:'Dark backpack',category:'accessories',status:'found',location:'Library - main stairwell',description:'Found a dark backpack with a small red keychain near the library stairs.',owner:'other',created:'Oct 24',emoji:'🎒',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f3',title:'Student ID card',category:'documents',status:'found',location:'Near Gate 3',description:'A student card was turned in. No personal details are published.',owner:'other',created:'Oct 24',emoji:'🪪',collectionPoint:'Student Services Office',handoverStatus:'received'},
 {id:'f4',title:'Wireless earbuds',category:'electronics',status:'lost',location:'Main cafeteria',description:'White earbuds in a distinctive blue case. Lost on Monday.',owner:'other',created:'Oct 24',emoji:'🎧'},
 {id:'f5',title:'Earbuds in blue case',category:'electronics',status:'found',location:'Cafeteria entrance',description:'White earbuds in a blue charging case found near the coffee counter.',owner:'other',created:'Oct 25',emoji:'🎧',collectionPoint:'',handoverStatus:'reported'},
 {id:'f6',title:'Blue sports bottle',category:'other',status:'lost',location:'Sports Hall - lockers',description:'Tall blue metal water bottle, possibly left after practice.',owner:'other',created:'Oct 25',emoji:'🥤'},
 {id:'f7',title:'Metal water bottle',category:'other',status:'found',location:'Sports Hall - benches',description:'Blue reusable metal bottle found after a basketball session.',owner:'other',created:'Oct 25',emoji:'🥤',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f8',title:'Engineering lab coat',category:'clothing',status:'claimed',location:'Building C',description:'Owner verified the item and collected it from the reception desk.',owner:'you',created:'Oct 22',emoji:'🥼',collectionPoint:'Library Reception',handoverStatus:'released'},
 {id:'f9',title:'Small notebook',category:'other',status:'lost',location:'C7 lecture room',description:'Brown cover with handwritten engineering notes.',owner:'other',created:'Oct 25',emoji:'📒'},
 {id:'f10',title:'Scientific calculator',category:'electronics',status:'lost',location:'B2 lecture hall',description:'Black scientific calculator with a protective cover.',owner:'other',created:'Oct 26',emoji:'🧮'},
 {id:'f11',title:'Calculator',category:'electronics',status:'found',location:'B2 study area',description:'Scientific calculator with a black cover, found on a desk.',owner:'you',created:'Oct 26',emoji:'🧮',collectionPoint:'Library Reception',handoverStatus:'received'},
 {id:'f12',title:'Canvas tote bag',category:'accessories',status:'lost',location:'Main campus bus stop',description:'Beige tote with green writing on one side.',owner:'other',created:'Oct 26',emoji:'👜'},
 {id:'f13',title:'USB flash drive',category:'electronics',status:'found',location:'Building A computer lab',description:'A small black flash drive was found beside a workstation.',owner:'other',created:'Oct 27',emoji:'💾',collectionPoint:'',handoverStatus:'reported'},
];
export const categories=['all','electronics','clothing','documents','accessories','other'];
export const statuses=['lost','found','claimed'];
export const collectionPoints=['Campus Security Desk','Student Services Office','Library Reception'];
export const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

/* ---------- Validation ---------- */

// Returns one message per invalid field, so the form can show each error beside its own input.
// `duplicate` holds the existing report when the title and location are already taken.
export function validate(f,arr,id){
 const errors={};
 const title=f.title.trim();
 if(title.length<2)errors.title='Title must be at least 2 characters.';
 if(!categories.slice(1).includes(f.category))errors.category='Choose a category.';
 if(!statuses.includes(f.status))errors.status='Choose lost, found or claimed.';
 const location=(f.location||'').trim().toLowerCase();
 const duplicate=title.length>=2&&arr.find(r=>r.id!==id&&r.title.trim().toLowerCase()===title.toLowerCase()&&(r.location||'').trim().toLowerCase()===location);
 if(duplicate){
  errors.title='An item with the same title has already been reported at this location.';
  errors.duplicate=duplicate;
 }
 return errors;
}

/* ---------- Search ---------- */

const STOP=new Set(['a','an','and','at','by','for','from','in','it','its','my','near','of','on','one','or','some','the','to','was','were','with','lost','found','left','possibly','after','item','beside']);
// "bottles" and "bottle" should behave the same.
const stem=w=>w.length>3&&w.endsWith('s')&&!w.endsWith('ss')?w.slice(0,-1):w;
const words=text=>(text||'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];

// Every word must appear, in any order. Partial words still match, so typing "back" finds "backpack".
// 'exact'   = all the words appear somewhere in the report
// 'similar' = some words appear, and at least one of them is in the title
//             ("black backpack" also surfaces the found "Dark backpack")
export function searchMatch(item,query){
 const terms=words(query);
 if(!terms.length)return 'exact';
 const useful=terms.filter(t=>!STOP.has(t));
 const wanted=(useful.length?useful:terms).map(stem);
 const hay=`${item.title} ${item.location||''} ${item.description||''} ${item.category}`.toLowerCase();
 const title=item.title.toLowerCase();
 if(wanted.every(t=>hay.includes(t)))return 'exact';
 return wanted.some(t=>title.includes(t))?'similar':null;
}

// Applies every filter, and puts exact search results ahead of similar ones.
export function filterReports(items,{q='',cat='all',status='all',mine=false}={}){
 const rows=[];
 for(const item of items){
  if(cat!=='all'&&item.category!==cat)continue;
  if(status!=='all'&&item.status!==status)continue;
  if(mine&&item.owner!=='you')continue;
  const match=searchMatch(item,q);
  if(match)rows.push({...item,match});
 }
 return [...rows.filter(r=>r.match==='exact'),...rows.filter(r=>r.match==='similar')];
}

/* ---------- Possible matches between lost and found reports ---------- */

const keywords=text=>new Set(words(text).filter(w=>w.length>1&&!STOP.has(w)).map(stem));

// Finds opposite-status reports in the same category that share enough words.
// A shared word counts double only when it is in both titles, so one colour word cannot create a match on its own
// ("Green umbrella" must not match a tote bag "with green writing"). Claimed items are resolved, so they never match.
export function possibleMatches(item,items){
 const opposite=item.status==='lost'?'found':item.status==='found'?'lost':null;
 if(!opposite)return [];
 const mineTitle=keywords(item.title);
 const mine=keywords(`${item.title} ${item.location||''} ${item.description||''}`);
 return items
  .filter(o=>o.id!==item.id&&o.status===opposite&&o.category===item.category)
  .map(o=>{
   const otherTitle=keywords(o.title);
   const other=keywords(`${o.title} ${o.location||''} ${o.description||''}`);
   let score=0;
   for(const w of mine)if(other.has(w))score+=mineTitle.has(w)&&otherTitle.has(w)?2:1;
   return {report:o,score};
  })
  .filter(x=>x.score>=2)
  .sort((a,b)=>b.score-a.score)
  .map(x=>x.report);
}

/* ---------- Handover state ---------- */

// The one place that decides what a notice may claim about who holds the item.
// Staff custody is only stated when a collection point has recorded the item as received.
export function custody(item){
 if(item.status==='lost')return null;
 if(item.status==='claimed'){
  if(item.handoverStatus==='released')return {kind:'returned',label:'Collected by owner',detail:item.collectionPoint?`Ownership verified; collected from ${item.collectionPoint}.`:'Ownership verified and item collected.'};
  return {kind:'claimed',label:'Marked as claimed',detail:'Marked by the person who posted it. No staff handover is recorded.'};
 }
 if(item.handoverStatus==='received'&&item.collectionPoint)return {kind:'held',label:`Received at ${item.collectionPoint}`,detail:'If this is yours, go there. Staff verify ownership before handing it over.'};
 return {kind:'unconfirmed',label:'Not confirmed at a collection point',detail:'Reported by the finder only. Staff may not have this item yet, so check back for an update.'};
}
