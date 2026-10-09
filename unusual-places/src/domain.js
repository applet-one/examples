export const cityCenters = {
 Bonn:{lat:50.7374,lng:7.0982}, Cologne:{lat:50.9375,lng:6.9603}, Düsseldorf:{lat:51.2277,lng:6.7735}, Essen:{lat:51.4556,lng:7.0116}, Berlin:{lat:52.52,lng:13.405}, Hamburg:{lat:53.5511,lng:9.9937}, Munich:{lat:48.1351,lng:11.582}, All:{lat:51.1,lng:10.4}
};
export function distance(a,b){const r=Math.PI/180;const dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r;const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function normalizeFilters(input={}){
 let city=String(input.city||'Bonn'); if(city==='All Germany') city='All'; if(!cityCenters[city])city='Bonn';
 let radius=input.radius==='all'?'all':Number(input.radius??100);if(radius!=='all'&&(!Number.isFinite(radius)||radius<1||radius>1500))radius=100;
 return {city,radius,category:['architecture','nature','museums','industrial'].includes(input.category)?input.category:'all',outdoor:input.outdoor===true||input.outdoor==='true',q:String(input.q||'').slice(0,150)};
}
export function searchPlaces(places,input={}){
 const filters=normalizeFilters(input),center=cityCenters[filters.city];const q=filters.q.toLowerCase();
 const results=places.map(p=>({...p,distanceKm:Math.round(distance(center,p)*10)/10})).filter(p=>(filters.city==='All'||filters.radius==='all'||p.distanceKm<=filters.radius)&&(filters.category==='all'||p.category===filters.category)&&(!filters.outdoor||p.outdoor)&&(!q||`${p.name} ${p.city} ${p.region} ${p.category} ${p.description}`.toLowerCase().includes(q))).sort((a,b)=>a.distanceKm-b.distanceKm);
 return {places:results,center,filters,total:results.length};
}
export function itinerary(places,ids){
 const ordered=ids.map(id=>places.find(p=>p.id===id)).filter(Boolean);const legs=ordered.slice(1).map((p,i)=>({from:ordered[i].id,to:p.id,distanceKm:Math.round(distance(ordered[i],p)*10)/10}));
 return {places:ordered,legs,totalVisitMinutes:ordered.reduce((s,p)=>s+p.durationMinutes,0),totalDistanceKm:Math.round(legs.reduce((s,l)=>s+l.distanceKm,0)*10)/10,note:'Distances are straight-line estimates, not driving routes. Check opening hours and transport before travelling.'};
}
export function interpretChat(message,previous,selectedIds,places){
 const text=String(message).slice(0,2000).toLowerCase();const filters=normalizeFilters(previous);let recognized=false;
 const aliases={bonn:'Bonn',cologne:'Cologne','köln':'Cologne',düsseldorf:'Düsseldorf',dusseldorf:'Düsseldorf',essen:'Essen',berlin:'Berlin',hamburg:'Hamburg',munich:'Munich',münchen:'Munich'};
 for(const [word,city]of Object.entries(aliases))if(text.includes(word)){filters.city=city;recognized=true;break;}
 if(/all germany|across germany|anywhere|whole of germany/.test(text)){filters.city='All';filters.radius='all';recognized=true;}
 const km=text.match(/(\d{1,4})\s*(?:km|kilomet)/);if(km){filters.radius=Math.min(1500,Math.max(1,Number(km[1])));recognized=true;}
 if(/outdoor|outside|open.air|draußen/.test(text)){filters.outdoor=true;recognized=true;}
 if(/indoor/.test(text)){filters.outdoor=false;recognized=true;}
 const categories={museums:/museum|museums/,industrial:/industrial|factory|factories|steel|mine|mining/,nature:/nature|forest|cave|hiking|natural/,architecture:/architecture|building|castle|sculpture/};
 for(const [category,regex]of Object.entries(categories))if(regex.test(text)){filters.category=category;recognized=true;break;}
 if(/all categories|any category|everything|all places|reset/.test(text)){filters.category='all';filters.outdoor=false;recognized=true;}
 if(/trip|itinerary|plan|lunch/.test(text)&&selectedIds.length){const plan=itinerary(places,selectedIds);const names=plan.places.map(p=>p.name).join(' → ');return{reply:`Your day trip is ready: ${names}. Allow about ${Math.round(plan.totalVisitMinutes/60*10)/10} hours at the stops, plus travel. For lunch, look for a café or restaurant near ${plan.places[Math.floor(plan.places.length/2)].city}; check current opening hours and dietary options. This is a suggested sequence, not a road-optimised route.`,trip:plan.places.map(p=>p.id),filters};}
 if(/trip|itinerary|plan|lunch/.test(text)&&!selectedIds.length)return{reply:'Bookmark a few places first, then ask me to plan a day trip with your shortlist. I’ll put them into the Day trip view.',filters};
 if(recognized){const result=searchPlaces(places,filters);return{reply:`Found ${result.total} ${filters.outdoor?'outdoor ':''}${filters.category==='all'?'unusual places':filters.category==='nature'?'nature spots':filters.category==='industrial'?'industrial places':filters.category==='architecture'?'architectural curiosities':'museums'} ${filters.city==='All'?'across Germany':`near ${filters.city}`}${filters.city!=='All'&&filters.radius!=='all'?` within ${filters.radius} km (straight line)`:''}. The map and cards are updated.${/weekend|tomorrow|today/.test(text)?' This curated demo does not check live opening hours; please check each official website before going.':''}`,filters};}
 return{reply:'I’m a lightweight demo guide, not a general-purpose AI. Try “Outdoor places within 100 km of Bonn”, “Museums near Cologne”, “Show all Germany”, or select places and ask “Plan a day trip with lunch”. For open-ended reasoning, use the MCP app in ChatGPT.'};
}
