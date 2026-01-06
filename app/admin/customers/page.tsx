"use client";

import { useState, useEffect } from "react";
import { getCustomers, addManualCustomer } from "@/app/actions/admin";

export default function CustomerDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    getCustomers().then(setCustomers);
  }, []);

  const filtered = customers.filter(c => 
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Customers</h1>
            <p className="text-gray-500">Manage accounts & start work orders.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="🔍 Search accounts..." 
                className="px-4 py-2 border border-gray-300 rounded-lg flex-1 md:w-64"
                onChange={(e) => setSearch(e.target.value)}
              />
              <button 
                onClick={() => setShowModal(true)}
                className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 whitespace-nowrap"
              >
                + New Customer
              </button>
          </div>
      </div>

      {/* CUSTOMER LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(cust => (
              <div key={cust.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-black transition-all group relative">
                  <div className="absolute top-4 right-4 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase">
                      {cust.market}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{cust.company_name}</h3>
                  <p className="text-sm text-gray-500 mb-4">👤 {cust.contact_name || "No Contact"}</p>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-6">
                      <div className="flex items-center gap-2">📞 {cust.phone || "--"}</div>
                      <div className="flex items-center gap-2">📧 {cust.email || "--"}</div>
                  </div>

                  {/* ACTION BAR */}
                  <div className="flex gap-2 border-t border-gray-100 pt-4">
                      <button 
                        onClick={() => alert(`Start Approval Process for ${cust.company_name}`)}
                        className="flex-1 bg-green-50 text-green-700 font-bold py-2 rounded-lg text-sm hover:bg-green-100"
                      >
                         🔧 New Request
                      </button>
                      <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                         ✏️
                      </button>
                  </div>
              </div>
          ))}
      </div>

      {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
              No customers found. Try changing your search or add a new one.
          </div>
      )}

      {/* MANUAL ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
               <h2 className="text-2xl font-black mb-1">Manual Onboarding</h2>
               <p className="text-gray-500 text-sm mb-6">Add a customer directly (Walk-in / Phone).</p>
               
               <form action={async (formData) => {
                   const res = await addManualCustomer(formData);
                   if (res?.error) alert(res.error);
                   else {
                       setShowModal(false);
                       const updated = await getCustomers();
                       setCustomers(updated);
                   }
               }}>
                   <div className="space-y-4">
                       <div>
                           <label className="text-xs font-bold uppercase text-gray-500">Company Name</label>
                           <input name="company" required className="w-full p-3 bg-gray-50 rounded-lg border" placeholder="e.g. City Fleet Ops" />
                       </div>
                       <div>
                           <label className="text-xs font-bold uppercase text-gray-500">Market</label>
                           <select name="market" className="w-full p-3 bg-gray-50 rounded-lg border">
                               <option value="San Antonio">San Antonio</option>
                               <option value="Austin">Austin</option>
                               <option value="Dallas">Dallas</option>
                               <option value="Houston">Houston</option>
                           </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-bold uppercase text-gray-500">Contact</label>
                               <input name="contact" className="w-full p-3 bg-gray-50 rounded-lg border" placeholder="Jane Doe" />
                           </div>
                           <div>
                               <label className="text-xs font-bold uppercase text-gray-500">Phone</label>
                               <input name="phone" className="w-full p-3 bg-gray-50 rounded-lg border" placeholder="555-0123" />
                           </div>
                       </div>
                       <div>
                           <label className="text-xs font-bold uppercase text-gray-500">Email</label>
                           <input name="email" className="w-full p-3 bg-gray-50 rounded-lg border" placeholder="jane@cityfleet.com" />
                       </div>
                   </div>

                   <div className="mt-8 flex gap-3">
                       <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancel</button>
                       <button type="submit" className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800">Create Account</button>
                   </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
}