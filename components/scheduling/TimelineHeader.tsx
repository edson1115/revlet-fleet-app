export default function TimelineHeader() {
  const hours = [...Array(24).keys()];

  return (
    <div className="flex text-[11px] text-gray-500 mb-1 select-none">
      {hours.map((h) => (
        <div key={h} className="flex-1 text-center">
          {h}:00
        </div>
      ))}
    </div>
  );
}



