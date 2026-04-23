import { db, auth } from './firebase.js';
import { collection, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

var providers=[
  {id:1,name:"Ravi Kumar",role:"Expert Plumber",icon:"🔧",rating:4.9,dist:"1.2 km",price:"₹299",reviews:128,init:"RK",color:"linear-gradient(135deg,#6366F1,#8B5CF6)",cat:"Plumber"},
  {id:2,name:"Arjun Singh",role:"Certified Electrician",icon:"⚡",rating:4.8,dist:"0.8 km",price:"₹349",reviews:94,init:"AS",color:"linear-gradient(135deg,#06B6D4,#0284C7)",cat:"Electrician"},
  {id:3,name:"Meena Raj",role:"Deep Clean Specialist",icon:"🧹",rating:4.7,dist:"2.1 km",price:"₹499",reviews:211,init:"MR",color:"linear-gradient(135deg,#F59E0B,#F97316)",cat:"Cleaner"},
  {id:4,name:"Suresh Patel",role:"AC & Appliance Repair",icon:"❄️",rating:4.9,dist:"1.5 km",price:"₹449",reviews:76,init:"SP",color:"linear-gradient(135deg,#10B981,#059669)",cat:"AC Repair"},
  {id:5,name:"Priya Nair",role:"Interior Painter",icon:"🎨",rating:4.6,dist:"3.0 km",price:"₹799",reviews:55,init:"PN",color:"linear-gradient(135deg,#EC4899,#A855F7)",cat:"Painter"},
  {id:6,name:"Kiran Auto",role:"Certified Mechanic",icon:"🚗",rating:4.8,dist:"1.9 km",price:"₹599",reviews:143,init:"KA",color:"linear-gradient(135deg,#EF4444,#F97316)",cat:"Mechanic"},
];

var tlSteps=["Requested","Accepted","In Progress","Completed"];
var tlActive=2;
var tlIcons=['📤','✅','🔨','🎉'];
var bookingRealtimeTimer=null;
var bookingEta=18;
var bookingFeedMessages=[
  "Provider accepted your request.",
  "Provider started traveling to your location.",
  "Traffic update received, ETA adjusted.",
  "Provider is 1.2 km away.",
  "Provider has started work.",
  "Service completed successfully."
];
var currentUser=null;
var liveClockTimer=null;
var livePulseTimer=null;
var mapRealtimeTimer=null;
var providerRealtime={};
var providerDashTimer=null;
var providerOtherTimer=null;
var currentProviderTab='dashboard';
var providerStats={total:247,month:32,earnings:48,rating:4.9,online:18,response:6};
var providerRequests=[
  {cust:"Deepa Sharma",svc:"Plumbing fix",time:"Today 4 PM",status:"New"},
  {cust:"Arun Mehta",svc:"Pipe leak repair",time:"Tomorrow 10 AM",status:"New"},
  {cust:"Sonia G.",svc:"Drainage issue",time:"Apr 25, 2 PM",status:"New"},
  {cust:"Prakash V.",svc:"Water heater",time:"Apr 26, 11 AM",status:"Pending"}
];
var providerFeedMessages=[
  "New booking request received.",
  "Customer accepted revised quote.",
  "Provider marked service as on the way.",
  "Rating updated after completed booking.",
  "Auto-assign matched a nearby job."
];
var liveMessages=[
  "New plumbing request in your area",
  "Provider accepted a service request",
  "Price update published for AC Repair",
  "Booking status changed to In Progress",
  "Nearby electrician is available now",
  "Customer left a 5-star review"
];

function renderProviders(list,containerId){
  var c=document.getElementById(containerId);
  c.innerHTML=list.map(function(p){
    return '<div class="pcard" onclick="openDetail('+p.id+')">'
      +'<div class="pcard-img"><div style="width:56px;height:56px;border-radius:50%;background:'+p.color+';display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">'+p.init+'</div></div>'
      +'<div class="pcard-body">'
      +'<div class="pcard-name">'+p.name+'</div>'
      +'<div style="color:var(--text3);font-size:12px;margin-bottom:6px">'+p.role+'</div>'
      +'<div class="pcard-meta"><span><span class="star">★</span> '+p.rating+'</span><span>'+p.dist+'</span><span>'+p.reviews+' reviews</span></div>'
      +'<div class="pcard-footer"><span class="price">'+p.price+'/hr</span><button class="btn-sm" onclick="event.stopPropagation();openDetail('+p.id+')">Book Now</button></div>'
      +'</div></div>';
  }).join('');
  setTimeout(initTilt, 50);
}

function openDetail(id){
  var p=providers.find(function(x){return x.id===id});
  if(!p)return;
  document.getElementById('detail-banner').textContent=p.icon;
  document.getElementById('detail-avatar').textContent=p.init;
  document.getElementById('detail-avatar').style.background=p.color;
  document.getElementById('detail-name').textContent=p.name;
  document.getElementById('detail-role').textContent=p.role;
  var svcs=['Basic Service — ₹299/hr','Emergency Call — ₹599','Annual Contract — ₹2499','Consultation — ₹99'];
  document.getElementById('detail-services').innerHTML=svcs.map(function(s){
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--primary)">✓</span>'+s+'</div>';
  }).join('');
  var revs=[{n:"Anita K.",t:"Excellent work, very professional!",r:"★★★★★"},{n:"Vijay M.",t:"Came on time, fixed the issue quickly.",r:"★★★★★"},{n:"Lakshmi R.",t:"Great service, affordable pricing.",r:"★★★★☆"}];
  document.getElementById('detail-reviews').innerHTML=revs.map(function(r){
    return '<div class="review"><div class="review-head"><span class="review-name">'+r.n+'</span><span style="color:#F59E0B;font-size:12px">'+r.r+'</span></div><p class="review-text">'+r.t+'</p></div>';
  }).join('');
  var slots=['9:00 AM','10:00 AM','11:00 AM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];
  document.getElementById('time-slots').innerHTML=slots.map(function(s,i){
    return '<div class="slot'+(i===2?' sel':'')+'" onclick="selSlot(this)">'+s+'</div>';
  }).join('');
  var d=new Date();d.setDate(d.getDate()+1);
  document.getElementById('book-date').value=d.toISOString().split('T')[0];
  show('detail');
}

function selSlot(el){
  document.querySelectorAll('.slot').forEach(function(s){s.classList.remove('sel')});
  el.classList.add('sel');
}

function renderTimeline(){
  var c=document.getElementById('timeline');
  if(!c)return;
  var html='';
  for(var i=0;i<tlSteps.length;i++){
    var cls=i<tlActive?'done':i===tlActive?'active':'';
    var ico=i<tlActive?'✓':tlIcons[i];
    html+='<div class="tl-step"><div class="tl-dot '+cls+'">'+ico+'</div><div class="tl-label">'+tlSteps[i]+'</div></div>';
    if(i<tlSteps.length-1)html+='<div class="tl-line '+(i<tlActive?'done':'')+'"></div>';
  }
  c.innerHTML=html;
}

function pushBookingFeed(msg){
  var list=document.getElementById('booking-feed');
  if(!list)return;
  var li=document.createElement('li');
  li.textContent=new Date().toLocaleTimeString()+' - '+msg;
  list.prepend(li);
  while(list.children.length>6){list.removeChild(list.lastChild)}
}

function refreshBookingLiveWidgets(){
  var statusEl=document.getElementById('bk-status');
  var etaEl=document.getElementById('bk-eta');
  var lastEl=document.getElementById('bk-last');
  if(statusEl)statusEl.textContent=tlSteps[tlActive];
  if(etaEl)etaEl.textContent=(tlActive===3?'0':bookingEta)+' min';
  if(lastEl)lastEl.textContent=new Date().toLocaleTimeString();
}

function tickBookingRealtime(){
  if(tlActive<3){
    if(Math.random()>0.5){tlActive++}
    bookingEta=Math.max(0,bookingEta-(2+Math.floor(Math.random()*4)));
  }
  pushBookingFeed(bookingFeedMessages[Math.min(tlActive,bookingFeedMessages.length-1)]);
  refreshBookingLiveWidgets();
  renderTimeline();
}

function startBookingRealtime(){
  stopBookingRealtime();
  refreshBookingLiveWidgets();
  pushBookingFeed('Live tracking started for Booking #LH2025-0482.');
  bookingRealtimeTimer=setInterval(tickBookingRealtime,5000);
}

function stopBookingRealtime(){
  if(bookingRealtimeTimer){
    clearInterval(bookingRealtimeTimer);
    bookingRealtimeTimer=null;
  }
}

function renderMapList(){
  var c=document.getElementById('map-list');
  c.innerHTML=providers.map(function(p,i){
    var rt=providerRealtime[p.id]||{state:'live',eta:12,lastSeen:'just now'};
    return '<div class="map-item" id="ml-'+p.id+'" onclick="selMapItem('+p.id+')">'
      +'<div style="width:40px;height:40px;border-radius:50%;background:'+p.color+';display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0">'+p.init+'</div>'
      +'<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">'+p.name+'</div>'
      +'<div style="color:var(--text3);font-size:11px">'+p.role+'</div>'
      +'<div style="display:flex;gap:8px;margin-top:2px"><span style="color:#F59E0B;font-size:11px">★ '+p.rating+'</span><span style="color:var(--text3);font-size:11px">'+p.dist+'</span><span style="color:var(--primary);font-size:11px;font-weight:600">'+p.price+'</span></div>'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;gap:8px"><span class="rt-pill '+(rt.state==='live'?'live':'busy')+'">'+(rt.state==='live'?'Live':'Busy')+'</span><span style="font-size:11px;color:var(--text3)">ETA '+rt.eta+' min</span></div></div>'
      +'</div>';
  }).join('');
  renderMapMarkers();
}

var markerPositions=[
  {x:'20%',y:'25%'},{x:'55%',y:'18%'},{x:'75%',y:'45%'},
  {x:'35%',y:'65%'},{x:'15%',y:'55%'},{x:'65%',y:'72%'}
];
function renderMapMarkers(){
  var c=document.getElementById('map-markers');
  c.innerHTML=providers.map(function(p,i){
    var pos=markerPositions[i]||{x:'50%',y:'50%'};
    var rt=providerRealtime[p.id]||{state:'live'};
    var ring=rt.state==='live'?'0 0 0 6px rgba(16,185,129,.20)':'0 0 0 6px rgba(245,158,11,.18)';
    return '<div class="map-marker" id="mm-'+p.id+'" style="left:'+pos.x+';top:'+pos.y+';background:'+p.color+';box-shadow:'+ring+'" onclick="selMapItem('+p.id+')">'+p.icon+'</div>';
  }).join('');
}

var selId=null;
function selMapItem(id){
  if(selId!==null){
    var oldL=document.getElementById('ml-'+selId);
    var oldM=document.getElementById('mm-'+selId);
    if(oldL)oldL.classList.remove('sel');
    if(oldM)oldM.classList.remove('sel');
  }
  selId=id;
  var p=providers.find(function(x){return x.id===id});
  var listEl=document.getElementById('ml-'+id);
  var markerEl=document.getElementById('mm-'+id);
  if(listEl)listEl.classList.add('sel');
  if(markerEl)markerEl.classList.add('sel');
  var popup=document.getElementById('map-popup-el');
  popup.style.display='block';
  var rt=providerRealtime[p.id]||{state:'live',eta:12,lastSeen:'just now'};
  popup.innerHTML='<div style="font-weight:600;font-size:13px;margin-bottom:2px">'+p.name+'</div>'
    +'<div style="color:var(--text3);font-size:11px;margin-bottom:4px">'+p.role+'</div>'
    +'<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span style="color:#F59E0B">★ '+p.rating+'</span><span style="color:var(--text3)">'+p.dist+'</span></div>'
    +'<div style="font-size:11px;margin-bottom:8px"><span class="rt-pill '+(rt.state==='live'?'live':'busy')+'">'+(rt.state==='live'?'Live':'Busy')+'</span><span style="margin-left:6px;color:var(--text3)">ETA '+rt.eta+'m · '+rt.lastSeen+'</span></div>'
    +'<button class="btn-sm" onclick="openDetail('+id+')" style="width:100%;font-size:11px">View & Book</button>';
  if(listEl)listEl.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function initMapRealtime(){
  providers.forEach(function(p){
    if(!providerRealtime[p.id]){
      providerRealtime[p.id]={
        state:Math.random()>0.3?'live':'busy',
        eta:8+Math.floor(Math.random()*18),
        lastSeen:'just now'
      };
    }
  });
  updateMapRealtimeStats();
}

function jitterMarkerPositions(){
  markerPositions=markerPositions.map(function(pos){
    var x=Math.max(8,Math.min(88,parseFloat(pos.x)+(Math.random()*6-3)));
    var y=Math.max(10,Math.min(86,parseFloat(pos.y)+(Math.random()*6-3)));
    return {x:x.toFixed(1)+'%',y:y.toFixed(1)+'%'};
  });
}

function tickMapRealtime(){
  providers.forEach(function(p){
    var rt=providerRealtime[p.id];
    if(!rt)return;
    rt.state=Math.random()>0.35?'live':'busy';
    rt.eta=Math.max(4,Math.min(30,rt.eta+(Math.random()>0.5?1:-1)*Math.floor(Math.random()*3)));
    rt.lastSeen='updated '+new Date().toLocaleTimeString();
  });
  jitterMarkerPositions();
  renderMapList();
  if(selId){selMapItem(selId)}
  updateMapRealtimeStats();
}

function updateMapRealtimeStats(){
  var active=0,totalEta=0,total=0;
  providers.forEach(function(p){
    var rt=providerRealtime[p.id];
    if(!rt)return;
    if(rt.state==='live')active++;
    totalEta+=rt.eta;
    total++;
  });
  var syncEl=document.getElementById('map-sync-time');
  var activeEl=document.getElementById('map-active-count');
  var etaEl=document.getElementById('map-eta-avg');
  if(syncEl)syncEl.textContent=new Date().toLocaleTimeString();
  if(activeEl)activeEl.textContent=String(active);
  if(etaEl)etaEl.textContent=(total?Math.round(totalEta/total):0)+' min';
}

function startMapRealtime(){
  if(mapRealtimeTimer)return;
  initMapRealtime();
  renderMapList();
  mapRealtimeTimer=setInterval(tickMapRealtime,4500);
}

function stopMapRealtime(){
  if(mapRealtimeTimer){
    clearInterval(mapRealtimeTimer);
    mapRealtimeTimer=null;
  }
}

function renderRequests(){
  var table=document.getElementById('req-table');
  if(!table)return;
  table.innerHTML=providerRequests.map(function(r,i){
    return '<tr><td style="font-weight:500">'+r.cust+'</td><td style="color:var(--text2)">'+r.svc+'</td><td style="color:var(--text3)">'+r.time+'</td>'
      +'<td><span class="status-pill status-new">'+r.status+'</span></td>'
      +'<td><button class="btn-accept" onclick="acceptReq(this,'+i+')">Accept</button><button class="btn-reject" onclick="rejectReq(this,'+i+')">Reject</button></td></tr>';
  }).join('');
}

function acceptReq(btn,i){
  var row=btn.closest('tr');
  row.querySelector('td:nth-child(4)').innerHTML='<span class="status-pill status-done">Accepted</span>';
  btn.parentElement.innerHTML='<span style="font-size:11px;color:#10B981">✓ Accepted</span>';
  if(providerRequests[i])providerRequests[i].status='Accepted';
  providerStats.total+=1;
  providerStats.month+=1;
  providerStats.earnings+=1;
  updateProviderStatsUI();
  pushProviderFeed('Accepted request from '+(providerRequests[i]?providerRequests[i].cust:'customer')+'.');
  toast('✅ Booking accepted!','success');
}
function rejectReq(btn,i){
  btn.closest('tr').style.opacity='0.4';
  btn.parentElement.innerHTML='<span style="font-size:11px;color:var(--text3)">Rejected</span>';
  if(providerRequests[i])providerRequests[i].status='Rejected';
  pushProviderFeed('Rejected request from '+(providerRequests[i]?providerRequests[i].cust:'customer')+'.');
  toast('❌ Booking declined.');
}

function pushProviderFeed(msg){
  var list=document.getElementById('provider-feed');
  if(!list)return;
  var li=document.createElement('li');
  li.textContent=new Date().toLocaleTimeString()+' - '+msg;
  list.prepend(li);
  while(list.children.length>7){list.removeChild(list.lastChild)}
}

function updateProviderStatsUI(){
  var totalEl=document.getElementById('provider-total-bookings');
  var monthEl=document.getElementById('provider-month-bookings');
  var earnEl=document.getElementById('provider-earnings');
  var ratingEl=document.getElementById('provider-rating');
  var syncEl=document.getElementById('provider-sync-time');
  var newReqEl=document.getElementById('provider-new-requests');
  var onlineEl=document.getElementById('provider-online-now');
  var responseEl=document.getElementById('provider-response-time');
  if(totalEl)totalEl.textContent=providerStats.total;
  if(monthEl)monthEl.textContent=providerStats.month;
  if(earnEl)earnEl.textContent='₹'+providerStats.earnings+'K';
  if(ratingEl)ratingEl.textContent=providerStats.rating.toFixed(1);
  if(syncEl)syncEl.textContent=new Date().toLocaleTimeString();
  if(newReqEl)newReqEl.textContent=providerRequests.filter(function(r){return r.status==='New'||r.status==='Pending'}).length;
  if(onlineEl)onlineEl.textContent=providerStats.online;
  if(responseEl)responseEl.textContent=providerStats.response+' min';
}

function tickProviderDashboard(){
  providerStats.online=Math.max(8,Math.min(40,providerStats.online+(Math.random()>0.5?1:-1)*Math.floor(Math.random()*3)));
  providerStats.response=Math.max(3,Math.min(14,providerStats.response+(Math.random()>0.5?1:-1)));
  providerStats.rating=Math.max(4.5,Math.min(5.0,providerStats.rating+(Math.random()-0.5)*0.05));
  if(Math.random()>0.55){
    var randomCustomer=['Karthik P.','Nisha A.','Varun T.','Sana M.'][Math.floor(Math.random()*4)];
    var randomService=['Quick plumbing check','Switchboard repair','Bathroom deep clean','AC inspection'][Math.floor(Math.random()*4)];
    providerRequests.unshift({cust:randomCustomer,svc:randomService,time:'Today '+(2+Math.floor(Math.random()*8))+' PM',status:'New'});
    if(providerRequests.length>7)providerRequests.pop();
  }
  pushProviderFeed(providerFeedMessages[Math.floor(Math.random()*providerFeedMessages.length)]);
  renderRequests();
  updateProviderStatsUI();
}

function startProviderDashboardRealtime(){
  stopProviderDashboardRealtime();
  renderRequests();
  updateProviderStatsUI();
  pushProviderFeed('Live dashboard connected.');
  providerDashTimer=setInterval(tickProviderDashboard,5500);
}

function stopProviderDashboardRealtime(){
  if(providerDashTimer){
    clearInterval(providerDashTimer);
    providerDashTimer=null;
  }
}

function startProviderOtherRealtime(){
  stopProviderOtherRealtime();
  providerOtherTimer=setInterval(function(){
    providerStats.earnings=Math.max(20,providerStats.earnings+(Math.random()>0.5?1:0));
    providerStats.rating=Math.max(4.5,Math.min(5.0,providerStats.rating+(Math.random()-0.5)*0.03));
    if(currentProviderTab!=='dashboard')renderProviderTab(currentProviderTab);
  },5000);
}

function stopProviderOtherRealtime(){
  if(providerOtherTimer){
    clearInterval(providerOtherTimer);
    providerOtherTimer=null;
  }
}

function renderProviderTab(tab){
  var other=document.getElementById('provider-other-view');
  var dash=document.getElementById('provider-dashboard-view');
  if(!other||!dash)return;
  currentProviderTab=tab||'dashboard';
  if(currentProviderTab==='dashboard'){
    dash.style.display='block';
    other.style.display='none';
    return;
  }
  dash.style.display='none';
  other.style.display='block';
  if(currentProviderTab==='services'){
    other.innerHTML='<div class="provider-panel"><h3>Services (Live)</h3><div class="provider-grid">'
      +'<div class="provider-mini"><div class="stat-label">Active Services</div><div class="live-value">6</div><div style="font-size:12px;color:var(--text2)">Updated '+new Date().toLocaleTimeString()+'</div></div>'
      +'<div class="provider-mini"><div class="stat-label">Most Booked</div><div class="live-value">Plumbing fix</div><div style="font-size:12px;color:var(--text2)">42 bookings this month</div></div>'
      +'<div class="provider-mini"><div class="stat-label">Quick Toggle</div><button class="btn-primary" style="margin-top:8px;padding:8px 14px" onclick="toast(\'✅ Service availability updated\',\'success\')">Set Availability</button></div>'
      +'</div></div>';
  }else if(currentProviderTab==='bookings'){
    var rows=providerRequests.map(function(r){
      return '<tr><td>'+r.cust+'</td><td>'+r.svc+'</td><td>'+r.time+'</td><td>'+r.status+'</td></tr>';
    }).join('');
    other.innerHTML='<div class="provider-panel"><h3>Bookings (Real-Time)</h3><div style="font-size:12px;color:var(--text2);margin-bottom:10px">Auto-refresh every few seconds</div>'
      +'<div class="table-wrap"><table class="req-table"><thead><tr><th>Customer</th><th>Service</th><th>Time</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }else if(currentProviderTab==='earnings'){
    other.innerHTML='<div class="provider-panel"><h3>Earnings Overview</h3><div class="provider-grid">'
      +'<div class="provider-mini"><div class="stat-label">Today</div><div class="live-value">₹'+(4+Math.floor(Math.random()*4))+'K</div></div>'
      +'<div class="provider-mini"><div class="stat-label">This Week</div><div class="live-value">₹'+(16+Math.floor(Math.random()*8))+'K</div></div>'
      +'<div class="provider-mini"><div class="stat-label">This Month</div><div class="live-value">₹'+providerStats.earnings+'K</div></div>'
      +'</div><div style="font-size:12px;color:var(--text2);margin-top:10px">Realtime updates synced at '+new Date().toLocaleTimeString()+'</div></div>';
  }else if(currentProviderTab==='reviews'){
    other.innerHTML='<div class="provider-panel"><h3>Reviews & Ratings</h3><div class="provider-grid">'
      +'<div class="provider-mini"><div class="stat-label">Current Rating</div><div class="live-value">'+providerStats.rating.toFixed(1)+' ★</div></div>'
      +'<div class="provider-mini"><div class="stat-label">New Reviews</div><div class="live-value">'+(1+Math.floor(Math.random()*4))+'</div></div>'
      +'<div class="provider-mini"><div class="stat-label">Latest Comment</div><div style="font-size:13px;color:var(--text2)">"Great service and quick response."</div></div>'
      +'</div></div>';
  }else if(currentProviderTab==='settings'){
    other.innerHTML='<div class="provider-panel"><h3>Settings</h3>'
      +'<div class="field"><label>Business Name</label><input type="text" value="LocalHub Services"></div>'
      +'<div class="field"><label>Working Hours</label><input type="text" value="09:00 AM - 08:00 PM"></div>'
      +'<button class="btn-primary" onclick="toast(\'✅ Settings saved\',\'success\')">Save Settings</button></div>';
  }
}

function show(pg){
  if(!canAccessPage(pg)){
    toast('🔐 Please login to continue.','warn');
    pg='auth';
  }
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.getElementById('pg-'+pg).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(function(l){
    l.classList.remove('active');
    if(l.getAttribute('onclick') && l.getAttribute('onclick').includes("show('"+pg+"')")) {
       l.classList.add('active');
    }
  });
  updateNavIndicator();
  window.scrollTo({top:0,behavior:'smooth'});
  if(pg==='profile'){fillProfileForm()}
  if(pg==='map')startMapRealtime();
  else stopMapRealtime();
  if(pg==='booking')startBookingRealtime();
  else stopBookingRealtime();
  if(pg==='provider')startProviderDashboardRealtime();
  else stopProviderDashboardRealtime();
  if(pg==='provider')startProviderOtherRealtime();
  else stopProviderOtherRealtime();
}

function toggleAuth(){
  document.getElementById('auth-login').style.display=document.getElementById('auth-login').style.display==='none'?'block':'none';
  document.getElementById('auth-signup').style.display=document.getElementById('auth-signup').style.display==='none'?'block':'none';
}

function doLogin(){
  var e=document.getElementById('a-email').value;
  var p=document.getElementById('a-pass').value;
  if(!e||!p){toast('⚠️ Please fill all fields.','warn');return}
  var users=getUsers();
  var found=users.find(function(u){return u.email.toLowerCase()===e.toLowerCase()&&u.password===p});
  if(!found){toast('❌ Invalid email or password.','warn');return}
  currentUser=found;
  saveSession();
  updateAuthUI();
  startRealtime();
  toast('🎉 Welcome back!','success');
  show('dashboard');
}
function doSignup(){
  var n=document.getElementById('su-name').value.trim();
  var e=document.getElementById('su-email').value.trim();
  var ph=document.getElementById('su-phone').value.trim();
  var p=document.getElementById('su-pass').value;
  if(!n||!e||!ph||!p){toast('⚠️ Fill all signup fields.','warn');return}
  var users=getUsers();
  if(users.some(function(u){return u.email.toLowerCase()===e.toLowerCase()})){toast('⚠️ Email already registered.','warn');return}
  var newUser={name:n,email:e,phone:ph,password:p,city:'',bio:'',lastSeen:new Date().toISOString()};
  users.push(newUser);
  localStorage.setItem('lhUsers',JSON.stringify(users));
  currentUser=newUser;
  saveSession();
  updateAuthUI();
  startRealtime();
  toast('🎉 Account created!','success');
  show('dashboard');
  confetti();
}
function logoutUser(){
  currentUser=null;
  localStorage.removeItem('lhSession');
  stopRealtime();
  updateAuthUI();
  toast('👋 Logged out successfully.');
  show('landing');
}

async function doGoogleLogin() {
  if (!auth) {
    toast('❌ Firebase Auth not initialized.', 'warn');
    return;
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    var newUser = {
      name: user.displayName || 'Google User',
      email: user.email,
      phone: user.phoneNumber || '',
      password: '', // Managed by Google
      city: '',
      bio: '',
      lastSeen: new Date().toISOString()
    };
    var users = getUsers();
    if (!users.some(u => u.email === newUser.email)) {
      users.push(newUser);
      localStorage.setItem('lhUsers', JSON.stringify(users));
    }
    currentUser = newUser;
    saveSession();
    updateAuthUI();
    startRealtime();
    toast('🎉 Logged in with Google!', 'success');
    show('dashboard');
    confetti();
  } catch (error) {
    console.error("Google Auth Error:", error);
    toast('❌ Google sign-in failed. Did you enable it in Firebase?', 'warn');
  }
}

function getUsers(){
  var stored=localStorage.getItem('lhUsers');
  if(!stored){
    var demo=[{name:'Demo User',email:'demo@localhub.com',phone:'+91 98765 43210',password:'demo123',city:'Bangalore',bio:'I book home services every week.',lastSeen:new Date().toISOString()}];
    localStorage.setItem('lhUsers',JSON.stringify(demo));
    return demo;
  }
  try{return JSON.parse(stored)||[]}catch(e){return []}
}
function saveSession(){
  localStorage.setItem('lhSession',JSON.stringify(currentUser));
}
function loadSession(){
  try{
    var sess=JSON.parse(localStorage.getItem('lhSession')||'null');
    currentUser=sess;
  }catch(e){currentUser=null}
}
function canAccessPage(pg){
  var protectedPages=['dashboard','booking','provider','profile'];
  return protectedPages.indexOf(pg)===-1||!!currentUser;
}
function updateAuthUI(){
  var loginBtn=document.getElementById('login-btn');
  var logoutBtn=document.getElementById('logout-btn');
  var navUser=document.getElementById('nav-user');
  if(currentUser){
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    navUser.style.display='inline';
    navUser.textContent='Hi, '+(currentUser.name||'User').split(' ')[0];
  }else{
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    navUser.style.display='none';
    navUser.textContent='';
  }
}
function fillProfileForm(){
  if(!currentUser)return;
  document.getElementById('p-name').value=currentUser.name||'';
  document.getElementById('p-email').value=currentUser.email||'';
  document.getElementById('p-phone').value=currentUser.phone||'';
  document.getElementById('p-city').value=currentUser.city||'';
  document.getElementById('p-bio').value=currentUser.bio||'';
  document.getElementById('profile-display-name').textContent=currentUser.name||'LocalHub User';
  document.getElementById('profile-avatar').textContent=getInitials(currentUser.name||'LH');
  document.getElementById('profile-last-seen').textContent='Last updated: '+formatTime(currentUser.lastSeen);
}
function saveProfile(){
  if(!currentUser){toast('🔐 Login required.','warn');return}
  var prevEmail=currentUser.email;
  var prevPhone=currentUser.phone;
  currentUser.name=document.getElementById('p-name').value.trim();
  currentUser.email=document.getElementById('p-email').value.trim();
  currentUser.phone=document.getElementById('p-phone').value.trim();
  currentUser.city=document.getElementById('p-city').value.trim();
  currentUser.bio=document.getElementById('p-bio').value.trim();
  currentUser.lastSeen=new Date().toISOString();
  var users=getUsers().map(function(u){
    return u.email===prevEmail||u.phone===prevPhone?currentUser:u;
  });
  localStorage.setItem('lhUsers',JSON.stringify(users));
  saveSession();
  updateAuthUI();
  fillProfileForm();
  toast('✅ Profile updated.','success');
}
function getInitials(name){
  return name.split(' ').filter(Boolean).slice(0,2).map(function(x){return x[0].toUpperCase()}).join('')||'LH';
}
function formatTime(iso){
  if(!iso)return 'just now';
  return new Date(iso).toLocaleString();
}
function addLiveItem(msg){
  var list=document.getElementById('live-feed-list');
  if(!list)return;
  var li=document.createElement('li');
  li.textContent=new Date().toLocaleTimeString()+' - '+msg;
  list.prepend(li);
  while(list.children.length>8){list.removeChild(list.lastChild)}
}
function startRealtime(){
  stopRealtime();
  var t=document.getElementById('live-time');
  var oc=document.getElementById('online-count');
  var sync=document.getElementById('last-sync');
  if(!t||!oc||!sync)return;
  t.textContent=new Date().toLocaleTimeString();
  oc.textContent=String(120+Math.floor(Math.random()*30));
  sync.textContent='just now';
  addLiveItem('Session started for '+(currentUser?currentUser.name:'guest'));
  liveClockTimer=setInterval(function(){
    t.textContent=new Date().toLocaleTimeString();
  },1000);
  livePulseTimer=setInterval(function(){
    oc.textContent=String(110+Math.floor(Math.random()*45));
    sync.textContent='updated '+new Date().toLocaleTimeString();
    addLiveItem(liveMessages[Math.floor(Math.random()*liveMessages.length)]);
  },5000);
}
function stopRealtime(){
  if(liveClockTimer){clearInterval(liveClockTimer);liveClockTimer=null}
  if(livePulseTimer){clearInterval(livePulseTimer);livePulseTimer=null}
}

function setFilter(el,type){
  document.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active')});
  el.classList.add('active');
  var list=providers;
  if(type==='top')list=providers.filter(function(p){return p.rating>=4.8});
  else if(type==='cheap')list=providers.slice().sort(function(a,b){return parseInt(a.price)-parseInt(b.price)});
  else if(type==='near')list=providers.slice().sort(function(a,b){return parseFloat(a.dist)-parseFloat(b.dist)});
  var cid=document.getElementById('dash-providers')?'dash-providers':null;
  if(cid)renderProviders(list,cid);
}

function filterCat(icon,name){
  show('dashboard');
  toast('Showing '+name+'s near you 📍');
  var filtered=providers.filter(function(p){return p.cat===name});
  renderProviders(filtered.length?filtered:providers,'dash-providers');
}

function searchHint(v){
  var s=document.getElementById('search-suggestions');
  var sl=document.getElementById('sugg-list');
  if(!v||v.length<2){s.style.display='none';return}
  var matches=providers.filter(function(p){return p.role.toLowerCase().includes(v.toLowerCase())||p.name.toLowerCase().includes(v.toLowerCase())});
  if(!matches.length){s.style.display='none';return}
  s.style.display='block';
  sl.innerHTML=matches.map(function(p){
    return '<div style="padding:10px 14px;cursor:pointer;display:flex;gap:10px;align-items:center;border-bottom:1px solid var(--border)" onclick="openDetail('+p.id+')" onmouseenter="this.style.background=\'rgba(99,102,241,0.06)\'" onmouseleave="this.style.background=\'\'"><span>'+p.icon+'</span><div><div style="font-size:13px;font-weight:500">'+p.name+'</div><div style="font-size:11px;color:var(--text3)">'+p.role+'</div></div><span style="margin-left:auto;color:var(--primary);font-size:12px;font-weight:600">'+p.price+'</span></div>';
  }).join('');
}

function setSb(el,tab){
  document.querySelectorAll('.sb-item').forEach(function(s){s.classList.remove('active')});
  el.classList.add('active');
  renderProviderTab(tab||'dashboard');
}

var dark=true;
function toggleTheme(){
  dark=!dark;
  document.body.classList.toggle('dark',dark);
  document.getElementById('themeBtn').textContent=dark?'☀️':'🌙';
}

var toastQ=[];
function toast(msg,type){
  var tw=document.getElementById('toast-wrap');
  var t=document.createElement('div');
  t.className='toast';
  var color=type==='success'?'#10B981':type==='warn'?'#F59E0B':'var(--primary)';
  t.innerHTML='<span style="width:8px;height:8px;border-radius:50%;background:'+color+';flex-shrink:0"></span>'+msg;
  tw.appendChild(t);
  setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},300)},3000);
}

