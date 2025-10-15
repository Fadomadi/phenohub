"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type AuthSessionProviderProps = {
  children: ReactNode;
};

const AuthSessionProvider = ({ children }: AuthSessionProviderProps) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default AuthSessionProvider;
