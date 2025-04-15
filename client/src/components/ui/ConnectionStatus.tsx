interface ConnectionStatusProps {
  online: boolean;
}

export default function ConnectionStatus({ online }: ConnectionStatusProps) {
  return (
    <div className="mt-2 flex items-center">
      <span className="flex h-3 w-3 relative">
        {online ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        )}
      </span>
      <span className="ml-2 text-sm text-white font-medium">{online ? 'Online' : 'Offline'}</span>
    </div>
  );
}
