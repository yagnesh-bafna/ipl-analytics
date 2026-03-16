export function Spinner({ className = 'w-8 h-8' }) {
  return (
    <div className={`${className} relative`}>
      <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-dark-700" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Spinner className="w-10 h-10" />
      <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading data...</p>
    </div>
  )
}
