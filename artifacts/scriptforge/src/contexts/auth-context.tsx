import { createContext, useContext, ReactNode } from "react";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken, setAuthToken } from "@/lib/auth-token";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasToken = !!getAuthToken();
  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      enabled: hasToken,
    },
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        setAuthToken(null);
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        setAuthToken(null);
        queryClient.setQueryData(getGetMeQueryKey(), null);
      },
    },
  });

  const logout = () => {
    logoutMutation.mutate(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
