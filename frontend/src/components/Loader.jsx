export default function Loader({ full }) {
  return (
    <div className={`${full ? 'min-h-screen' : 'py-10'} flex items-center justify-center`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
    </div>
  );
}
