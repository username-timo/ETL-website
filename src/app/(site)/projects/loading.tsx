export default function ProjectsLoading() {
  return (
    <main className="bg-white dark:bg-darkmode min-h-screen pt-28 pb-16">
      <div className="container lg:max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header skeleton */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="h-6 w-28 rounded-full bg-section dark:bg-darklight animate-pulse mb-3" />
          <div className="h-10 w-64 rounded-lg bg-section dark:bg-darklight animate-pulse mb-4" />
          <div className="w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg,#1a3c6e,#4fa3d1)" }} />
          <div className="h-4 w-80 max-w-full rounded bg-section dark:bg-darklight animate-pulse mt-5" />
        </div>

        {/* Filter chips skeleton */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-section dark:bg-darklight animate-pulse" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i}
              className="rounded-2xl overflow-hidden border border-border dark:border-dark_border bg-section dark:bg-darklight">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-5 w-4/5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-3 w-3/5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
