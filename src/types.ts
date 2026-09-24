/* 3: hna l-models l-mfassale b7ot kel tafasil l-sh7ne w l-zaboun 3ashan l-CRUD ykoun wazeh. */
export type Status="Delivered"|"In Transit"|"Processing"|"Delayed";
export interface OrderItem { name:string; quantity:number; price:number }
export interface Order { id:string; customer:string; customerId?:string; customerEmail?:string; city:string; area?:string; subtotal?:number; deliveryFee?:number; total:number; status:Status; date:string; items:number; progress:number; trackingNumber:string; phone:string; address:string; paymentMethod:string; deliveryWindow:string; notes:string; productDetails?:string; products:OrderItem[]; driver:string; driverId?:string; createdAt:string; updatedAt:string }
export type DriverStatus='Available'|'On delivery'|'Offline';
export interface Driver { id:string; name:string; phone:string; vehicle:string; plate:string; currentArea:string; status:DriverStatus; deliveries:number; notes?:string }
export type CustomerStatus="Active"|"Inactive"|"VIP";
export interface Customer { id:string; name:string; fullName:string; email:string; phone:string; address:string; city:string; area:string; company:string; type:'Individual'|'Business'; joinedDate:string; notes:string; preferredPayment:string; ordersCount:number; totalSpent:number; lastOrder:string; status:CustomerStatus }
export interface Product { id:number; name:string; price:number }
/* 6: hna models taba3 l-login w l-profile 3ashan l-session tkoun typed w ma fiha any. */
export type UserRole = 'user' | 'admin';
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  phone: string;
  city: string;
  jobTitle: string;
}
export type ProfileUpdate = Pick<AuthUser, 'name' | 'email' | 'phone' | 'city' | 'jobTitle'>;
