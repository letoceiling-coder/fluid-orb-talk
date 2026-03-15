import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/AuthService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await authService.resetPassword(token, password);
      setMessage(result.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Use reset token from forgot-password</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Input placeholder="Reset token" value={token} onChange={(e) => setToken(e.target.value)} required />
            <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset password"}
            </Button>
            <p className="text-sm text-muted-foreground">
              <Link to="/login" className="hover:underline">Back to login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

