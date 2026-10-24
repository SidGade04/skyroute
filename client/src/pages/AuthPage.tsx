import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { GoogleIcon } from '@/assets/icons/GoogleIcon';
import { DIAL_CODES } from '@/types/dialCodes.types';
import { supabase } from '@/api/supabaseClient';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup'
  const [country, setCountry] = useState('AE')
  const dial = DIAL_CODES.find(([iso]) => iso === country)?.[2] ?? '+971'

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error logging in:', error.message);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
        {signup ? 'Create an account' : 'Log in'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Search is open. Rendezvous and Sniper need an account.
      </p>

      <form
        className="mt-8 grid gap-4 rounded-xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!signup) return
          const form = e.currentTarget
          const password = (form.elements.namedItem('password') as HTMLInputElement).value
          const confirm = form.elements.namedItem('confirm') as HTMLInputElement
          confirm.setCustomValidity(confirm.value === password ? '' : 'Passwords do not match')
          form.reportValidity()
        }}
      >
        {signup && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" autoComplete="given-name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" autoComplete="family-name" required />
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        {signup && (
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="flex gap-2">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger aria-label="Country code" className="w-[5.75rem]">
                  {dial}
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {DIAL_CODES.map(([iso, name, code]) => (
                    <SelectItem key={iso} value={iso}>
                      {name} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="countryCode" value={dial} />
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="50 123 4567"
                pattern="[0-9 ]{4,16}"
                required
                className="flex-1"
              />
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={8}
            required
          />
        </div>
        {signup && (
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              onChange={(e) => e.currentTarget.setCustomValidity('')}
            />
          </div>
        )}
        <Button type="submit" className="mt-1 h-9">
          {signup ? 'Sign up' : 'Log in'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {signup ? (
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[var(--ink)] underline-offset-4 hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            Need an account?{' '}
            <Link to="/signup" className="font-medium text-[var(--ink)] underline-offset-4 hover:underline">
              Sign up
            </Link>
          </>
        )}
      </p>
      <p className="mt-4 text-center text-sm text-muted-foreground">OR</p>
      <Button variant="outline" className="mt-4 w-full" onClick={handleGoogleLogin}>
        <GoogleIcon className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </section>
  )
}
