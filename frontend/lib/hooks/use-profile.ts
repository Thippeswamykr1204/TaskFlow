import { useMutation } from "@tanstack/react-query";
import { updateProfileRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { AxiosError } from "axios";

export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => updateProfileRequest(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    }
  });
}
