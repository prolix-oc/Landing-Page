export default function CharacterDetailsLoading() {
  return (
    <div className="min-h-screen relative">
      <div className="relative container mx-auto px-4 py-16">
        {/* Back Button Skeleton */}
        <div className="mb-8">
          <div className="h-6 w-32 bg-gray-800/50 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Image and Info Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden sticky top-4">
              {/* Image Skeleton */}
              <div className="relative aspect-square bg-gray-900/50 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="inline-block w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Name Skeleton */}
                <div className="h-8 w-48 bg-gray-800/50 rounded animate-pulse"></div>
                {/* Date Skeleton */}
                <div className="h-4 w-32 bg-gray-800/50 rounded animate-pulse"></div>
                {/* Buttons Skeleton */}
                <div className="space-y-2 pt-4">
                  <div className="h-12 w-full bg-gray-800/50 rounded-xl animate-pulse"></div>
                  <div className="h-12 w-full bg-gray-800/50 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Details Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* First Message Skeleton */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="h-8 w-40 bg-gray-800/50 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-800/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Scenario Skeleton */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="h-8 w-32 bg-gray-800/50 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-800/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="h-8 w-36 bg-gray-800/50 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-800/50 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gray-800/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
