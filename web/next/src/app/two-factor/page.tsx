"use client"

import { site } from "@packages/config/site"
import { RiShieldKeyholeLine } from "@remixicon/react"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { authClient } from "@/lib/auth/client"

const CODE_LENGTH = 6

// Reached with no session: the sign-in that got here was deliberately torn down and replaced with a
// short-lived challenge cookie, so this page cannot live under (protected) and cannot read a user.
// Everything it knows is in that cookie, which is the point.
export default function Page() {
  const [code, setCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [usingBackup, setUsingBackup] = useState(false)

  const verify = useMutation({
    mutationFn: async () => {
      const res = usingBackup
        ? await authClient.twoFactor.verifyBackupCode({ code: backupCode.trim() })
        : await authClient.twoFactor.verifyTotp({ code })
      if (res.error) throw new Error(res.error.message)
    },
    // A full navigation rather than a router push: a session cookie was just set, and every cached
    // query on the client was fetched without one.
    onSuccess: () => {
      window.location.href = "/dashboard"
    },
    onError: (e: Error) => {
      setCode("")
      setBackupCode("")
      toast.add({ title: e.message || "That code is not right", type: "error" })
    },
  })

  const ready = usingBackup ? backupCode.trim().length > 0 : code.length === CODE_LENGTH

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-muted text-muted-foreground mx-auto flex size-10 items-center justify-center rounded-lg">
            <RiShieldKeyholeLine />
          </div>
          <h1 className="text-xl font-semibold">Two-factor authentication</h1>
          <p className="text-muted-foreground text-sm">
            {usingBackup
              ? `Enter one of the backup codes you saved when you set up ${site.name}.`
              : "Enter the six-digit code from your authenticator app."}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (ready) verify.mutate()
          }}
        >
          <Field>
            {usingBackup ? (
              <>
                <FieldLabel htmlFor="backup-code">Backup code</FieldLabel>
                <Input
                  id="backup-code"
                  autoComplete="one-time-code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                />
                <FieldDescription>Each code works once.</FieldDescription>
              </>
            ) : (
              <>
                <FieldLabel htmlFor="totp-code">Code</FieldLabel>
                <InputOTP
                  id="totp-code"
                  autoFocus
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(value) => {
                    setCode(value)
                    if (value.length === CODE_LENGTH) verify.mutate()
                  }}
                >
                  <InputOTPGroup>
                    {Array.from({ length: CODE_LENGTH }, (_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>The code changes every thirty seconds.</FieldDescription>
              </>
            )}
          </Field>

          <div className="mt-6 space-y-2">
            <Button type="submit" className="w-full" disabled={!ready || verify.isPending}>
              {verify.isPending ? <Spinner /> : null}
              Continue
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setUsingBackup((previous) => !previous)
                setCode("")
                setBackupCode("")
              }}
            >
              {usingBackup ? "Use my authenticator app" : "Use a backup code instead"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
