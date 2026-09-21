"use client"

import { RiCheckLine, RiFileCopyLine, RiShieldKeyholeLine } from "@remixicon/react"
import { useMutation } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { authClient } from "@/lib/auth/client"

const CODE_LENGTH = 6

// The secret behind the QR, so someone whose authenticator cannot scan can still type it. Grouped
// in fours because a 32-character base32 string read off a screen is otherwise unreadable.
function secretFrom(totpURI: string): string | null {
  try {
    const secret = new URL(totpURI).searchParams.get("secret")
    return secret ? (secret.match(/.{1,4}/g)?.join(" ") ?? secret) : null
  } catch {
    return null
  }
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          toast.add({ title: "Could not copy. Select the text instead.", type: "error" })
        }
      }}
    >
      {copied ? <RiCheckLine /> : <RiFileCopyLine />}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

export function TwoFactor() {
  const { data: session, refetch } = authClient.useSession()
  const enabled = session?.user.twoFactorEnabled === true

  // Held only between "Add" and "Verify": abandoning the dialog leaves nothing behind, because the
  // plugin writes the row unverified and the account stays unchanged until a code checks out.
  const [enrolling, setEnrolling] = useState<{ totpURI: string } | null>(null)
  const [code, setCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [disabling, setDisabling] = useState(false)

  const begin = useMutation({
    mutationFn: async () => {
      // No password argument: nobody here has one, which is why the server passes
      // allowPasswordless. The plugin still demands it from anyone who does.
      const res = await authClient.twoFactor.enable({ password: "" })
      if (res.error) throw new Error(res.error.message)
      return res.data as { totpURI: string; backupCodes: string[] }
    },
    onSuccess: (data) => setEnrolling({ totpURI: data.totpURI }),
    onError: (e: Error) =>
      toast.add({ title: e.message || "Could not start setup", type: "error" }),
  })

  const confirm = useMutation({
    mutationFn: async () => {
      const res = await authClient.twoFactor.verifyTotp({ code })
      if (res.error) throw new Error(res.error.message)
      // Shown once and never again: the plugin returns them here and stores only an encrypted copy.
      const codes = await authClient.twoFactor.generateBackupCodes({ password: "" })
      if (codes.error) throw new Error(codes.error.message)
      return (codes.data as { backupCodes: string[] }).backupCodes
    },
    onSuccess: (codes) => {
      setEnrolling(null)
      setCode("")
      setBackupCodes(codes)
      void refetch()
    },
    onError: (e: Error) => {
      setCode("")
      toast.add({ title: e.message || "That code is not right", type: "error" })
    },
  })

  const disable = useMutation({
    mutationFn: async () => {
      const res = await authClient.twoFactor.disable({ password: "" })
      if (res.error) throw new Error(res.error.message)
    },
    onSuccess: () => {
      setDisabling(false)
      toast.add({ title: "Two-factor authentication is off.", type: "success" })
      void refetch()
    },
    onError: (e: Error) =>
      toast.add({ title: e.message || "Could not turn it off", type: "error" }),
  })

  const regenerate = useMutation({
    mutationFn: async () => {
      const res = await authClient.twoFactor.generateBackupCodes({ password: "" })
      if (res.error) throw new Error(res.error.message)
      return (res.data as { backupCodes: string[] }).backupCodes
    },
    onSuccess: (codes) => setBackupCodes(codes),
    onError: (e: Error) =>
      toast.add({ title: e.message || "Could not make new codes", type: "error" }),
  })

  const secret = enrolling ? secretFrom(enrolling.totpURI) : null

  return (
    <div className="space-y-4">
      {enabled ? (
        <>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <RiShieldKeyholeLine />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="flex items-center gap-2">
                Authenticator app
                <Badge variant="outline" className="text-success">
                  On
                </Badge>
              </ItemTitle>
              <ItemDescription>
                Every sign-in asks for a six-digit code, whichever way you sign in.
              </ItemDescription>
            </ItemContent>
          </Item>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={regenerate.isPending}
              onClick={() => regenerate.mutate()}
            >
              {regenerate.isPending ? <Spinner /> : null}
              New backup codes
            </Button>
            <Button type="button" variant="outline" onClick={() => setDisabling(true)}>
              Turn off
            </Button>
          </div>
        </>
      ) : (
        <>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiShieldKeyholeLine />
              </EmptyMedia>
              <EmptyTitle>Two-factor authentication is off</EmptyTitle>
              <EmptyDescription>
                Add an authenticator app and every sign-in will ask for a six-digit code as well as
                your usual method.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
          <div className="flex justify-end">
            <Button type="button" disabled={begin.isPending} onClick={() => begin.mutate()}>
              {begin.isPending ? <Spinner /> : <RiShieldKeyholeLine />}
              Add an authenticator app
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={enrolling !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEnrolling(null)
            setCode("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an authenticator app</DialogTitle>
            <DialogDescription>
              Scan this with Google Authenticator, 1Password, or any other TOTP app, then type the
              code it shows.
            </DialogDescription>
          </DialogHeader>
          {enrolling && (
            <div className="space-y-4">
              {/* A white plate regardless of theme: a QR inverted in dark mode does not scan. */}
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4">
                  <QRCodeSVG value={enrolling.totpURI} size={176} />
                </div>
              </div>
              {secret && (
                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle>Or type this in instead</ItemTitle>
                    {/* ItemDescription is line-clamp-2 by default, which is right for a name and
                        wrong for this: a clipped base32 secret cannot be typed into an
                        authenticator, and this is the fallback for exactly the people who cannot
                        scan the QR above it. */}
                    <ItemDescription className="line-clamp-none font-mono break-all">
                      {secret}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <CopyButton label="Copy setup code" value={secret.replaceAll(" ", "")} />
                  </ItemActions>
                </Item>
              )}
              <Field>
                <FieldLabel htmlFor="totp-code">Code from the app</FieldLabel>
                <InputOTP id="totp-code" maxLength={CODE_LENGTH} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {Array.from({ length: CODE_LENGTH }, (_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>Nothing is switched on until this checks out.</FieldDescription>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnrolling(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={confirm.isPending || code.length !== CODE_LENGTH}
              onClick={() => confirm.mutate()}
            >
              {confirm.isPending ? <Spinner /> : null}
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={backupCodes !== null} onOpenChange={(open) => !open && setBackupCodes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your backup codes</DialogTitle>
            <DialogDescription>
              Each one signs you in once if you lose your phone. This is the only time they are
              shown, and making new ones replaces the whole set.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-4 font-mono text-sm">
            {(backupCodes ?? []).map((backupCode) => (
              <span key={backupCode}>{backupCode}</span>
            ))}
          </div>
          <DialogFooter>
            <CopyButton label="Copy backup codes" value={(backupCodes ?? []).join("\n")} />
            <Button type="button" onClick={() => setBackupCodes(null)}>
              I have saved them
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={disabling} onOpenChange={setDisabling}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Sign-in goes back to your usual method alone, and your current backup codes stop
              working. You can set it up again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={disable.isPending} onClick={() => disable.mutate()}>
              {disable.isPending ? <Spinner /> : null}
              Turn off
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
