import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/AuthService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await authService.forgotPassword(email);
      setMessage(result.reset_token ? `${result.message}. Token: ${result.reset_token}` : result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Request password reset token</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground break-all">{message}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset request"}
            </Button>
            <div className="text-sm text-muted-foreground flex justify-between">
              <Link to="/login" className="hover:underline">Back to login</Link>
              <Link to="/reset-password" className="hover:underline">Have token?</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

