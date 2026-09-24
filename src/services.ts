import axios from 'axios';
import type {AuthUser,Customer,Driver,Order,ProfileUpdate} from './types';
import {deliveryFeeFor} from './deliveryFees';
/* 3: hna l-API fallback 3a localStorage 3ashan l-app ydal shaghghal bala backend. */
const base=import.meta.env.VITE_API_URL||'http://localhost:3001'; const api=axios.create({baseURL:base,timeout:1200}); const key=(k:string)=>`routely-${k}`;
async function request<T>(remote:()=>Promise<T>,fallback:()=>T):Promise<T>{try{return await remote()}catch{return fallback()}}
const local=<T,>(k:string):T[]=>{try{return JSON.parse(localStorage.getItem(key(k))||'[]') as T[]}catch{return []}};
export const normalizeCustomer=(value:Partial<Customer>,index=0):Customer=>{const name=typeof value.name==='string'&&value.name.trim()?value.name.trim():'Unknown customer';return {id:typeof value.id==='string'&&value.id?value.id:`legacy-${index}`,name,fullName:typeof value.fullName==='string'&&value.fullName.trim()?value.fullName.trim():name,email:value.email||'',phone:value.phone||'',address:value.address||'',city:value.city||'Beirut',area:value.area||'',company:value.company||'',type:value.type==='Business'?'Business':'Individual',joinedDate:value.joinedDate||new Date().toISOString().slice(0,10),notes:value.notes||'',preferredPayment:value.preferredPayment||'Cash on delivery',ordersCount:Number(value.ordersCount)||0,totalSpent:Number(value.totalSpent)||0,lastOrder:value.lastOrder||'—',status:value.status==='VIP'||value.status==='Inactive'?value.status:'Active'}};
export const normalizeOrder=(value:Partial<Order>,index=0):Order=>{const statuses=['Delivered','In Transit','Processing','Delayed'] as const;const status=statuses.includes(value.status as typeof statuses[number])?value.status as Order['status']:'Processing';const progress=Number.isFinite(Number(value.progress))?Math.max(0,Math.min(100,Number(value.progress))):({Delivered:100,'In Transit':65,Processing:20,Delayed:40}[status]);const city=value.city||'Beirut';const hasFee=Number.isFinite(Number(value.deliveryFee));const fee=hasFee?Math.max(0,Number(value.deliveryFee)):deliveryFeeFor(city);const hasSubtotal=Number.isFinite(Number(value.subtotal));const rawTotal=Number(value.total);const subtotal=hasSubtotal?Math.max(0,Number(value.subtotal)):Number.isFinite(rawTotal)?Math.max(0,rawTotal-(hasFee?fee:0)):0;/* Hawn mnwaffe2 legacy orders: l-fee mn l-city w l-total da2iman subtotal + fee, bala double-add. */const total=subtotal+fee;return {id:value.id||`legacy-order-${index}`,customer:value.customer||'Unknown customer',customerId:value.customerId,customerEmail:value.customerEmail,city,area:value.area||'',subtotal,deliveryFee:fee,total,status, date:value.date||value.createdAt||'',items:Number(value.items)||0,progress,trackingNumber:value.trackingNumber||'',phone:value.phone||'',address:value.address||'',paymentMethod:value.paymentMethod||'Cash on delivery',deliveryWindow:value.deliveryWindow||'',notes:value.notes||'',productDetails:value.productDetails||'',products:Array.isArray(value.products)?value.products:[],driver:value.driver||'Unassigned',driverId:value.driverId,createdAt:value.createdAt||value.date||'',updatedAt:value.updatedAt||value.date||''}};
const seedDrivers:Driver[]=[
  {id:'drv-001',name:'Fadi Haddad',phone:'+961 70 245 810',vehicle:'Toyota Corolla',plate:'LB 124578',currentArea:'Hamra',status:'On delivery',deliveries:8},
  {id:'drv-002',name:'Maya Khoury',phone:'+961 76 318 442',vehicle:'Kia Picanto',plate:'LB 237914',currentArea:'Jounieh',status:'Available',deliveries:5},
  {id:'drv-003',name:'Rami Saad',phone:'+961 71 902 116',vehicle:'Hyundai H-1',plate:'LB 459821',currentArea:'Achrafieh',status:'Available',deliveries:11},
  {id:'drv-004',name:'Nour Daher',phone:'+961 81 556 230',vehicle:'Nissan Sunny',plate:'LB 681203',currentArea:'Zahle',status:'Offline',deliveries:3}
];
export const normalizeDriver=(value:Partial<Driver>,index=0):Driver=>({id:value.id||`drv-legacy-${index}`,name:value.name||'Unnamed driver',phone:value.phone||'',vehicle:value.vehicle||'Unassigned vehicle',plate:value.plate||'—',currentArea:value.currentArea||'Beirut',status:value.status==='On delivery'||value.status==='Offline'?value.status:'Available',deliveries:Number(value.deliveries)||0,notes:value.notes||''});
export const normalizeDriverName=(value:unknown)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').toLocaleLowerCase():'';
export const linkOrdersToDrivers=(orders:Order[],drivers:Driver[])=>orders.map(order=>{
  const byId=order.driverId?drivers.find(driver=>driver.id===order.driverId):undefined;
  const orderName=normalizeDriverName(order.driver);
  const exactName=drivers.find(driver=>normalizeDriverName(driver.name)===orderName);
  const legacyMatches=orderName?drivers.filter(driver=>normalizeDriverName(driver.name).split(' ')[0]===orderName):[];
  const byName=byId||exactName||(legacyMatches.length===1?legacyMatches[0]:undefined);
  // Ya3ne mnshouf l-ID awwal, ba3den l-esem mnwa7do la ma ndayye3 l-talab.
  if(!byName)return {...order,driverId:undefined,driver:orderName&&orderName!=='unassigned'?order.driver:'Unassigned'};
  return {...order,driverId:byName.id,driver:byName.name};
});
export const driverService={
  list:()=>request(()=>api.get<Partial<Driver>[]>('/drivers').then(r=>r.data),()=>{const saved=local<Partial<Driver>>('drivers');return localStorage.getItem(key('drivers'))!==null?saved:seedDrivers}).then(items=>items.map(normalizeDriver)),
  create:async(d:Driver)=>{const all=await driverService.list();localStorage.setItem(key('drivers'),JSON.stringify([d,...all]));try{return(await api.post<Driver>('/drivers',d)).data}catch{return d}},
  update:async(id:string,p:Partial<Driver>)=>{const all=await driverService.list();const next=all.map(d=>d.id===id?normalizeDriver({...d,...p}):d);localStorage.setItem(key('drivers'),JSON.stringify(next));try{return normalizeDriver(await api.patch<Driver>(`/drivers/${id}`,p).then(r=>r.data))}catch{return next.find(d=>d.id===id)!}},
  remove:async(id:string)=>{const all=(await driverService.list()).filter(d=>d.id!==id);localStorage.setItem(key('drivers'),JSON.stringify(all));try{await api.delete(`/drivers/${id}`)}catch{/* local fallback remains authoritative */}}
};
/* 5: hna orderService b7ot CRUD typed w sync local/remote. */
export const orderService={list:()=>request(()=>api.get<Partial<Order>[]>('/orders').then(r=>r.data),()=>local<Partial<Order>>('orders')).then(items=>items.map(normalizeOrder)),create:async(o:Order)=>{const normalized=normalizeOrder(o);const all=await orderService.list();localStorage.setItem(key('orders'),JSON.stringify([normalized,...all]));try{return normalizeOrder((await api.post<Order>('/orders',normalized)).data)}catch{return normalized}},update:async(id:string,p:Partial<Order>)=>{const all=await orderService.list();const current=all.find(o=>o.id===id);const normalized=normalizeOrder({...current,...p,updatedAt:new Date().toISOString()});const next=all.map(o=>o.id===id?normalized:o);localStorage.setItem(key('orders'),JSON.stringify(next));try{return normalizeOrder((await api.patch<Order>(`/orders/${id}`,normalized)).data)}catch{return normalized}},remove:async(id:string)=>{const all=(await orderService.list()).filter(o=>o.id!==id);localStorage.setItem(key('orders'),JSON.stringify(all));try{await api.delete(`/orders/${id}`)}catch{/* fallback local */}}};
/* 2: hna customerService b7ot profile completo w CRUD ma3 fallback. */
export const customerService={
  list:()=>request(()=>api.get<Partial<Customer>[]>('/customers').then(r=>r.data),()=>local<Partial<Customer>>('customers')).then(items=>items.map(normalizeCustomer)),
  create:async(c:Customer):Promise<Customer>=>{const all=await customerService.list();localStorage.setItem(key('customers'),JSON.stringify([c,...all]));try{return (await api.post<Customer>('/customers',c)).data}catch{return c}},
  update:async(id:string,p:Partial<Customer>):Promise<Customer>=>{const all=await customerService.list();const next=all.map(c=>c.id===id?normalizeCustomer({...c,...p}):c);localStorage.setItem(key('customers'),JSON.stringify(next));const updated=next.find(c=>c.id===id)||normalizeCustomer({...p,id});try{return (await api.patch<Customer>(`/customers/${id}`,p)).data}catch{return updated}},
  remove:async(id:string):Promise<void>=>{const all=(await customerService.list()).filter(c=>c.id!==id);localStorage.setItem(key('customers'),JSON.stringify(all));try{await api.delete(`/customers/${id}`)}catch{/* 3a localStorage, l-delete bydal safe iza l-API mesh mawjud. */}}
};
/* 4: hna auth service b7afez users w profile 3a localStorage, w byesma7 ay role yefout. */
const authKey='routely-auth'; const usersKey='routely-users';
const readUsers=():AuthUser[]=>{try{return JSON.parse(localStorage.getItem(usersKey)||'[]') as AuthUser[]}catch{return []}};
const writeUsers=(users:AuthUser[])=>localStorage.setItem(usersKey,JSON.stringify(users));
export const authService={
  current:():AuthUser|null=>{try{return JSON.parse(localStorage.getItem(authKey)||'null') as AuthUser|null}catch{return null}},
  login:(email:string,password:string):AuthUser=>{const user=readUsers().find(item=>item.email.toLowerCase()===email.trim().toLowerCase()&&item.password===password);if(!user)throw new Error('Email or password is incorrect.');localStorage.setItem(authKey,JSON.stringify(user));return user},
  register:async(input:Omit<AuthUser,'id'|'role'>):Promise<AuthUser>=>{const users=readUsers();if(users.some(user=>user.email.toLowerCase()===input.email.toLowerCase()))throw new Error('An account with this email already exists.');const user:AuthUser={...input,id:crypto.randomUUID(),role:'admin'};writeUsers([...users,user]);localStorage.setItem(authKey,JSON.stringify(user));return user},
  updateProfile:(id:string,update:ProfileUpdate):AuthUser=>{const users=readUsers();const user=users.find(item=>item.id===id);if(!user)throw new Error('Your session expired. Please sign in again.');const next={...user,...update};writeUsers(users.map(item=>item.id===id?next:item));localStorage.setItem(authKey,JSON.stringify(next));return next},
  logout:()=>localStorage.removeItem(authKey),
};