var colors=['#6366F1','#06B6D4','#F59E0B','#10B981','#EC4899','#EF4444','#8B5CF6','#F97316'];
function confetti(){
  for(var i=0;i<60;i++){
    (function(idx){
      setTimeout(function(){
        var c=document.createElement('div');
        c.className='confetti-piece';
        c.style.left=Math.random()*100+'vw';
        c.style.background=colors[idx%colors.length];
        c.style.animationDuration=(1.5+Math.random()*2)+'s';
        c.style.animationDelay='0s';
        c.style.width=(6+Math.random()*8)+'px';
        c.style.height=(6+Math.random()*8)+'px';
        document.body.appendChild(c);
        setTimeout(function(){c.remove()},4000);
      },idx*30);
    })(i);
  }
}

function renderDashCats(){
  var cats=[['⚡','Electrician'],['🔧','Plumber'],['🚗','Mechanic'],['🧹','Cleaner'],['🎨','Painter'],['❄️','AC Repair'],['🌿','Gardener'],['📦','Movers']];
  document.getElementById('dash-cats').innerHTML=cats.map(function(c){
    return '<div class="cat" onclick="filterCat(\''+c[0]+'\',\''+c[1]+'\')"><span class="cat-icon">'+c[0]+'</span><span class="cat-label">'+c[1]+'</span></div>';
  }).join('');
}

