export default function MoodSection() {
  const moods = [
    "Romance",
    "Workout",
    "Chill",
    "Focus",
    "Party",
    "Sleep",
    "Travel",
    "Bollywood",
    "Punjabi",
    "LoFi",
    "Happy",
    "Sad",
  ];

  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-5">
        Moods & Genres
      </h2>

      <div className="flex flex-wrap gap-3">
        {moods.map((mood) => (
          <button
            key={mood}
            className="
              px-5
              py-3
              rounded-xl
              bg-zinc-900
              hover:bg-zinc-800
            "
          >
            {mood}
          </button>
        ))}
      </div>
    </section>
  );
}