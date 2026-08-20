import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export function AuthShell({
  children,
  rightPanel,
}: {
  children: ReactNode;
  rightPanel: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-[55%] lg:px-24">
        <div className="mx-auto w-full max-w-md">
          <Logo className="mb-10" />
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block lg:w-[45%]">{rightPanel}</div>
    </div>
  );
}