export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f6] flex items-center justify-center px-4">
      {children}
    </div>
  );
}
