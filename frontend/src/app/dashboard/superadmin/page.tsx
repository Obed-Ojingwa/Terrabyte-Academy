"use client";
export default function SuperAdminDashboard() {
  return (
    <div className="p-6 bg-[#03091A] min-h-full">
      <h1 className="text-2xl font-black text-white mb-1">Platform Analytics</h1>
      <p className="text-white/40 text-sm mb-8">Root administrator overview</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:"Total Users",value:"1,284",color:"text-purple-400"},{label:"Students",value:"986",color:"text-brand-400"},{label:"Total Revenue",value:"₦14.2M",color:"text-yellow-400"},{label:"Certs Issued",value:"412",color:"text-green-400"}].map(s=>(
          <div key={s.label} className="bg-[#071428] border border-white/[0.06] rounded-2xl p-5">
            <p className={`text-2xl font-black mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-white/40 text-xs">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
