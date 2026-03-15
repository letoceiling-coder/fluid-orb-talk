import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, type AuthUser } from "@/services/AuthService";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService.me()
      .then((res) => setUser(res.user))
      .catch((err) => setError(err instanceof Error ? err.message : "Unauthorized"));
  }, []);

  const logout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Authenticated user info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {user && (
            <>
              <p className="text-sm"><span className="text-muted-foreground">Name:</span> {user.name}</p>
              <p className="text-sm"><span className="text-muted-foreground">Email:</span> {user.email}</p>
              <p className="text-sm"><span className="text-muted-foreground">Role:</span> {user.role}</p>
            </>
          )}
          <Button variant="outline" onClick={logout}>Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
}

