export default function CharacterDetailsLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background orbs skeleton */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full blur-[80px] bg-blue-500/20" />
        <div className="absolute top-[40%] left-[0%] w-[550px] h-[550px] bg-purple-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] bg-cyan-600/20 rounded-full blur-[70px]" />
      </div>

      {/* Back Button Skeleton */}
      <div className="fixed top-6 left-6 z-50">
        <div className="h-9 w-44 bg-gray-900/80 border border-white/10 rounded-full animate-pulse"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 sm:py-12 pt-20 sm:pt-24">
        {/* Main Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

          <div className="relative p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image + Actions */}
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="lg:sticky lg:top-6 space-y-4">
                  {/* Character Portrait Skeleton */}
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* Name area skeleton */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse mb-2"></div>
                      <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-3"></div>
                    <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse"></div>
                    <div className="h-12 w-full bg-white/[0.05] border border-white/[0.1] rounded-xl animate-pulse"></div>
                    <div className="h-12 w-full bg-white/[0.05] border border-white/[0.1] rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Right Column: Content Sections */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                {/* First Message Section Skeleton */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse"></div>
                      <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] animate-pulse"></div>
                  </div>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <div className="h-px w-full mb-4 bg-gradient-to-r from-white/20 to-transparent"></div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Collapsed Section Skeletons */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse"></div>
                        <div className="h-6 w-28 bg-white/10 rounded animate-pulse"></div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
