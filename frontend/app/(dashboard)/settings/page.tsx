"use client";

import { useState, useEffect } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogout } from "@/lib/hooks/use-logout";
import { useAuthStore } from "@/lib/store/auth-store";
import { useUpdateProfile } from "@/lib/hooks/use-profile";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const isChanged = user && (name !== user.name || email !== user.email);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChanged) return;
    
    setErrorMsg(null);
    setSuccessMsg(null);
    
    updateProfile.mutate(
      { name, email },
      {
        onSuccess: () => {
          setSuccessMsg("Profile updated successfully.");
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (error: any) => {
          if (error?.response?.data?.error === 'AUTH_EMAIL_EXISTS') {
            setErrorMsg("That email address is already in use.");
          } else {
            setErrorMsg("Failed to update profile. Please try again.");
          }
        },
      }
    );
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-muted-foreground">Your account details and session controls.</p>

      {errorMsg && (
        <div className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger border border-danger/20">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mt-4 rounded-md bg-status-done-bg p-3 text-sm text-status-done-fg border border-status-done-fg/20">
          {successMsg}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-heading text-lg font-semibold text-foreground">Account</h2>
          <p className="text-sm text-muted-foreground">Update your personal information.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                aria-label="Name" 
                required 
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                aria-label="Email" 
                required 
              />
            </label>
            
            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                disabled={!isChanged || updateProfile.isPending}
              >
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 border-danger/20">
        <CardHeader>
          <h2 className="font-heading text-lg font-semibold text-danger">Session</h2>
          <p className="text-sm text-muted-foreground">End this session on this device.</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="text-danger hover:bg-danger/10 hover:text-danger border-danger/20" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
