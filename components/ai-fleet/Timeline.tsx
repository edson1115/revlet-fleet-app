export function Timeline({ items }: { items: any[] }) {
  return (
    <div className="space-y-4">
      {items.map((x, i) => (
        <div key={i} className="flex gap-4 items-start">
          <div className="h-3 w-3 bg-black rounded-full mt-1.5"></div>
          <div>
            <p className="font-medium">{x.title}</p>
            <p className="text-sm text-gray-600">
              {new Date(x.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
