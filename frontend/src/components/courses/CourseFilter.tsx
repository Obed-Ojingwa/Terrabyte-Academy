"use client";
interface Props { filters: Record<string, string>; onChange: (f: Record<string, string>) => void; }
const categories = ["Geographic Information Systems","Data Analysis","Spatial Analysis","Surveying","Mapping","AutoCad","Networking"];
const modes = ["online","physical","private"];
const levels = ["beginner","intermediate","advanced"];

export default function CourseFilter({ filters, onChange }: Props) {
  const set = (key: string, val: string) => {
    const next = { ...filters };
    next[key] === val ? delete next[key] : (next[key] = val);
    onChange(next);
  };
  return (
    <div className="space-y-6">
      {[{ title: "Category", key: "category", items: categories }, { title: "Mode", key: "mode", items: modes }, { title: "Level", key: "level", items: levels }].map(({ title, key, items }) => (
        <div key={key}>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">{title}</h3>
          <div className="space-y-1">
            {items.map((item) => (
              <button key={item} onClick={() => set(key, item)} className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all capitalize ${filters[key] === item ? "bg-brand-500/20 text-brand-300 font-semibold" : "text-white/50 hover:bg-white/[0.05] hover:text-white"}`}>{item}</button>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(filters).length > 0 && <button onClick={() => onChange({})} className="text-xs text-red-400 hover:text-red-300 transition-colors">✕ Clear filters</button>}
    </div>
  );
}
