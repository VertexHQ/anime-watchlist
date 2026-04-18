export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-200">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-500 border-t-purple-400" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