// Init
renderProviders(providers,'landing-providers');
renderProviders(providers,'dash-providers');
renderDashCats();
renderTimeline();
renderMapList();
renderRequests();
loadSession();
updateAuthUI();
if(currentUser){
  fillProfileForm();
  startRealtime();
}

// Nav Interactive Effects
window.addEventListener('scroll', function() {
  var nav = document.getElementById('main-nav');
  if(nav) {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
});
function updateNavIndicator() {
  var activeLink = document.querySelector('.nav-link.active');
  var indicator = document.getElementById('nav-indicator');
  var navLinksContainer = document.querySelector('.nav-links');
  if (activeLink && indicator && navLinksContainer && window.innerWidth > 600) {
    var linkRect = activeLink.getBoundingClientRect();
    var containerRect = navLinksContainer.getBoundingClientRect();
    indicator.style.width = linkRect.width + 'px';
    indicator.style.left = (linkRect.left - containerRect.left) + 'px';
    indicator.style.opacity = '1';
  } else if(indicator) {
    indicator.style.opacity = '0';
  }
}
window.addEventListener('resize', updateNavIndicator);
setTimeout(updateNavIndicator, 100);

// Attractive JS Effects: Mouse Glow & 3D Tilt
window.addEventListener('mousemove', function(e) {
  var glow = document.getElementById('mouse-glow');
  if(glow) {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }
});

function initTilt() {
  document.querySelectorAll('.pcard').forEach(function(el) {
    el.addEventListener('mousemove', function(e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -8;
      var rotateY = ((x - centerX) / centerX) * 8;
      el.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';
      el.style.transition = 'none';
    });
    el.addEventListener('mouseleave', function() {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      el.style.transition = 'transform 0.5s ease';
    });
  });
}

// -----------------------------------------------------------------------------
// FIREBASE & STRIPE REAL-TIME INTEGRATION
// -----------------------------------------------------------------------------
let isFirebaseConnected = false;

async function syncProvidersFromFirebase() {
  if (!db) return; // Keys not provided yet
  try {
    const querySnapshot = await getDocs(collection(db, 'providers'));
    if (querySnapshot.empty) {
      // Seed data on first run
      for (const p of providers) {
        await addDoc(collection(db, 'providers'), p);
      }
      isFirebaseConnected = true;
    }
    
    // Listen for real-time updates
    onSnapshot(collection(db, 'providers'), (snapshot) => {
      const loadedProviders = [];
      snapshot.forEach(doc => loadedProviders.push({ id: doc.id, ...doc.data() }));
      if (loadedProviders.length > 0) {
        providers = loadedProviders;
        renderProviders(providers, 'landing-providers');
        renderProviders(providers, 'dash-providers');
        renderMapList();
      }
    });
  } catch (error) {
    console.warn("Firebase rules/auth error or missing keys:", error);
  }
}
syncProvidersFromFirebase();

// Stripe Checkout Handler
window.handleBookingPayment = async function() {
  toast('💳 Redirecting to secure checkout...', 'success');
  try {
    const response = await fetch('http://localhost:3000/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'service_123',
        providerName: document.getElementById('detail-name').textContent || 'Expert Provider',
        price: 500 // Demo price
      }),
    });
    const session = await response.json();
    if (session.error) {
      toast('❌ Payment error: ' + session.error, 'warn');
      return;
    }
    if (session.url) {
      window.location.href = session.url;
    }
  } catch (err) {
    toast('❌ Server error. Is the backend running?', 'warn');
  }
};

// Expose functions to global scope so inline HTML onclick handlers still work
window.show = show;
window.toast = toast;
window.logoutUser = logoutUser;
window.doLogin = doLogin;
window.doSignup = doSignup;
window.toggleAuth = toggleAuth;
window.searchHint = searchHint;
window.filterCat = filterCat;
window.openDetail = openDetail;
window.selSlot = selSlot;
window.confetti = confetti;
window.setFilter = setFilter;
window.selMapItem = selMapItem;
window.acceptReq = acceptReq;
window.rejectReq = rejectReq;
window.saveProfile = saveProfile;
window.setSb = setSb;
window.toggleTheme = toggleTheme;
window.doGoogleLogin = doGoogleLogin;